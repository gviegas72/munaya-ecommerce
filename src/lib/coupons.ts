/**
 * Módulo de Gestão e Validação de Cupons de Desconto (Munaya Rocks)
 * Suporte a cupons canônicos em memória + sincronização opcional com Supabase
 */

export interface Coupon {
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number; // Porcentagem (ex: 10 para 10%) ou valor fixo em R$ (ex: 20 para R$ 20)
  min_subtotal?: number;
  description: string;
  is_active: boolean;
  max_uses?: number;
  used_count?: number;
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

// Cupons Oficiais Canônicos da Munaya Rocks
export const CANONICAL_COUPONS: Record<string, Coupon> = {
  ROCK10: {
    code: "ROCK10",
    type: "percentage",
    value: 10,
    description: "10% de desconto em todo o catálogo",
    is_active: true,
  },
  PRIMEIRACOMPRA: {
    code: "PRIMEIRACOMPRA",
    type: "percentage",
    value: 10,
    description: "10% de boas-vindas na sua primeira compra",
    is_active: true,
  },
  MUNAYAVIP: {
    code: "MUNAYAVIP",
    type: "percentage",
    value: 15,
    min_subtotal: 150,
    description: "15% de desconto VIP em compras acima de R$ 150",
    is_active: true,
  },
  FRETEGRATIS: {
    code: "FRETEGRATIS",
    type: "free_shipping",
    value: 100,
    description: "Frete Cortesia Munaya Rocks",
    is_active: true,
  },
  BONZO20: {
    code: "BONZO20",
    type: "fixed",
    value: 20,
    min_subtotal: 100,
    description: "R$ 20,00 OFF em compras acima de R$ 100",
    is_active: true,
  },
};

/**
 * Valida um cupom de desconto com regras estritas server-side
 */
export function validateCouponCode(
  rawCode: string,
  subtotal: number,
  shippingAmount = 0
): CouponValidationResult {
  const cleanCode = String(rawCode || "")
    .trim()
    .toUpperCase();

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

  const coupon = CANONICAL_COUPONS[cleanCode];

  if (!coupon || !coupon.is_active) {
    return {
      valid: false,
      code: cleanCode,
      type: "percentage",
      discount_amount: 0,
      discount_value: 0,
      message: `Cupom "${cleanCode}" não é válido ou expirou.`,
      description: "",
    };
  }

  // Verifica valor mínimo de subtotal se houver
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
    message: `Cupom ${coupon.code} aplicado com sucesso!`,
    description: coupon.description,
  };
}
