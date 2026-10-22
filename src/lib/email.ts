/**
 * 📧 MÓDULO DE E-MAILS TRANSACIONAIS DA MUNAYA ROCKS
 * 
 * Templates padronizados e responsivos construídos com @react-email
 * Suporte a Dark Mode, estética Rock'n'Roll e compatibilidade com Gmail, Outlook e Apple Mail.
 * Envio via Resend API (REST).
 */

import { render } from "@react-email/render";
import { OrderCreatedEmail } from "@/emails/OrderCreated";
import { PaymentConfirmedEmail } from "@/emails/PaymentConfirmed";
import { OrderShippedEmail } from "@/emails/OrderShipped";

export interface EmailOrderItem {
  name: string;
  size?: string;
  color?: string;
  blank?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  unit_price?: number;
}

export interface EmailOrderPayload {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  payment_method?: string;
  pix_code?: string;
  pix_qr_url?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  shipping_carrier?: string;
  shipping_eta?: string;
  tracking_code?: string;
  tracking_url?: string;
  items?: EmailOrderItem[];
}

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Função base para envio de e-mails via Resend
 */
export async function sendRawEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.EMAIL_FROM || "Munaya Rocks <onboarding@resend.dev>";

  if (!apiKey || apiKey === "sandbox_key" || apiKey.includes("test")) {
    console.log("📨 [SIMULAÇÃO DE E-MAIL TRANSACIONAL]", {
      to,
      subject,
      provider: "Resend (Simulado — configure RESEND_API_KEY no .env)",
    });
    return { success: true, simulated: true };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ [RESEND ERRO]:", data);
      return { success: false, error: data?.message || "Falha no envio" };
    }

    console.log(`✅ [E-MAIL ENVIADO COM SUCESSO] Para: ${to} | ID: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ [RESEND FALHA DE REDE]:", msg);
    return { success: false, error: msg };
  }
}

/**
 * 1. E-mail: Pedido Recebido / Aguardando Pix
 */
export async function sendOrderCreatedEmail(order: EmailOrderPayload) {
  try {
    const html = await render(
      OrderCreatedEmail({
        orderId: order.id,
        customerName: order.customer_name,
        pixCode: order.pix_code,
        totalAmount: order.total_amount,
        items: order.items,
        deliveryAddress: order.street
          ? {
              street: order.street,
              number: order.number || "S/N",
              complement: order.complement,
              neighborhood: order.neighborhood || "",
              city: order.city || "",
              state: order.state || "",
              zipcode: order.zipcode || "",
            }
          : undefined,
      })
    );

    return sendRawEmail({
      to: order.customer_email,
      subject: `🤘 Pedido #${order.id} registrado! Falta pouco para o seu rock chegar`,
      html,
    });
  } catch (renderErr) {
    console.error("Erro ao renderizar template OrderCreated:", renderErr);
    return { success: false, error: "Erro ao renderizar template de e-mail." };
  }
}

/**
 * 2. E-mail: Pagamento Confirmado / Entrou em Produção
 */
export async function sendPaymentConfirmedEmail(order: EmailOrderPayload) {
  try {
    const html = await render(
      PaymentConfirmedEmail({
        orderId: order.id,
        customerName: order.customer_name,
        totalAmount: order.total_amount,
        items: order.items,
        deliveryAddress: order.street
          ? {
              street: order.street,
              number: order.number || "S/N",
              complement: order.complement,
              neighborhood: order.neighborhood || "",
              city: order.city || "",
              state: order.state || "",
              zipcode: order.zipcode || "",
            }
          : undefined,
      })
    );

    return sendRawEmail({
      to: order.customer_email,
      subject: `🔥 Pagamento confirmado! Seu pedido #${order.id} entrou em produção`,
      html,
    });
  } catch (renderErr) {
    console.error("Erro ao renderizar template PaymentConfirmed:", renderErr);
    return { success: false, error: "Erro ao renderizar template de e-mail." };
  }
}

/**
 * 3. E-mail: Pedido Enviado / Código de Rastreamento
 */
export async function sendOrderShippedEmail(order: EmailOrderPayload) {
  try {
    const html = await render(
      OrderShippedEmail({
        orderId: order.id,
        customerName: order.customer_name,
        trackingCode: order.tracking_code || "NL123456789BR",
        trackingUrl: order.tracking_url,
        carrierName: order.shipping_carrier || "Correios",
        totalAmount: order.total_amount,
        items: order.items,
        deliveryAddress: order.street
          ? {
              street: order.street,
              number: order.number || "S/N",
              complement: order.complement,
              neighborhood: order.neighborhood || "",
              city: order.city || "",
              state: order.state || "",
              zipcode: order.zipcode || "",
            }
          : undefined,
      })
    );

    return sendRawEmail({
      to: order.customer_email,
      subject: `📦 Barulho a caminho! Seu pedido #${order.id} foi enviado (+ Rastreio)`,
      html,
    });
  } catch (renderErr) {
    console.error("Erro ao renderizar template OrderShipped:", renderErr);
    return { success: false, error: "Erro ao renderizar template de e-mail." };
  }
}
