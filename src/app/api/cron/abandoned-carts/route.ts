import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/admin-auth";
import {
  sendPixReminderWhatsApp,
  sendAbandonedCartRecoveryWhatsApp,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // 30 segundos de execução na Vercel

/**
 * GET e POST /api/cron/abandoned-carts
 * Orquestrador Automatizado de Recuperação de Carrinho & Pix (Issue #32)
 * Disparado pelo GitHub Actions (a cada 10 min), pela Cron Job diária da Vercel ou manualmente pelo /admin
 */
export async function GET(req: NextRequest) {
  return handleRecovery(req);
}

export async function POST(req: NextRequest) {
  return handleRecovery(req);
}

async function handleRecovery(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Proteção de segurança: aceita chamada agendada (Vercel Cron / GitHub Actions)
  // com o CRON_SECRET, ou um operador autenticado do /admin (disparo manual).
  const isCronCall = Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;
  const isAuthorized =
    isCronCall ||
    Boolean(verifyAdminAuth(req)) ||
    process.env.NODE_ENV === "development";

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Acesso não autorizado ao motor de recuperação." },
      { status: 401 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://munayarocks.vercel.app";
  const now = new Date();
  const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000).toISOString();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const results = {
    timestamp: now.toISOString(),
    pixRemindersSent: 0,
    firstCartAlertsSent: 0,
    secondCartAlertsSent: 0,
    skippedPaid: 0,
    errors: [] as string[],
  };

  try {
    // =========================================================================
    // 1. QUICK WIN: RECUPERAÇÃO DE PIX GERADO NÃO PAGO (Estágio C)
    // =========================================================================
    const { data: pendingPixOrders, error: pixErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("payment_status", "aguardando_pagamento")
      .eq("payment_method", "pix")
      .lt("created_at", twentyMinutesAgo)
      .gt("created_at", fortyEightHoursAgo)
      .limit(15);

    if (pixErr) {
      console.warn("⚠️ [RECOVERY CRON] Aviso ao buscar pedidos Pix pendentes:", pixErr.message);
    } else if (pendingPixOrders && pendingPixOrders.length > 0) {
      for (const order of pendingPixOrders) {
        // Se já foi enviado o lembrete de Pix, pula
        const itemsMetadata = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
        const alreadyNotified = order.tracking_url === "pix_reminder_sent" || order.notes?.includes("pix_reminder_sent");

        if (alreadyNotified) continue;

        // Double check: status atual no banco
        const { data: freshOrder } = await supabaseAdmin
          .from("orders")
          .select("payment_status")
          .eq("id", order.id)
          .single();

        if (freshOrder?.payment_status === "pago") {
          results.skippedPaid++;
          continue;
        }

        if (order.customer_phone) {
          const sendRes = await sendPixReminderWhatsApp({
            id: order.id,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            total_amount: Number(order.total_amount),
            pix_code: order.mp_order_id ? undefined : undefined, // O Pix code já é associado
            items: Array.isArray(itemsMetadata) ? itemsMetadata : [],
          });

          if (sendRes.success) {
            results.pixRemindersSent++;
            // Grava marca d'água no pedido para idempotência
            await supabaseAdmin
              .from("orders")
              .update({
                notes: `${order.notes || ""} [pix_reminder_sent:${now.toISOString()}]`,
              })
              .eq("id", order.id);
          }
        }
      }
    }

    // =========================================================================
    // 2. RECUPERAÇÃO DE CHECKOUT ABANDONADO — 1º DISPARO (20 min — Suporte)
    // =========================================================================
    const { data: abandonedDrafts, error: draftsErr } = await supabaseAdmin
      .from("abandoned_checkouts")
      .select("*")
      .eq("status", "draft")
      .lt("updated_at", twentyMinutesAgo)
      .gt("updated_at", twentyFourHoursAgo)
      .not("customer_phone", "is", null)
      .limit(15);

    if (!draftsErr && abandonedDrafts) {
      for (const draft of abandonedDrafts) {
        // Verifica se o cliente tem algum pedido pago recente com o mesmo telefone ou e-mail
        if (draft.customer_phone) {
          const { data: paidOrders } = await supabaseAdmin
            .from("orders")
            .select("id")
            .eq("customer_phone", draft.customer_phone)
            .eq("payment_status", "pago")
            .limit(1);

          if (paidOrders && paidOrders.length > 0) {
            // Marca como recuperado e não incomoda
            await supabaseAdmin
              .from("abandoned_checkouts")
              .update({ status: "recovered", recovered_at: now.toISOString() })
              .eq("id", draft.id);
            results.skippedPaid++;
            continue;
          }
        }

        const recoveryUrl = `${siteUrl}/recuperar?token=${encodeURIComponent(draft.recovery_token)}`;
        const items = Array.isArray(draft.cart_items) ? draft.cart_items : [];

        const sendRes = await sendAbandonedCartRecoveryWhatsApp({
          sessionId: draft.session_id,
          customerName: draft.customer_name,
          customerPhone: draft.customer_phone,
          cartItems: items,
          totalAmount: Number(draft.total_amount || draft.subtotal || 0),
          recoveryUrl,
          isSecondAlert: false,
        });

        if (sendRes.success) {
          results.firstCartAlertsSent++;
          await supabaseAdmin
            .from("abandoned_checkouts")
            .update({
              status: "first_alert_sent",
              first_alert_sent_at: now.toISOString(),
            })
            .eq("id", draft.id);
        }
      }
    }

    // =========================================================================
    // 3. RECUPERAÇÃO DE CHECKOUT ABANDONADO — 2º DISPARO (24h — Cupom VOLTA5)
    // =========================================================================
    const { data: secondAlertDrafts, error: secondErr } = await supabaseAdmin
      .from("abandoned_checkouts")
      .select("*")
      .eq("status", "first_alert_sent")
      .lt("first_alert_sent_at", twentyFourHoursAgo)
      .gt("first_alert_sent_at", fortyEightHoursAgo)
      .not("customer_phone", "is", null)
      .limit(15);

    if (!secondErr && secondAlertDrafts) {
      for (const draft of secondAlertDrafts) {
        // Double check se já pagou
        const { data: paidOrders } = await supabaseAdmin
          .from("orders")
          .select("id")
          .eq("customer_phone", draft.customer_phone)
          .eq("payment_status", "pago")
          .limit(1);

        if (paidOrders && paidOrders.length > 0) {
          await supabaseAdmin
            .from("abandoned_checkouts")
            .update({ status: "recovered", recovered_at: now.toISOString() })
            .eq("id", draft.id);
          results.skippedPaid++;
          continue;
        }

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
          results.secondCartAlertsSent++;
          await supabaseAdmin
            .from("abandoned_checkouts")
            .update({
              status: "second_alert_sent",
              second_alert_sent_at: now.toISOString(),
            })
            .eq("id", draft.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Ciclo de recuperação executado com sucesso.",
      results,
    });
  } catch (error: any) {
    console.error("❌ [RECOVERY CRON FATAL]:", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Falha na execução do motor de recuperação.",
      },
      { status: 500 }
    );
  }
}
