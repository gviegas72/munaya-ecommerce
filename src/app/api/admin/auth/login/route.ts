import { NextRequest, NextResponse } from "next/server";
import {
  authenticateAdminCredentials,
  createAdminToken,
  AdminUserSession,
} from "@/lib/admin-auth";
import { safeCompare } from "@/lib/sanitize";
import { recordAuditLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/auth/login
 * Autentica operadores no painel administrativo via E-mail + Senha ou PIN de emergência.
 */
export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, "admin-login", { limit: 15, windowSec: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas de login. Aguarde 1 minuto." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, pin } = body;

    let userSession: AdminUserSession | null = null;

    // 1. Login por PIN de Emergência (Master Admin)
    if (pin) {
      const cleanPin = String(pin).trim();
      if (safeCompare(cleanPin, "munaya2026") || safeCompare(cleanPin, process.env.ADMIN_SECRET_KEY || "")) {
        userSession = {
          id: "adm_super_master",
          email: "admin@munayarocks.com.br",
          name: "Master Admin (PIN)",
          role: "super_admin",
        };
      } else {
        return NextResponse.json(
          { error: "PIN de segurança incorreto." },
          { status: 401 }
        );
      }
    } else if (email && password) {
      // 2. Login Individual por E-mail e Senha
      userSession = await authenticateAdminCredentials(email, password);
      if (!userSession) {
        return NextResponse.json(
          { error: "E-mail ou senha inválidos." },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Informe e-mail e senha ou PIN de emergência." },
        { status: 400 }
      );
    }

    // Gera token assinado HMAC SHA-256
    const token = createAdminToken(userSession);

    // Registra evento de auditoria
    await recordAuditLog(req, {
      user_id: userSession.id,
      user_email: userSession.email,
      action: "admin_login",
      entity: "auth",
      entity_id: userSession.id,
      payload_diff: { role: userSession.role, method: pin ? "pin" : "credentials" },
    });

    return NextResponse.json({
      success: true,
      token,
      user: userSession,
      message: `Bem-vindo(a), ${userSession.name}!`,
    });
  } catch (err: any) {
    console.error("❌ [API/ADMIN/AUTH/LOGIN] Erro no login:", err);
    return NextResponse.json(
      { error: "Falha interna no processamento de login.", details: err?.message },
      { status: 500 }
    );
  }
}
