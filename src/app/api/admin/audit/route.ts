import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { getAuditLogs } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/audit
 * Consulta os logs de auditoria imutáveis.
 * Apenas usuários com permissão "super_admin" têm acesso.
 */
export async function GET(req: NextRequest) {
  const session = verifyAdminAuth(req, ["super_admin"]);

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: "Acesso restrito: Apenas administradores com perfil Super Admin podem visualizar os logs de auditoria.",
      },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 1), 200);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);
    const action = searchParams.get("action") || undefined;
    const entity = searchParams.get("entity") || undefined;
    const search = searchParams.get("search") || undefined;

    const result = await getAuditLogs({
      limit,
      offset,
      action,
      entity,
      search,
    });

    return NextResponse.json({
      success: true,
      logs: result.logs,
      total: result.total,
      limit,
      offset,
    });
  } catch (err: any) {
    console.error("❌ [API/ADMIN/AUDIT] Erro ao buscar logs:", err);
    return NextResponse.json(
      { success: false, error: "Falha ao consultar logs de auditoria.", details: err?.message },
      { status: 500 }
    );
  }
}
