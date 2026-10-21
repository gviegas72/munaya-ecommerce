import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { applyPricingToCatalog, getPricingSettings } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/**
 * POST /api/pricing/apply
 * Aplica o cálculo de markup dinâmico a todos os produtos do catálogo
 */
export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 401 }
    );
  }

  try {
    const settings = await getPricingSettings();
    const result = await applyPricingToCatalog(settings);

    return NextResponse.json({
      success: true,
      updated_count: result.updatedCount,
      message: result.message,
    });
  } catch (err: any) {
    console.error("❌ [API PRICING APPLY] Erro ao aplicar precificação em lote:", err);
    return NextResponse.json(
      { error: "Erro ao atualizar preços do catálogo.", details: err?.message },
      { status: 500 }
    );
  }
}
