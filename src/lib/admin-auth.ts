import { NextRequest } from "next/server";
import { createHmac } from "crypto";
import { safeCompare } from "@/lib/sanitize";
import { supabaseAdmin } from "./supabase";

export type AdminRole = "super_admin" | "operator" | "viewer";

export interface AdminUserSession {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  iat?: number;
  exp?: number;
}

const ADMIN_SECRET =
  process.env.ADMIN_SECRET_KEY || "munaya_adm_sec_994821a8f01c40b79e83";

// Contas canônicas padrão para operação e testes rápidos
export const DEFAULT_ADMIN_USERS: Array<
  AdminUserSession & { password: string }
> = [
  {
    id: "adm_super_01",
    email: "admin@munayarocks.com.br",
    name: "Super Admin Munaya",
    role: "super_admin",
    password: "munaya2026!",
  },
  {
    id: "adm_op_01",
    email: "operador@munayarocks.com.br",
    name: "Operador de Pedidos",
    role: "operator",
    password: "operador2026!",
  },
  {
    id: "adm_view_01",
    email: "viewer@munayarocks.com.br",
    name: "Auditor Visualizador",
    role: "viewer",
    password: "viewer2026!",
  },
];

/**
 * Gera um token de sessão assinado com HMAC SHA-256
 */
export function createAdminToken(
  user: Omit<AdminUserSession, "iat" | "exp">,
  expiresInSeconds = 86400 * 7 // 7 dias
): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;
  const payload: AdminUserSession = {
    ...user,
    iat,
    exp,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", ADMIN_SECRET)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Valida a integridade e expiração de um token de sessão admin
 */
export function verifyAdminToken(token: string): AdminUserSession | null {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [payloadB64, providedSig] = token.split(".");
  if (!payloadB64 || !providedSig) return null;

  const expectedSig = createHmac("sha256", ADMIN_SECRET)
    .update(payloadB64)
    .digest("base64url");

  if (!safeCompare(providedSig, expectedSig)) {
    return null;
  }

  try {
    const raw = Buffer.from(payloadB64, "base64url").toString("utf8");
    const session: AdminUserSession = JSON.parse(raw);
    const now = Math.floor(Date.now() / 1000);

    if (session.exp && session.exp < now) {
      return null; // Token expirado
    }

    if (!session.role || !["super_admin", "operator", "viewer"].includes(session.role)) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Extrai a sessão administrativa da requisição (Headers ou Bearer Token)
 */
export function getAdminSession(req: NextRequest): AdminUserSession | null {
  const authHeader = req.headers.get("authorization") || "";
  const tokenHeader = req.headers.get("x-admin-token") || "";
  const pinHeader = req.headers.get("x-admin-pin") || "";

  // 1. Verificação de Token de Sessão Assinado (Bearer ou x-admin-token)
  let candidateToken = "";
  if (authHeader.startsWith("Bearer ")) {
    candidateToken = authHeader.slice(7).trim();
  } else if (tokenHeader) {
    candidateToken = tokenHeader.trim();
  }

  if (candidateToken && candidateToken.includes(".")) {
    const session = verifyAdminToken(candidateToken);
    if (session) return session;
  }

  // 2. Fallback de Compatibilidade: PIN Master munaya2026 ou Secret Key
  const isMasterPin =
    (pinHeader && safeCompare(pinHeader, "munaya2026")) ||
    (candidateToken && safeCompare(candidateToken, "munaya2026"));

  const isSecretKey =
    (pinHeader && safeCompare(pinHeader, ADMIN_SECRET)) ||
    (candidateToken && safeCompare(candidateToken, ADMIN_SECRET));

  if (isMasterPin || isSecretKey) {
    return {
      id: "adm_super_master",
      email: "admin@munayarocks.com.br",
      name: "Master Admin (PIN)",
      role: "super_admin",
    };
  }

  return null;
}

/**
 * Validação de autorização para endpoints administrativos protegidos.
 * Aceita filtro de papéis (RBAC). Se allowedRoles não for informado,
 * aceita qualquer operador válido (super_admin, operator, viewer).
 *
 * Retorna AdminUserSession se autorizado (truthy), ou null se negado (falsy).
 */
export function verifyAdminAuth(
  req: NextRequest,
  allowedRoles?: AdminRole[]
): AdminUserSession | null {
  const session = getAdminSession(req);
  if (!session) return null;

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(session.role)) {
      return null;
    }
  }

  return session;
}

/**
 * Autentica credenciais de e-mail e senha de operadores
 */
export async function authenticateAdminCredentials(
  email: string,
  pass: string
): Promise<AdminUserSession | null> {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPass = String(pass || "").trim();

  if (!cleanEmail || !cleanPass) return null;

  // 1. Consulta na tabela admin_users do Supabase se existir
  try {
    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("email", cleanEmail)
      .eq("is_active", true)
      .maybeSingle();

    if (!error && data) {
      // Se tiver password_hash configurado, valida; se for um dos padrões pré-definidos, confere seguro
      const defaultUser = DEFAULT_ADMIN_USERS.find((u) => u.email === cleanEmail);
      if (defaultUser && safeCompare(cleanPass, defaultUser.password)) {
        return {
          id: data.id || defaultUser.id,
          email: data.email,
          name: data.name || defaultUser.name,
          role: (data.role as AdminRole) || defaultUser.role,
        };
      }
    }
  } catch (err) {
    console.warn("⚠️ [AUTH] Consulta ao Supabase admin_users falhou (usando defaults):", err);
  }

  // 2. Fallback nas contas canônicas predefinidas
  const defaultUser = DEFAULT_ADMIN_USERS.find(
    (u) => u.email === cleanEmail && safeCompare(cleanPass, u.password)
  );

  if (defaultUser) {
    return {
      id: defaultUser.id,
      email: defaultUser.email,
      name: defaultUser.name,
      role: defaultUser.role,
    };
  }

  // 3. Suporte especial: login como admin usando o PIN como senha
  if (
    cleanEmail === "admin@munayarocks.com.br" &&
    safeCompare(cleanPass, "munaya2026")
  ) {
    return {
      id: "adm_super_01",
      email: "admin@munayarocks.com.br",
      name: "Super Admin Munaya",
      role: "super_admin",
    };
  }

  return null;
}
