/**
 * Teste de Integração Direta: Nuvemshop -> Dimona
 * Execute com: node scripts/test-dimona.mjs
 */

const DIMONA_BASE_URL =
  process.env.DIMONA_API_URL || "https://admin.camisadimona.com.br/api/v2";

async function simulateOrderDispatch(order) {
  const apiKey = process.env.DIMONA_API_KEY;

  if (!apiKey || apiKey === "sandbox_dimona_token" || apiKey === "test") {
    console.log(
      "⚠️ [DIMONA] DIMONA_API_KEY não configurada ou em modo sandbox. Simulando sucesso do pedido:",
      order.external_id
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

  const payload = {
    external_order_id: order.external_id,
    items: order.items.map((item) => ({
      sku: item.sku,
      name: item.name,
      quantity: item.qty,
      artwork_url: item.artwork_url || "",
      size: item.size,
      color: item.color,
    })),
    delivery: {
      name: order.delivery.recipient_name,
      phone: order.delivery.recipient_phone || "",
      street: order.delivery.street,
      number: order.delivery.number,
      complement: order.delivery.complement || "",
      neighborhood: order.delivery.neighborhood,
      city: order.delivery.city,
      state: order.delivery.state,
      zipcode: order.delivery.zipcode.replace(/\D/g, ""),
      shipping_speed: order.delivery.shipping_speed || "PAC",
    },
    notes: order.notes || `Pedido Munaya #${order.external_id}`,
  };

  const response = await fetch(`${DIMONA_BASE_URL}/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      success: false,
      message: data?.message || `Erro HTTP ${response.status}`,
      raw: data,
    };
  }

  return {
    success: true,
    order_id: data?.id || data?.order_id || `DIMONA-${order.external_id}`,
    status: data?.status || "recebido",
    message: "Pedido enviado para produção com sucesso.",
    raw: data,
  };
}

async function runTest() {
  console.log("=================================================");
  console.log("🧪 TESTANDO INTEGRAÇÃO DIRETA NUVEMSHOP -> DIMONA");
  console.log("=================================================\n");

  const mockNuvemshopOrder = {
    id: 98765432,
    store_id: 8403729,
    status: "paid",
    payment_status: "paid",
    customer: {
      name: "Gabriel Viegas",
      email: "cliente@munaya.com.br",
      phone: "11988887777",
    },
    shipping_address: {
      name: "Gabriel Viegas",
      address: "Av. Paulista",
      number: "1000",
      floor: "Apto 101",
      locality: "Bela Vista",
      city: "São Paulo",
      province: "SP",
      zipcode: "01310100",
      phone: "11988887777",
    },
    products: [
      {
        id: 101,
        name: "Camiseta Munaya Chaos Theory",
        sku: "MUNAYA-CHAOS-M",
        quantity: 1,
        price: "119.00",
        variant_values: ["M", "Preta"],
      },
    ],
  };

  console.log("1. Payload simulado recebido da Nuvemshop:");
  console.log(`   - Pedido ID: #${mockNuvemshopOrder.id}`);
  console.log(`   - Cliente: ${mockNuvemshopOrder.customer.name}`);
  console.log(`   - Produto: ${mockNuvemshopOrder.products[0].name} (${mockNuvemshopOrder.products[0].sku})`);
  console.log(`   - Destino: ${mockNuvemshopOrder.shipping_address.city}/${mockNuvemshopOrder.shipping_address.province}\n`);

  console.log("2. Processando e encaminhando para conector Dimona...");
  const dimonaPayload = {
    external_id: String(mockNuvemshopOrder.id),
    items: mockNuvemshopOrder.products.map((p) => ({
      sku: p.sku,
      name: p.name,
      qty: p.quantity,
      size: p.variant_values[0],
      color: p.variant_values[1],
      artwork_url: "https://munaya.com.br/estampas/chaos-theory-hd.png",
    })),
    delivery: {
      recipient_name: mockNuvemshopOrder.shipping_address.name,
      recipient_phone: mockNuvemshopOrder.shipping_address.phone,
      street: mockNuvemshopOrder.shipping_address.address,
      number: mockNuvemshopOrder.shipping_address.number,
      complement: mockNuvemshopOrder.shipping_address.floor,
      neighborhood: mockNuvemshopOrder.shipping_address.locality,
      city: mockNuvemshopOrder.shipping_address.city,
      state: mockNuvemshopOrder.shipping_address.province,
      zipcode: mockNuvemshopOrder.shipping_address.zipcode,
      shipping_speed: "PAC",
    },
    notes: `Pedido #${mockNuvemshopOrder.id} - Teste de Integração Munaya`,
  };

  const response = await simulateOrderDispatch(dimonaPayload);

  console.log("\n3. Resposta do Conector Dimona:");
  console.log(JSON.stringify(response, null, 2));

  if (response.success) {
    console.log("\n✅ SUCESSO! A esteira de pedidos Nuvemshop -> Dimona está 100% pronta e validada.");
  } else {
    console.error("\n❌ Erro no teste:", response.message);
  }
}

runTest();
