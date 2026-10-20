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
export const LOCAL_FALLBACK_PRODUCTS: StoreProduct[] = [
  {
    id: 1,
    name: "Munaya Bonzo",
    price: "R$ 119",
    rawPrice: 119.0,
    image: "/uploads/modelo_bonzo_01.jpg",
    images: [
      "/uploads/modelo_bonzo_01.jpg",
      "/uploads/01_BONZO_detalhe_01.jpg",
      "/distortion-bonzo.png",
    ],
    description:
      "Camiseta 100% algodão estonado pesado. Modelagem streetwear reta. Estampa Bonzo sob demanda Dimona em alta definição.",
    span: "col-span-1 md:col-span-2 row-span-2",
    variants: [
      { id: 101, size: "P", sku: "MUNAYA-BONZO-PRETA-P", price: "R$ 119" },
      { id: 102, size: "M", sku: "MUNAYA-BONZO-PRETA-M", price: "R$ 119" },
      { id: 103, size: "G", sku: "MUNAYA-BONZO-PRETA-G", price: "R$ 119" },
      { id: 104, size: "GG", sku: "MUNAYA-BONZO-PRETA-GG", price: "R$ 119" },
    ],
    checkoutUrl: `${STORE_URL}/produtos/camiseta-munaya-bonzo-27l82/`,
  },
  {
    id: 2,
    name: "Lion Heart",
    price: "R$ 119",
    rawPrice: 119.0,
    image: "/uploads/MUNAYA_LionHeart_mostra02.jpg",
    images: [
      "/uploads/MUNAYA_LionHeart_mostra02.jpg",
      "/distortion-lionheart.png",
    ],
    description:
      "Camiseta 100% algodão preto profundo. Estampa Lion Heart com acabamento premium de toque zero.",
    span: "col-span-1 row-span-1",
    variants: [
      { id: 201, size: "P", sku: "MUNAYA-LION-PRETA-P", price: "R$ 119" },
      { id: 202, size: "M", sku: "MUNAYA-LION-PRETA-M", price: "R$ 119" },
      { id: 203, size: "G", sku: "MUNAYA-LION-PRETA-G", price: "R$ 119" },
      { id: 204, size: "GG", sku: "MUNAYA-LION-PRETA-GG", price: "R$ 119" },
    ],
    checkoutUrl: `${STORE_URL}/produtos/`,
  },
  {
    id: 3,
    name: "Chaos Theory",
    price: "R$ 119",
    rawPrice: 119.0,
    image: "/limited-raglan-psych-v3.png",
    images: [
      "/limited-raglan-psych-v3.png",
      "/distortion-bonzo.png",
    ],
    description:
      "Camiseta especial raglan / streetwear. Edição Chaos Theory inspirada nas raízes do punk e grunge.",
    span: "col-span-1 row-span-1",
    variants: [
      { id: 301, size: "P", sku: "MUNAYA-CHAOS-PRETA-P", price: "R$ 119" },
      { id: 302, size: "M", sku: "MUNAYA-CHAOS-PRETA-M", price: "R$ 119" },
      { id: 303, size: "G", sku: "MUNAYA-CHAOS-PRETA-G", price: "R$ 119" },
      { id: 304, size: "GG", sku: "MUNAYA-CHAOS-PRETA-GG", price: "R$ 119" },
    ],
    checkoutUrl: `${STORE_URL}/produtos/`,
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
