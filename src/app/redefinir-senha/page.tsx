"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // 1. Verifica se já existe sessão ativa (estabelecida via callback ou link mágico)
    async function checkUserSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setHasValidSession(true);
          setCheckingSession(false);
          return;
        }

        // 2. Se a URL veio com fragmento hash (#access_token=...&type=recovery)
        if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
          setHasValidSession(true);
          setCheckingSession(false);
          return;
        }

        // Aguarda evento de auth state change caso o Supabase ainda esteja processando o token
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === "PASSWORD_RECOVERY" || session?.user) {
              setHasValidSession(true);
              setCheckingSession(false);
            }
          }
        );

        // Fallback de timeout de 2 segundos para checagem de sessão
        const timer = setTimeout(() => {
          setCheckingSession(false);
        }, 2000);

        return () => {
          authListener?.subscription?.unsubscribe();
          clearTimeout(timer);
        };
      } catch (e) {
        setCheckingSession(false);
      }
    }

    checkUserSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 6) {
      setErrorMsg("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("As duas senhas digitadas não coincidem. Verifique e tente novamente.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setErrorMsg(error.message || "Não foi possível atualizar a senha. Solicite um novo link.");
        return;
      }

      setSuccess(true);
      // Redireciona para o login após 3.5 segundos
      setTimeout(() => {
        router.push("/login");
      }, 3500);
    } catch (err: any) {
      setErrorMsg("Erro de comunicação ao salvar a nova senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] w-full flex items-center justify-center p-4 md:p-8 bg-black text-white">
      <div className="w-full max-w-md bg-neutral-950 border-2 border-neutral-800 p-6 md:p-8 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neutral-800 via-[#ff66c4] to-neutral-800" />

        {checkingSession ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-[#ff66c4] animate-spin" />
            <p className="text-xs uppercase tracking-wider font-mono text-neutral-400">
              Validando autorização de segurança...
            </p>
          </div>
        ) : success ? (
          <div className="text-center space-y-4 py-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h1 className="font-oswald text-3xl font-black uppercase tracking-tight text-white">
              Senha Redefinida!
            </h1>

            <p className="text-sm text-neutral-300 leading-relaxed font-sans">
              Sua nova senha foi atualizada com sucesso no Munaya Rocks. Você já pode fazer login e acessar seus pedidos.
            </p>

            <div className="pt-4">
              <Link
                href="/login"
                className="w-full bg-[#ff66c4] text-black font-oswald text-base font-black uppercase py-3.5 tracking-wider hover:bg-white transition-colors inline-flex items-center justify-center gap-2"
              >
                <span>Fazer Login Agora</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : !hasValidSession ? (
          <div className="text-center space-y-4 py-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-500 text-red-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h1 className="font-oswald text-3xl font-black uppercase tracking-tight text-white">
              Link Inválido ou Expirado
            </h1>

            <p className="text-sm text-neutral-400 leading-relaxed font-sans">
              Por motivos de segurança, os links de redefinição de senha possuem tempo limite de uso ou já podem ter sido utilizados.
            </p>

            <div className="pt-4 flex flex-col gap-2">
              <Link
                href="/esqueci-senha"
                className="w-full bg-white text-black font-oswald text-base font-black uppercase py-3 tracking-wider hover:bg-[#ff66c4] hover:text-black transition-colors"
              >
                Solicitar Novo Link
              </Link>
              <Link
                href="/login"
                className="text-xs text-neutral-400 hover:text-white uppercase font-mono tracking-wider py-2"
              >
                Voltar para o Login
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#ff66c4]/10 border border-[#ff66c4] text-[#ff66c4] flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-oswald text-3xl md:text-4xl font-black uppercase tracking-tight text-white leading-none">
                    Nova Senha
                  </h1>
                  <span className="text-xs text-neutral-400 font-mono uppercase tracking-wider">
                    Defina sua nova credencial
                  </span>
                </div>
              </div>

              <p className="text-sm text-neutral-400 pt-2 leading-relaxed">
                Digite e confirme sua nova senha de acesso abaixo (mínimo de 6 dígitos).
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-950/80 border border-red-500 text-red-200 p-3 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-neutral-300 mb-1.5 tracking-wider">
                  Nova Senha (Mínimo 6 caracteres) *
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-neutral-900 border border-neutral-700 pl-10 pr-10 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#ff66c4] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-neutral-300 mb-1.5 tracking-wider">
                  Confirmar Nova Senha *
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-neutral-900 border border-neutral-700 pl-10 pr-3 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#ff66c4] font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-oswald text-lg font-black uppercase py-3.5 tracking-wider hover:bg-[#ff66c4] hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Atualizando Senha...</span>
                  </>
                ) : (
                  <span>Salvar Nova Senha</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
