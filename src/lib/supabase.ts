import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jaxxkyvsgasgaccbejln.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Cliente público para leitura no navegador e servidor
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente administrativo com privilégios de escrita segura (apenas no backend)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

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
  display_order: number;
  badge?: string;
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

    return data as DatabaseProduct[];
  } catch (err) {
    console.error("Erro ao buscar produtos no Supabase:", err);
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
