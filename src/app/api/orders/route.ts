import { NextRequest, NextResponse } from "next/server";
import { createDimonaOrder, DimonaOrderItem } from "@/lib/dimona";
import { getArtworkUrl } from "@/lib/artworks";
import { saveDatabaseOrder, getDatabaseOrdersAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { recordAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Lista todos os pedidos registrados no Supabase (para o painel de admin)
 * Rota protegida: GET /api/orders
 */
export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminAuth(req)) {
      return NextResponse.json(
        { success: false, error: "Acesso não autorizado. Autenticação administrativa obrigatória." },
        { status: 401 }
      );
    }

    const orders = await getDatabaseOrdersAdmin();
    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * Endpoint de Criação e Despacho de Pedidos do Checkout Headless Munaya
 * Rota protegida: POST /api/orders
 * NOTA DE SEGURANÇA: Esta rota agora exige autorização administrativa ou de webhook interno.
 * Pedidos públicos de clientes só podem ser despachados para a Dimona após liquidação de pagamento
 * confirmada pelo Webhook do Mercado Pago.
 */
export async function POST(req: NextRequest) {
  try {
    const session = verifyAdminAuth(req, ["super_admin", "operator"]);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Despacho direto de pedidos não permitido sem autorização de operador ou confirmação prévia.",
        },
        { status: 403 }
      );
    }
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

    // Salva ou atualiza o pedido no Supabase
    await saveDatabaseOrder({
      id: orderId,
      customer,
      address,
      shipping_carrier: dimonaOrderPayload.delivery.shipping_speed,
      dimona_id: dimonaRes.order_id,
      dimona_status: dimonaRes.status || "recebido",
      payment_status: "pago",
      items: rawItems,
    }).catch((e) => console.warn("Supabase order save:", e));

    await recordAuditLog(req, {
      user_id: session.id,
      user_email: session.email,
      action: "dimona_order_dispatch",
      entity: "orders",
      entity_id: String(orderId),
      payload_diff: {
        recipient_name: dimonaOrderPayload.delivery.recipient_name,
        dimona_order_id: dimonaRes.order_id,
        items_count: items.length,
        shipping: dimonaOrderPayload.delivery.shipping_speed,
      },
    });

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
