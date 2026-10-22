/**
 * Módulo de Notificações Transacionais via WhatsApp — Munaya Rocks
 * Compatível com provedores REST (Z-API, Evolution API, WPPConnect) + Deep Links wa.me
 */

export interface WhatsAppOrderItem {
  name: string;
  size?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  unit_price?: number;
}

export interface WhatsAppOrderPayload {
  id: string;
  customer_name: string;
  customer_phone?: string;
  total_amount: number;
  payment_method?: string;
  pix_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  shipping_carrier?: string;
  tracking_code?: string;
  tracking_url?: string;
  items?: WhatsAppOrderItem[];
}

export interface WhatsAppSendResult {
  success: boolean;
  simulated?: boolean;
  provider?: string;
  phone: string;
  text: string;
  wa_me_url: string;
  error?: string;
}

// Cache em memória para idempotência em runtime serverless
const sentNotificationsCache = new Set<string>();

/**
 * Higieniza o número de telefone removendo caracteres não numéricos
 * e garantindo o DDI 55 (Brasil).
 */
export function formatWhatsAppPhone(rawPhone?: string): string {
  const digits = String(rawPhone || "")
    .replace(/\D/g, "")
    .replace(/^0+/, "");

  if (!digits) return "";

  // Se já começa com 55 e tem 12 ou 13 dígitos, mantém
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // Se tem 10 ou 11 dígitos (DDD + número), adiciona o DDI 55
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits.startsWith("55") ? digits : `55${digits}`;
}

/**
 * Gera link direto oficial wa.me com a mensagem codificada
 */
export function buildWhatsAppDirectUrl(rawPhone: string, message: string): string {
  const cleanPhone = formatWhatsAppPhone(rawPhone);
  if (!cleanPhone) {
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Função base de disparo via API de WhatsApp (com fallback gracioso)
 */
async function sendRawWhatsApp({
  orderId,
  eventType,
  phone,
  text,
  forceResend = false,
}: {
  orderId: string;
  eventType: "created" | "paid" | "shipped";
  phone?: string;
  text: string;
  forceResend?: boolean;
}): Promise<WhatsAppSendResult> {
  const formattedPhone = formatWhatsAppPhone(phone);
  const waMeUrl = buildWhatsAppDirectUrl(formattedPhone, text);
  const idempotencyKey = `${orderId}:${eventType}`;

  if (!formattedPhone || formattedPhone.length < 12) {
    console.warn(`⚠️ [WHATSAPP] Telefone ausente ou inválido para o pedido #${orderId}:`, phone);
    return {
      success: false,
      simulated: true,
      phone: formattedPhone,
      text,
      wa_me_url: waMeUrl,
      error: "Telefone do cliente ausente ou incompleto.",
    };
  }

  if (!forceResend && sentNotificationsCache.has(idempotencyKey)) {
    console.log(`ℹ️ [WHATSAPP IDEMPOTÊNCIA] Notificação '${eventType}' já disparada para #${orderId}`);
    return {
      success: true,
      simulated: true,
      phone: formattedPhone,
      text,
      wa_me_url: waMeUrl,
    };
  }

  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiToken = process.env.WHATSAPP_API_TOKEN;

  if (!apiUrl || apiUrl === "sandbox" || apiUrl.includes("example.com")) {
    sentNotificationsCache.add(idempotencyKey);
    console.log("📲 [SIMULAÇÃO DE WHATSAPP TRANSACIONAL]", {
      orderId,
      eventType,
      to: formattedPhone,
      provider: "WhatsApp Fallback (Configure WHATSAPP_API_URL para disparo ativo)",
      preview: text.slice(0, 120) + "...",
    });
    return {
      success: true,
      simulated: true,
      provider: "wa.me_fallback",
      phone: formattedPhone,
      text,
      wa_me_url: waMeUrl,
    };
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiToken) {
      headers["Authorization"] = `Bearer ${apiToken}`;
      headers["Client-Token"] = apiToken;
      headers["apikey"] = apiToken;
    }

    const res = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        phone: formattedPhone,
        number: formattedPhone,
        message: text,
        textMessage: { text },
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("❌ [WHATSAPP API ERRO]:", data);
      return {
        success: false,
        provider: "api",
        phone: formattedPhone,
        text,
        wa_me_url: waMeUrl,
        error: data?.message || data?.error || `HTTP ${res.status}`,
      };
    }

    sentNotificationsCache.add(idempotencyKey);
    console.log(`✅ [WHATSAPP ENVIADO COM SUCESSO] Para: ${formattedPhone} | Pedido: #${orderId}`);
    return {
      success: true,
      simulated: false,
      provider: "api",
      phone: formattedPhone,
      text,
      wa_me_url: waMeUrl,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ [WHATSAPP FALHA DE REDE - FALLBACK ATIVADO]:", msg);
    return {
      success: true,
      simulated: true,
      provider: "fallback_after_error",
      phone: formattedPhone,
      text,
      wa_me_url: waMeUrl,
      error: msg,
    };
  }
}

/**
 * Gatilho 1: Pedido Criado via Pix (Resumo + Pix Copia-e-Cola)
 */
export async function sendOrderCreatedWhatsApp(
  order: WhatsAppOrderPayload,
  forceResend = false
): Promise<WhatsAppSendResult> {
  const firstName = String(order.customer_name || "Rocker").trim().split(/\s+/)[0];
  const totalBrl = Number(order.total_amount || 0).toFixed(2).replace(".", ",");
  const itemsSummary = (order.items || [])
    .map((it) => `• ${it.quantity || it.qty || 1}x ${it.name} (${it.size || "M"})`)
    .join("\n");

  const lines = [
    `🤘 *MUNAYA ROCKS — PEDIDO #${order.id}*`,
    ``,
    `Fala, *${firstName}*! Recebemos o seu pedido na loja.`,
    itemsSummary ? `\n*Itens do pedido:*\n${itemsSummary}\n` : "",
    `💰 *Total:* R$ ${totalBrl}`,
    order.pix_code
      ? [
          ``,
          `⚡ *PIX COPIA E COLA:*`,
          `Copie o código abaixo e cole no app do seu banco para aprovação imediata:`,
          ``,
          order.pix_code,
        ].join("\n")
      : "",
    ``,
    `Assim que o pagamento for confirmado, sua peça entra direto na esteira de produção artesanal! 🎸`,
  ]
    .filter(Boolean)
    .join("\n");

  return sendRawWhatsApp({
    orderId: order.id,
    eventType: "created",
    phone: order.customer_phone,
    text: lines,
    forceResend,
  });
}

/**
 * Gatilho 2: Pagamento Confirmado / Entrada em Produção
 */
export async function sendPaymentConfirmedWhatsApp(
  order: WhatsAppOrderPayload,
  forceResend = false
): Promise<WhatsAppSendResult> {
  const firstName = String(order.customer_name || "Rocker").trim().split(/\s+/)[0];
  const totalBrl = Number(order.total_amount || 0).toFixed(2).replace(".", ",");

  const lines = [
    `🔥 *PAGAMENTO CONFIRMADO — MUNAYA ROCKS*`,
    ``,
    `Tudo certo, *${firstName}*! Confirmamos o pagamento de *R$ ${totalBrl}* referente ao seu pedido *#${order.id}*.`,
    ``,
    `🏭 *Status:* Em Produção Artesanal (Dimona)`,
    `Sua estampa já está na linha de impressão DTG de alta definição. Assim que o pacote for despachado na transportadora, enviaremos seu código de rastreamento por aqui! 🤘`,
  ].join("\n");

  return sendRawWhatsApp({
    orderId: order.id,
    eventType: "paid",
    phone: order.customer_phone,
    text: lines,
    forceResend,
  });
}

/**
 * Gatilho 3: Pedido Despachado / Código de Rastreamento
 */
export async function sendOrderShippedWhatsApp(
  order: WhatsAppOrderPayload,
  forceResend = false
): Promise<WhatsAppSendResult> {
  const firstName = String(order.customer_name || "Rocker").trim().split(/\s+/)[0];
  const tracking = order.tracking_code || "Em atualização";
  const trackingUrl =
    order.tracking_url ||
    `https://www.linkcorreios.com.br/?id=${encodeURIComponent(tracking)}`;

  const lines = [
    `📦 *BARULHO A CAMINHO! — MUNAYA ROCKS*`,
    ``,
    `Boa notícia, *${firstName}*! Seu pedido *#${order.id}* saiu da fábrica e já está em trânsito.`,
    ``,
    `🚚 *Código de Rastreio:* ${tracking}`,
    `🔗 *Acompanhe a entrega:* ${trackingUrl}`,
    order.street
      ? `\n📍 *Destino:* ${order.street}, ${order.number || "S/N"} — ${order.city || ""}/${order.state || ""}`
      : "",
    ``,
    `Obrigado por vestir Munaya Rocks! 🤘⚡`,
  ]
    .filter(Boolean)
    .join("\n");

  return sendRawWhatsApp({
    orderId: order.id,
    eventType: "shipped",
    phone: order.customer_phone,
    text: lines,
    forceResend,
  });
}
