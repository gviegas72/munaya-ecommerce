"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const pathname = usePathname();
  const { openCart, totalCount } = useCart();

  useEffect(() => {
    // Verifica sessão ativa no Supabase
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setIsAuthed(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session?.user);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Não exibe a navbar da loja dentro do painel /admin
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const contaLabel = isAuthed ? "Minha conta" : "Entrar";
  const isContaActive =
    pathname === "/login" ||
    pathname === "/esqueci-senha" ||
    pathname === "/redefinir-senha";

  return (
    <>
      {/* =========================================
          1. HEADER MOBILE (Idêntico à v3 do Claude)
         ========================================= */}
      <header className="md:hidden sticky top-0 z-50 w-full bg-background border-b border-foreground flex items-center justify-between gap-4 px-4 py-3 box-border">
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex-none cursor-pointer"
          aria-label="Munaya — início"
        >
          <img
            src="/logo-pink.svg"
            alt="Munaya — início"
            loading="eager"
            fetchPriority="high"
            className="w-12 h-12 object-contain"
          />
        </Link>

        <div className="flex items-center gap-[10px]">
          <button
            type="button"
            onClick={openCart}
            aria-label="Sacola"
            className="cursor-pointer relative w-12 h-12 border border-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="square"
            >
              <path d="M4 7h16l-1.5 13H5.5L4 7zM8.5 7V5a3.5 3.5 0 0 1 7 0v2"></path>
            </svg>
            <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-[5px] box-border inline-flex items-center justify-center bg-[#ff66c4] text-black font-oswald text-[14px] font-bold">
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
            className="cursor-pointer w-12 h-12 border border-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="square"
            >
              <path d="M3 6h18M3 12h18M3 18h18"></path>
            </svg>
          </button>
        </div>
      </header>

      {/* Menu Gaveta Mobile Aberto (Idêntico à v3 do Claude) */}
      {mobileMenuOpen && (
        <nav className="md:hidden sticky top-[73px] z-45 w-full bg-background border-b border-foreground flex flex-col pt-2 px-4 pb-5 box-border font-oswald text-[30px] font-bold uppercase">
          <Link
            href="/?screen=categoria"
            onClick={() => setMobileMenuOpen(false)}
            className="cursor-pointer py-[14px] border-b border-foreground text-foreground"
          >
            Início
          </Link>
          <Link
            href="/?screen=colecoes"
            onClick={() => setMobileMenuOpen(false)}
            className="cursor-pointer py-[14px] border-b border-foreground text-foreground"
          >
            Estampas
          </Link>
          <Link
            href="/?screen=sobre"
            onClick={() => setMobileMenuOpen(false)}
            className="cursor-pointer py-[14px] border-b border-foreground text-foreground"
          >
            Sobre
          </Link>
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="cursor-pointer py-[14px] text-[#ff66c4]"
          >
            {contaLabel}
          </Link>
        </nav>
      )}

      {/* =========================================
          2. SIDEBAR DESKTOP (Idêntico à v3 do Claude)
         ========================================= */}
      <aside className="hidden md:flex w-[15%] min-w-[200px] h-screen fixed top-0 left-0 border-r border-foreground flex-col justify-between p-6 box-border flex-none bg-background z-40 overflow-y-auto gap-6">
        <div className="flex flex-col gap-10">
          <Link
            href="/"
            className="cursor-pointer inline-block"
            aria-label="Munaya — início"
          >
            <img
              src="/logo-pink.svg"
              alt="Munaya — início"
              loading="eager"
              fetchPriority="high"
              className="mt-[26px] w-[136px] h-[136px] object-contain"
            />
          </Link>

          <nav className="flex flex-col gap-[28px] font-oswald text-[24px] font-bold uppercase">
            <Link
              href="/?screen=categoria"
              className="cursor-pointer transition-transform duration-200 hover:translate-x-2 text-foreground"
            >
              Início
            </Link>
            <Link
              href="/?screen=colecoes"
              className="cursor-pointer transition-transform duration-200 hover:translate-x-2 text-foreground"
            >
              Estampas
            </Link>
            <Link
              href="/?screen=sobre"
              className="cursor-pointer transition-transform duration-200 hover:translate-x-2 text-foreground"
            >
              Sobre
            </Link>
            <Link
              href="/login"
              className={`cursor-pointer transition-transform duration-200 hover:translate-x-2 ${
                isContaActive ? "text-[#ff66c4]" : "text-foreground"
              }`}
            >
              {contaLabel}
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={openCart}
            className="cursor-pointer flex items-center justify-between gap-3 border border-foreground px-3 py-[10px] font-oswald text-[18px] font-bold uppercase transition-colors duration-200 hover:bg-foreground hover:text-background"
          >
            <span>Sacola</span>
            <span className="min-w-[26px] h-[26px] px-[6px] box-border inline-flex items-center justify-center bg-[#ff66c4] text-black text-[15px] font-bold">
              {totalCount}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
