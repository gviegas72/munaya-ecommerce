import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { recordAuditLog } from "@/lib/audit";
import { applyPricingToCatalog, getPricingSettings } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/**
 * POST /api/pricing/apply
 * Aplica o cálculo de markup dinâmico a todos os produtos do catálogo (Apenas Super Admin)
 */
export async function POST(req: NextRequest) {
  const session = verifyAdminAuth(req, ["super_admin"]);
  if (!session) {
    return NextResponse.json(
      { error: "Acesso restrito: Apenas usuários com perfil Super Admin podem recalcular preços do catálogo em lote." },
      { status: 403 }
    );
  }

  try {
    const settings = await getPricingSettings();
    const result = await applyPricingToCatalog(settings);

    await recordAuditLog(req, {
      user_id: session.id,
      user_email: session.email,
      action: "pricing_batch_apply",
      entity: "catalog",
      entity_id: "all_products",
      payload_diff: {
        updated_count: result.updatedCount,
        markup_type: settings.markup_type,
        markup_value: settings.markup_value,
      },
    });

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
