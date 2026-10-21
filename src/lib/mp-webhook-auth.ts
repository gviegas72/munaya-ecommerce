import { createHmac } from "crypto";
import { safeCompare } from "@/lib/sanitize";

/**
 * Validação da assinatura criptográfica oficial do Webhook do Mercado Pago (HMAC SHA-256)
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 *
 * Headers esperados:
 * - x-signature: ts=...,v1=...
 * - x-request-id: UUID da requisição
 */
export function verifyMercadoPagoWebhookSignature(
  xSignatureHeader: string | null,
  xRequestId: string | null,
  dataId: string | null
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  // Se o segredo do webhook ainda não foi configurado na Vercel, permite em modo fallback auditável
  if (!secret) {
    console.warn("⚠️ [WEBHOOK] MERCADOPAGO_WEBHOOK_SECRET ausente. Modo permissivo ativo.");
    return true;
  }

  if (!xSignatureHeader || !dataId) {
    console.warn("❌ [WEBHOOK] x-signature ou dataId ausente.");
    return false;
  }

  try {
    // xSignatureHeader vem no formato: "ts=1700000000,v1=hash_hmac..."
    const parts = xSignatureHeader.split(",").reduce((acc: Record<string, string>, part) => {
      const [k, v] = part.split("=");
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    }, {});

    const ts = parts["ts"];
    const hash = parts["v1"];

    if (!ts || !hash) {
      return false;
    }

    // Template oficial de validação: "id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];"
    const manifest = `id:${dataId};request-id:${xRequestId || ""};ts:${ts};`;
    const computed = createHmac("sha256", secret).update(manifest).digest("hex");

    return safeCompare(computed, hash);
  } catch (err) {
    console.error("❌ [WEBHOOK] Erro ao validar assinatura HMAC:", err);
    return false;
  }
}
