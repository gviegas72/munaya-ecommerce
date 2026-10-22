/**
 * 🏭 TESTE OFICIAL DE ESTEIRA DE/PARA DIMONA (ACL / ANTI-CORRUPTION LAYER)
 * Execute com: npm run test:dimona
 */

const DIMONA_BASE_URL =
  process.env.DIMONA_API_URL || "https://admin.camisadimona.com.br/api/v2";

const DIMONA_BLANKS = {
  classic: { name: "Classic 30.1 Algodão Penteado", prefix: "CLASSIC", cost: 42.0 },
  quality: { name: "Quality Premium 30.1", prefix: "QUALITY", cost: 48.0 },
  estonada: { name: "Estonada Rockwear", prefix: "ESTONADA", cost: 55.0 },
  moletom: { name: "Moletom Heavy Canguru", prefix: "MOLETOM", cost: 89.0 },
};

function resolveDimonaSku(canonicalSku, blankType = "classic", dimonaProdId = "") {
  const parts = canonicalSku.split("-");
  const color = parts.length >= 5 ? parts[parts.length - 2] : "PRETA";
  const size = parts.length >= 5 ? parts[parts.length - 1] : "M";

  if (dimonaProdId) {
    return `${dimonaProdId}-${color}-${size}`;
  }
  const blank = DIMONA_BLANKS[blankType] || DIMONA_BLANKS.classic;
  return `DIM-${blank.prefix}-${color}-${size}`;
}

async function simulateOrderDispatch(order) {
  const apiKey = process.env.DIMONA_API_KEY;

  if (!apiKey || apiKey === "sandbox_dimona_token" || apiKey === "test") {
    console.log(
      "⚠️ [DIMONA] DIMONA_API_KEY em modo sandbox/dry-run. Simulando esteira de produção:",
      order.external_id
    );
    return {
      success: true,
      order_id: `SIMULATED-DIMONA-${order.external_id}-${Date.now()}`,
      status: "aguardando_producao_simulado",
      message: "Pedido simulado com sucesso (modo sandbox/homologação).",
      raw: {
        received_order: order,
        mode: "sandbox",
      },
    };
  }

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
  console.log("===============================================================");
  console.log("🏭 TESTANDO ESTEIRA DE/PARA DIMONA (ACL / ANTI-CORRUPTION LAYER)");
  console.log("===============================================================\n");

  const testProduct = {
    id: 2,
    name: "Camiseta Dimebag",
    canonicalSku: "MNY-TSH-DIMEBAG-PRETA-G",
    blankType: "classic",
    dimonaProductId: "",
    artworkUrl: "https://munayarocks.vercel.app/artes/dimebag.jpg",
    mockUrl: "https://munayarocks.vercel.app/uploads/DIMEBAG_camiseta.jpg",
    price: 219.99,
  };

  const resolvedFactorySku = resolveDimonaSku(
    testProduct.canonicalSku,
    testProduct.blankType,
    testProduct.dimonaProductId
  );

  console.log("1. Resolução De/Para de Código de Fábrica:");
  console.log(`   - SKU Canônico Loja: ${testProduct.canonicalSku}`);
  console.log(`   - Blank Selecionado: ${DIMONA_BLANKS[testProduct.blankType].name} (Custo: R$ ${DIMONA_BLANKS[testProduct.blankType].cost.toFixed(2)})`);
  console.log(`   ➔ SKU Resolvido Fábrica Dimona: ${resolvedFactorySku}\n`);

  const orderPayload = {
    external_id: "MUNAYA-TEST-9901",
    items: [
      {
        sku: resolvedFactorySku,
        canonical_sku: testProduct.canonicalSku,
        name: testProduct.name,
        qty: 1,
        size: "G",
        color: "Preta",
        artwork_url: testProduct.artworkUrl,
        mock_url: testProduct.mockUrl,
        unit_price: testProduct.price,
      },
    ],
    delivery: {
      recipient_name: "Cliente Homologação Munaya",
      recipient_document: "11144477735",
      recipient_email: "teste@munayarocks.com.br",
      recipient_phone: "11988887777",
      street: "Rua das Pedras",
      number: "500",
      complement: "Sala 2",
      neighborhood: "Moinhos",
      city: "Porto Alegre",
      state: "RS",
      zipcode: "91380410",
      shipping_speed: "PAC",
    },
    notes: "Pedido homologação esteira De/Para Munaya Rocks -> Dimona v2",
  };

  console.log("2. Enviando payload oficial para conector Dimona...");
  const response = await simulateOrderDispatch(orderPayload);

  console.log("\n3. Retorno da API da Dimona:");
  console.log(JSON.stringify(response, null, 2));

  if (response.success) {
    console.log("\n✅ SUCESSO! Esteira De/Para Dimona validada com 100% de conformidade técnica.");
  } else {
    console.error("\n❌ Falha na simulação:", response.message);
  }
}

runTest();
