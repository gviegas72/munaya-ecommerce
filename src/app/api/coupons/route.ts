import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { recordAuditLog } from "@/lib/audit";
import { getCoupons, upsertCoupon, deleteCoupon, Coupon } from "@/lib/coupons";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/coupons
 * Lista todos os cupons (Apenas Admin autenticado)
 */
export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json(
      { error: "Acesso não autorizado. Chave de administração inválida." },
      { status: 401 }
    );
  }

  try {
    const coupons = await getCoupons();
    return NextResponse.json({
      success: true,
      coupons,
    });
  } catch (err: any) {
    console.error("❌ [API COUPONS] Erro ao listar cupons:", err);
    return NextResponse.json(
      { error: "Falha ao consultar cupons.", details: err?.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coupons
 * Cria ou atualiza um cupom de desconto (Apenas Admin)
 */
export async function POST(req: NextRequest) {
  const session = verifyAdminAuth(req, ["super_admin"]);
  if (!session) {
    return NextResponse.json(
      { error: "Acesso restrito: Apenas usuários com permissão Super Admin podem criar ou editar cupons." },
      { status: 403 }
    );
  }

  const rateLimit = checkRateLimit(req, "admin-coupons-write", { limit: 60, windowSec: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Limite de operações atingido." }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawCode = String(body.code || "").trim();

    if (!rawCode) {
      return NextResponse.json(
        { error: "Código do cupom é obrigatório." },
        { status: 400 }
      );
    }

    const type = body.type || "percentage";
    if (!["percentage", "fixed", "free_shipping"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo de cupom inválido. Use 'percentage', 'fixed' ou 'free_shipping'." },
        { status: 400 }
      );
    }

    const couponData: Omit<Coupon, "used_count"> = {
      code: rawCode,
      type,
      value: Number(body.value || 0),
      min_subtotal: Number(body.min_subtotal || 0),
      description: String(body.description || `Cupom ${rawCode}`),
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      expires_at: body.expires_at || null,
      max_uses: body.max_uses ? Number(body.max_uses) : null,
    };

    const res = await upsertCoupon(couponData);

    if (!res.success) {
      return NextResponse.json({ error: res.error || "Erro ao salvar cupom." }, { status: 400 });
    }

    await recordAuditLog(req, {
      user_id: session.id,
      user_email: session.email,
      action: "coupon_upsert",
      entity: "coupons",
      entity_id: rawCode,
      payload_diff: {
        type: couponData.type,
        value: couponData.value,
        is_active: couponData.is_active,
      },
    });

    return NextResponse.json({
      success: true,
      coupon: res.coupon,
      message: `Cupom ${res.coupon?.code} salvo com sucesso!`,
    });
  } catch (err: any) {
    console.error("❌ [API COUPONS] Erro ao criar cupom:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar cupom.", details: err?.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/coupons
 * Edição parcial / Toggle de ativação do cupom
 */
export async function PATCH(req: NextRequest) {
  return POST(req);
}

/**
 * DELETE /api/coupons?code=ROCK10
 * Exclui ou inativa um cupom
 */
export async function DELETE(req: NextRequest) {
  const session = verifyAdminAuth(req, ["super_admin"]);
  if (!session) {
    return NextResponse.json(
      { error: "Acesso restrito: Apenas usuários com permissão Super Admin podem excluir cupons." },
      { status: 403 }
    );
  }

  const code = req.nextUrl.searchParams.get("code") || "";
  if (!code) {
    return NextResponse.json({ error: "Código é obrigatório." }, { status: 400 });
  }

  const res = await deleteCoupon(code);

  await recordAuditLog(req, {
    user_id: session.id,
    user_email: session.email,
    action: "coupon_delete",
    entity: "coupons",
    entity_id: code.toUpperCase(),
  });

  return NextResponse.json({
    success: res.success,
    message: `Cupom ${code.toUpperCase()} removido com sucesso.`,
  });
}
