/**
 * Cliente de Integração com a Nuvemshop (Catálogo & Checkout)
 * Documentação da API: https://tiendanube.github.io/api-documentation/intro
 */

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
export const CATALOG_VARIANTS: Record<string, Record<string, string>> = {
  bonzo: {
    P: "1622729750",
    M: "1622729751",
    G: "1622729752",
    GG: "1622729753",
  },
  dimebag: {
    P: "1623046305",
    M: "1623046306",
    G: "1623046307",
    GG: "1623046308",
  },
  ghost: {
    P: "1623046693",
    M: "1623046694",
    G: "1623046695",
    GG: "1623046696",
  },
  cathedral: {
    P: "1623047278",
    M: "1623047279",
    G: "1623047280",
    GG: "1623047281",
  },
  amplificador: {
    P: "1623047745",
    M: "1623047746",
    G: "1623047747",
    GG: "1623047748",
  },
};

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
