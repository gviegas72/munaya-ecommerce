import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { getProductByIdOrSlug, getCatalogProducts } from "@/lib/supabase";
import {
  buildDimonaDispatchItem,
  validateDimonaOrderData,
  resolveDimonaSku,
  DIMONA_BLANKS,
} from "@/lib/dimona-mapping";
import { createDimonaOrder } from "@/lib/dimona";

export const dynamic = "force-dynamic";

/**
 * Endpoint de Simulação & Teste de Esteira Dimona (De/Para)
 * Rota: POST /api/dimona/test-dispatch
 */
export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminAuth(req)) {
      return NextResponse.json(
        { success: false, error: "Acesso administrativo obrigatório." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const productId = body.productId ? Number(body.productId) : null;
    const color = body.color || "Preta";
    const size = body.size || "M";
    const customBlankType = body.blank_type;

    let productMeta: any = null;

    if (productId) {
      productMeta = await getProductByIdOrSlug(productId);
    } else {
      const all = await getCatalogProducts();
      productMeta = all[0] || null;
    }

    if (!productMeta) {
      return NextResponse.json(
        { success: false, error: "Nenhum produto encontrado para o teste." },
        { status: 404 }
      );
    }

    const effectiveBlankType = customBlankType || productMeta.blank_type || "classic";
    const effectiveMeta = {
      ...productMeta,
      blank_type: effectiveBlankType,
    };

    const dummyItem = {
      sku: productMeta.sku ? `${productMeta.sku}-${color}-${size}` : undefined,
      name: productMeta.name,
      qty: 1,
      size,
      color,
      price: productMeta.price,
      artwork_url: productMeta.artwork_url,
      image_url: productMeta.image_url,
    };

    const dispatchItem = buildDimonaDispatchItem(dummyItem, effectiveMeta);

    const testDelivery = {
      recipient_name: "Cliente Teste Munaya (Homologação)",
      recipient_document: "11144477735",
      recipient_email: "teste@munayarocks.com.br",
      recipient_phone: "11988887777",
      street: "Rua Augusta",
      number: "123",
      complement: "Apto 42",
      neighborhood: "Consolação",
      city: "São Paulo",
      state: "SP",
      zipcode: "01305100",
      shipping_speed: "PAC" as const,
    };

    const validation = validateDimonaOrderData("TEST-SIMULATION", [dispatchItem], testDelivery);

    const orderPayload = {
      external_id: `SIMULACAO-${Date.now().toString().slice(-6)}`,
      items: [dispatchItem],
      delivery: testDelivery,
      notes: "Ordem gerada pelo Simulador de De/Para Dimona no /admin",
    };

    // Dispara via client da Dimona (que responde em modo dry-run / sandbox se em homologação)
    const dimonaResponse = await createDimonaOrder(orderPayload);

    return NextResponse.json({
      success: true,
      message: "Simulação de esteira Dimona executada com sucesso!",
      validation,
      resolvedSku: dispatchItem.sku,
      blank: DIMONA_BLANKS[effectiveBlankType] || DIMONA_BLANKS.classic,
      item: dispatchItem,
      payloadSent: orderPayload,
      dimonaResponse,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
