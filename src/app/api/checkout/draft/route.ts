import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/checkout/draft
 * Endpoint de auto-save silencioso (debounce) para salvar o rascunho de checkout
 * Permite a recuperação automática de carrinhos abandonados (Issue #32)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const sessionId = String(body.sessionId || body.session_id || "").trim();
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Identificador de sessão ausente." },
        { status: 400 }
      );
    }

    const cleanPhone = String(body.phone || body.customer_phone || "").replace(/\D/g, "");
    const cleanEmail = String(body.email || body.customer_email || "").trim().toLowerCase();
    const cleanName = String(body.name || body.customer_name || "").trim();

    // Se ainda não preencheu nem telefone nem e-mail, não há dados para contato
    if (!cleanPhone && !cleanEmail) {
      return NextResponse.json({
        success: true,
        message: "Aguardando preenchimento de contato.",
        ignored: true,
      });
    }

    const items = Array.isArray(body.items) ? body.items : [];
    const subtotal = Number(body.subtotal || 0);
    const shippingAmount = Number(body.shippingAmount || body.shipping_amount || 0);
    const totalAmount = Number(body.totalAmount || body.total_amount || subtotal + shippingAmount);

    // Gera token amigável de recuperação caso ainda não exista
    const recoveryToken =
      String(body.recoveryToken || body.recovery_token || "").trim() ||
      `RCV-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    // 1. Verifica se já existe um rascunho para esta sessão
    const { data: existingDraft } = await supabaseAdmin
      .from("abandoned_checkouts")
      .select("id, status, recovery_token")
      .eq("session_id", sessionId)
      .maybeSingle();

    // Se já foi recuperado (o cliente concluiu o pedido), não sobrescreve
    if (existingDraft && existingDraft.status === "recovered") {
      return NextResponse.json({
        success: true,
        recovered: true,
        message: "Pedido já concluído com sucesso.",
      });
    }

    const payloadToSave: Record<string, any> = {
      session_id: sessionId,
      customer_name: cleanName || null,
      customer_email: cleanEmail || null,
      customer_phone: cleanPhone || null,
      customer_cpf: String(body.cpf || body.customer_cpf || "").replace(/\D/g, "") || null,
      zipcode: String(body.zipcode || body.cep || "").replace(/\D/g, "") || null,
      street: String(body.street || "").trim() || null,
      number: String(body.number || "").trim() || null,
      neighborhood: String(body.neighborhood || "").trim() || null,
      city: String(body.city || "").trim() || null,
      state: String(body.state || "").trim().toUpperCase() || null,
      cart_items: items,
      subtotal,
      shipping_amount: shippingAmount,
      shipping_carrier: String(body.shippingCarrier || body.shipping_carrier || "").trim() || null,
      total_amount: totalAmount,
      recovery_token: existingDraft?.recovery_token || recoveryToken,
      coupon_code: String(body.couponCode || body.coupon || "").trim() || null,
      status: "draft",
      updated_at: new Date().toISOString(),
    };

    if (existingDraft?.id) {
      await supabaseAdmin
        .from("abandoned_checkouts")
        .update(payloadToSave)
        .eq("id", existingDraft.id);
    } else {
      await supabaseAdmin
        .from("abandoned_checkouts")
        .insert({
          ...payloadToSave,
          created_at: new Date().toISOString(),
        });
    }

    return NextResponse.json({
      success: true,
      recovery_token: payloadToSave.recovery_token,
      session_id: sessionId,
    });
  } catch (error: any) {
    console.error("❌ [CHECKOUT DRAFT] Erro ao salvar rascunho:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Falha interna ao salvar rascunho." },
      { status: 500 }
    );
  }
}
