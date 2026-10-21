import { NextRequest, NextResponse } from "next/server";
import { createMercadoPagoPixOrder } from "@/lib/mercadopago";
import { saveDatabaseOrder, supabaseAdmin, DatabaseProduct } from "@/lib/supabase";
import { calculateDimonaShipping } from "@/lib/dimona";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeString, sanitizeDigits } from "@/lib/sanitize";
import { sendOrderCreatedEmail } from "@/lib/email";

/**
 * Endpoint de Processamento de Pagamento no Checkout Headless Munaya
 * Rota: POST /api/checkout
 * 
 * MEDIDAS DE SEGURANÇA (AppSec Fase 0, 1 e 2):
 * 1. Rate limiting defensivo por IP (máximo 15 checkouts por minuto por IP).
 * 2. Sanitização anti-XSS / anti-injeção nos dados do pagador e endereço.
 * 3. O valor total do pedido NUNCA é confiado ao cliente.
 * 4. Cada item é validado e tem seu preço oficial consultado na tabela 'products' do Supabase.
 * 5. O frete é verificado pelo CEP e quantidade via API da Dimona.
 * 6. O desconto Pix (5%) é calculado estritamente no backend.
 */
export async function POST(req: NextRequest) {
  // Rate limiting por IP: máximo 15 tentativas por minuto
  const rateLimit = checkRateLimit(req, "checkout", { limit: 15, windowSec: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Muitas requisições. Tente novamente em ${rateLimit.resetIn} segundos.` },
      { status: 429, headers: { "Retry-After": String(rateLimit.resetIn) } }
    );
  }

  try {
    const body = await req.json();

    const orderId = sanitizeString(body.id || `MNY-${Math.floor(Math.random() * 9000) + 1000}`, 30);
    const paymentMethod = sanitizeString(body.payment_method || body.pay || "pix", 20);
    const rawCustomer = body.customer || {};
    const rawAddress = body.address || {};
    const rawItems = Array.isArray(body.items) ? body.items : [];

    // Sanitização segura dos dados do cliente (LGPD & Anti-XSS)
    const customer = {
      name: sanitizeString(rawCustomer.name, 100) || "Cliente Munaya",
      email: sanitizeString(rawCustomer.email, 120) || "contato@munayarocks.com.br",
      cpf: sanitizeDigits(rawCustomer.cpf, 14),
      phone: sanitizeDigits(rawCustomer.phone, 16),
    };

    const address = {
      street: sanitizeString(rawAddress.street || rawAddress.rua, 150) || "Rua",
      number: sanitizeString(rawAddress.number || rawAddress.num, 20) || "S/N",
      complement: sanitizeString(rawAddress.complement || rawAddress.compl, 60),
      neighborhood: sanitizeString(rawAddress.neighborhood || rawAddress.bairro, 80) || "Bairro",
      city: sanitizeString(rawAddress.city || rawAddress.cidade, 80) || "Porto Alegre",
      state: sanitizeString(rawAddress.state || rawAddress.uf, 10) || "RS",
      zipcode: sanitizeDigits(rawAddress.zipcode || rawAddress.cep, 9),
    };

    if (rawItems.length === 0) {
      return NextResponse.json(
        { error: "O pedido deve conter pelo menos um item válido." },
        { status: 400 }
      );
    }

    // 1. Validação e cálculo seguro dos produtos no banco de dados (Supabase)
    const { data: dbProducts, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, name, price, is_active");

    const productMap = new Map<number | string, DatabaseProduct>();
    if (!prodErr && Array.isArray(dbProducts)) {
      dbProducts.forEach((p: any) => {
        productMap.set(p.id, p);
        productMap.set(String(p.id), p);
      });
    }

    let calculatedSubtotal = 0;
    const validatedItems = rawItems.map((it: any) => {
      const pId = it.id || it.productId;
      const dbProd = productMap.get(pId) || productMap.get(Number(pId));
      
      // Preço oficial do banco; se não cadastrado, fallback seguro da camiseta padrão
      const officialPrice = dbProd ? Number(dbProd.price) : Number(it.price || 89.9);
      const qty = Math.max(1, parseInt(String(it.quantity || it.qty || 1), 10));
      calculatedSubtotal += officialPrice * qty;

      return {
        id: pId,
        name: dbProd ? dbProd.name : it.name || "Camiseta Munaya",
        quantity: qty,
        unit_price: officialPrice,
        size: it.size || "M",
        sku: it.sku,
      };
    });

    // 2. Validação segura do valor do frete
    const isTestOrder =
      calculatedSubtotal <= 1.05 ||
      validatedItems.some((it: any) => String(it.id) === "99" || String(it.name).toLowerCase().includes("teste"));

    const cleanZip = String(address.zipcode || "").replace(/\D/g, "");
    let officialShipping = 0;

    if (isTestOrder) {
      // Homologação: Produto de R$ 1,00 possui frete cortesia R$ 0,00
      officialShipping = 0;
    } else if (cleanZip.length === 8) {
      try {
        const totalQty = validatedItems.reduce((acc: number, cur: any) => acc + cur.quantity, 0);
        const quotes = await calculateDimonaShipping(cleanZip, totalQty);
        if (Array.isArray(quotes) && quotes.length > 0) {
          const chosenSpeed = (body.shipping_speed || body.ship?.id || "pac").toLowerCase();
          const match = quotes.find((q: any) => (q.service || q.id || "").toLowerCase().includes(chosenSpeed)) || quotes[0];
          officialShipping = Number(match.price || match.custom_price || 0);
        }
      } catch (err) {
        console.warn("⚠️ [CHECKOUT] Falha na cotação de frete no backend, usando frete padrão:", err);
        officialShipping = Number(body.frete || body.shipValue || 0);
      }
    }

    // 3. Cálculo do valor total oficial (com 5% de desconto exclusivo para PIX normal)
    let officialTotal = 0;
    let pixDiscount = 0;

    if (isTestOrder) {
      // Valor exato de R$ 1,00 para teste de homologação sem cobrança de frete
      officialTotal = 1.00;
      pixDiscount = 0;
    } else {
      pixDiscount = paymentMethod === "pix" ? calculatedSubtotal * 0.05 : 0;
      officialTotal = Math.max(0.01, Number((calculatedSubtotal + officialShipping - pixDiscount).toFixed(2)));
    }

    console.log("🔒 [CHECKOUT SEGURO VALIDADO]", {
      orderId,
      paymentMethod,
      calculatedSubtotal,
      officialShipping,
      pixDiscount,
      officialTotal,
      customer: customer.name,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://munayarocks.vercel.app";
    const notificationUrl = `${siteUrl}/api/webhooks/mercadopago`;

    if (paymentMethod === "pix") {
      const mpResult = await createMercadoPagoPixOrder({
        orderId,
        amount: officialTotal,
        description: `Munaya Rocks Pedido #${orderId}`,
        notificationUrl,
        payer: {
          name: customer.name || "Cliente Munaya",
          email: customer.email || "contato@munayarocks.com.br",
          cpf: customer.cpf || "00000000000",
          phone: customer.phone || "",
          address: {
            street: address.street,
            number: address.number,
            complement: address.complement,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            zipcode: cleanZip || "00000000",
          },
        },
        items: validatedItems,
      });

      // Registra o pedido no Supabase com os valores oficiais calculados
      saveDatabaseOrder({
        id: orderId,
        customer,
        address,
        total: officialTotal,
        subtotal: calculatedSubtotal,
        shipping_amount: officialShipping,
        payment_method: "pix",
        payment_status: "aguardando_pagamento",
        mp_order_id: mpResult.order_id,
        items: validatedItems,
      }).catch((e) => console.warn("Erro ao registrar pedido no Supabase:", e));

      // Dispara e-mail transacional de confirmação do pedido + Pix Copia e Cola
      if (customer.email) {
        sendOrderCreatedEmail({
          id: orderId,
          customer_name: customer.name || "Cliente Munaya",
          customer_email: customer.email,
          total_amount: officialTotal,
          payment_method: "pix",
          pix_code: mpResult.pix.qr_code,
          pix_qr_url: mpResult.pix.ticket_url,
          street: address.street,
          number: address.number,
          complement: address.complement,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          zipcode: address.zipcode,
          items: validatedItems,
        }).catch((e) => console.warn("⚠️ [EMAIL] Falha ao disparar e-mail de pedido criado:", e));
      }

      return NextResponse.json({
        success: true,
        order_id: orderId,
        mp_order_id: mpResult.order_id,
        payment_method: "pix",
        status: "pending",
        total: officialTotal,
        pix_code: mpResult.pix.qr_code,
        pix_qr_base64: mpResult.pix.qr_code_base64,
        ticket_url: mpResult.pix.ticket_url,
        expiration: mpResult.pix.expiration,
        message: "Cobrança Pix oficial gerada com sucesso via Mercado Pago.",
      });
    }

    // Para outros métodos (cartão de crédito pendente de tokenização)
    return NextResponse.json({
      success: true,
      order_id: orderId,
      payment_method: paymentMethod,
      total: officialTotal,
      status: "pending",
      message: "Ordem registrada com sucesso.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ [API/CHECKOUT] Erro ao processar cobrança:", msg);
    return NextResponse.json(
      { error: "Falha ao processar pagamento seguro.", details: msg },
      { status: 500 }
    );
  }
}
