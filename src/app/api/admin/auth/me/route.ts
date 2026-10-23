import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/auth/me
 * Retorna os dados da sessão do operador autenticado atualmente.
 */
export async function GET(req: NextRequest) {
  const session = getAdminSession(req);

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Sessão expirada ou não autenticada." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: session,
  });
}
