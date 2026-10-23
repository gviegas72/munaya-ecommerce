/**
 * 🎸 MUNAYA ROCKS - MOTOR DE CUPONS PROMOCIONAIS & DESCONTOS
 * Suporte a Cupons Dinâmicos no Supabase + Cache Resiliente em Memória
 * Tipos: Porcentagem (%), Valor Fixo (R$) e Frete Grátis (R$ 0,00 para Testes/Promos)
 */

import { supabaseAdmin, supabase } from "./supabase";

export interface Coupon {
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number; // Porcentagem (ex: 10 para 10%) ou valor fixo em R$ (ex: 20 para R$ 20)
  min_subtotal?: number;
  description: string;
  is_active: boolean;
  expires_at?: string | null; // Data de validade ISO (null = perene / sem expiração)
  max_uses?: number | null; // Limite de utilizações (null = ilimitado)
  used_count: number;
  created_at?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  discount_amount: number;
  discount_value: number;
  message: string;
  description: string;
}

// Cupons Oficiais Canônicos (Reserva resiliente em memória)
export const INITIAL_CANONICAL_COUPONS: Record<string, Coupon> = {
  PRIMEIRACOMPRA: {
    code: "PRIMEIRACOMPRA",
    type: "percentage",
    value: 10,
    min_subtotal: 0,
    description: "10% de boas-vindas na sua primeira compra",
    is_active: true,
    expires_at: null,
    max_uses: null,
    used_count: 0,
  },
  TESTEFRETE: {
    code: "TESTEFRETE",
    type: "free_shipping",
    value: 100,
    min_subtotal: 0,
    description: "Cupom de Teste de Homologação (Frete Grátis R$ 0,00)",
    is_active: true,
    expires_at: null,
    max_uses: null,
    used_count: 0,
  },
  VOLTA5: {
    code: "VOLTA5",
    type: "percentage",
    value: 5,
    min_subtotal: 0,
    description: "5% OFF de resgate exclusivo para finalizar seu pedido",
    is_active: true,
    expires_at: null,
    max_uses: null,
    used_count: 0,
  },
  ROCK10: {
    code: "ROCK10",
    type: "percentage",
    value: 10,
    min_subtotal: 0,
    description: "10% de desconto em todo o catálogo",
    is_active: true,
    expires_at: null,
    max_uses: null,
    used_count: 0,
  },
  MUNAYAVIP: {
    code: "MUNAYAVIP",
    type: "percentage",
    value: 15,
    min_subtotal: 150,
    description: "15% de desconto VIP em compras acima de R$ 150",
    is_active: true,
    expires_at: null,
    max_uses: null,
    used_count: 0,
  },
  BONZO20: {
    code: "BONZO20",
    type: "fixed",
    value: 20,
    min_subtotal: 100,
    description: "R$ 20,00 OFF em compras acima de R$ 100",
    is_active: true,
    expires_at: null,
    max_uses: null,
    used_count: 0,
  },
};

// Cache de cupons em tempo de execução
const memoryCoupons: Record<string, Coupon> = { ...INITIAL_CANONICAL_COUPONS };

/**
 * Lista todos os cupons cadastrados (tentando Supabase primeiro, com fallback para memória)
 */
export async function getCoupons(): Promise<Coupon[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      // Atualiza o cache local
      data.forEach((c) => {
        memoryCoupons[c.code] = {
          code: c.code,
          type: c.type,
          value: Number(c.value),
          min_subtotal: Number(c.min_subtotal || 0),
          description: c.description || "",
          is_active: Boolean(c.is_active),
          expires_at: c.expires_at || null,
          max_uses: c.max_uses ? Number(c.max_uses) : null,
          used_count: Number(c.used_count || 0),
          created_at: c.created_at,
        };
      });
      return Object.values(memoryCoupons);
    }
  } catch (err) {
    console.warn("⚠️ [COUPONS] Falha ao consultar Supabase (usando memória local):", err);
  }

  return Object.values(memoryCoupons);
}

/**
 * Busca um cupom específico por código
 */
export async function getCouponByCode(rawCode: string): Promise<Coupon | null> {
  const cleanCode = String(rawCode || "").trim().toUpperCase();
  if (!cleanCode) return null;

  try {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", cleanCode)
      .maybeSingle();

    if (!error && data) {
      const c: Coupon = {
        code: data.code,
        type: data.type,
        value: Number(data.value),
        min_subtotal: Number(data.min_subtotal || 0),
        description: data.description || "",
        is_active: Boolean(data.is_active),
        expires_at: data.expires_at || null,
        max_uses: data.max_uses ? Number(data.max_uses) : null,
        used_count: Number(data.used_count || 0),
        created_at: data.created_at,
      };
      memoryCoupons[cleanCode] = c;
      return c;
    }
  } catch {
    // Ignora e usa memória
  }

  return memoryCoupons[cleanCode] || null;
}

/**
 * Salva ou atualiza um cupom no Supabase e na memória
 */
export async function upsertCoupon(
  coupon: Omit<Coupon, "used_count"> & { used_count?: number }
): Promise<{ success: boolean; coupon?: Coupon; error?: string }> {
  const cleanCode = String(coupon.code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");

  if (!cleanCode) {
    return { success: false, error: "Código do cupom é obrigatório." };
  }

  const payload: Coupon = {
    code: cleanCode,
    type: coupon.type || "percentage",
    value: Number(coupon.value) || 0,
    min_subtotal: Number(coupon.min_subtotal || 0),
    description: coupon.description || "",
    is_active: coupon.is_active !== undefined ? Boolean(coupon.is_active) : true,
    expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString() : null,
    max_uses: coupon.max_uses ? Number(coupon.max_uses) : null,
    used_count: Number(coupon.used_count || memoryCoupons[cleanCode]?.used_count || 0),
    updated_at: new Date().toISOString(),
  } as any;

  // Atualiza cache em memória imediatamente
  memoryCoupons[cleanCode] = payload;

  try {
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .upsert(payload, { onConflict: "code" })
      .select()
      .maybeSingle();

    if (error) {
      console.warn("⚠️ [COUPONS] Supabase upsert error (salvo apenas em memória):", error.message);
      return { success: true, coupon: payload };
    }

    return { success: true, coupon: data || payload };
  } catch (err: any) {
    console.warn("⚠️ [COUPONS] Exceção ao gravar no Supabase:", err?.message);
    return { success: true, coupon: payload };
  }
}

/**
 * Exclui ou inativa um cupom
 */
export async function deleteCoupon(code: string): Promise<{ success: boolean; error?: string }> {
  const cleanCode = String(code || "").trim().toUpperCase();

  delete memoryCoupons[cleanCode];

  try {
    const { error } = await supabaseAdmin
      .from("coupons")
      .delete()
      .eq("code", cleanCode);

    if (error) {
      console.warn("⚠️ [COUPONS] Supabase delete error:", error.message);
    }
  } catch {
    // Ignora erro
  }

  return { success: true };
}

/**
 * Incrementa o contador de utilizações do cupom
 */
export async function incrementCouponUsage(code: string): Promise<void> {
  const cleanCode = String(code || "").trim().toUpperCase();
  if (memoryCoupons[cleanCode]) {
    memoryCoupons[cleanCode].used_count += 1;
  }

  try {
    const { error } = await supabaseAdmin.rpc("increment_coupon_usage", {
      coupon_code: cleanCode,
    });

    if (error) {
      // Fallback manual se a RPC não existir
      const { data } = await supabaseAdmin
        .from("coupons")
        .select("used_count")
        .eq("code", cleanCode)
        .maybeSingle();

      if (data) {
        await supabaseAdmin
          .from("coupons")
          .update({ used_count: (data.used_count || 0) + 1 })
          .eq("code", cleanCode);
      }
    }
  } catch {
    // Silencioso
  }
}

/**
 * Valida um cupom de desconto com regras estritas server-side
 */
export async function validateCouponCode(
  rawCode: string,
  subtotal: number,
  shippingAmount = 0
): Promise<CouponValidationResult> {
  const cleanCode = String(rawCode || "").trim().toUpperCase();

  if (!cleanCode) {
    return {
      valid: false,
      code: "",
      type: "percentage",
      discount_amount: 0,
      discount_value: 0,
      message: "Digite um código de cupom.",
      description: "",
    };
  }

  const coupon = await getCouponByCode(cleanCode);

  if (!coupon || !coupon.is_active) {
    return {
      valid: false,
      code: cleanCode,
      type: "percentage",
      discount_amount: 0,
      discount_value: 0,
      message: `Cupom "${cleanCode}" não é válido ou está inativo.`,
      description: "",
    };
  }

  // 1. Verifica data de expiração (se for perene, expires_at é null)
  if (coupon.expires_at) {
    const expDate = new Date(coupon.expires_at);
    // Validade até o final do dia especificado
    expDate.setHours(23, 59, 59, 999);
    if (new Date() > expDate) {
      const formattedDate = expDate.toLocaleDateString("pt-BR");
      return {
        valid: false,
        code: cleanCode,
        type: coupon.type,
        discount_amount: 0,
        discount_value: coupon.value,
        message: `O cupom ${cleanCode} expirou em ${formattedDate}.`,
        description: coupon.description,
      };
    }
  }

  // 2. Verifica limite de usos se configurado
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return {
      valid: false,
      code: cleanCode,
      type: coupon.type,
      discount_amount: 0,
      discount_value: coupon.value,
      message: `O limite de utilizações do cupom ${cleanCode} foi atingido.`,
      description: coupon.description,
    };
  }

  // 3. Verifica valor mínimo de subtotal se houver
  if (coupon.min_subtotal && subtotal < coupon.min_subtotal) {
    return {
      valid: false,
      code: cleanCode,
      type: coupon.type,
      discount_amount: 0,
      discount_value: coupon.value,
      message: `O cupom ${cleanCode} requer pedido mínimo de R$ ${coupon.min_subtotal.toFixed(2).replace(".", ",")}.`,
      description: coupon.description,
    };
  }

  let discountAmount = 0;

  if (coupon.type === "percentage") {
    discountAmount = (subtotal * coupon.value) / 100;
  } else if (coupon.type === "fixed") {
    discountAmount = Math.min(coupon.value, subtotal);
  } else if (coupon.type === "free_shipping") {
    // Cupom de frete grátis zera o valor total do frete informado
    discountAmount = shippingAmount;
  }

  // Arredonda para 2 casas decimais
  discountAmount = Math.round(discountAmount * 100) / 100;

  return {
    valid: true,
    code: coupon.code,
    type: coupon.type,
    discount_amount: discountAmount,
    discount_value: coupon.value,
    message:
      coupon.type === "free_shipping"
        ? `Cupom ${coupon.code} aplicado: Frete Grátis!`
        : `Cupom ${coupon.code} aplicado com sucesso!`,
    description: coupon.description,
  };
}

// Compatibilidade legada síncrona se necessário
export const CANONICAL_COUPONS = INITIAL_CANONICAL_COUPONS;
