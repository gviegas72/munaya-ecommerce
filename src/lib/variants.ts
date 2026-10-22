/**
 * 🎸 MUNAYA ROCKS - MOTOR DE VARIANTES, CORES, TAMANHOS E SKUS
 * Padrão Oficial: [MUNAYA]-[NOME]-[COR]-[TAM] (ex: MUNAYA-DIMEBAG-PRETA-PP)
 */

export interface ProductColor {
  name: string;
  hex: string;
  skuCode: string;
  mockupUrl?: string;
}

export const OFFICIAL_COLORS: ProductColor[] = [
  { name: "Preta", hex: "#111111", skuCode: "PRETA" },
  { name: "Branca", hex: "#ffffff", skuCode: "BRANCA" },
  { name: "Cinza", hex: "#777777", skuCode: "CINZA" },
];

export const OFFICIAL_SIZES = ["PP", "P", "M", "G", "GG", "XGG"] as const;
export type ProductSize = (typeof OFFICIAL_SIZES)[number];

export interface SizeMeasurement {
  size: ProductSize;
  torax: number; // Largura do tórax em cm
  altura: number; // Comprimento em cm
  manga: number; // Comprimento da manga em cm
}

export const SIZE_MEASUREMENTS_TABLE: SizeMeasurement[] = [
  { size: "PP", torax: 47, altura: 68, manga: 20 },
  { size: "P", torax: 50, altura: 70, manga: 21 },
  { size: "M", torax: 53, altura: 72, manga: 22 },
  { size: "G", torax: 56, altura: 74, manga: 23 },
  { size: "GG", torax: 59, altura: 76, manga: 24 },
  { size: "XGG", torax: 62, altura: 78, manga: 25 },
];

/**
 * Limpa o nome ou slug para compor o Miolo do SKU
 * Ex: "Camiseta Dimebag" -> "DIMEBAG"
 * Ex: "Munaya Bonzo Series" -> "BONZO"
 * Ex: "MNY-TSH-BONZO" -> "BONZO"
 */
export function sanitizeSkuName(nameOrSlug: string): string {
  let clean = String(nameOrSlug || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^MNY-(TSH|BON|CAN|ECO|MOL)-/i, "")
    .replace(/^MNY-/i, "")
    .replace(/^CAMISETA\s+|^CAMISA\s+|^TSHIRT\s+|^T-SHIRT\s+/i, "")
    .replace(/^MUNAYA\s+/i, "")
    .replace(/\s+SERIES|\s+EDITION/i, "")
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Se veio um SKU completo como "MNY-TSH-BONZO-PRETA-M", extrai apenas o miolo do nome
  if (clean.includes("-")) {
    const parts = clean.split("-");
    // Se a última parte for tamanho conhecido e a penúltima cor conhecida, remove-as
    if (["PP", "P", "M", "G", "GG", "XGG", "UNICO"].includes(parts[parts.length - 1])) {
      parts.pop();
    }
    if (parts.length > 0 && ["PRETA", "BRANCA", "CINZA", "PRETO", "BRANCO"].includes(parts[parts.length - 1])) {
      parts.pop();
    }
    if (parts.length > 0) {
      clean = parts.join("-");
    }
  }

  if (!clean) {
    clean = "ROCK";
  }
  return clean;
}

/**
 * Normaliza o código da cor para o SKU
 * Pretos -> PRETA, Brancos -> BRANCA, Cinzas -> CINZA
 */
export function sanitizeSkuColor(colorName: string): string {
  const c = String(colorName || "").toUpperCase().trim();
  if (c.includes("PRET") || c === "#111111" || c === "#000000") return "PRETA";
  if (c.includes("BRANC") || c === "#FFFFFF") return "BRANCA";
  if (c.includes("CINZ") || c.includes("CHUMB") || c.includes("MESCL") || c === "#777777") return "CINZA";
  
  const custom = c
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "");
  return custom || "PRETA";
}

/**
 * Gera o SKU oficial da variante completa
 * Padrão Enxuto: MNY-[TIPO]-[NOME]-[COR]-[TAM]
 * Exemplo: MNY-TSH-DIMEBAG-PRETA-PP
 * Exemplo Caneca: MNY-CAN-DIMEBAG-BRANCA-UNICO
 * Exemplo Moletom: MNY-MOL-DIMEBAG-PRETA-G
 */
export function generateVariantSku(
  productNameOrSlug: string,
  colorName: string = "Preta",
  sizeName: string = "M",
  productType: string = "TSH"
): string {
  const typePart = String(productType || "TSH").toUpperCase().trim().slice(0, 3);
  const namePart = sanitizeSkuName(productNameOrSlug);
  const colorPart = sanitizeSkuColor(colorName);
  const sizePart = String(sizeName || "M").toUpperCase().trim();
  return `MNY-${typePart}-${namePart}-${colorPart}-${sizePart}`;
}

/**
 * Mapeia o id do Blank da Dimona para o código de 3 letras do SKU Munaya
 */
export function blankTypeToSkuType(blankType: string = "classic"): string {
  const b = String(blankType || "classic").toLowerCase();
  if (b.includes("caneca")) return "CAN";
  if (b.includes("bone") || b.includes("boné")) return "BON";
  if (b.includes("moletom")) return "MOL";
  if (b.includes("ecobag")) return "ECO";
  return "TSH";
}

/**
 * Gera o SKU base do produto (sem cor e tamanho)
 * Padrão Enxuto: MNY-[TIPO]-[NOME]
 */
export function generateBaseSku(productNameOrSlug: string, productType: string = "TSH"): string {
  const typePart = String(productType || "TSH").toUpperCase().trim().slice(0, 3);
  const namePart = sanitizeSkuName(productNameOrSlug);
  return `MNY-${typePart}-${namePart}`;
}

/**
 * Resolve a URL do mockup correspondente à cor selecionada:
 * 1. Se a cor tiver `mockupUrl` dedicada cadastrada no Admin, retorna ela.
 * 2. Se for a cor padrão Preta sem override, retorna a foto principal do produto.
 * 3. Para Branca, Cinza (Mescla) ou demais cores sem foto estática própria,
 *    gera dinamicamente o mockup da camiseta na cor escolhida com a estampa real do produto (/api/mockup).
 */
export function getColorMockupUrl(
  product: {
    name?: string;
    slug?: string;
    sku?: string;
    image_url?: string;
    artwork_url?: string;
    gallery?: string[];
  },
  color: ProductColor,
  blankType: string = "classic"
): string {
  if (color?.mockupUrl && String(color.mockupUrl).trim()) {
    return String(color.mockupUrl).trim();
  }

  const normColor = sanitizeSkuColor(color?.skuCode || color?.name || "PRETA");
  const cleanBlank = String(blankType || "classic").toLowerCase();
  const defaultCover =
    (product.gallery && product.gallery.length > 0 && product.gallery[0]) ||
    product.image_url ||
    "/uploads/modelo_bonzo_01.jpg";

  // Se for camiseta Classic na cor Preta sem mockup customizado, usa a foto de estúdio
  if (cleanBlank === "classic" && normColor === "PRETA") {
    return defaultCover;
  }

  const params = new URLSearchParams({
    color: normColor,
    blank: cleanBlank,
    sku: String(product.sku || product.slug || product.name || "MUNAYA"),
    name: String(product.name || "Camiseta Munaya Rocks"),
  });
  if (product.artwork_url) {
    params.set("art", String(product.artwork_url));
  }
  return `/api/mockup?${params.toString()}`;
}

