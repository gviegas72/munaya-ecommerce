"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, KeyRound, Loader2 } from "lucide-react";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Por favor, informe um endereço de e-mail válido.");
      return;
    }

    setLoading(true);

    try {
      // Dispara a geração de token e envio imediato por e-mail via API da loja (Resend + Supabase Admin)
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok && data?.error) {
        setErrorMsg(data.error);
        return;
      }

      // Por segurança contra enumeração de contas, sempre exibimos a mensagem de confirmação
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg("Ocorreu um erro temporário ao solicitar o envio. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] w-full flex items-center justify-center p-4 md:p-8 bg-black text-white">
      <div className="w-full max-w-md bg-neutral-950 border-2 border-neutral-800 p-6 md:p-8 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative">
        {/* Faixa decorativa superior */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neutral-800 via-[#ff66c4] to-neutral-800" />

        {/* Link de retorno */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs uppercase font-mono tracking-wider text-neutral-400 hover:text-[#ff66c4] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para o Login</span>
        </Link>

        {submitted ? (
          <div className="text-center space-y-4 py-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h1 className="font-oswald text-3xl font-black uppercase tracking-tight text-white">
              Verifique seu E-mail
            </h1>

            <p className="text-sm text-neutral-300 leading-relaxed font-sans">
              Se houver uma conta cadastrada com{" "}
              <strong className="text-white font-mono break-all">{email}</strong>,
              enviamos um link seguro para você redefinir sua senha.
            </p>

            <div className="bg-neutral-900 border border-neutral-800 p-4 text-xs text-neutral-400 text-left space-y-2">
              <p className="font-bold text-neutral-200 uppercase tracking-wider">
                💡 Dicas importantes:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>O link expira em poucas horas por segurança.</li>
                <li>Verifique sua caixa de Spam ou Promoções se não localizar em 2 minutos.</li>
              </ul>
            </div>

            <div className="pt-4 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full bg-white text-black font-oswald text-base font-black uppercase py-3 tracking-wider hover:bg-[#ff66c4] hover:text-black transition-colors"
              >
                Voltar para o Login
              </Link>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-xs text-neutral-400 hover:text-white uppercase font-mono tracking-wider py-2"
              >
                Tentar outro e-mail
              </button>
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
                    Recuperar Senha
                  </h1>
                  <span className="text-xs text-neutral-400 font-mono uppercase tracking-wider">
                    Munaya Rocks · Minha Conta
                  </span>
                </div>
              </div>

              <p className="text-sm text-neutral-400 pt-2 leading-relaxed">
                Digite seu e-mail abaixo para receber as instruções e o link seguro de redefinição de acesso.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-950/80 border border-red-500 text-red-200 p-3 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-neutral-300 mb-1.5 tracking-wider">
                  E-mail Cadastrado *
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full bg-neutral-900 border border-neutral-700 pl-10 pr-3 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#ff66c4] font-sans"
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
                    <span>Enviando Instruções...</span>
                  </>
                ) : (
                  <span>Enviar Link de Recuperação</span>
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-neutral-900">
              <p className="text-xs text-neutral-400">
                Lembrou da senha?{" "}
                <Link
                  href="/login"
                  className="text-[#ff66c4] hover:underline font-bold uppercase tracking-wider"
                >
                  Entrar na conta
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
