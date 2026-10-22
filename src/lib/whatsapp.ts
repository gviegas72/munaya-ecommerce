/**
 * Módulo de Notificações Transacionais via WhatsApp — Munaya Rocks
 * Integração Nativa com Evolution API (v1 e v2) + Persistência Segura no Supabase + Fallback wa.me
 */

import { supabaseAdmin } from "./supabase";

export interface EvolutionSettings {
  baseUrl: string;
  instanceName: string;
  apiKey: string;
  enabled: boolean;
  updatedAt?: string;
}

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

const CONFIG_BUCKET = "private-config";
const EVOLUTION_CONFIG_FILE = "evolution.json";

let cachedSettings: EvolutionSettings | null = null;
let cacheTimestamp = 0;
const sentNotificationsCache = new Set<string>();

/**
 * Carrega as credenciais da Evolution API salvas no bucket privado do Supabase
 * (ou das variáveis de ambiente como fallback).
 */
export async function getEvolutionSettings(forceRefresh = false): Promise<EvolutionSettings> {
  const now = Date.now();
  if (!forceRefresh && cachedSettings && now - cacheTimestamp < 15000) {
    return cachedSettings;
  }

  const defaultSettings: EvolutionSettings = {
    baseUrl: (process.env.EVOLUTION_API_URL || process.env.WHATSAPP_API_URL || "").replace(/\/+$/, ""),
    instanceName: process.env.EVOLUTION_INSTANCE_NAME || "munaya",
    apiKey: process.env.EVOLUTION_API_KEY || process.env.WHATSAPP_API_TOKEN || "",
    enabled: Boolean(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY),
  };

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(CONFIG_BUCKET)
      .download(EVOLUTION_CONFIG_FILE);

    if (!error && data) {
      const rawText = await data.text();
      const parsed = JSON.parse(rawText);
      cachedSettings = {
        baseUrl: String(parsed.baseUrl || defaultSettings.baseUrl).trim().replace(/\/+$/, ""),
        instanceName: String(parsed.instanceName || defaultSettings.instanceName).trim(),
        apiKey: String(parsed.apiKey || defaultSettings.apiKey).trim(),
        enabled: parsed.enabled !== undefined ? Boolean(parsed.enabled) : true,
        updatedAt: parsed.updatedAt,
      };
      cacheTimestamp = now;
      return cachedSettings;
    }
  } catch (err) {
    // Usa defaultSettings se ainda não houver arquivo salvo
  }

  cachedSettings = defaultSettings;
  cacheTimestamp = now;
  return defaultSettings;
}

/**
 * Salva as credenciais da Evolution API no bucket privado do Supabase
 */
export async function saveEvolutionSettings(
  input: Partial<EvolutionSettings>
): Promise<{ success: boolean; settings: EvolutionSettings; error?: string }> {
  const current = await getEvolutionSettings(true);
  const next: EvolutionSettings = {
    baseUrl: String(input.baseUrl ?? current.baseUrl).trim().replace(/\/+$/, ""),
    instanceName: String(input.instanceName ?? current.instanceName).trim(),
    apiKey: String(input.apiKey ?? current.apiKey).trim(),
    enabled: input.enabled !== undefined ? Boolean(input.enabled) : true,
    updatedAt: new Date().toISOString(),
  };

  try {
    // Garante que o bucket privado existe
    await supabaseAdmin.storage.createBucket(CONFIG_BUCKET, { public: false }).catch(() => {});

    const payload = Buffer.from(JSON.stringify(next, null, 2), "utf-8");
    const { error } = await supabaseAdmin.storage
      .from(CONFIG_BUCKET)
      .upload(EVOLUTION_CONFIG_FILE, payload, {
        contentType: "application/json",
        upsert: true,
      });

    if (error) {
      return { success: false, settings: next, error: error.message };
    }

    cachedSettings = next;
    cacheTimestamp = Date.now();
    return { success: true, settings: next };
  } catch (err: any) {
    return {
      success: false,
      settings: next,
      error: err?.message || "Erro ao gravar configurações da Evolution API.",
    };
  }
}

/**
 * Consulta o estado da instância na Evolution API (open, close, connecting)
 * e opcionalmente busca o QR Code de pareamento.
 */
export async function checkEvolutionConnection(fetchQr = false): Promise<{
  configured: boolean;
  state: string;
  qrcodeBase64?: string | null;
  pairingCode?: string | null;
  error?: string;
}> {
  const cfg = await getEvolutionSettings(true);
  if (!cfg.baseUrl || !cfg.instanceName || !cfg.apiKey) {
    return {
      configured: false,
      state: "unconfigured",
    };
  }

  try {
    const stateUrl = `${cfg.baseUrl}/instance/connectionState/${encodeURIComponent(cfg.instanceName)}`;
    const res = await fetch(stateUrl, {
      method: "GET",
      headers: {
        apikey: cfg.apiKey,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        configured: true,
        state: "error",
        error: data?.message || data?.response?.message || `HTTP ${res.status} ao consultar instância '${cfg.instanceName}'`,
      };
    }

    const state =
      data?.instance?.state ||
      data?.state ||
      data?.instance?.status ||
      "unknown";

    if (fetchQr && state !== "open") {
      const connectUrl = `${cfg.baseUrl}/instance/connect/${encodeURIComponent(cfg.instanceName)}`;
      const qrRes = await fetch(connectUrl, {
        method: "GET",
        headers: {
          apikey: cfg.apiKey,
          "Content-Type": "application/json",
        },
      });
      const qrData = await qrRes.json().catch(() => ({}));
      const qrcodeBase64 = qrData?.base64 || qrData?.qrcode?.base64 || null;
      const pairingCode = qrData?.pairingCode || qrData?.code || null;

      return {
        configured: true,
        state,
        qrcodeBase64,
        pairingCode,
      };
    }

    return {
      configured: true,
      state,
    };
  } catch (err: any) {
    return {
      configured: true,
      state: "error",
      error: err?.message || "Falha de conexão com o servidor da Evolution API.",
    };
  }
}

/**
 * Higieniza o número de telefone removendo caracteres não numéricos
 * e garantindo o DDI 55 (Brasil).
 */
export function formatWhatsAppPhone(rawPhone?: string): string {
  const digits = String(rawPhone || "")
    .replace(/\D/g, "")
    .replace(/^0+/, "");

  if (!digits) return "";

  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

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
 * Dispara mensagem de texto via Evolution API (compatível com v2 e v1)
 */
export async function sendEvolutionTextMessage(
  phone: string,
  text: string
): Promise<WhatsAppSendResult> {
  const formattedPhone = formatWhatsAppPhone(phone);
  const waMeUrl = buildWhatsAppDirectUrl(formattedPhone, text);

  if (!formattedPhone || formattedPhone.length < 12) {
    return {
      success: false,
      simulated: true,
      phone: formattedPhone,
      text,
      wa_me_url: waMeUrl,
      error: "Número de telefone inválido ou sem DDD.",
    };
  }

  const cfg = await getEvolutionSettings();

  if (!cfg.enabled || !cfg.baseUrl || !cfg.instanceName || !cfg.apiKey) {
    return {
      success: true,
      simulated: true,
      provider: "wa.me_fallback",
      phone: formattedPhone,
      text,
      wa_me_url: waMeUrl,
    };
  }

  const endpoint = `${cfg.baseUrl}/message/sendText/${encodeURIComponent(cfg.instanceName)}`;

  try {
    // 1. Tenta formato Evolution API v2 ({ number, text })
    let res = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: cfg.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: formattedPhone,
        text,
        delay: 1000,
      }),
    });

    // 2. Se retornar 400 Bad Request (Evolution API v1 exige textMessage: { text }), faz fallback imediato para v1
    if (res.status === 400) {
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          apikey: cfg.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: formattedPhone,
          options: {
            delay: 1000,
            presence: "composing",
          },
          textMessage: {
            text,
          },
        }),
      });
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg =
        data?.response?.message ||
        data?.message ||
        data?.error ||
        `HTTP ${res.status}`;
      console.error("❌ [EVOLUTION API ERRO]:", data);
      return {
        success: false,
        simulated: false,
        provider: "evolution_api",
        phone: formattedPhone,
        text,
        wa_me_url: waMeUrl,
        error: Array.isArray(errMsg) ? errMsg.join(", ") : String(errMsg),
      };
    }

    console.log(
      `✅ [EVOLUTION API DISPARADO] Instância: ${cfg.instanceName} | Para: ${formattedPhone}`
    );
    return {
      success: true,
      simulated: false,
      provider: "evolution_api",
      phone: formattedPhone,
      text,
      wa_me_url: waMeUrl,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ [EVOLUTION API FALHA DE REDE]:", msg);
    return {
      success: false,
      simulated: true,
      provider: "evolution_api_error",
      phone: formattedPhone,
      text,
      wa_me_url: waMeUrl,
      error: msg,
    };
  }
}

/**
 * Função interna com controle de idempotência para os gatilhos do pedido
 */
async function sendOrderWhatsAppNotification({
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
  const idempotencyKey = `${orderId}:${eventType}`;
  const formattedPhone = formatWhatsAppPhone(phone);
  const waMeUrl = buildWhatsAppDirectUrl(formattedPhone, text);

  if (!forceResend && sentNotificationsCache.has(idempotencyKey)) {
    return {
      success: true,
      simulated: true,
      phone: formattedPhone,
      text,
      wa_me_url: waMeUrl,
    };
  }

  const res = await sendEvolutionTextMessage(phone || "", text);
  if (res.success) {
    sentNotificationsCache.add(idempotencyKey);
  }
  return res;
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

  return sendOrderWhatsAppNotification({
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

  return sendOrderWhatsAppNotification({
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

  return sendOrderWhatsAppNotification({
    orderId: order.id,
    eventType: "shipped",
    phone: order.customer_phone,
    text: lines,
    forceResend,
  });
}
