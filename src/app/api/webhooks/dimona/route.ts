import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendOrderShippedEmail } from "@/lib/email";
import { safeCompare } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

/**
 * Webhook Oficial de Atualização de Produção e Rastreio da Dimona (Print-on-Demand)
 * Rota: POST /api/webhooks/dimona
 *
 * Recebe notificações automáticas da fábrica:
 * - Mudança de status: em_producao, embalado, enviado, entregue
 * - Código de rastreamento dos Correios / Jadlog
 */
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tokenQuery = url.searchParams.get("token");
    const apiKeyHeader =
      req.headers.get("api-key") ||
      req.headers.get("x-dimona-token") ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    const dimonaSecret = process.env.DIMONA_API_KEY;

    // Validação de segurança defensiva (se configurada chave)
    if (dimonaSecret && dimonaSecret !== "sandbox_dimona_token" && dimonaSecret !== "test") {
      const provided = apiKeyHeader || tokenQuery;
      if (provided && !safeCompare(provided, dimonaSecret)) {
        console.warn("⛔ [DIMONA WEBHOOK] Chave de autenticação inválida.");
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
      }
    }

    const body = await req.json().catch(() => ({}));

    console.log("🏭 [DIMONA WEBHOOK RECEBIDO]:", JSON.stringify(body, null, 2));

    const externalId =
      body.order_id ||
      body.external_id ||
      body.reference ||
      body.external_reference;

    if (!externalId) {
      return NextResponse.json(
        { error: "order_id ou external_id ausente no payload." },
        { status: 400 }
      );
    }

    const cleanOrderId = String(externalId).trim();

    // Busca o pedido correspondente no Supabase
    const { data: order, error: findError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", cleanOrderId)
      .single();

    if (findError || !order) {
      console.warn(`⚠️ [DIMONA WEBHOOK] Pedido #${cleanOrderId} não encontrado no Supabase.`);
      return NextResponse.json(
        { error: `Pedido #${cleanOrderId} não encontrado.` },
        { status: 404 }
      );
    }

    // Extrai dados de status e rastreamento
    const newStatus =
      body.status ||
      body.order_status ||
      body.dimona_status ||
      "em_producao";

    const trackingCode =
      body.tracking_code ||
      body.tracking ||
      body.tracking_number ||
      body.delivery?.tracking_code ||
      null;

    const trackingUrl =
      body.tracking_url ||
      body.delivery?.tracking_url ||
      (trackingCode
        ? `https://www.linkcorreios.com.br/?id=${encodeURIComponent(trackingCode)}`
        : null);

    const dimonaId = body.dimona_id || body.id || order.dimona_id;

    // Atualiza o pedido no Supabase
    const updates: Record<string, any> = {
      dimona_status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (dimonaId) updates.dimona_id = String(dimonaId);
    if (trackingCode) updates.tracking_code = String(trackingCode);
    if (trackingUrl) updates.tracking_url = String(trackingUrl);

    await supabaseAdmin
      .from("orders")
      .update(updates)
      .eq("id", cleanOrderId);

    console.log(`✅ [DIMONA WEBHOOK] Pedido #${cleanOrderId} atualizado para status: ${newStatus}`);

    // Se o pedido acabou de ser despachado com código de rastreio e o cliente ainda não foi notificado
    const isShipped =
      newStatus.toLowerCase().includes("enviado") ||
      newStatus.toLowerCase().includes("shipped") ||
      newStatus.toLowerCase().includes("despachado") ||
      Boolean(trackingCode && trackingCode !== order.tracking_code);

    if (isShipped && trackingCode && order.customer_email) {
      console.log(`📦 [DIMONA] Disparando e-mail de rastreamento para ${order.customer_email}...`);
      sendOrderShippedEmail({
        id: order.id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        total_amount: order.total_amount,
        tracking_code: trackingCode,
        tracking_url: trackingUrl,
        street: order.street,
        number: order.number,
        complement: order.complement,
        neighborhood: order.neighborhood,
        city: order.city,
        state: order.state,
        zipcode: order.zipcode,
      }).catch((e) => console.warn("⚠️ [EMAIL] Falha ao enviar e-mail de rastreio via webhook Dimona:", e));
    }

    return NextResponse.json({
      success: true,
      order_id: cleanOrderId,
      dimona_status: newStatus,
      tracking_code: trackingCode,
      message: "Webhook da Dimona processado com sucesso.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ [DIMONA WEBHOOK ERRO]:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
