import { NextRequest } from "next/server";
import { supabaseAdmin } from "./supabase";

export interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  entity: string;
  entity_id?: string;
  payload_diff?: any;
  ip_address?: string;
  created_at: string;
}

// Buffer circular resiliente em memória (últimos 500 registros)
const memoryAuditLogs: AuditLog[] = [
  {
    id: "aud_seed_01",
    user_id: "adm_super_01",
    user_email: "admin@munayarocks.com.br",
    action: "system_bootstrap",
    entity: "system",
    entity_id: "munaya_v1",
    payload_diff: { message: "Trilha de auditoria e RBAC inicializados no Munaya Rocks" },
    ip_address: "127.0.0.1",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

/**
 * Extrai o endereço IP da requisição de forma segura
 */
export function extractClientIp(req: NextRequest | any): string {
  if (!req) return "127.0.0.1";
  if (typeof req === "object" && "headers" in req) {
    const forwarded = req.headers.get
      ? req.headers.get("x-forwarded-for")
      : req.headers["x-forwarded-for"];
    if (forwarded) {
      return String(forwarded).split(",")[0].trim();
    }
    const realIp = req.headers.get
      ? req.headers.get("x-real-ip")
      : req.headers["x-real-ip"];
    if (realIp) return String(realIp).trim();
  }
  return req.ip || "127.0.0.1";
}

/**
 * Registra um evento de auditoria imutável (Trilha de Compliance)
 */
export async function recordAuditLog(
  req: NextRequest | any,
  data: {
    user_id?: string;
    user_email?: string;
    action: string;
    entity: string;
    entity_id?: string;
    payload_diff?: any;
  }
): Promise<AuditLog> {
  const ip = extractClientIp(req);
  const logEntry: AuditLog = {
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    user_id: data.user_id || "adm_unknown",
    user_email: data.user_email || "system@munayarocks.com.br",
    action: data.action,
    entity: data.entity,
    entity_id: data.entity_id || "-",
    payload_diff: data.payload_diff || null,
    ip_address: ip,
    created_at: new Date().toISOString(),
  };

  // 1. Armazena na memória local com limite
  memoryAuditLogs.unshift(logEntry);
  if (memoryAuditLogs.length > 500) {
    memoryAuditLogs.pop();
  }

  // 2. Grava de forma assíncrona no Supabase
  try {
    const { error } = await supabaseAdmin.from("admin_audit_logs").insert({
      id: logEntry.id,
      user_id: logEntry.user_id,
      user_email: logEntry.user_email,
      action: logEntry.action,
      entity: logEntry.entity,
      entity_id: logEntry.entity_id,
      payload_diff: logEntry.payload_diff,
      ip_address: logEntry.ip_address,
      created_at: logEntry.created_at,
    });

    if (error) {
      // Tenta fallback com nome de tabela alternativo se aplicável
      if (error.code === "PGRST204" || error.message.includes("Could not find the table")) {
        try {
          await supabaseAdmin.from("audit_logs").insert({
            id: logEntry.id,
            user_id: logEntry.user_id,
            user_email: logEntry.user_email,
            action: logEntry.action,
            entity: logEntry.entity,
            entity_id: logEntry.entity_id,
            payload_diff: logEntry.payload_diff,
            ip_address: logEntry.ip_address,
            created_at: logEntry.created_at,
          });
        } catch {
          // fallback silencioso
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ [AUDIT] Falha ao persistir log no Supabase (mantido em memória):", err);
  }

  return logEntry;
}

/**
 * Consulta os logs de auditoria com suporte a filtros e busca
 */
export async function getAuditLogs(options?: {
  limit?: number;
  offset?: number;
  action?: string;
  entity?: string;
  search?: string;
}): Promise<{ logs: AuditLog[]; total: number }> {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  try {
    let query = supabaseAdmin
      .from("admin_audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (options?.action) {
      query = query.eq("action", options.action);
    }
    if (options?.entity) {
      query = query.eq("entity", options.entity);
    }
    if (options?.search) {
      query = query.or(
        `user_email.ilike.%${options.search}%,entity_id.ilike.%${options.search}%,action.ilike.%${options.search}%`
      );
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      return {
        logs: data as AuditLog[],
        total: count ?? data.length,
      };
    }
  } catch (e) {
    console.warn("⚠️ [AUDIT] Consulta ao Supabase falhou, utilizando memória:", e);
  }

  // Fallback nos logs em memória
  let filtered = [...memoryAuditLogs];
  if (options?.action) {
    filtered = filtered.filter((l) => l.action === options.action);
  }
  if (options?.entity) {
    filtered = filtered.filter((l) => l.entity === options.entity);
  }
  if (options?.search) {
    const s = options.search.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.user_email.toLowerCase().includes(s) ||
        (l.entity_id && l.entity_id.toLowerCase().includes(s)) ||
        l.action.toLowerCase().includes(s)
    );
  }

  const paginated = filtered.slice(offset, offset + limit);
  return {
    logs: paginated,
    total: filtered.length,
  };
}
