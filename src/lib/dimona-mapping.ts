/**
 * 🏭 MUNAYA ROCKS - MOTOR DE MAPEAMENTO DE/PARA DIMONA (ACL / Anti-Corruption Layer)
 * 
 * Vincula os SKUs canônicos Munaya (ex: MNY-TSH-DIMEBAG-PRETA-G) aos códigos e
 * parâmetros da esteira industrial da Camisa Dimona (API v2).
 */

import { sanitizeSkuColor } from "./variants";
import { getArtworkUrl } from "./artworks";

export interface BlankDefinition {
  id: string;
  name: string;
  shortLabel: string;
  codePrefix: string;
  skuType: string;
  factoryCost: number;
  suggestedPrice: number;
  category: "vestuario" | "acessorio";
  description: string;
  availableSizes: string[];
  defaultColors: string[];
}

/**
 * Catálogo Oficial de Blanks da Dimona integrados à esteira da Munaya
 */
export const DIMONA_BLANKS: Record<string, BlankDefinition> = {
  classic: {
    id: "classic",
    name: "Classic 30.1 Algodão Penteado",
    shortLabel: "Camiseta",
    codePrefix: "CLASSIC",
    skuType: "TSH",
    factoryCost: 42.0,
    suggestedPrice: 89.9,
    category: "vestuario",
    description: "Malha 100% algodão penteado 30.1, toque macio e reforço de ombro a ombro.",
    availableSizes: ["PP", "P", "M", "G", "GG", "XGG"],
    defaultColors: ["Preta", "Branca", "Cinza"],
  },
  quality: {
    id: "quality",
    name: "Quality Premium 30.1",
    shortLabel: "Camiseta Premium",
    codePrefix: "QUALITY",
    skuType: "TSH",
    factoryCost: 48.0,
    suggestedPrice: 119.0,
    category: "vestuario",
    description: "Algodão premium superior com acabamento especial e gramatura encorpada.",
    availableSizes: ["PP", "P", "M", "G", "GG", "XGG"],
    defaultColors: ["Preta", "Branca", "Cinza"],
  },
  estonada: {
    id: "estonada",
    name: "Estonada Rockwear",
    shortLabel: "Camiseta Estonada",
    codePrefix: "ESTONADA",
    skuType: "TSH",
    factoryCost: 55.0,
    suggestedPrice: 129.0,
    category: "vestuario",
    description: "Malha estonada com processo de lavanderia vintage e visual desgastado autêntico.",
    availableSizes: ["P", "M", "G", "GG", "XGG"],
    defaultColors: ["Preta", "Cinza"],
  },
  moletom: {
    id: "moletom",
    name: "Moletom Heavy Canguru",
    shortLabel: "Moletom",
    codePrefix: "MOLETOM",
    skuType: "MOL",
    factoryCost: 89.0,
    suggestedPrice: 199.9,
    category: "vestuario",
    description: "Moletom pesado 3 cabos com felpa interna, capuz forrado e bolso canguru.",
    availableSizes: ["P", "M", "G", "GG"],
    defaultColors: ["Preta", "Cinza"],
  },
  caneca: {
    id: "caneca",
    name: "Caneca Cerâmica Resinada 325ml",
    shortLabel: "Caneca",
    codePrefix: "CANECA",
    skuType: "CAN",
    factoryCost: 26.0,
    suggestedPrice: 49.9,
    category: "acessorio",
    description: "Cerâmica importada resinada para estampa em sublimação térmica de alta fidelidade.",
    availableSizes: ["UNICO"],
    defaultColors: ["Branca", "Preta"],
  },
  bone: {
    id: "bone",
    name: "Boné Snapback Premium",
    shortLabel: "Boné",
    codePrefix: "BONE",
    skuType: "BON",
    factoryCost: 38.0,
    suggestedPrice: 79.9,
    category: "acessorio",
    description: "Boné modelo snapback estruturado com regulagem traseira e aba reta/curva.",
    availableSizes: ["UNICO"],
    defaultColors: ["Preta"],
  },
  ecobag: {
    id: "ecobag",
    name: "Ecobag Algodão Cru 100%",
    shortLabel: "Ecobag",
    codePrefix: "ECOBAG",
    skuType: "ECO",
    factoryCost: 22.0,
    suggestedPrice: 39.9,
    category: "acessorio",
    description: "Ecobag sustentável em algodão cru resistente, alças reforçadas de 60cm.",
    availableSizes: ["UNICO"],
    defaultColors: ["Creme", "Preta"],
  },
};

export interface DimonaResolvedSku {
  dimonaSku: string;
  dimonaProductId?: string;
  blankType: string;
  blankName: string;
  factoryCost: number;
  colorCode: string;
  sizeCode: string;
}

/**
 * Resolve o SKU determinístico da Fábrica Dimona a partir do SKU canônico Munaya
 * ou parâmetros do produto.
 * 
 * Regra:
 * 1. Se o produto tiver `dimona_product_id` configurado (ex: DIM-4021):
 *    -> DIM-4021-[COR]-[TAM]
 * 2. Se não tiver ID explícito, resolve pelo blank de fábrica configurado:
 *    -> DIM-[BLANK_PREFIX]-[COR]-[TAM] (ex: DIM-CLASSIC-PRETA-G)
 */
export function resolveDimonaSku(
  canonicalSku: string,
  options: {
    dimonaProductId?: string;
    blankType?: string;
    colorName?: string;
    sizeName?: string;
  } = {}
): DimonaResolvedSku {
  const parts = String(canonicalSku || "").split("-");
  
  // Extrai cor e tamanho do SKU canônico MNY-TSH-[NOME]-[COR]-[TAM] caso não passados
  const inferredSize = parts.length >= 5 ? parts[parts.length - 1] : "M";
  const inferredColor = parts.length >= 5 ? parts[parts.length - 2] : "PRETA";

  const sizeCode = String(options.sizeName || inferredSize || "M").toUpperCase().trim();
  const colorCode = sanitizeSkuColor(options.colorName || inferredColor || "Preta");

  const rawBlank = (options.blankType || "classic").toLowerCase();
  const blank = DIMONA_BLANKS[rawBlank] || DIMONA_BLANKS.classic;

  let dimonaSku: string;
  const cleanDimonaProdId = (options.dimonaProductId || "").trim().toUpperCase();

  if (cleanDimonaProdId) {
    dimonaSku = `${cleanDimonaProdId}-${colorCode}-${sizeCode}`;
  } else {
    dimonaSku = `DIM-${blank.codePrefix}-${colorCode}-${sizeCode}`;
  }

  return {
    dimonaSku,
    dimonaProductId: cleanDimonaProdId || undefined,
    blankType: blank.id,
    blankName: blank.name,
    factoryCost: blank.factoryCost,
    colorCode,
    sizeCode,
  };
}

export interface DimonaDispatchItem {
  sku: string;
  canonical_sku: string;
  name: string;
  qty: number;
  size: string;
  color: string;
  artwork_url: string;
  mock_url?: string;
  unit_price: number;
  blank_type: string;
  factory_cost: number;
}

/**
 * Retorna o preço de venda efetivo para uma estampa e blank específicos
 */
export function getProductBlankPrice(
  productPrice: number,
  blankType: string = "classic",
  customBlankPrices?: Record<string, number>
): number {
  if (customBlankPrices && typeof customBlankPrices[blankType] === "number" && customBlankPrices[blankType] > 0) {
    return customBlankPrices[blankType];
  }
  const cleanBlank = String(blankType || "classic").toLowerCase();
  const blank = DIMONA_BLANKS[cleanBlank] || DIMONA_BLANKS.classic;
  // Se for camiseta classic, respeita o preço base do produto
  if (cleanBlank === "classic") {
    return Number(productPrice) || blank.suggestedPrice;
  }
  return blank.suggestedPrice;
}

/**
 * Constrói o item completo para despacho fabril na Dimona com validação rigorosa
 */
export function buildDimonaDispatchItem(
  item: {
    sku?: string;
    name?: string;
    qty?: number;
    size?: string;
    color?: string;
    price?: number;
    artwork_url?: string;
    image_url?: string;
  },
  productMeta?: {
    dimona_product_id?: string;
    blank_type?: string;
    artwork_url?: string;
    image_url?: string;
  },
  baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://munayarocks.vercel.app"
): DimonaDispatchItem {
  const canonicalSku = item.sku || `MNY-TSH-ROCK-${item.color || "PRETA"}-${item.size || "M"}`;
  const blankType = productMeta?.blank_type || "classic";
  const dimonaProductId = productMeta?.dimona_product_id;

  const resolved = resolveDimonaSku(canonicalSku, {
    dimonaProductId,
    blankType,
    colorName: item.color,
    sizeName: item.size,
  });

  // Resolve a URL da estampa em alta resolução
  let artworkUrl = item.artwork_url || productMeta?.artwork_url || "";
  if (!artworkUrl || !artworkUrl.startsWith("http")) {
    artworkUrl = getArtworkUrl(canonicalSku, baseUrl);
  }

  // Resolve a URL do mockup visual
  let mockUrl = item.image_url || productMeta?.image_url || "";
  if (mockUrl && !mockUrl.startsWith("http")) {
    mockUrl = `${baseUrl}${mockUrl.startsWith("/") ? "" : "/"}${mockUrl}`;
  }

  return {
    sku: resolved.dimonaSku,
    canonical_sku: canonicalSku,
    name: item.name || `Camiseta Munaya (${resolved.blankName})`,
    qty: Math.max(1, Number(item.qty) || 1),
    size: resolved.sizeCode,
    color: resolved.colorCode,
    artwork_url: artworkUrl,
    mock_url: mockUrl || undefined,
    unit_price: Number(item.price) || 89.9,
    blank_type: resolved.blankType,
    factory_cost: resolved.factoryCost,
  };
}

/**
 * Validação rigorosa dos itens e destinatário antes de disparar ordem para a Dimona
 */
export function validateDimonaOrderData(
  externalId: string,
  items: DimonaDispatchItem[],
  delivery: {
    recipient_name?: string;
    recipient_document?: string;
    recipient_email?: string;
    street?: string;
    number?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!externalId) errors.push("ID do pedido ausente.");
  if (!items || items.length === 0) errors.push("Lista de itens vazia.");

  items.forEach((it, idx) => {
    if (!it.sku) errors.push(`Item #${idx + 1} está sem SKU da Dimona.`);
    if (!it.artwork_url || !it.artwork_url.startsWith("http")) {
      errors.push(`Item #${idx + 1} (${it.name}) sem URL válida de arte em alta resolução (designs).`);
    }
  });

  if (!delivery.recipient_name) errors.push("Nome do destinatário ausente.");
  if (!delivery.street) errors.push("Rua/Endereço de entrega ausente.");
  if (!delivery.city) errors.push("Cidade de entrega ausente.");
  if (!delivery.state) errors.push("UF do estado de entrega ausente.");
  
  const cleanZip = String(delivery.zipcode || "").replace(/\D/g, "");
  if (cleanZip.length !== 8) {
    errors.push(`CEP inválido (${cleanZip}). Deve conter exatamente 8 dígitos.`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
