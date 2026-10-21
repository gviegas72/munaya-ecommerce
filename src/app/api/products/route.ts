import { NextRequest, NextResponse } from "next/server";
import {
  getCatalogProducts,
  getAllProductsAdmin,
  updateProductAdmin,
} from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("admin") === "true";

    if (isAdmin && !verifyAdminAuth(req)) {
      return NextResponse.json(
        { success: false, error: "Acesso administrativo não autorizado." },
        { status: 401 }
      );
    }

    const products = isAdmin
      ? await getAllProductsAdmin()
      : await getCatalogProducts();

    return NextResponse.json({
      success: true,
      source: products.length > 0 ? "supabase" : "fallback",
      products,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!verifyAdminAuth(req)) {
      return NextResponse.json(
        {
          success: false,
          error: "Acesso administrativo obrigatório para alteração de catálogo.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID do produto é obrigatório." },
        { status: 400 }
      );
    }

    if (updates.price !== undefined) {
      const cleanPrice = Number(String(updates.price).replace(",", "."));
      if (isNaN(cleanPrice) || cleanPrice < 0) {
        return NextResponse.json(
          { success: false, error: "Preço numérico inválido." },
          { status: 400 }
        );
      }
      updates.price = cleanPrice;
    }

    if (updates.display_order !== undefined) {
      const cleanOrder = parseInt(String(updates.display_order), 10);
      if (!isNaN(cleanOrder)) {
        updates.display_order = cleanOrder;
      }
    }

    const res = await updateProductAdmin(Number(id), updates);
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: res.data,
      message: "Produto atualizado com sucesso.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
