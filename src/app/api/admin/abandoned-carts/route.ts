import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/admin-auth";
import {
  buildWhatsAppDirectUrl,
  formatWhatsAppPhone,
  sendAbandonedCartRecoveryWhatsApp,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/abandoned-carts
 * Retorna métricas de recuperação, lista de carrinhos e links de WhatsApp de 1-clique
 */
export async function GET(req: NextRequest) {
  const auth = verifyAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Acesso administrativo negado." }, { status: 401 });
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://munayarocks.vercel.app";

    // 1. Busca todos os carrinhos abandonados
    const { data: drafts, error: draftsErr } = await supabaseAdmin
      .from("abandoned_checkouts")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(100);

    if (draftsErr) {
      console.warn("Aviso ao consultar abandoned_checkouts:", draftsErr.message);
    }

    const itemsList = drafts || [];
    const totalAbandoned = itemsList.length;
    const recoveredList = itemsList.filter((d) => d.status === "recovered");
    const totalRecovered = recoveredList.length;
    const recoveryRate = totalAbandoned > 0 ? (totalRecovered / totalAbandoned) * 100 : 0;
    const recoveredAmount = recoveredList.reduce(
      (sum, d) => sum + Number(d.total_amount || d.subtotal || 0),
      0
    );

    // 2. Busca pedidos Pix pendentes há mais de 20 minutos
    const twentyMinAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const { data: pendingPix } = await supabaseAdmin
      .from("orders")
      .select("id, customer_name, customer_phone, total_amount, created_at, mp_order_id, notes")
      .eq("payment_status", "aguardando_pagamento")
      .eq("payment_method", "pix")
      .lt("created_at", twentyMinAgo)
      .limit(20);

    const pendingPixCount = pendingPix?.length || 0;

    // Enriquece a lista com link do WhatsApp Web
    const enrichedDrafts = itemsList.map((draft) => {
      const recoveryUrl = `${siteUrl}/recuperar?token=${encodeURIComponent(draft.recovery_token)}&cupom=VOLTA5`;
      const cleanPhone = formatWhatsAppPhone(draft.customer_phone);
      const firstName = String(draft.customer_name || "Rocker").split(/\s+/)[0];
      const itemsSummary = (Array.isArray(draft.cart_items) ? draft.cart_items : [])
        .map((it: any) => `• ${it.qty || 1}x ${it.name} (${it.size || "M"})`)
        .join("\n");

      const messageText = [
        `🤘 *MUNAYA ROCKS — SEU CARRINHO TE ESPERA!*`,
        ``,
        `Fala, *${firstName}*! Vimos que você separou umas peças exclusivas na loja:`,
        itemsSummary ? `\n${itemsSummary}\n` : "",
        `Pra te ajudar a fechar o pedido, liberamos o cupom *VOLTA5* com *5% OFF extra*:`,
        `🔗 ${recoveryUrl}`,
        ``,
        `É só tocar no link acima que sua sacola já abre com o desconto aplicado! ⚡🎸`,
      ]
        .filter(Boolean)
        .join("\n");

      const waMeUrl = buildWhatsAppDirectUrl(cleanPhone, messageText);

      return {
        ...draft,
        wa_me_url: waMeUrl,
        recovery_url: recoveryUrl,
      };
    });

    return NextResponse.json({
      success: true,
      metrics: {
        total_abandoned: totalAbandoned,
        total_recovered: totalRecovered,
        recovery_rate_pct: Number(recoveryRate.toFixed(1)),
        recovered_amount_brl: Number(recoveredAmount.toFixed(2)),
        pending_pix_count: pendingPixCount,
      },
      drafts: enrichedDrafts,
      pending_pix: pendingPix || [],
    });
  } catch (err: any) {
    console.error("❌ [ADMIN ABANDONED CARTS]:", err?.message || err);
    return NextResponse.json(
      { success: false, error: "Erro ao consultar métricas de recuperação." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/abandoned-carts
 * Disparo manual de recuperação para um carrinho específico
 */
export async function POST(req: NextRequest) {
  const auth = verifyAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Acesso administrativo negado." }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const draftId = body.draft_id;

    if (!draftId) {
      return NextResponse.json({ error: "ID do carrinho ausente." }, { status: 400 });
    }

    const { data: draft, error } = await supabaseAdmin
      .from("abandoned_checkouts")
      .select("*")
      .eq("id", draftId)
      .single();

    if (error || !draft) {
      return NextResponse.json({ error: "Carrinho não encontrado." }, { status: 404 });
    }

    if (!draft.customer_phone) {
      return NextResponse.json(
        { error: "Este carrinho não possui telefone cadastrado." },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://munayarocks.vercel.app";
    const recoveryUrl = `${siteUrl}/recuperar?token=${encodeURIComponent(draft.recovery_token)}&cupom=VOLTA5`;
    const items = Array.isArray(draft.cart_items) ? draft.cart_items : [];

    const sendRes = await sendAbandonedCartRecoveryWhatsApp({
      sessionId: draft.session_id,
      customerName: draft.customer_name,
      customerPhone: draft.customer_phone,
      cartItems: items,
      totalAmount: Number(draft.total_amount || draft.subtotal || 0),
      recoveryUrl,
      couponCode: "VOLTA5",
      isSecondAlert: true,
    });

    if (sendRes.success) {
      await supabaseAdmin
        .from("abandoned_checkouts")
        .update({
          status: "first_alert_sent",
          first_alert_sent_at: new Date().toISOString(),
        })
        .eq("id", draft.id);
    }

    return NextResponse.json({
      success: sendRes.success,
      result: sendRes,
      message: sendRes.success
        ? "Mensagem de recuperação enviada com sucesso pelo WhatsApp!"
        : "Disparo simulado ou falha na Evolution API.",
    });
  } catch (err: any) {
    console.error("❌ [ADMIN DISPATCH RECOVERY]:", err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao disparar recuperação manual." },
      { status: 500 }
    );
  }
}
