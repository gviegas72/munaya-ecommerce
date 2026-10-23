import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/checkout/recover?token=RCV-XXXX
 * Busca os dados de um carrinho abandonado a partir do recovery_token
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = String(searchParams.get("token") || "").trim();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token de recuperação ausente." },
        { status: 400 }
      );
    }

    const { data: draft, error } = await supabaseAdmin
      .from("abandoned_checkouts")
      .select("*")
      .eq("recovery_token", token)
      .maybeSingle();

    if (error || !draft) {
      return NextResponse.json(
        { success: false, error: "Carrinho não encontrado ou expirado." },
        { status: 404 }
      );
    }

    // Se já foi pago, avisa o cliente
    if (draft.status === "recovered") {
      return NextResponse.json({
        success: true,
        already_recovered: true,
        message: "Este pedido já foi finalizado e aprovado com sucesso!",
      });
    }

    return NextResponse.json({
      success: true,
      draft: {
        session_id: draft.session_id,
        customer_name: draft.customer_name,
        customer_email: draft.customer_email,
        customer_phone: draft.customer_phone,
        customer_cpf: draft.customer_cpf,
        zipcode: draft.zipcode,
        street: draft.street,
        number: draft.number,
        neighborhood: draft.neighborhood,
        city: draft.city,
        state: draft.state,
        items: draft.cart_items,
        subtotal: draft.subtotal,
        shipping_amount: draft.shipping_amount,
        shipping_carrier: draft.shipping_carrier,
        total_amount: draft.total_amount,
        coupon_code: draft.coupon_code,
      },
    });
  } catch (err: any) {
    console.error("❌ [CHECKOUT RECOVER API]:", err?.message || err);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar dados de recuperação." },
      { status: 500 }
    );
  }
}
