/**
 * Cliente de Integração com o Mercado Pago Orders API (Checkout Transparente)
 * Documentação: https://www.mercadopago.com.br/developers/pt/reference/orders_online/create
 */

export interface MpOrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  size?: string;
  sku?: string;
}

export interface MpPayer {
  name: string;
  email: string;
  cpf: string;
  phone?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
    zipcode: string;
  };
}

export interface CreatePixOrderParams {
  orderId: string;
  amount: number;
  description: string;
  payer: MpPayer;
  items: MpOrderItem[];
  notificationUrl?: string;
}

export interface CreateCardOrderParams {
  orderId: string;
  amount: number;
  token: string;
  installments: number;
  paymentMethodId: string;
  payer: MpPayer;
  items: MpOrderItem[];
  notificationUrl?: string;
}

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || "";
const MP_BASE_URL = "https://api.mercadopago.com/v1";

/**
 * Cria uma Ordem de Pagamento via PIX no Mercado Pago (Orders API)
 */
export async function createMercadoPagoPixOrder(params: CreatePixOrderParams) {
  if (!MP_ACCESS_TOKEN) {
    console.warn("⚠️ [MERCADO PAGO] MERCADOPAGO_ACCESS_TOKEN ausente. Gerando Pix simulado.");
    const dummyPix = `00020126580014BR.GOV.BCB.PIX0136munaya-${params.orderId.toLowerCase()}-2027520400005303986540${Number(params.amount).toFixed(2)}5802BR5906MUNAYA6009SAO PAULO62070503***6304A1B2`;
    return {
      success: true,
      order_id: `SIMULATED-MP-${params.orderId}`,
      external_reference: params.orderId,
      status: "action_required",
      status_detail: "waiting_transfer",
      pix: {
        payment_id: `PAY-SIM-${Date.now()}`,
        qr_code: dummyPix,
        qr_code_base64: "",
        ticket_url: "",
        expiration: new Date(Date.now() + 86400000).toISOString(),
      },
    };
  }

  const nameParts = (params.payer.name || "Cliente Munaya").trim().split(/\s+/);
  const firstName = nameParts[0] || "Cliente";
  const lastName = nameParts.slice(1).join(" ") || "Munaya";
  const cleanCpf = (params.payer.cpf || "").replace(/\D/g, "");
  const cleanZip = (params.payer.address?.zipcode || "00000000").replace(/\D/g, "");

  const payload = {
    external_reference: String(params.orderId),
    total_amount: Number(params.amount).toFixed(2),
    type: "online",
    processing_mode: "automatic",
    payer: {
      first_name: firstName,
      last_name: lastName,
      email: params.payer.email || "contato@munayarocks.com.br",
      identification: {
        type: "CPF",
        number: cleanCpf.length === 11 ? cleanCpf : "19119119100",
      },
      address: {
        zip_code: cleanZip.length === 8 ? cleanZip : "91380410",
        street_name: params.payer.address?.street || "Rua Principal",
        street_number: String(params.payer.address?.number || "100"),
      },
    },
    transactions: {
      payments: [
        {
          amount: Number(params.amount).toFixed(2),
          payment_method: {
            id: "pix",
            type: "bank_transfer",
          },
        },
      ],
    },
  };

  const response = await fetch(`${MP_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `pix-${params.orderId}-${Date.now()}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ [MERCADO PAGO] Erro ao criar ordem Pix:", data);
    throw new Error(
      data?.errors?.[0]?.message ||
        data?.message ||
        `Erro HTTP ${response.status} no Mercado Pago`
    );
  }

  const payment = data.transactions?.payments?.[0];
  const paymentMethod = payment?.payment_method;

  return {
    success: true,
    order_id: data.id,
    external_reference: data.external_reference,
    status: data.status,
    status_detail: data.status_detail,
    pix: {
      payment_id: payment?.id,
      qr_code: paymentMethod?.qr_code || "",
      qr_code_base64: paymentMethod?.qr_code_base64 || "",
      ticket_url: paymentMethod?.ticket_url || "",
      expiration: payment?.date_of_expiration,
    },
  };
}

/**
 * Consulta o status de uma Ordem no Mercado Pago
 */
export async function getMercadoPagoOrder(orderId: string) {
  if (!MP_ACCESS_TOKEN) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado no .env");
  }

  const response = await fetch(`${MP_BASE_URL}/orders/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      Accept: "application/json",
    },
  });

  return await response.json();
}
