/**
 * Módulo de E-mails Transacionais da Munaya Rocks
 * Integração direta com a API do Resend (REST puro, sem dependências externas)
 * Documentação: https://resend.com/docs/api-reference/emails/send-email
 */

export interface EmailOrderItem {
  name: string;
  size?: string;
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
async function sendRawEmail({
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
 * Layout HTML Base compartilhado com estilo Rock Munaya (Dark Mode e Pink Punk)
 */
function emailLayout(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050505; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #050505; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0f0f0f; border: 2px solid #262626;">
          <!-- Topo com Logo -->
          <tr>
            <td align="center" style="padding: 32px 24px; border-bottom: 2px solid #262626; background-color: #000000;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; color: #ffffff;">
                MUNAYA<span style="color: #ff66c4;">.ROCKS</span>
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #a3a3a3; font-weight: 700;">
                Headless E-Commerce // Rock Wear
              </p>
            </td>
          </tr>

          <!-- Corpo Principal -->
          <tr>
            <td style="padding: 32px 28px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="padding: 24px; background-color: #000000; border-top: 1px solid #1f1f1f; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 1px;">
                Munaya Rocks • Porto Alegre, RS • Brasil
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #525252;">
                Dúvidas? Responda este e-mail ou fale com a gente no WhatsApp.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. E-mail: Pedido Recebido / Aguardando Pix
 */
export async function sendOrderCreatedEmail(order: EmailOrderPayload) {
  const itemsHtml = (order.items || [])
    .map(
      (it) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #1f1f1f; font-size: 14px; color: #ffffff; font-weight: 600;">
          ${it.name} <span style="color: #a3a3a3; font-size: 12px;">(${it.size || "M"})</span>
        </td>
        <td align="center" style="padding: 10px 0; border-bottom: 1px solid #1f1f1f; font-size: 14px; color: #d4d4d4;">
          ${it.quantity || it.qty || 1}x
        </td>
        <td align="right" style="padding: 10px 0; border-bottom: 1px solid #1f1f1f; font-size: 14px; color: #ffffff; font-weight: 700;">
          R$ ${Number(it.price || it.unit_price || 1).toFixed(2).replace(".", ",")}
        </td>
      </tr>`
    )
    .join("");

  const content = `
    <div style="margin-bottom: 24px;">
      <span style="font-size: 12px; text-transform: uppercase; font-weight: 800; letter-spacing: 2px; color: #ff66c4;">
        Pedido #${order.id} Registrado
      </span>
      <h2 style="margin: 8px 0 0 0; font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; color: #ffffff;">
        Falta pouco para o seu rock chegar! 🤘
      </h2>
      <p style="margin: 12px 0 0 0; font-size: 15px; color: #d4d4d4; line-height: 1.6;">
        Olá, <strong>${order.customer_name}</strong>! Recebemos seu pedido. Para colocarmos sua estampa na esteira de produção artesanal da fábrica, basta efetuar o pagamento via Pix.
      </p>
    </div>

    ${
      order.pix_code
        ? `
    <!-- Bloco Pix Copia e Cola -->
    <div style="background-color: #171717; border: 2px solid #ff66c4; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #ff66c4;">
        Código Pix Copia e Cola
      </p>
      <div style="background-color: #0a0a0a; border: 1px dashed #404040; padding: 12px; font-family: monospace; font-size: 12px; word-break: break-all; color: #f5f5f5; text-align: left;">
        ${order.pix_code}
      </div>
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #a3a3a3;">
        Copie o código acima e pague no app do seu banco. A aprovação é imediata.
      </p>
    </div>`
        : ""
    }

    <!-- Resumo dos Itens -->
    <div style="margin-top: 28px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #ffffff;">
        Itens Selecionados
      </h3>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        ${itemsHtml}
      </table>
      <div style="margin-top: 16px; padding-top: 12px; border-top: 2px solid #262626; text-align: right;">
        <span style="font-size: 13px; text-transform: uppercase; color: #a3a3a3; font-weight: 700;">Total:</span>
        <span style="font-size: 26px; font-weight: 900; color: #ff66c4; margin-left: 8px;">
          R$ ${Number(order.total_amount).toFixed(2).replace(".", ",")}
        </span>
      </div>
    </div>

    <!-- Endereço de Entrega -->
    ${
      order.street
        ? `
    <div style="margin-top: 28px; background-color: #141414; border: 1px solid #262626; padding: 16px;">
      <h4 style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #a3a3a3;">
        Endereço de Entrega
      </h4>
      <p style="margin: 0; font-size: 13px; color: #e5e5e5; line-height: 1.5;">
        ${order.street}, ${order.number || "S/N"} ${order.complement ? ` - ${order.complement}` : ""}<br>
        ${order.neighborhood} — ${order.city}/${order.state}<br>
        CEP: ${order.zipcode}
      </p>
    </div>`
        : ""
    }
  `;

  return sendRawEmail({
    to: order.customer_email,
    subject: `🤘 Pedido #${order.id} registrado! Falta pouco para o seu rock chegar`,
    html: emailLayout(`Pedido #${order.id} Munaya Rocks`, content),
  });
}

/**
 * 2. E-mail: Pagamento Confirmado / Entrou em Produção
 */
export async function sendPaymentConfirmedEmail(order: EmailOrderPayload) {
  const content = `
    <div style="margin-bottom: 24px;">
      <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #10b981; padding: 4px 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
        ✅ Pagamento Confirmado
      </span>
      <h2 style="margin: 0; font-size: 30px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; color: #ffffff;">
        Seu pedido #${order.id} entrou na esteira! ⚡
      </h2>
      <p style="margin: 14px 0 0 0; font-size: 15px; color: #d4d4d4; line-height: 1.6;">
        Tudo certo, <strong>${order.customer_name}</strong>! Recebemos a confirmação do seu pagamento de <strong>R$ ${Number(order.total_amount).toFixed(2).replace(".", ",")}</strong>.
      </p>
    </div>

    <!-- Card de Status da Produção -->
    <div style="background-color: #141414; border: 2px solid #262626; padding: 22px; margin: 24px 0;">
      <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #ff66c4;">
        🏭 Status: Em Produção Artesanal (Dimona)
      </h3>
      <p style="margin: 0; font-size: 13px; color: #a3a3a3; line-height: 1.6;">
        Sua camiseta está sendo impressa com tecnologia DTG de alta definição e algodão premium sustentável. Assim que a peça for embalada e postada na transportadora, você receberá o código de rastreamento oficial.
      </p>
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <a href="https://munayarocks.vercel.app" style="display: inline-block; background-color: #ffffff; color: #000000; font-weight: 900; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; padding: 14px 28px; text-decoration: none;">
        Acessar a Loja Munaya
      </a>
    </div>
  `;

  return sendRawEmail({
    to: order.customer_email,
    subject: `🔥 Pagamento confirmado! Seu pedido #${order.id} entrou em produção`,
    html: emailLayout(`Pagamento Confirmado #${order.id}`, content),
  });
}

/**
 * 3. E-mail: Pedido Enviado / Código de Rastreamento
 */
export async function sendOrderShippedEmail(order: EmailOrderPayload) {
  const tracking = order.tracking_code || "Em atualização";
  const trackingUrl =
    order.tracking_url ||
    `https://www.linkcorreios.com.br/?id=${encodeURIComponent(tracking)}`;

  const content = `
    <div style="margin-bottom: 24px;">
      <span style="display: inline-block; background-color: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; color: #38bdf8; padding: 4px 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
        📦 Pedido Despachado
      </span>
      <h2 style="margin: 0; font-size: 30px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; color: #ffffff;">
        Barulho a caminho! 🚚
      </h2>
      <p style="margin: 14px 0 0 0; font-size: 15px; color: #d4d4d4; line-height: 1.6;">
        Boa notícia, <strong>${order.customer_name}</strong>! Seu pedido <strong>#${order.id}</strong> acabou de sair da fábrica e já está em trânsito com a transportadora.
      </p>
    </div>

    <!-- Bloco de Rastreio em Destaque -->
    <div style="background-color: #171717; border: 2px solid #38bdf8; padding: 22px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #a3a3a3;">
        Código de Rastreamento
      </p>
      <div style="font-family: monospace; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: 2px; margin: 8px 0 16px 0;">
        ${tracking}
      </div>
      <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #38bdf8; color: #000000; font-weight: 900; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; padding: 12px 24px; text-decoration: none;">
        Rastrear Pacote Agora
      </a>
    </div>

    <!-- Endereço de Destino -->
    ${
      order.street
        ? `
    <div style="margin-top: 24px; background-color: #141414; border: 1px solid #262626; padding: 16px;">
      <h4 style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #a3a3a3;">
        Endereço de Entrega
      </h4>
      <p style="margin: 0; font-size: 13px; color: #e5e5e5; line-height: 1.5;">
        ${order.street}, ${order.number || "S/N"} ${order.complement ? ` - ${order.complement}` : ""}<br>
        ${order.neighborhood} — ${order.city}/${order.state}<br>
        CEP: ${order.zipcode}
      </p>
    </div>`
        : ""
    }
  `;

  return sendRawEmail({
    to: order.customer_email,
    subject: `📦 Barulho a caminho! Seu pedido #${order.id} foi enviado (+ Rastreio)`,
    html: emailLayout(`Pedido Enviado #${order.id}`, content),
  });
}
