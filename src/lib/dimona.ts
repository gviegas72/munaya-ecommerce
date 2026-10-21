/**
 * Cliente de Integração com a API v2 da Camisa Dimona (Print-on-Demand)
 * Documentação: https://admin.camisadimona.com.br/api/v2 e https://api.camisadimona.com.br/
 */

export interface DimonaOrderItem {
  sku: string;
  name: string;
  qty: number;
  size?: string;
  color?: string;
  artwork_url?: string;
  mock_url?: string;
  unit_price?: number;
}

export interface DimonaDeliveryAddress {
  recipient_name: string;
  recipient_document?: string;
  recipient_email?: string;
  recipient_phone?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  shipping_speed?: "PAC" | "SEDEX" | "TRANSPORTADORA" | "pac" | "sedex";
}

export interface DimonaCreateOrderPayload {
  external_id: string; // ID do pedido na Nuvemshop
  items: DimonaOrderItem[];
  delivery: DimonaDeliveryAddress;
  notes?: string;
}

export interface DimonaOrderResponse {
  success: boolean;
  order_id?: string;
  status?: string;
  message?: string;
  raw?: unknown;
}

const DIMONA_BASE_URL =
  process.env.DIMONA_API_URL || "https://admin.camisadimona.com.br/api/v2";

/**
 * Envia um novo pedido de produção sob demanda para a API da Camisa Dimona
 */
export async function createDimonaOrder(
  order: DimonaCreateOrderPayload
): Promise<DimonaOrderResponse> {
  const apiKey = process.env.DIMONA_API_KEY;

  // Se a chave não estiver configurada ou estiver em modo de teste/simulação
  if (!apiKey || apiKey === "sandbox_dimona_token" || apiKey === "test") {
    console.warn(
      "⚠️ [DIMONA] DIMONA_API_KEY não configurada ou em modo sandbox. Simulando sucesso do pedido:",
      order.external_id,
      order.items
    );
    return {
      success: true,
      order_id: `SIMULATED-DIMONA-${order.external_id}-${Date.now()}`,
      status: "aguardando_producao_simulado",
      message: "Pedido simulado com sucesso (modo sandbox/desenvolvimento).",
      raw: {
        received_order: order,
        mode: "sandbox",
      },
    };
  }

  try {
    const payload = {
      order_id: String(order.external_id),
      customer_name: order.delivery.recipient_name,
      customer_document: (order.delivery.recipient_document || "00000000000").replace(/\D/g, ""),
      customer_email: order.delivery.recipient_email || "",
      shipping_speed: (order.delivery.shipping_speed || "PAC").toLowerCase(),
      address: {
        street: order.delivery.street,
        number: String(order.delivery.number || "S/N"),
        complement: order.delivery.complement || "",
        neighborhood: order.delivery.neighborhood || "Centro",
        city: order.delivery.city,
        state: order.delivery.state,
        zipcode: order.delivery.zipcode.replace(/\D/g, ""),
      },
      items: order.items.map((item) => ({
        name: item.name,
        sku: item.sku,
        qty: item.qty,
        designs: item.artwork_url ? [item.artwork_url] : [],
        mocks: item.mock_url ? [item.mock_url] : [],
      })),
      notes: order.notes || `Pedido Munaya #${order.external_id}`,
    };

    const response = await fetch(`${DIMONA_BASE_URL}/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("❌ [DIMONA] Erro ao criar pedido na Dimona:", {
        status: response.status,
        data,
      });
      return {
        success: false,
        message:
          data?.message || `Erro HTTP ${response.status} ao comunicar com a Dimona.`,
        raw: data,
      };
    }

    return {
      success: true,
      order_id: data?.order || data?.id || data?.order_id || `DIMONA-${order.external_id}`,
      status: data?.status || "recebido",
      message: "Pedido enviado para produção com sucesso.",
      raw: data,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("❌ [DIMONA] Falha de conexão com a API da Dimona:", errorMessage);
    return {
      success: false,
      message: `Falha na requisição: ${errorMessage}`,
    };
  }
}

/**
 * Consulta cotação de frete diretamente na API da Dimona
 */
export async function calculateDimonaShipping(
  zipcode: string,
  totalQuantity = 1
) {
  const apiKey = process.env.DIMONA_API_KEY;
  if (!apiKey || apiKey === "sandbox_dimona_token") {
    // Retorno mockado para testes
    return [
      { service: "PAC", price: 18.5, days: 5 },
      { service: "SEDEX", price: 28.9, days: 2 },
    ];
  }

  const response = await fetch(`${DIMONA_BASE_URL}/shipping`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      zipcode: zipcode.replace(/\D/g, ""),
      quantity: totalQuantity,
    }),
  });

  return await response.json();
}
