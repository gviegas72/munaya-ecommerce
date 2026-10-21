import { NextRequest, NextResponse } from "next/server";
import { createDimonaOrder, DimonaOrderItem } from "@/lib/dimona";
import { getArtworkUrl } from "@/lib/artworks";

/**
 * Endpoint de Webhook da Nuvemshop
 * Disparado quando ocorre um evento de pedido pago na Nuvemshop
 * Rota: POST /api/webhooks/nuvemshop
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    console.log("🔔 [WEBHOOK NUVEMSHOP] Payload recebido:", {
      id: rawBody.id,
      event: rawBody.event,
      payment_status: rawBody.payment_status || rawBody.status,
    });

    // Se a Nuvemshop enviar apenas a notificação de evento com ID
    // ou o objeto completo do pedido
    const order = rawBody.order || rawBody;

    // Verificar se o pedido está pago (ou se é um disparo de teste)
    const isPaid =
      order.payment_status === "paid" ||
      order.status === "paid" ||
      rawBody.event === "order/paid" ||
      order.is_test === true;

    if (!isPaid) {
      console.log(
        `ℹ️ [WEBHOOK NUVEMSHOP] Pedido #${order.id} ignorado pois o status de pagamento não é 'paid' (status atual: ${order.payment_status || order.status})`
      );
      return NextResponse.json({
        received: true,
        message: "Evento recebido. Nenhuma ação necessária para pedidos não pagos.",
      });
    }

    // Extrair endereço de entrega
    const shipping = order.shipping_address || order.billing_address || {};
    const recipientName =
      shipping.name ||
      `${shipping.first_name || ""} ${shipping.last_name || ""}`.trim() ||
      order.customer?.name ||
      "Cliente Munaya";

    // Extrair produtos e mapear SKUs
    const rawProducts = order.products || order.line_items || [];
    const items: DimonaOrderItem[] = rawProducts.map((p: any) => ({
      sku: p.sku || `MUNAYA-${p.product_id || p.id}`,
      name: p.name || "Camiseta Munaya",
      qty: Number(p.quantity) || 1,
      size: p.variant_values?.[0] || p.size || "M",
      color: p.variant_values?.[1] || p.color || "Preto",
      unit_price: Number(p.price) || undefined,
      artwork_url: p.artwork_url || getArtworkUrl(p.sku || p.name),
    }));

    if (items.length === 0) {
      console.warn(`⚠️ [WEBHOOK NUVEMSHOP] Pedido #${order.id} sem itens de produto.`);
      return NextResponse.json(
        { error: "Nenhum produto encontrado no pedido." },
        { status: 400 }
      );
    }

    // Preparar o payload para a API da Dimona
    const dimonaOrderPayload = {
      external_id: String(order.id || Date.now()),
      items,
      delivery: {
        recipient_name: recipientName,
        recipient_document: order.customer?.identification || order.customer?.document || shipping.id_number || "00000000000",
        recipient_email: order.customer?.email || order.contact_email || order.email || "contato@munayarocks.com.br",
        recipient_phone: shipping.phone || order.customer?.phone || "",
        street: shipping.address || shipping.street || "Endereço não informado",
        number: shipping.number || "S/N",
        complement: shipping.floor || shipping.complement || "",
        neighborhood: shipping.locality || shipping.neighborhood || "Centro",
        city: shipping.city || "São Paulo",
        state: shipping.province || shipping.state || "SP",
        zipcode: shipping.zipcode || shipping.postal_code || "00000000",
        shipping_speed: (order.shipping_option === "express" ? "SEDEX" : "PAC") as "PAC" | "SEDEX",
      },
      notes: `Pedido #${order.id} importado automaticamente da Nuvemshop (Munaya Rocks)`,
    };

    console.log("📦 [WEBHOOK NUVEMSHOP] Encaminhando pedido para a Dimona:", {
      external_id: dimonaOrderPayload.external_id,
      items_count: items.length,
      recipient: dimonaOrderPayload.delivery.recipient_name,
      city: `${dimonaOrderPayload.delivery.city}/${dimonaOrderPayload.delivery.state}`,
    });

    // Enviar para a esteira de produção da Dimona
    const dimonaResponse = await createDimonaOrder(dimonaOrderPayload);

    if (!dimonaResponse.success) {
      console.error(
        `❌ [WEBHOOK NUVEMSHOP] Falha ao despachar pedido #${order.id} para a Dimona:`,
        dimonaResponse.message
      );
      return NextResponse.json(
        {
          success: false,
          error: dimonaResponse.message,
          dimona_response: dimonaResponse,
        },
        { status: 502 }
      );
    }

    console.log(
      `✅ [WEBHOOK NUVEMSHOP] Pedido #${order.id} enviado à Dimona com sucesso! Dimona ID: ${dimonaResponse.order_id}`
    );

    return NextResponse.json({
      success: true,
      nuvemshop_order_id: order.id,
      dimona_order_id: dimonaResponse.order_id,
      status: dimonaResponse.status,
      message: "Pedido recebido e despachado para produção na Dimona com sucesso.",
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("💥 [WEBHOOK NUVEMSHOP] Erro não tratado:", errorMsg);
    return NextResponse.json(
      { error: "Erro interno no processamento do webhook.", details: errorMsg },
      { status: 500 }
    );
  }
}

/**
 * Health check para teste rápido da rota via GET no navegador
 */
export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "Munaya Nuvemshop-to-Dimona Webhook Dispatcher",
    timestamp: new Date().toISOString(),
    dimona_configured: !!process.env.DIMONA_API_KEY,
  });
}
