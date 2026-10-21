import { NextRequest, NextResponse } from "next/server";
import {
  getCatalogProducts,
  getAllProductsAdmin,
  updateProductAdmin,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("admin") === "true";

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
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID do produto é obrigatório." },
        { status: 400 }
      );
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
