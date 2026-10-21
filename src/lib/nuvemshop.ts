/**
 * Cliente de Integração com a Nuvemshop (Catálogo & Checkout)
 * Documentação da API: https://tiendanube.github.io/api-documentation/intro
 */

import { ProductColor } from "./variants";

export interface NuvemshopVariant {
  id: number;
  product_id: number;
  sku: string;
  price: string;
  compare_at_price?: string;
  stock?: number;
  values: Array<{
    en?: string;
    es?: string;
    pt?: string;
  }>;
}

export interface NuvemshopImage {
  id: number;
  product_id: number;
  src: string;
  position: number;
}

export interface NuvemshopProduct {
  id: number;
  name: {
    pt: string;
    [key: string]: string;
  };
  description: {
    pt: string;
    [key: string]: string;
  };
  handle: {
    pt: string;
    [key: string]: string;
  };
  variants: NuvemshopVariant[];
  images: NuvemshopImage[];
  created_at?: string;
  updated_at?: string;
}

export interface StoreProduct {
  id: number | string;
  nuvemshopId?: string | number;
  name: string;
  price: string;
  rawPrice: number;
  image: string;
  images: string[];
  description: string;
  span?: string;
  variants: Array<{
    id: number;
    size: string;
    sku: string;
    price: string;
  }>;
  checkoutUrl: string;
  sku?: string;
  colors?: ProductColor[];
  sizes?: string[];
}

const STORE_URL =
  process.env.NEXT_PUBLIC_STORE_URL ||
  "https://munayarocks.lojavirtualnuvem.com.br";
const STORE_ID = process.env.NUVEMSHOP_STORE_ID || "8403729";
const ACCESS_TOKEN = process.env.NUVEMSHOP_ACCESS_TOKEN;

/**
 * Produtos base locais (Pilotos) para exibição imediata caso a API oficial
 * ainda não esteja com o Access Token gerado no painel da Nuvemshop
 */
export { CATALOG_VARIANTS } from "./catalog-variants";

export const LOCAL_FALLBACK_PRODUCTS: StoreProduct[] = [
  {
    id: 1,
    nuvemshopId: "375454425",
    name: "Munaya Bonzo",
    price: "R$ 89,90",
    rawPrice: 89.9,
    image: "/uploads/modelo_bonzo_01.jpg",
    images: [
      "/uploads/modelo_bonzo_01.jpg",
      "/uploads/01_BONZO_detalhe_01.jpg",
      "/distortion-bonzo.png",
    ],
    description:
      "Camiseta 100% algodão penteado 30.1. Estampa Bonzo exclusiva Munaya em alta definição.",
    span: "col-span-1 md:col-span-2 row-span-2",
    variants: [
      { id: 1622729750, size: "P", sku: "MUNAYA-BONZO-PRETA-P", price: "R$ 89,90" },
      { id: 1622729751, size: "M", sku: "MUNAYA-BONZO-PRETA-M", price: "R$ 89,90" },
      { id: 1622729752, size: "G", sku: "MUNAYA-BONZO-PRETA-G", price: "R$ 89,90" },
      { id: 1622729753, size: "GG", sku: "MUNAYA-BONZO-PRETA-GG", price: "R$ 89,90" },
    ],
    checkoutUrl: `${STORE_URL}/produtos/camiseta-munaya-bonzo-27l82/`,
  },
  {
    id: 2,
    name: "Camiseta Dimebag",
    price: "R$ 89,90",
    rawPrice: 89.9,
    image: "/uploads/DIMEBAG_camiseta.jpg",
    images: [
      "/uploads/DIMEBAG_camiseta.jpg",
      "/uploads/DIMEBAG_detalhe_02.jpg",
    ],
    description:
      "Camiseta 100% algodão preta profunda. Estampa Dimebag com visual agressivo e acabamento toque zero.",
    span: "col-span-1 row-span-1",
    variants: [
      { id: 1623046305, size: "P", sku: "MUNAYA-DIMEBAG-PRETA-P", price: "R$ 89,90" },
      { id: 1623046306, size: "M", sku: "MUNAYA-DIMEBAG-PRETA-M", price: "R$ 89,90" },
      { id: 1623046307, size: "G", sku: "MUNAYA-DIMEBAG-PRETA-G", price: "R$ 89,90" },
      { id: 1623046308, size: "GG", sku: "MUNAYA-DIMEBAG-PRETA-GG", price: "R$ 89,90" },
    ],
    checkoutUrl: `${STORE_URL}/produtos/camiseta-dimebag/`,
  },
  {
    id: 3,
    name: "Camiseta Ghost",
    price: "R$ 89,90",
    rawPrice: 89.9,
    image: "/uploads/GHOST_camiseta.jpg",
    images: [
      "/uploads/GHOST_camiseta.jpg",
      "/uploads/GHOST_detalhe_01.jpg",
      "/uploads/GHOST_modelos.jpg",
    ],
    description:
      "Camiseta estampa Ghost. Confeccionada em algodão de alta qualidade e caimento streetwear impecável.",
    span: "col-span-1 row-span-1",
    variants: [
      { id: 1623046693, size: "P", sku: "MUNAYA-GHOST-PRETA-P", price: "R$ 89,90" },
      { id: 1623046694, size: "M", sku: "MUNAYA-GHOST-PRETA-M", price: "R$ 89,90" },
      { id: 1623046695, size: "G", sku: "MUNAYA-GHOST-PRETA-G", price: "R$ 89,90" },
      { id: 1623046696, size: "GG", sku: "MUNAYA-GHOST-PRETA-GG", price: "R$ 89,90" },
    ],
    checkoutUrl: `${STORE_URL}/produtos/camiseta-ghost/`,
  },
  {
    id: 4,
    name: "Camiseta Cathedral",
    price: "R$ 89,90",
    rawPrice: 89.9,
    image: "/uploads/BORN2ROCK_camiseta.jpg",
    images: [
      "/uploads/BORN2ROCK_camiseta.jpg",
      "/uploads/BORN2ROCK_detalhe_01.jpg",
    ],
    description:
      "Camiseta estampa Cathedral. Estética pesada, inspirada no doom/stoner metal com conforto absoluto.",
    span: "col-span-1 md:col-span-2 row-span-1",
    variants: [
      { id: 1623047278, size: "P", sku: "MUNAYA-CATHEDRAL-PRETA-P", price: "R$ 89,90" },
      { id: 1623047279, size: "M", sku: "MUNAYA-CATHEDRAL-PRETA-M", price: "R$ 89,90" },
      { id: 1623047280, size: "G", sku: "MUNAYA-CATHEDRAL-PRETA-G", price: "R$ 89,90" },
      { id: 1623047281, size: "GG", sku: "MUNAYA-CATHEDRAL-PRETA-GG", price: "R$ 89,90" },
    ],
    checkoutUrl: `${STORE_URL}/produtos/camiseta-cathedral/`,
  },
  {
    id: 5,
    name: "Camiseta Amplificador",
    price: "R$ 89,90",
    rawPrice: 89.9,
    image: "/uploads/amp_detalhe_01.jpg",
    images: [
      "/uploads/amp_detalhe_01.jpg",
    ],
    description:
      "Camiseta estampa Amplificador. O som valvulado e a distorção bruta estampados em algodão premium.",
    span: "col-span-1 row-span-1",
    variants: [
      { id: 1623047745, size: "P", sku: "MUNAYA-AMPLIFICADOR-PRETA-P", price: "R$ 89,90" },
      { id: 1623047746, size: "M", sku: "MUNAYA-AMPLIFICADOR-PRETA-M", price: "R$ 89,90" },
      { id: 1623047747, size: "G", sku: "MUNAYA-AMPLIFICADOR-PRETA-G", price: "R$ 89,90" },
      { id: 1623047748, size: "GG", sku: "MUNAYA-AMPLIFICADOR-PRETA-GG", price: "R$ 89,90" },
    ],
    checkoutUrl: `${STORE_URL}/produtos/camiseta-amplificador/`,
  },
  {
    id: 6,
    name: "Camiseta Clutch",
    price: "R$ 89,90",
    rawPrice: 89.9,
    image: "/uploads/AIC_borboleta.jpg",
    images: ["/uploads/AIC_borboleta.jpg"],
    description: "Camiseta estampa Clutch. Confeccionada em algodão de alta qualidade.",
    span: "col-span-1 row-span-1",
    variants: [
      { id: 1623054236, size: "P", sku: "MUNAYA-CLUTCH-PRETA-P", price: "R$ 89,90" },
      { id: 1623054237, size: "M", sku: "MUNAYA-CLUTCH-PRETA-M", price: "R$ 89,90" },
      { id: 1623054238, size: "G", sku: "MUNAYA-CLUTCH-PRETA-G", price: "R$ 89,90" },
      { id: 1623054239, size: "GG", sku: "MUNAYA-CLUTCH-PRETA-GG", price: "R$ 89,90" },
    ],
    checkoutUrl: `${STORE_URL}/produtos/camiseta-clutch/`,
  },
  {
    id: 7,
    name: "Camiseta Soundgarden",
    price: "R$ 89,90",
    rawPrice: 89.9,
    image: "/uploads/david-gilmour_detalhe_01.jpg",
    images: ["/uploads/david-gilmour_detalhe_01.jpg"],
    description: "Camiseta estampa Soundgarden. Confeccionada em algodão de alta qualidade.",
    span: "col-span-1 row-span-1",
    variants: [
      { id: 1623055630, size: "P", sku: "MUNAYA-SOUNDGARDEN-PRETA-P", price: "R$ 89,90" },
      { id: 1623055631, size: "M", sku: "MUNAYA-SOUNDGARDEN-PRETA-M", price: "R$ 89,90" },
      { id: 1623055632, size: "G", sku: "MUNAYA-SOUNDGARDEN-PRETA-G", price: "R$ 89,90" },
      { id: 1623055633, size: "GG", sku: "MUNAYA-SOUNDGARDEN-PRETA-GG", price: "R$ 89,90" },
    ],
    checkoutUrl: `${STORE_URL}/produtos/camiseta-soundgarden/`,
  },
  {
    id: 8,
    name: "Camiseta Chico",
    price: "R$ 89,90",
    rawPrice: 89.9,
    image: "/uploads/modelo_bonzo_01.jpg",
    images: ["/uploads/modelo_bonzo_01.jpg"],
    description: "Camiseta estampa Chico. Confeccionada em algodão de alta qualidade.",
    span: "col-span-1 row-span-1",
    variants: [
      { id: 1623055976, size: "P", sku: "MUNAYA-CHICO-PRETA-P", price: "R$ 89,90" },
      { id: 1623055977, size: "M", sku: "MUNAYA-CHICO-PRETA-M", price: "R$ 89,90" },
      { id: 1623055978, size: "G", sku: "MUNAYA-CHICO-PRETA-G", price: "R$ 89,90" },
      { id: 1623055979, size: "GG", sku: "MUNAYA-CHICO-PRETA-GG", price: "R$ 89,90" },
    ],
    checkoutUrl: `${STORE_URL}/produtos/camiseta-chico/`,
  },
  {
    id: 9,
    name: "Camiseta Rolling Stones",
    price: "R$ 89,90",
    rawPrice: 89.9,
    image: "/uploads/BORN2ROCK_detalhe_02.jpg",
    images: ["/uploads/BORN2ROCK_detalhe_02.jpg"],
    description: "Camiseta estampa Rolling Stones. Confeccionada em algodão de alta qualidade.",
    span: "col-span-1 row-span-1",
    variants: [
      { id: 1623056408, size: "P", sku: "MUNAYA-ROLLING-STONES-PRETA-P", price: "R$ 89,90" },
      { id: 1623056409, size: "M", sku: "MUNAYA-ROLLING-STONES-PRETA-M", price: "R$ 89,90" },
      { id: 1623056410, size: "G", sku: "MUNAYA-ROLLING-STONES-PRETA-G", price: "R$ 89,90" },
      { id: 1623056411, size: "GG", sku: "MUNAYA-ROLLING-STONES-PRETA-GG", price: "R$ 89,90" },
    ],
    checkoutUrl: `${STORE_URL}/produtos/camiseta-rolling-stones/`,
  },
  {
    id: 10,
    name: "Camiseta Spiritualbeggars",
    price: "R$ 89,90",
    rawPrice: 89.9,
    image: "/distortion-bonzo.png",
    images: ["/distortion-bonzo.png"],
    description: "Camiseta estampa Spiritualbeggars. Confeccionada em algodão de alta qualidade.",
    span: "col-span-1 row-span-1",
    variants: [
      { id: 1623056776, size: "P", sku: "MUNAYA-SPIRITUALBEGGARS-PRETA-P", price: "R$ 89,90" },
      { id: 1623056777, size: "M", sku: "MUNAYA-SPIRITUALBEGGARS-PRETA-M", price: "R$ 89,90" },
      { id: 1623056778, size: "G", sku: "MUNAYA-SPIRITUALBEGGARS-PRETA-G", price: "R$ 89,90" },
      { id: 1623056779, size: "GG", sku: "MUNAYA-SPIRITUALBEGGARS-PRETA-GG", price: "R$ 89,90" },
    ],
    checkoutUrl: `${STORE_URL}/produtos/camiseta-spiritualbeggars/`,
  },
  {
    id: 11,
    name: "Camiseta Lionheart",
    price: "R$ 89,90",
    rawPrice: 89.9,
    image: "/uploads/MUNAYA_LionHeart_mostra02.jpg",
    images: ["/uploads/MUNAYA_LionHeart_mostra02.jpg"],
    description: "Camiseta estampa Lionheart. Confeccionada em algodão de alta qualidade.",
    span: "col-span-1 row-span-1",
    variants: [
      { id: 1623057201, size: "P", sku: "MUNAYA-LIONHEART-PRETA-P", price: "R$ 89,90" },
      { id: 1623057202, size: "M", sku: "MUNAYA-LIONHEART-PRETA-M", price: "R$ 89,90" },
      { id: 1623057203, size: "G", sku: "MUNAYA-LIONHEART-PRETA-G", price: "R$ 89,90" },
      { id: 1623057204, size: "GG", sku: "MUNAYA-LIONHEART-PRETA-GG", price: "R$ 89,90" },
    ],
    checkoutUrl: `${STORE_URL}/produtos/camiseta-lionheart/`,
  },
  {
    id: 12,
    name: "Camiseta Suicidal Tendencies",
    price: "R$ 89,90",
    rawPrice: 89.9,
    image: "/distortion-lionheart.png",
    images: ["/distortion-lionheart.png"],
    description: "Camiseta estampa Suicidal Tendencies. Confeccionada em algodão de alta qualidade.",
    span: "col-span-1 row-span-1",
    variants: [
      { id: 1623057549, size: "P", sku: "MUNAYA-SUICIDAL-TENDENCIES-PRETA-P", price: "R$ 89,90" },
      { id: 1623057550, size: "M", sku: "MUNAYA-SUICIDAL-TENDENCIES-PRETA-M", price: "R$ 89,90" },
      { id: 1623057551, size: "G", sku: "MUNAYA-SUICIDAL-TENDENCIES-PRETA-G", price: "R$ 89,90" },
      { id: 1623057552, size: "GG", sku: "MUNAYA-SUICIDAL-TENDENCIES-PRETA-GG", price: "R$ 89,90" },
    ],
    checkoutUrl: `${STORE_URL}/produtos/camiseta-suicidal-tendencies/`,
  },
  {
    id: 13,
    name: "Camiseta 3R Árvore",
    price: "R$ 89,90",
    rawPrice: 89.9,
    image: "/limited-raglan-psych-v3.png",
    images: ["/limited-raglan-psych-v3.png"],
    description: "Camiseta estampa 3R Árvore. Confeccionada em algodão de alta qualidade.",
    span: "col-span-1 row-span-1",
    variants: [
      { id: 1623057899, size: "P", sku: "MUNAYA-3R-ARVORE-PRETA-P", price: "R$ 89,90" },
      { id: 1623057900, size: "M", sku: "MUNAYA-3R-ARVORE-PRETA-M", price: "R$ 89,90" },
      { id: 1623057901, size: "G", sku: "MUNAYA-3R-ARVORE-PRETA-G", price: "R$ 89,90" },
      { id: 1623057902, size: "GG", sku: "MUNAYA-3R-ARVORE-PRETA-GG", price: "R$ 89,90" },
    ],
    checkoutUrl: `${STORE_URL}/produtos/camiseta-3r-arvore/`,
  },
  {
    id: 14,
    name: "Camiseta Monstermagnet",
    price: "R$ 89,90",
    rawPrice: 89.9,
    image: "/uploads/GHOST_modelos.jpg",
    images: ["/uploads/GHOST_modelos.jpg"],
    description: "Camiseta estampa Monstermagnet. Confeccionada em algodão de alta qualidade.",
    span: "col-span-1 row-span-1",
    variants: [
      { id: 1623058301, size: "P", sku: "MUNAYA-MONSTERMAGNET-PRETA-P", price: "R$ 89,90" },
      { id: 1623058302, size: "M", sku: "MUNAYA-MONSTERMAGNET-PRETA-M", price: "R$ 89,90" },
      { id: 1623058303, size: "G", sku: "MUNAYA-MONSTERMAGNET-PRETA-G", price: "R$ 89,90" },
      { id: 1623058304, size: "GG", sku: "MUNAYA-MONSTERMAGNET-PRETA-GG", price: "R$ 89,90" },
    ],
    checkoutUrl: `${STORE_URL}/produtos/camiseta-monstermagnet/`,
  },
  {
    id: 15,
    name: "Camiseta Coc",
    price: "R$ 89,90",
    rawPrice: 89.9,
    image: "/uploads/DIMEBAG_detalhe_02.jpg",
    images: ["/uploads/DIMEBAG_detalhe_02.jpg"],
    description: "Camiseta estampa Coc. Confeccionada em algodão de alta qualidade.",
    span: "col-span-1 row-span-1",
    variants: [
      { id: 1623058681, size: "P", sku: "MUNAYA-COC-PRETA-P", price: "R$ 89,90" },
      { id: 1623058682, size: "M", sku: "MUNAYA-COC-PRETA-M", price: "R$ 89,90" },
      { id: 1623058683, size: "G", sku: "MUNAYA-COC-PRETA-G", price: "R$ 89,90" },
      { id: 1623058684, size: "GG", sku: "MUNAYA-COC-PRETA-GG", price: "R$ 89,90" },
    ],
    checkoutUrl: `${STORE_URL}/produtos/camiseta-coc/`,
  },
];

/**
 * Busca todos os produtos ativos da loja
 */
export async function getStoreProducts(): Promise<StoreProduct[]> {
  if (!ACCESS_TOKEN || ACCESS_TOKEN === "seu_access_token_nuvemshop_aqui") {
    // Retorna o catálogo local enriquecido com as camisetas reais
    return LOCAL_FALLBACK_PRODUCTS;
  }

  try {
    const res = await fetch(
      `https://api.nuvemshop.com.br/v1/${STORE_ID}/products`,
      {
        headers: {
          Authentication: `bearer ${ACCESS_TOKEN}`,
          "User-Agent": "MunayaEcommerce (admin@munaya.com.br)",
        },
        next: { revalidate: 60 }, // Cache revalidado a cada 1 minuto
      }
    );

    if (!res.ok) {
      console.warn(
        `⚠️ [NUVEMSHOP] Falha ao consultar API (${res.status}). Usando catálogo local de fallback.`
      );
      return LOCAL_FALLBACK_PRODUCTS;
    }

    const apiProducts: NuvemshopProduct[] = await res.json();

    if (!Array.isArray(apiProducts) || apiProducts.length === 0) {
      return LOCAL_FALLBACK_PRODUCTS;
    }

    // Formatar os produtos da Nuvemshop para a vitrine Munaya
    return apiProducts.map((p, index) => {
      const primaryImage =
        p.images?.[0]?.src || "/uploads/modelo_bonzo_01.jpg";
      const allImages = p.images?.length
        ? p.images.map((img) => img.src)
        : [primaryImage];

      const firstPrice = Number(p.variants?.[0]?.price) || 119;
      const formattedPrice = `R$ ${firstPrice.toFixed(0)}`;

      // Grid span do layout brutalista
      const span =
        index === 0
          ? "col-span-1 md:col-span-2 row-span-2"
          : index === 3
          ? "col-span-1 md:col-span-2 row-span-1"
          : "col-span-1 row-span-1";

      const variants = (p.variants || []).map((v) => ({
        id: v.id,
        size: v.values?.[0]?.pt || v.sku?.split("-").pop() || "M",
        sku: v.sku || `MUNAYA-${p.id}-${v.id}`,
        price: `R$ ${Number(v.price).toFixed(0)}`,
      }));

      const handle = p.handle?.pt || "";
      const checkoutUrl = handle
        ? `${STORE_URL}/produtos/${handle}/`
        : `${STORE_URL}/produtos/`;

      return {
        id: p.id,
        nuvemshopId: p.id,
        name: p.name?.pt || "Camiseta Munaya",
        price: formattedPrice,
        rawPrice: firstPrice,
        image: primaryImage,
        images: allImages,
        description:
          p.description?.pt?.replace(/<[^>]*>?/gm, "") ||
          "Camiseta 100% algodão estonado Munaya.",
        span,
        variants,
        checkoutUrl,
      };
    });
  } catch (err) {
    console.error("❌ [NUVEMSHOP] Erro na requisição à Nuvemshop:", err);
    return LOCAL_FALLBACK_PRODUCTS;
  }
}

/**
 * Busca um produto específico pelo ID ou Slug
 */
export async function getStoreProductById(
  id: string | number
): Promise<StoreProduct | null> {
  const products = await getStoreProducts();
  const found = products.find(
    (p) => String(p.id) === String(id) || String(p.name).toLowerCase() === String(id).toLowerCase()
  );

  return found || products[0] || null;
}

/**
 * Monta o link para o checkout direto na Nuvemshop com a variação escolhida
 */
export function buildNuvemshopCheckoutUrl(
  productHandleOrUrl: string,
  variantId?: number
): string {
  if (!variantId) {
    return productHandleOrUrl.startsWith("http")
      ? productHandleOrUrl
      : `${STORE_URL}/produtos/${productHandleOrUrl}`;
  }

  // Redireciona para adicionar a variante ao carrinho da Nuvemshop
  return `${STORE_URL}/carrinho?add=${variantId}`;
}
