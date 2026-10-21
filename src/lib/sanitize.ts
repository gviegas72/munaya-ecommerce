import { timingSafeEqual } from "crypto";

/**
 * Sanitiza strings para remover caracteres perigosos, tags HTML e scripts maliciosos (anti-XSS).
 */
export function sanitizeString(input: unknown, maxLen = 255): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .replace(/[<>'"`;\\]/g, "") // remove caracteres de injeção XSS / SQL
    .slice(0, maxLen);
}

/**
 * Sanitiza números de documentos (CPF, CEP, Telefone) mantendo apenas dígitos.
 */
export function sanitizeDigits(input: unknown, maxLen = 20): string {
  if (typeof input !== "string" && typeof input !== "number") return "";
  return String(input).replace(/\D/g, "").slice(0, maxLen);
}

/**
 * Comparação em tempo constante (Timing-Safe) para tokens, senhas e assinaturas.
 * Previne ataques de canal lateral (Timing Attacks) onde invasores medem nanossegundos
 * para descobrir senhas ou chaves de API.
 */
export function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length !== bufB.length) {
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
