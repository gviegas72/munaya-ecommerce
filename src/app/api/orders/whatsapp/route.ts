import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/admin-auth";
import {
  sendOrderCreatedWhatsApp,
  sendPaymentConfirmedWhatsApp,
  sendOrderShippedWhatsApp,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/**
 * Endpoint Administrativo para Disparo / Simulação / Preview de Notificações WhatsApp
 * Rota protegida: POST /api/orders/whatsapp
 */
export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminAuth(req)) {
      return NextResponse.json(
        { error: "Acesso administrativo obrigatório." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { order_id, type, tracking_code, tracking_url } = body;

    if (!order_id || !type) {
      return NextResponse.json(
        { error: "order_id e type são obrigatórios." },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Pedido não encontrado no banco de dados." },
        { status: 404 }
      );
    }

    let waResult;

    if (type === "created") {
      waResult = await sendOrderCreatedWhatsApp(
        {
          id: order.id,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          total_amount: order.total_amount,
          payment_method: order.payment_method,
          pix_code:
            order.pix_code ||
            `00020126580014BR.GOV.BCB.PIX0136munaya-pix-${order.id.toLowerCase()}5204000053039865802BR5912MUNAYA ROCKS6012PORTO ALEGRE62070503***6304ABCD`,
          street: order.street,
          number: order.number,
          complement: order.complement,
          neighborhood: order.neighborhood,
          city: order.city,
          state: order.state,
          zipcode: order.zipcode,
          items: order.items,
        },
        true
      );
    } else if (type === "paid") {
      waResult = await sendPaymentConfirmedWhatsApp(
        {
          id: order.id,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          total_amount: order.total_amount,
          items: order.items,
        },
        true
      );
    } else if (type === "shipped") {
      const finalTracking =
        tracking_code || order.tracking_code || "BR123456789MY";
      const finalUrl =
        tracking_url ||
        order.tracking_url ||
        `https://www.linkcorreios.com.br/?id=${encodeURIComponent(finalTracking)}`;

      if (tracking_code && tracking_code !== order.tracking_code) {
        await supabaseAdmin
          .from("orders")
          .update({
            tracking_code: finalTracking,
            tracking_url: finalUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);
      }

      waResult = await sendOrderShippedWhatsApp(
        {
          id: order.id,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          total_amount: order.total_amount,
          tracking_code: finalTracking,
          tracking_url: finalUrl,
          street: order.street,
          number: order.number,
          complement: order.complement,
          neighborhood: order.neighborhood,
          city: order.city,
          state: order.state,
          zipcode: order.zipcode,
        },
        true
      );
    } else {
      return NextResponse.json(
        { error: "Tipo inválido. Opções: created, paid, shipped." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Notificação WhatsApp '${type}' gerada para ${waResult.phone || order.customer_phone}!`,
      result: waResult,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ [API/ORDERS/WHATSAPP ERRO]:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
