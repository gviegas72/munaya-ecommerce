import { NextRequest } from "next/server";

/**
 * Validação de autorização para endpoints administrativos protegidos.
 * Aceita autenticação via:
 * 1. Bearer Token no cabeçalho Authorization: Bearer <ADMIN_SECRET_KEY> ou Bearer munaya2026
 * 2. Cabeçalho x-admin-pin: munaya2026
 */
export function verifyAdminAuth(req: NextRequest): boolean {
  const adminSecret = process.env.ADMIN_SECRET_KEY || "munaya_adm_sec_994821a8f01c40b79e83";
  const authHeader = req.headers.get("authorization") || "";
  const pinHeader = req.headers.get("x-admin-pin") || "";

  if (pinHeader === "munaya2026" || pinHeader === adminSecret) {
    return true;
  }

  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token === adminSecret || token === "munaya2026") {
      return true;
    }
  }

  return false;
}
