import { NextRequest } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// Armazena as requisições em memória por IP (LRU simplificado)
const ipCache = new Map<string, RateLimitRecord>();

// Limpeza periódica a cada 5 minutos para evitar consumo de memória
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipCache.entries()) {
    if (now > record.resetAt) {
      ipCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  limit: number;      // Máximo de requisições permitidas
  windowSec: number;  // Janela em segundos
}

/**
 * Limitador de Taxa em Borda / Servidor (Rate Limiter)
 * Previne ataques de negação de serviço (DoS), scraping abusivo e força bruta.
 */
export function checkRateLimit(
  req: NextRequest,
  endpointName: string,
  options: RateLimitOptions = { limit: 30, windowSec: 60 }
): { allowed: boolean; remaining: number; resetIn: number } {
  // Identifica o IP de origem através dos headers confiáveis da Vercel / Cloudflare
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";

  const key = `${endpointName}:${ip}`;
  const now = Date.now();
  const windowMs = options.windowSec * 1000;

  const current = ipCache.get(key);

  if (!current || now > current.resetAt) {
    ipCache.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: options.limit - 1, resetIn: options.windowSec };
  }

  if (current.count >= options.limit) {
    const resetIn = Math.ceil((current.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetIn };
  }

  current.count++;
  const resetIn = Math.ceil((current.resetAt - now) / 1000);
  return { allowed: true, remaining: options.limit - current.count, resetIn };
}
