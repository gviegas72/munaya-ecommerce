"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  LogOut,
  ShoppingBag,
  CheckCircle2,
  UserPlus,
  LogIn,
} from "lucide-react";

type AuthMode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(false);

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState("");

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setCurrentUser(data.user);
        }
      } catch (err) {
        // Sessão não ativa
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setCurrentUser(session?.user || null);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setRegisterSuccessMsg("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setErrorMsg("E-mail ou senha incorretos. Verifique suas credenciais.");
        return;
      }

      if (data?.user) {
        setCurrentUser(data.user);
      }
    } catch (err: any) {
      setErrorMsg("Erro de comunicação ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setRegisterSuccessMsg("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Informe um e-mail válido.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("As duas senhas digitadas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      // 1. Cria a conta no backend com auto-confirmação ativa (sem link quebrado para localhost)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        setErrorMsg(result.error || "Erro ao cadastrar conta.");
        setLoading(false);
        return;
      }

      // 2. Efetua o login imediatamente na sessão do navegador
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (loginData?.user) {
        setCurrentUser(loginData.user);
      } else {
        setRegisterSuccessMsg("Conta criada com sucesso! Faça login abaixo.");
        setAuthMode("login");
      }
    } catch (err: any) {
      setErrorMsg("Erro de comunicação ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    try {
      window.localStorage.removeItem("munaya.conta.v1");
    } catch (e) {}
    setCurrentUser(null);
  };

  return (
    <div className="min-h-[85vh] w-full flex items-center justify-center p-4 md:p-8 bg-black text-white">
      <div className="w-full max-w-md bg-neutral-950 border-2 border-neutral-800 p-6 md:p-8 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neutral-800 via-[#ff66c4] to-neutral-800" />

        {checkingAuth ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-[#ff66c4] animate-spin" />
            <p className="text-xs uppercase tracking-wider font-mono text-neutral-400">
              Verificando sessão...
            </p>
          </div>
        ) : currentUser ? (
          <div className="space-y-6 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-neutral-900 border-2 border-[#ff66c4] text-[#ff66c4] mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(255,102,196,0.3)]">
              <User className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Sessão Conectada
              </span>
              <h1 className="font-oswald text-3xl font-black uppercase tracking-tight text-white mt-2">
                Minha Conta
              </h1>
              <p className="text-sm font-mono text-neutral-400 truncate max-w-xs mx-auto">
                {currentUser.email}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Link
                href="/categoria"
                className="w-full bg-white text-black font-oswald text-base font-black uppercase py-3 tracking-wider hover:bg-[#ff66c4] hover:text-black transition-colors inline-flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explorar Catálogo</span>
              </Link>

              <Link
                href="/esqueci-senha"
                className="w-full bg-neutral-900 border border-neutral-700 text-neutral-300 font-oswald text-sm font-bold uppercase py-2.5 tracking-wider hover:border-[#ff66c4] hover:text-white transition-colors"
              >
                Testar Recuperação de Senha
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full border border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-600 hover:text-white font-oswald text-sm font-bold uppercase py-2.5 tracking-wider transition-colors inline-flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header com Abas Entrar / Criar Conta */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#ff66c4]/10 border border-[#ff66c4] text-[#ff66c4] flex items-center justify-center">
                  {authMode === "login" ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h1 className="font-oswald text-3xl md:text-4xl font-black uppercase tracking-tight text-white leading-none">
                    {authMode === "login" ? "Entrar na Conta" : "Criar Nova Conta"}
                  </h1>
                  <span className="text-xs text-neutral-400 font-mono uppercase tracking-wider">
                    Munaya Rocks · Área do Cliente
                  </span>
                </div>
              </div>

              {/* Seletor de Abas */}
              <div className="grid grid-cols-2 border border-neutral-800 bg-neutral-900 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setErrorMsg("");
                  }}
                  className={`py-2 text-xs font-oswald uppercase tracking-wider font-bold transition-all ${
                    authMode === "login"
                      ? "bg-[#ff66c4] text-black shadow"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Já tenho conta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setErrorMsg("");
                  }}
                  className={`py-2 text-xs font-oswald uppercase tracking-wider font-bold transition-all ${
                    authMode === "register"
                      ? "bg-[#ff66c4] text-black shadow"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Criar conta
                </button>
              </div>
            </div>

            {registerSuccessMsg && (
              <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 p-3 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{registerSuccessMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-950/80 border border-red-500 text-red-200 p-3 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* FORMULÁRIO: ENTRAR */}
            {authMode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-neutral-300 mb-1.5 tracking-wider">
                    E-mail *
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@email.com"
                      className="w-full bg-neutral-900 border border-neutral-700 pl-10 pr-3 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#ff66c4] font-sans"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs uppercase font-bold text-neutral-300 tracking-wider">
                      Senha *
                    </label>
                    {/* Link Esqueci Minha Senha */}
                    <Link
                      href="/esqueci-senha"
                      className="text-xs text-[#ff66c4] hover:underline font-mono uppercase tracking-wider"
                    >
                      Esqueci minha senha
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black font-oswald text-lg font-black uppercase py-3.5 tracking-wider hover:bg-[#ff66c4] hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Autenticando...</span>
                    </>
                  ) : (
                    <span>Entrar</span>
                  )}
                </button>
              </form>
            ) : (
              /* FORMULÁRIO: CRIAR CONTA */
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-neutral-300 mb-1.5 tracking-wider">
                    Seu Melhor E-mail *
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@email.com"
                      className="w-full bg-neutral-900 border border-neutral-700 pl-10 pr-3 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#ff66c4] font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold text-neutral-300 mb-1.5 tracking-wider">
                    Criar Senha (Mínimo 6 caracteres) *
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
                    Confirmar Senha *
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
                  className="w-full bg-[#ff66c4] text-black font-oswald text-lg font-black uppercase py-3.5 tracking-wider hover:bg-white hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Criando Conta...</span>
                    </>
                  ) : (
                    <span>Cadastrar Conta Gratuita</span>
                  )}
                </button>
              </form>
            )}

            <div className="text-center pt-2 border-t border-neutral-900">
              {authMode === "login" ? (
                <p className="text-xs text-neutral-400">
                  Ainda não tem conta?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setErrorMsg("");
                    }}
                    className="text-[#ff66c4] hover:underline font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Criar conta agora
                  </button>
                </p>
              ) : (
                <p className="text-xs text-neutral-400">
                  Já possui conta?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setErrorMsg("");
                    }}
                    className="text-[#ff66c4] hover:underline font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Fazer login
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
