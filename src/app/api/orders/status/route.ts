import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, saveDatabaseOrder } from "@/lib/supabase";
import { createDimonaOrder } from "@/lib/dimona";
import { getArtworkUrl } from "@/lib/artworks";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendPaymentConfirmedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Consulta pública de status de um pedido específico (para cliente final e tela de checkout)
 * Rota: GET /api/orders/status?id=MNY-4261
 */
export async function GET(req: NextRequest) {
  const rateLimit = checkRateLimit(req, "order-status", { limit: 60, windowSec: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Muitas consultas. Aguarde alguns segundos." }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("id");

    if (!orderId) {
      return NextResponse.json({ error: "ID do pedido não informado." }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    }

    // Se já estiver pago, retorna imediatamente
    if (order.payment_status === "pago") {
      return NextResponse.json({
        success: true,
        id: order.id,
        payment_status: "pago",
        is_paid: true,
        dimona_status: order.dimona_status,
        dimona_id: order.dimona_id,
        tracking_code: order.tracking_code,
      });
    }

    // Se ainda estiver aguardando pagamento, tenta conciliar ativamente no Mercado Pago
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (mpAccessToken && (order.mp_order_id || order.id)) {
      try {
        // Tenta buscar pagamentos recentes ou pelo external_reference
        const searchRes = await fetch(
          `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(order.id)}`,
          {
            headers: {
              Authorization: `Bearer ${mpAccessToken}`,
            },
          }
        );

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const approvedPayment = searchData.results?.find(
            (p: any) => p.status === "approved" || p.status === "paid"
          );

          if (approvedPayment) {
            console.log(`✅ [CONCILIAÇÃO ATIVA] Pedido ${order.id} foi pago via Mercado Pago!`);

            // Despacha para a esteira da Dimona (ou modo dry-run)
            const dimonaPayload = {
              external_id: order.id,
              items: (order.items || []).map((it: any) => {
                const sku = it.sku || `MUNAYA-${String(it.name || "ESTAMPA").toUpperCase().replace(/\s+/g, "-")}-PRETA-M`;
                return {
                  sku,
                  name: it.name,
                  qty: Number(it.quantity || it.qty || 1),
                  size: it.size || "M",
                  unit_price: Number(it.price || it.unit_price || 1),
                  artwork_url: getArtworkUrl(sku),
                };
              }),
              delivery: {
                recipient_name: order.customer_name,
                recipient_document: order.customer_cpf,
                recipient_email: order.customer_email,
                recipient_phone: order.customer_phone,
                street: order.street,
                number: String(order.number || "S/N"),
                complement: order.complement || "",
                neighborhood: order.neighborhood,
                city: order.city,
                state: order.state,
                zipcode: order.zipcode,
                shipping_speed: "PAC" as const,
              },
              notes: `Pedido #${order.id} confirmado e conciliado ativamente`,
            };

            const dimonaRes = await createDimonaOrder(dimonaPayload);

            await saveDatabaseOrder({
              id: order.id,
              payment_status: "pago",
              dimona_id: dimonaRes.order_id,
              dimona_status: dimonaRes.status || "recebido",
            });

            // Dispara e-mail de confirmação de pagamento
            if (order.customer_email) {
              sendPaymentConfirmedEmail({
                id: order.id,
                customer_name: order.customer_name,
                customer_email: order.customer_email,
                total_amount: order.total_amount,
                items: order.items,
              }).catch((e) => console.warn("⚠️ [EMAIL] Falha ao enviar confirmação de pagamento:", e));
            }

            return NextResponse.json({
              success: true,
              id: order.id,
              payment_status: "pago",
              is_paid: true,
              dimona_status: dimonaRes.status || "recebido",
              dimona_id: dimonaRes.order_id,
            });
          }
        }
      } catch (mpErr) {
        console.warn("⚠️ [CONCILIAÇÃO] Falha ao consultar Mercado Pago:", mpErr);
      }
    }

    return NextResponse.json({
      success: true,
      id: order.id,
      payment_status: order.payment_status || "aguardando_pagamento",
      is_paid: false,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
