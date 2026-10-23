import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Destino seguro com sanitização contra Open Redirect
  let next = requestUrl.searchParams.get("next") || "/login";
  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/login";
  }

  if (error) {
    console.warn("⚠️ [AUTH CALLBACK] Erro retornado pelo provedor OAuth:", error, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(errorDescription || error || "Falha na autenticação social")}`,
        requestUrl.origin
      )
    );
  }

  if (code) {
    try {
      const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeErr) {
        console.error("❌ [AUTH CALLBACK] Erro ao trocar código por sessão:", exchangeErr.message);
        return NextResponse.redirect(
          new URL(
            `/login?error=${encodeURIComponent(exchangeErr.message || "Erro ao validar sessão")}`,
            requestUrl.origin
          )
        );
      }
    } catch (err: any) {
      console.error("❌ [AUTH CALLBACK] Exceção:", err?.message || err);
      return NextResponse.redirect(
        new URL(`/login?error=Erro+ao+processar+login+social`, requestUrl.origin)
      );
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
