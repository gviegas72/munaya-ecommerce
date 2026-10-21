import { NextRequest, NextResponse } from "next/server";
import { validateCouponCode } from "@/lib/coupons";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Validação de Cupons de Desconto para o Checkout
 * Rota: POST /api/coupons/validate
 */
export async function POST(req: NextRequest) {
  // Rate limiting defensivo (máximo 30 tentativas por minuto por IP)
  const rateLimit = checkRateLimit(req, "coupon-validate", { limit: 30, windowSec: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas de validação de cupom. Aguarde um minuto." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || "").trim();
    const subtotal = Number(body.subtotal || 0);
    const shipping = Number(body.shipping || body.shipping_amount || 0);

    const result = await validateCouponCode(code, subtotal, shipping);

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: result.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      code: result.code,
      type: result.type,
      discount_amount: result.discount_amount,
      discount_value: result.discount_value,
      message: result.message,
      description: result.description,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
