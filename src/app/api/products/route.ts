import { NextRequest, NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const products = await getCatalogProducts();
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
