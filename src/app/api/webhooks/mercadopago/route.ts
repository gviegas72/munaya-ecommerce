import { NextRequest, NextResponse } from "next/server";
import { getMercadoPagoOrder } from "@/lib/mercadopago";
import { createDimonaOrder } from "@/lib/dimona";
import { getArtworkUrl } from "@/lib/artworks";
import { saveDatabaseOrder } from "@/lib/supabase";
import { verifyMercadoPagoWebhookSignature } from "@/lib/mp-webhook-auth";
import { sendPaymentConfirmedEmail } from "@/lib/email";

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
        const payer = mpOrder.payer || {};
        const address = payer.address || {};

        // Monta o payload de produção para a Dimona
        const dimonaPayload = {
          external_id: externalId,
          items: (mpOrder.items || []).map((it: any) => {
            const sku = it.sku || `MUNAYA-${String(it.title || "BONZO").toUpperCase().replace(/\s+/g, "-")}-PRETA-M`;
            return {
              sku,
              name: it.title || "Camiseta Munaya Rocks",
              qty: Number(it.quantity) || 1,
              size: it.size || "M",
              unit_price: Number(it.unit_price) || 119,
              artwork_url: getArtworkUrl(sku),
            };
          }),
          delivery: {
            recipient_name: `${payer.first_name || "Cliente"} ${payer.last_name || "Munaya"}`.trim(),
            recipient_document: payer.identification?.number || "00000000000",
            recipient_email: payer.email || "contato@munayarocks.com.br",
            recipient_phone: payer.phone || "",
            street: address.street_name || "Rua",
            number: String(address.street_number || "S/N"),
            complement: address.complement || "",
            neighborhood: address.neighborhood || "Centro",
            city: address.city || "Porto Alegre",
            state: address.state || "RS",
            zipcode: address.zip_code || "91380410",
            shipping_speed: "PAC" as const,
          },
          notes: `Pedido #${externalId} aprovado via Mercado Pago Orders API`,
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

        // Dispara e-mail transacional de pagamento aprovado
        if (payer.email) {
          sendPaymentConfirmedEmail({
            id: externalId,
            customer_name: `${payer.first_name || "Cliente"} ${payer.last_name || ""}`.trim(),
            customer_email: payer.email,
            total_amount: Number(mpOrder.total_amount) || 1,
            items: dimonaPayload.items,
          }).catch((e) => console.warn("⚠️ [EMAIL] Falha ao enviar confirmação de pagamento webhook:", e));
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
