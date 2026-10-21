/**
 * 🎸 MUNAYA ROCKS - MOTOR DE PRECIFICAÇÃO DINÂMICA & MARKUP
 * Calcula preços de venda finais a partir do custo de produção B2B (Dimona),
 * aplicando margem de lucro percentual/multiplicador e arredondamento psicológico comercial (.90).
 */

import { supabaseAdmin, supabase, getAllProductsAdmin, updateProductAdmin } from "./supabase";

export interface FabricCostConfig {
  id: string;
  name: string;
  base_cost: number; // Custo de produção B2B na Dimona (R$)
  description: string;
}

export interface PricingSettings {
  markup_type: "percentage" | "multiplier"; // '%' sobre o custo ou multiplicador (ex: 2.2x)
  markup_value: number; // ex: 114.05 para 114.05% ou 2.14 para 2.14x
  rounding_mode: "90_cents" | "00_cents" | "exact"; // .90, .00 ou exato
  default_fabric: string; // ex: 'classic'
  tax_gateway_percent: number; // ex: 4.5% (Mercado Pago / Taxas)
  fabrics: Record<string, FabricCostConfig>;
  updated_at?: string;
}

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  markup_type: "percentage",
  markup_value: 114.05, // R$ 42,00 * 2.1405 = R$ 89,90
  rounding_mode: "90_cents",
  default_fabric: "classic",
  tax_gateway_percent: 4.5,
  fabrics: {
    classic: {
      id: "classic",
      name: "Classic 30.1 Algodão Penteado",
      base_cost: 42.0,
      description: "Malha tradicional 100% algodão Dimona com estampa digital DTG.",
    },
    quality: {
      id: "quality",
      name: "Quality Premium",
      base_cost: 48.0,
      description: "Malha de maior gramatura com toque macio e acabamento reforçado.",
    },
    estonada: {
      id: "estonada",
      name: "Estonada Rockwear (Lavagem Especial)",
      base_cost: 54.0,
      description: "Efeito marmorizado/estonado vintage clássico do rock.",
    },
    moletom: {
      id: "moletom",
      name: "Moletom Canguru c/ Capuz",
      base_cost: 98.0,
      description: "Moletom pesado com felpa interna e estampa em alta definição.",
    },
    ecobag: {
      id: "ecobag",
      name: "Ecobag Algodão Cru",
      base_cost: 28.0,
      description: "Sacola ecológica em lona resistente com alça reforçada.",
    },
  },
};

// Cache em memória caso o banco ainda não possua a tabela de configurações
let memorySettings: PricingSettings = { ...DEFAULT_PRICING_SETTINGS };

/**
 * Calcula o preço de venda final baseado no custo e nas regras de markup
 */
export function calculateSellingPrice(
  cost: number,
  settings: Partial<PricingSettings> = {}
): number {
  const cfg = { ...DEFAULT_PRICING_SETTINGS, ...settings };
  const baseCost = Number(cost) || 0;
  if (baseCost <= 0) return 0;

  let raw = 0;
  if (cfg.markup_type === "multiplier") {
    raw = baseCost * (Number(cfg.markup_value) || 2.14);
  } else {
    // Porcentagem: cost * (1 + markup/100)
    raw = baseCost * (1 + (Number(cfg.markup_value) || 114.05) / 100);
  }

  // Regra de arredondamento psicológico comercial
  if (cfg.rounding_mode === "90_cents") {
    const floor = Math.floor(raw);
    const cents = raw - floor;
    // Se o valor já estiver acima de .45, joga para floor + 0.90; se estiver abaixo, joga para floor - 1 + 0.90
    let rounded = floor + 0.9;
    if (cents < 0.35 && floor > 1) {
      rounded = floor - 1 + 0.9;
    }
    return Math.max(0.9, Number(rounded.toFixed(2)));
  }

  if (cfg.rounding_mode === "00_cents") {
    return Math.max(1, Math.round(raw));
  }

  // Exato com 2 casas
  return Math.max(0.01, Number(raw.toFixed(2)));
}

/**
 * Calcula indicadores financeiros (Lucro Bruto, Margem Bruta, Margem Líquida estimada)
 */
export function calculateFinancialSummary(
  cost: number,
  sellingPrice: number,
  taxPercent = 4.5
) {
  const c = Number(cost) || 0;
  const p = Number(sellingPrice) || 0;
  const tax = Number(taxPercent) || 0;

  const grossProfit = Math.max(0, p - c);
  const taxAmount = (p * tax) / 100;
  const netProfit = Math.max(0, p - c - taxAmount);
  const grossMarginPercent = p > 0 ? (grossProfit / p) * 100 : 0;
  const netMarginPercent = p > 0 ? (netProfit / p) * 100 : 0;
  const markupPercent = c > 0 ? ((p - c) / c) * 100 : 0;

  return {
    cost: c,
    selling_price: p,
    gross_profit: Number(grossProfit.toFixed(2)),
    tax_amount: Number(taxAmount.toFixed(2)),
    net_profit: Number(netProfit.toFixed(2)),
    gross_margin_percent: Number(grossMarginPercent.toFixed(1)),
    net_margin_percent: Number(netMarginPercent.toFixed(1)),
    markup_percent: Number(markupPercent.toFixed(1)),
  };
}

/**
 * Busca as configurações de precificação ativas
 */
export async function getPricingSettings(): Promise<PricingSettings> {
  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "pricing")
      .maybeSingle();

    if (!error && data?.value) {
      memorySettings = {
        ...DEFAULT_PRICING_SETTINGS,
        ...data.value,
        fabrics: {
          ...DEFAULT_PRICING_SETTINGS.fabrics,
          ...(data.value.fabrics || {}),
        },
      };
      return memorySettings;
    }
  } catch (e) {
    console.warn("⚠️ [PRICING] Tabela store_settings não disponível, usando memória:", e);
  }

  return memorySettings;
}

/**
 * Salva as configurações de precificação
 */
export async function savePricingSettings(
  settings: Partial<PricingSettings>
): Promise<{ success: boolean; settings: PricingSettings; error?: string }> {
  const updated: PricingSettings = {
    ...memorySettings,
    ...settings,
    fabrics: {
      ...memorySettings.fabrics,
      ...(settings.fabrics || {}),
    },
    updated_at: new Date().toISOString(),
  };

  memorySettings = updated;

  try {
    const { error } = await supabaseAdmin
      .from("store_settings")
      .upsert(
        {
          key: "pricing",
          value: updated,
          updated_at: updated.updated_at,
        },
        { onConflict: "key" }
      );

    if (error) {
      console.warn("⚠️ [PRICING] Erro ao gravar store_settings no Supabase:", error.message);
    }
  } catch (err: any) {
    console.warn("⚠️ [PRICING] Exceção ao gravar store_settings:", err?.message);
  }

  return { success: true, settings: updated };
}

/**
 * Aplica a regra de markup dinâmico a todos os produtos do catálogo (em lote)
 */
export async function applyPricingToCatalog(
  settings?: PricingSettings
): Promise<{ success: boolean; updatedCount: number; message: string }> {
  const activeSettings = settings || (await getPricingSettings());
  const products = await getAllProductsAdmin();

  if (!products || products.length === 0) {
    return { success: true, updatedCount: 0, message: "Nenhum produto para atualizar." };
  }

  let updatedCount = 0;

  for (const prod of products) {
    // Identifica o tipo de malha (padrão classic ou estonada se tiver 'estonada' na descrição/nome)
    const isEstonada =
      (prod.name || "").toLowerCase().includes("estonad") ||
      (prod.description || "").toLowerCase().includes("estonad") ||
      (prod.subtitle || "").toLowerCase().includes("estonad");

    const fabricKey = isEstonada ? "estonada" : activeSettings.default_fabric || "classic";
    const fabric = activeSettings.fabrics[fabricKey] || activeSettings.fabrics.classic;
    const baseCost = fabric?.base_cost || 42.0;

    const newPrice = calculateSellingPrice(baseCost, activeSettings);

    if (prod.price !== newPrice) {
      await updateProductAdmin(prod.id, { price: newPrice });
      updatedCount += 1;
    }
  }

  return {
    success: true,
    updatedCount,
    message: `${updatedCount} produtos foram atualizados com a nova regra de precificação!`,
  };
}
