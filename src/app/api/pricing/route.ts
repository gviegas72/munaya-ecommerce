import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/admin-auth";
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
 * Salva as configurações de custo e markup (Admin)
 */
export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 401 }
    );
  }

  try {
    const body: Partial<PricingSettings> = await req.json().catch(() => ({}));
    const res = await savePricingSettings(body);

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
