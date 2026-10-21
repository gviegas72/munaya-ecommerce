import { NextRequest, NextResponse } from "next/server";
import { createDimonaOrder, DimonaOrderItem } from "@/lib/dimona";
import { getArtworkUrl } from "@/lib/artworks";

/**
 * Endpoint de Criação e Despacho de Pedidos do Checkout Headless Munaya
 * Rota: POST /api/orders
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const orderId = body.id || `MNY-${Math.floor(Math.random() * 9000) + 1000}`;
    const customer = body.customer || {};
    const address = body.address || {};
    const rawItems = body.items || [];

    // Mapeia os itens do carrinho para o formato da Dimona com as URLs das artes
    const items: DimonaOrderItem[] = rawItems.map((it: any) => {
      const sku = it.sku || `MUNAYA-${String(it.name || "BONZO").toUpperCase().replace(/\s+/g, "-")}-PRETA-${it.size || "M"}`;
      return {
        sku: sku,
        name: it.name || "Camiseta Munaya",
        qty: Number(it.quantity || it.qty) || 1,
        size: it.size || "M",
        color: "Preto",
        unit_price: Number(it.price || it.unit) || 119,
        artwork_url: it.artwork_url || getArtworkUrl(sku || it.name),
      };
    });

    const dimonaOrderPayload = {
      external_id: String(orderId),
      items,
      delivery: {
        recipient_name: customer.name || "Cliente Munaya",
        recipient_document: (customer.cpf || customer.document || "00000000000").replace(/\D/g, ""),
        recipient_email: customer.email || "contato@munayarocks.com.br",
        recipient_phone: customer.phone || customer.fone || "",
        street: address.street || address.rua || "Rua não informada",
        number: String(address.number || address.num || "S/N"),
        complement: address.complement || address.compl || "",
        neighborhood: address.neighborhood || address.bairro || "Centro",
        city: address.city || address.cidade || "Porto Alegre",
        state: address.state || address.uf || "RS",
        zipcode: String(address.zipcode || address.cep || "00000000").replace(/\D/g, ""),
        shipping_speed: (body.shipping_speed || "PAC") as "PAC" | "SEDEX",
      },
      notes: `Pedido #${orderId} gerado no Checkout Headless Munaya Rocks`,
    };

    console.log("🚀 [CHECKOUT VERCEL -> DIMONA] Enviando pedido:", {
      orderId,
      customer: dimonaOrderPayload.delivery.recipient_name,
      itemsCount: items.length,
      shipping: dimonaOrderPayload.delivery.shipping_speed,
    });

    const dimonaRes = await createDimonaOrder(dimonaOrderPayload);

    return NextResponse.json({
      success: true,
      order_id: orderId,
      dimona_order: dimonaRes,
      message: "Pedido registrado e despachado para a Dimona com sucesso.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ [API/ORDERS] Erro ao criar pedido:", msg);
    return NextResponse.json(
      { error: "Falha ao registrar pedido.", details: msg },
      { status: 500 }
    );
  }
}
