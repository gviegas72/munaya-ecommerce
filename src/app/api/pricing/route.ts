import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { recordAuditLog } from "@/lib/audit";
import {
  getPricingSettings,
  savePricingSettings,
  calculateSellingPrice,
  calculateFinancialSummary,
  PricingSettings,
} from "@/lib/pricing";

export const dynamic = "force-dynamic";

/**
 * GET /api/pricing
 * Retorna as regras de precificação ativas e a simulação de margem
 */
export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json(
      { error: "Acesso não autorizado. Chave de administração inválida." },
      { status: 401 }
    );
  }

  try {
    const settings = await getPricingSettings();

    // Gera simulações financeiras para cada tipo de malha
    const simulations: Record<string, any> = {};
    Object.entries(settings.fabrics).forEach(([key, fabric]) => {
      const suggestedPrice = calculateSellingPrice(fabric.base_cost, settings);
      simulations[key] = {
        ...calculateFinancialSummary(
          fabric.base_cost,
          suggestedPrice,
          settings.tax_gateway_percent
        ),
        fabric_name: fabric.name,
      };
    });

    return NextResponse.json({
      success: true,
      settings,
      simulations,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Falha ao consultar regras de precificação.", details: err?.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pricing
 * Salva as configurações de custo e markup (Apenas Super Admin)
 */
export async function POST(req: NextRequest) {
  const session = verifyAdminAuth(req, ["super_admin"]);
  if (!session) {
    return NextResponse.json(
      { error: "Acesso restrito: Apenas usuários com permissão Super Admin podem alterar as regras de preço e markup." },
      { status: 403 }
    );
  }

  try {
    const body: Partial<PricingSettings> = await req.json().catch(() => ({}));
    const res = await savePricingSettings(body);

    await recordAuditLog(req, {
      user_id: session.id,
      user_email: session.email,
      action: "pricing_rules_update",
      entity: "pricing",
      entity_id: "global_pricing",
      payload_diff: {
        markup_type: body.markup_type,
        markup_value: body.markup_value,
        rounding_mode: body.rounding_mode,
        tax_gateway_percent: body.tax_gateway_percent,
      },
    });

    return NextResponse.json({
      success: res.success,
      settings: res.settings,
      message: "Regras de precificação e custos atualizadas com sucesso!",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erro ao salvar regras de precificação.", details: err?.message },
      { status: 500 }
    );
  }
}
