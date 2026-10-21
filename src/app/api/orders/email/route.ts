import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/admin-auth";
import {
  sendOrderCreatedEmail,
  sendPaymentConfirmedEmail,
  sendOrderShippedEmail,
} from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Endpoint Administrativo para Reenvio / Disparo de E-mails Transacionais
 * Rota protegida: POST /api/orders/email
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

    let emailResult;

    if (type === "created") {
      emailResult = await sendOrderCreatedEmail({
        id: order.id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        total_amount: order.total_amount,
        payment_method: order.payment_method,
        street: order.street,
        number: order.number,
        complement: order.complement,
        neighborhood: order.neighborhood,
        city: order.city,
        state: order.state,
        zipcode: order.zipcode,
        items: order.items,
      });
    } else if (type === "paid") {
      emailResult = await sendPaymentConfirmedEmail({
        id: order.id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        total_amount: order.total_amount,
        items: order.items,
      });
    } else if (type === "shipped") {
      const finalTracking = tracking_code || order.tracking_code || "BR123456789MY";
      const finalUrl = tracking_url || order.tracking_url;

      // Se passou código novo de rastreamento, atualiza no Supabase
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

      emailResult = await sendOrderShippedEmail({
        id: order.id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
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
      });
    } else {
      return NextResponse.json(
        { error: "Tipo de e-mail inválido. Opções: created, paid, shipped." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `E-mail '${type}' enviado com sucesso para ${order.customer_email}!`,
      result: emailResult,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ [API/ORDERS/EMAIL ERRO]:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
