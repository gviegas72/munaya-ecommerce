import { NextRequest, NextResponse } from "next/server";
import { getMercadoPagoOrder } from "@/lib/mercadopago";
import { createDimonaOrder } from "@/lib/dimona";
import { buildDimonaDispatchItem, validateDimonaOrderData } from "@/lib/dimona-mapping";
import { saveDatabaseOrder, supabaseAdmin, getCatalogProducts } from "@/lib/supabase";
import { verifyMercadoPagoWebhookSignature } from "@/lib/mp-webhook-auth";
import { sendPaymentConfirmedEmail } from "@/lib/email";
import { sendPaymentConfirmedWhatsApp } from "@/lib/whatsapp";

/**
 * Webhook Oficial do Mercado Pago
 * Rota: POST /api/webhooks/mercadopago
 */
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const topic = url.searchParams.get("topic") || url.searchParams.get("type");
    const id = url.searchParams.get("id") || url.searchParams.get("data.id");

    const body = await req.json().catch(() => ({}));
    const eventId = id || body?.data?.id || body?.id;
    const action = body?.action || topic || "order.updated";

    // Validação de assinatura HMAC do Mercado Pago (Fase 1 AppSec)
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");
    const isValidSignature = verifyMercadoPagoWebhookSignature(xSignature, xRequestId, String(eventId || ""));

    if (!isValidSignature) {
      console.error("⛔ [WEBHOOK REJEITADO] Assinatura HMAC inválida ou forjada.");
      return NextResponse.json({ error: "Assinatura inválida." }, { status: 403 });
    }

    console.log("🔔 [WEBHOOK MERCADO PAGO]", { action, eventId });

    if (!eventId) {
      return NextResponse.json({ received: true });
    }

    // Se for notificação de Ordem
    if (action.includes("order") || topic === "order") {
      const mpOrder = await getMercadoPagoOrder(String(eventId));

      console.log("📦 [STATUS ORDEM MERCADO PAGO]:", {
        orderId: mpOrder.id,
        status: mpOrder.status,
        external_reference: mpOrder.external_reference,
      });

      // Verifica se a ordem foi paga com sucesso
      const isPaid =
        mpOrder.status === "paid" ||
        mpOrder.status === "processed" ||
        mpOrder.transactions?.payments?.some(
          (p: any) => p.status === "approved" || p.status === "paid"
        );

      if (isPaid) {
        console.log("💰 [PAGAMENTO APROVADO] Despachando para a Dimona...");

        const externalId = mpOrder.external_reference || `MNY-${mpOrder.id}`;
        
        // 1. Busca os dados reais e validados do pedido diretamente do Supabase
        const { data: dbOrder } = await supabaseAdmin
          .from("orders")
          .select("*")
          .eq("id", externalId)
          .maybeSingle();

        const payer = mpOrder.payer || {};
        const customerName = dbOrder?.customer_name || `${payer.first_name || "Cliente"} ${payer.last_name || ""}`.trim();
        const customerEmail = dbOrder?.customer_email || payer.email || "contato@munayarocks.com.br";
        const customerCpf = dbOrder?.customer_cpf || payer.identification?.number || "";
        const customerPhone = dbOrder?.customer_phone || payer.phone || "";

        // Itens oficiais do pedido cadastrado no Supabase
        const rawItems = dbOrder?.items && Array.isArray(dbOrder.items) && dbOrder.items.length > 0
          ? dbOrder.items
          : (mpOrder.items || []);

        // Busca o catálogo para cruzar parâmetros de esteira (blank_type, dimona_product_id)
        const catalogProducts = await getCatalogProducts().catch(() => []);

        const dimonaItems = rawItems.map((it: any) => {
          const matchedProd = catalogProducts.find(
            (p: any) =>
              p.id === it.productId ||
              p.id === it.product_id ||
              p.slug === it.slug ||
              (p.name && it.name && p.name.toLowerCase() === it.name.toLowerCase())
          );

          const productMeta = {
            dimona_product_id: matchedProd?.dimona_product_id,
            blank_type: matchedProd?.blank_type || "classic",
            artwork_url: matchedProd?.artwork_url || it.artwork_url,
            image_url: matchedProd?.image_url || it.image_url,
          };

          return buildDimonaDispatchItem(it, productMeta);
        });

        const deliveryData = {
          recipient_name: customerName,
          recipient_document: customerCpf.replace(/\D/g, ""),
          recipient_email: customerEmail,
          recipient_phone: customerPhone.replace(/\D/g, ""),
          street: dbOrder?.street || "Rua",
          number: String(dbOrder?.number || "S/N"),
          complement: dbOrder?.complement || "",
          neighborhood: dbOrder?.neighborhood || "Bairro",
          city: dbOrder?.city || "Porto Alegre",
          state: dbOrder?.state || "RS",
          zipcode: String(dbOrder?.zipcode || "00000000").replace(/\D/g, ""),
          shipping_speed: ((dbOrder?.shipping_service || "PAC") as "PAC" | "SEDEX"),
        };

        // Validação da camada anti-corrupção antes do despacho
        const validation = validateDimonaOrderData(externalId, dimonaItems, deliveryData);
        if (!validation.valid) {
          console.warn("⚠️ [DIMONA ACL WARNING] Inconsistências detectadas no pedido antes do despacho:", validation.errors);
        }

        // Monta o payload de produção para a Dimona com o endereço real e SKUs de fábrica
        const dimonaPayload = {
          external_id: externalId,
          items: dimonaItems,
          delivery: deliveryData,
          notes: `Pedido #${externalId} aprovado via Mercado Pago Orders API | De/Para Dimona ACL`,
        };

        const dimonaRes = await createDimonaOrder(dimonaPayload);
        console.log("✅ [DIMONA DISPATCH RESULT]:", dimonaRes);

        // Atualiza o pedido no Supabase para 'pago' e com o ID da Dimona
        await saveDatabaseOrder({
          id: externalId,
          payment_status: "pago",
          dimona_id: dimonaRes.order_id,
          dimona_status: dimonaRes.status || "recebido",
        }).catch((e) => console.warn("Erro ao atualizar status no Supabase:", e));

        // Marca qualquer rascunho de carrinho abandonado como recuperado
        Promise.resolve(
          supabaseAdmin
            .from("abandoned_checkouts")
            .update({
              status: "recovered",
              recovered_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .or(`order_id.eq.${externalId},phone.eq.${customerPhone},email.eq.${customerEmail}`)
        ).catch((e: unknown) => console.warn("Aviso ao marcar carrinho recuperado:", e));

        // Dispara e-mail transacional de pagamento aprovado
        if (customerEmail) {
          sendPaymentConfirmedEmail({
            id: externalId,
            customer_name: customerName,
            customer_email: customerEmail,
            total_amount: Number(dbOrder?.total_amount || mpOrder.total_amount) || 89.9,
            items: dimonaPayload.items,
          }).catch((e) => console.warn("⚠️ [EMAIL] Falha ao enviar confirmação de pagamento webhook:", e));
        }

        // Dispara notificação transacional via WhatsApp de pagamento aprovado
        if (customerPhone) {
          sendPaymentConfirmedWhatsApp({
            id: externalId,
            customer_name: customerName,
            customer_phone: customerPhone,
            total_amount: Number(dbOrder?.total_amount || mpOrder.total_amount) || 89.9,
            items: dimonaPayload.items,
          }).catch((e) => console.warn("⚠️ [WHATSAPP] Falha ao enviar confirmação de pagamento webhook:", e));
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ [WEBHOOK MERCADO PAGO ERRO]:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
