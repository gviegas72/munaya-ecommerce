import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jaxxkyvsgasgaccbejln.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_-DOPw3mHijTge4WhQu4Kfw_0n7VSrNJ";

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Cliente público para leitura no navegador e servidor
export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'placeholder-anon-key');

// Cliente administrativo com privilégios de escrita segura (apenas no backend)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey || 'placeholder-role-key', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

import {
  generateBaseSku,
  OFFICIAL_COLORS,
  OFFICIAL_SIZES,
  ProductColor,
} from "./variants";

export interface DatabaseProduct {
  id: number;
  slug: string;
  name: string;
  subtitle?: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  image_url: string;
  artwork_url: string;
  is_active: boolean;
  is_featured: boolean;
  is_custom_price?: boolean; // Trava contra recálculo de markup em lote
  dimona_product_id?: string; // ID do produto/modelo na Dimona (De/Para)
  blank_type?: string;        // Tipo de blank padrão (classic, quality, estonada, etc.)
  available_blanks?: string[]; // Lista de blanks habilitados para esta estampa
  blank_prices?: Record<string, number>; // Preços customizados por blank
  display_order: number;
  badge?: string;
  sku?: string;
  colors?: ProductColor[];
  sizes?: string[];
  gallery?: string[];
  video_url?: string; // Link de vídeo YouTube opcional da peça
  images?: any;
}

export function hydrateProductVariants(p: any): DatabaseProduct {
  if (!p) return p;
  const meta =
    p.images && typeof p.images === "object" && !Array.isArray(p.images)
      ? p.images
      : {};

  const baseSku =
    p.sku || meta.sku || generateBaseSku(p.name || p.slug || "");
  const colors =
    Array.isArray(p.colors) && p.colors.length > 0
      ? p.colors
      : Array.isArray(meta.colors) && meta.colors.length > 0
      ? meta.colors
      : OFFICIAL_COLORS;
  const sizes =
    Array.isArray(p.sizes) && p.sizes.length > 0
      ? p.sizes
      : Array.isArray(meta.sizes) && meta.sizes.length > 0
      ? meta.sizes
      : Array.from(OFFICIAL_SIZES);

  const rawGallery: string[] = Array.isArray(p.gallery) && p.gallery.length > 0
    ? p.gallery
    : Array.isArray(meta.gallery) && meta.gallery.length > 0
    ? meta.gallery
    : Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : [];

  const cleanGallery = rawGallery
    .map((u) => String(u || "").trim())
    .filter(Boolean)
    .slice(0, 6);

  const coverUrl = String(p.image_url || cleanGallery[0] || "").trim();
  const gallery =
    cleanGallery.length > 0
      ? cleanGallery
      : coverUrl
      ? [coverUrl]
      : [];

  const available_blanks =
    Array.isArray(p.available_blanks) && p.available_blanks.length > 0
      ? p.available_blanks
      : Array.isArray(meta.available_blanks) && meta.available_blanks.length > 0
      ? meta.available_blanks
      : ["classic"];

  const blank_prices =
    p.blank_prices && typeof p.blank_prices === "object"
      ? p.blank_prices
      : meta.blank_prices && typeof meta.blank_prices === "object"
      ? meta.blank_prices
      : {};

  return {
    ...p,
    image_url: coverUrl || gallery[0] || "",
    gallery,
    is_custom_price: p.is_custom_price !== undefined ? Boolean(p.is_custom_price) : Boolean(meta.is_custom_price || false),
    dimona_product_id: p.dimona_product_id !== undefined ? String(p.dimona_product_id || "") : String(meta.dimona_product_id || ""),
    blank_type: p.blank_type || meta.blank_type || "classic",
    available_blanks,
    blank_prices,
    video_url: p.video_url || meta.video_url || meta.youtube_url || "",
    sku: baseSku,
    colors,
    sizes,
  };
}

/**
 * Busca um único produto por ID ou Slug no Supabase
 */
export async function getProductByIdOrSlug(idOrSlug: string | number): Promise<DatabaseProduct | null> {
  try {
    const raw = String(idOrSlug).trim();
    const isNumeric = !isNaN(Number(raw)) && /^\d+$/.test(raw);

    let query = supabase.from("products").select("*").eq("is_active", true);
    if (isNumeric) {
      query = query.eq("id", Number(raw));
    } else {
      query = query.eq("slug", raw);
    }

    let { data, error } = await query.maybeSingle();

    // Fallback: se não encontrou, tenta a condição oposta
    if (!data || error) {
      let fallbackQuery = supabase.from("products").select("*").eq("is_active", true);
      if (isNumeric) {
        fallbackQuery = fallbackQuery.eq("slug", raw);
      } else {
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed)) {
          fallbackQuery = fallbackQuery.eq("id", parsed);
        } else {
          return null;
        }
      }
      const fallbackRes = await fallbackQuery.maybeSingle();
      data = fallbackRes.data;
    }

    if (!data) return null;
    return hydrateProductVariants(data);
  } catch (err) {
    console.error("Erro ao buscar produto por ID/slug no Supabase:", err);
    return null;
  }
}

/**
 * Busca todos os produtos ativos do catálogo ordenados pela ordem da vitrine
 */
export async function getCatalogProducts(): Promise<DatabaseProduct[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return [];
    }

    return (data as any[]).map(hydrateProductVariants);
  } catch (err) {
    console.error("Erro ao buscar produtos no Supabase:", err);
    return [];
  }
}

/**
 * Busca todos os produtos para a tela de administração (ativos e inativos)
 */
export async function getAllProductsAdmin(): Promise<DatabaseProduct[]> {
  try {
    const client = supabaseServiceRoleKey ? supabaseAdmin : supabase;
    let { data, error } = await client
      .from("products")
      .select("*")
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      const fallback = await supabase
        .from("products")
        .select("*")
        .order("display_order", { ascending: true });
      if (fallback.data && fallback.data.length > 0) {
        data = fallback.data;
        error = null;
      }
    }

    if (error || !data) return [];
    return (data as any[]).map(hydrateProductVariants);
  } catch (err) {
    console.error("Erro ao buscar produtos admin no Supabase:", err);
    return [];
  }
}

/**
 * Cria um novo produto no catálogo via painel administrativo
 */
export async function createProductAdmin(
  productData: Partial<DatabaseProduct>
) {
  try {
    let nextId = productData.id;
    if (!nextId) {
      const { data: maxRow } = await supabaseAdmin
        .from("products")
        .select("id")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();
      nextId = maxRow && maxRow.id ? maxRow.id + 1 : 1;
    }

    const currentMeta =
      productData.images &&
      typeof productData.images === "object" &&
      !Array.isArray(productData.images)
        ? productData.images
        : {};

    const cleanGallery = Array.isArray(productData.gallery)
      ? productData.gallery
          .map((u) => String(u || "").trim())
          .filter(Boolean)
          .slice(0, 6)
      : productData.image_url
      ? [String(productData.image_url).trim()]
      : [];

    const metaPayload = {
      ...currentMeta,
      sku:
        productData.sku ||
        currentMeta.sku ||
        generateBaseSku(productData.name || productData.slug || ""),
      colors: productData.colors || currentMeta.colors || OFFICIAL_COLORS,
      sizes:
        productData.sizes ||
        currentMeta.sizes ||
        Array.from(OFFICIAL_SIZES),
      gallery: cleanGallery,
      ...(productData.is_custom_price !== undefined ? { is_custom_price: productData.is_custom_price } : {}),
      ...(productData.dimona_product_id !== undefined ? { dimona_product_id: productData.dimona_product_id } : {}),
      ...(productData.blank_type !== undefined ? { blank_type: productData.blank_type } : {}),
      ...(productData.available_blanks !== undefined ? { available_blanks: productData.available_blanks } : {}),
      ...(productData.blank_prices !== undefined ? { blank_prices: productData.blank_prices } : {}),
    };

    const insertPayload: any = {
      ...productData,
      id: nextId,
      image_url: cleanGallery[0] || productData.image_url || "",
      images: metaPayload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    delete insertPayload.sku;
    delete insertPayload.colors;
    delete insertPayload.sizes;
    delete insertPayload.gallery;
    delete insertPayload.is_custom_price;
    delete insertPayload.dimona_product_id;
    delete insertPayload.blank_type;
    delete insertPayload.available_blanks;
    delete insertPayload.blank_prices;

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      const errMsg = error.message || error.details || JSON.stringify(error);
      throw new Error(errMsg);
    }
    return { success: true, data: hydrateProductVariants(data) };
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
        ? String((err as any).message)
        : JSON.stringify(err);
    console.error("Erro ao criar produto no Supabase:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Remove um produto do catálogo via painel administrativo
 */
export async function deleteProductAdmin(id: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      const errMsg = error.message || error.details || JSON.stringify(error);
      throw new Error(errMsg);
    }
    return { success: true, data };
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
        ? String((err as any).message)
        : JSON.stringify(err);
    console.error("Erro ao remover produto no Supabase:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Atualiza um produto no catálogo via painel administrativo
 */
export async function updateProductAdmin(
  id: number,
  updates: Partial<DatabaseProduct>
) {
  try {
    // Busca dados atuais para preservar ou mesclar imagens/metadata
    let currentMeta: any = {};
    const { data: currentProd } = await supabaseAdmin
      .from("products")
      .select("images, image_url")
      .eq("id", id)
      .maybeSingle();
    if (
      currentProd?.images &&
      typeof currentProd.images === "object" &&
      !Array.isArray(currentProd.images)
    ) {
      currentMeta = currentProd.images;
    }

    let nextGallery: string[] | undefined = undefined;
    if (Array.isArray(updates.gallery)) {
      nextGallery = updates.gallery
        .map((u) => String(u || "").trim())
        .filter(Boolean)
        .slice(0, 6);
    } else if (updates.image_url) {
      const existingGallery: string[] = Array.isArray(currentMeta.gallery)
        ? currentMeta.gallery.map((u: any) => String(u || "").trim()).filter(Boolean)
        : [];
      const newCover = String(updates.image_url).trim();
      nextGallery = [newCover, ...existingGallery.filter((u) => u !== newCover)].slice(0, 6);
    }

    const metaPayload = {
      ...currentMeta,
      ...(updates.sku ? { sku: updates.sku } : {}),
      ...(updates.colors ? { colors: updates.colors } : {}),
      ...(updates.sizes ? { sizes: updates.sizes } : {}),
      ...(nextGallery !== undefined ? { gallery: nextGallery } : {}),
      ...(updates.is_custom_price !== undefined ? { is_custom_price: updates.is_custom_price } : {}),
      ...(updates.dimona_product_id !== undefined ? { dimona_product_id: updates.dimona_product_id } : {}),
      ...(updates.blank_type !== undefined ? { blank_type: updates.blank_type } : {}),
      ...(updates.available_blanks !== undefined ? { available_blanks: updates.available_blanks } : {}),
      ...(updates.blank_prices !== undefined ? { blank_prices: updates.blank_prices } : {}),
      ...(updates.video_url !== undefined ? { video_url: updates.video_url } : {}),
    };

    const updatePayload: any = {
      ...updates,
      ...(nextGallery && nextGallery.length > 0 ? { image_url: nextGallery[0] } : {}),
      images: metaPayload,
      updated_at: new Date().toISOString(),
    };
    delete updatePayload.sku;
    delete updatePayload.colors;
    delete updatePayload.sizes;
    delete updatePayload.gallery;
    delete updatePayload.video_url;
    // Removemos do payload raiz para não quebrar tabelas do Supabase que ainda não rodaram a migration SQL
    delete updatePayload.is_custom_price;
    delete updatePayload.dimona_product_id;
    delete updatePayload.blank_type;
    delete updatePayload.available_blanks;
    delete updatePayload.blank_prices;

    const { data, error } = await supabaseAdmin
      .from("products")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      const errMsg = error.message || error.details || JSON.stringify(error);
      throw new Error(errMsg);
    }
    return { success: true, data: hydrateProductVariants(data) };
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
        ? String((err as any).message)
        : JSON.stringify(err);
    console.error("Erro ao atualizar produto no Supabase:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Busca todos os pedidos para a tela de administração
 */
export async function getDatabaseOrdersAdmin() {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error("Erro ao listar pedidos no Supabase:", err);
    return [];
  }
}

/**
 * Grava ou atualiza um pedido no banco de dados
 */
export async function saveDatabaseOrder(order: any) {
  try {
    const { data, error } = await supabaseAdmin.from("orders").upsert(
      {
        id: order.id || order.num,
        customer_name: order.customer_name || order.customer?.name || "Cliente",
        customer_email: order.customer_email || order.customer?.email || "",
        customer_cpf: order.customer_cpf || order.customer?.cpf || "",
        customer_phone: order.customer_phone || order.customer?.phone || "",
        street: order.street || order.address?.street || "",
        number: String(order.number || order.address?.number || "S/N"),
        complement: order.complement || order.address?.complement || "",
        neighborhood: order.neighborhood || order.address?.neighborhood || "",
        city: order.city || order.address?.city || "",
        state: order.state || order.address?.state || "",
        zipcode: order.zipcode || order.address?.zipcode || "",
        total_amount: Number(order.total_amount || order.total || 0),
        shipping_amount: Number(order.shipping_amount || order.frete || 0),
        shipping_carrier: order.shipping_carrier || order.shipName || "",
        shipping_eta: order.shipping_eta || order.eta || "",
        payment_method: order.payment_method || order.pay || "pix",
        payment_status: order.payment_status || "aguardando_pagamento",
        mp_order_id: order.mp_order_id || null,
        dimona_id: order.dimona_id || null,
        dimona_status: order.dimona_status || "pendente",
        tracking_code: order.tracking_code || null,
        tracking_url: order.tracking_url || null,
        items: order.items || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error("Erro ao salvar pedido no Supabase:", error);
    }

    return { success: !error, data };
  } catch (err) {
    console.error("Exceção ao salvar pedido no Supabase:", err);
    return { success: false, error: err };
  }
}
