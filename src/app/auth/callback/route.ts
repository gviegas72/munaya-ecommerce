import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/redefinir-senha";

  if (code) {
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (err) {
      console.error("Erro ao trocar código por sessão no callback:", err);
    }
  }

  // Redireciona para a página de destino (com caminho relativo no mesmo host)
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
