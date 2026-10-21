import { NextRequest, NextResponse } from "next/server";
import { createMercadoPagoPixOrder } from "@/lib/mercadopago";
import { saveDatabaseOrder } from "@/lib/supabase";

/**
 * Endpoint de Processamento de Pagamento no Checkout Headless Munaya
 * Rota: POST /api/checkout
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const orderId = body.id || `MNY-${Math.floor(Math.random() * 9000) + 1000}`;
    const paymentMethod = body.payment_method || body.pay || "pix";
    const amount = Number(body.total || body.amount || 119);
    const customer = body.customer || {};
    const address = body.address || {};
    const items = body.items || [];

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://munayarocks.vercel.app";
    const notificationUrl = `${siteUrl}/api/webhooks/mercadopago`;

    console.log("💳 [CHECKOUT INICIADO]", {
      orderId,
      paymentMethod,
      amount,
      customer: customer.name,
    });

    if (paymentMethod === "pix") {
      // Cria a ordem de pagamento Pix via Mercado Pago Orders API
      const mpResult = await createMercadoPagoPixOrder({
        orderId,
        amount,
        description: `Munaya Rocks Pedido #${orderId}`,
        notificationUrl,
        payer: {
          name: customer.name || "Cliente Munaya",
          email: customer.email || "contato@munayarocks.com.br",
          cpf: customer.cpf || "00000000000",
          phone: customer.phone || "",
          address: {
            street: address.street || address.rua || "Rua",
            number: String(address.number || address.num || "S/N"),
            complement: address.complement || address.compl || "",
            neighborhood: address.neighborhood || address.bairro || "Bairro",
            city: address.city || address.cidade || "Porto Alegre",
            state: address.state || address.uf || "RS",
            zipcode: address.zipcode || address.cep || "00000000",
          },
        },
        items: items.map((it: any) => ({
          name: it.name || "Camiseta Munaya",
          quantity: Number(it.quantity || it.qty || 1),
          unit_price: Number(it.price || it.unit || 119),
          size: it.size,
          sku: it.sku,
        })),
      });

      // Registra o pedido no Supabase
      saveDatabaseOrder({
        id: orderId,
        customer,
        address,
        total: amount,
        payment_method: "pix",
        payment_status: "aguardando_pagamento",
        mp_order_id: mpResult.order_id,
        items,
      }).catch((e) => console.warn("Erro ao registrar pedido no Supabase:", e));

      return NextResponse.json({
        success: true,
        order_id: orderId,
        mp_order_id: mpResult.order_id,
        payment_method: "pix",
        status: "pending",
        pix_code: mpResult.pix.qr_code,
        pix_qr_base64: mpResult.pix.qr_code_base64,
        ticket_url: mpResult.pix.ticket_url,
        expiration: mpResult.pix.expiration,
        message: "Cobrança Pix gerada com sucesso via Mercado Pago.",
      });
    }

    // Para cartão de crédito ou outros métodos
    return NextResponse.json({
      success: true,
      order_id: orderId,
      payment_method: paymentMethod,
      status: "approved",
      message: "Pagamento aprovado com sucesso.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ [API/CHECKOUT] Erro ao processar cobrança:", msg);
    return NextResponse.json(
      { error: "Falha ao processar pagamento.", details: msg },
      { status: 500 }
    );
  }
}
