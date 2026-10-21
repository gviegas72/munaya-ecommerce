"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { openCart, totalCount } = useCart();

  const navLinks = [
    { href: "/", label: "Início" },
    { href: "/#colecoes", label: "Estampas" },
    { href: "/#sobre", label: "Sobre" },
    { href: "/admin", label: "Admin" },
  ];

  return (
    <>
      {/* =========================================
          1. HEADER MOBILE (Aparece apenas em < md)
         ========================================= */}
      <header className="md:hidden sticky top-0 z-50 w-full bg-background border-b border-foreground flex items-center justify-between px-4 py-3">
        {/* Logo Munaya com máscara e cor de destaque Pink Punk */}
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2"
          aria-label="Munaya - Início"
        >
          {/* Imagem direta do logo redondo rosa em SVG */}
          <img
            src="/logo-pink.svg"
            alt="Munaya"
            className="w-12 h-12 object-contain"
          />
          <span className="font-oswald text-2xl font-black uppercase tracking-tighter">
            Munaya
          </span>
        </Link>

        {/* Ações: Sacola e Hambúrguer */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openCart}
            className="relative w-11 h-11 border border-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
            aria-label="Sacola de Compras"
          >
            <ShoppingBag className="w-5 h-5" strokeWidth={2.2} />
            {totalCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] px-1 bg-[#ff66c4] text-black font-oswald text-xs font-black flex items-center justify-center">
                {totalCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-11 h-11 border border-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
            aria-label="Abrir Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" strokeWidth={2.5} />
            ) : (
              <Menu className="w-6 h-6" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </header>

      {/* Menu Gaveta Mobile Aberto */}
      {mobileMenuOpen && (
        <nav className="md:hidden sticky top-[69px] z-40 w-full bg-background border-b-2 border-foreground flex flex-col p-6 animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col font-oswald text-3xl font-black uppercase tracking-tight divide-y divide-foreground/20">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-4 transition-transform active:translate-x-2 ${
                  pathname === link.href ? "text-[#ff66c4]" : "text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openCart();
              }}
              className="py-4 flex items-center justify-between text-left transition-transform active:translate-x-2 text-foreground"
            >
              <span>Sacola</span>
              <span className="min-w-[24px] h-[24px] px-1.5 flex items-center justify-center bg-[#ff66c4] text-black font-oswald text-sm font-bold">
                {totalCount}
              </span>
            </button>
          </div>
        </nav>
      )}

      {/* =========================================
          2. SIDEBAR DESKTOP (Aparece apenas em >= md)
         ========================================= */}
      <aside className="hidden md:flex w-[15%] min-w-[200px] h-screen fixed top-0 left-0 border-r border-foreground flex-col justify-between p-6 bg-background z-50 overflow-y-auto">
        <div className="flex flex-col gap-10">
          {/* Logo Munaya Desktop */}
          <Link
            href="/"
            className="flex flex-col items-start hover:opacity-80 transition-opacity"
            aria-label="Munaya - Início"
          >
            {/* Imagem direta do logo redondo rosa em SVG */}
            <img
              src="/logo-pink.svg"
              alt="Munaya"
              className="w-32 h-32 object-contain"
            />
          </Link>

          {/* Links de Navegação */}
          <nav className="flex flex-col gap-6 font-oswald uppercase text-2xl font-bold tracking-tight">
            <Link
              href="/"
              className={`hover:translate-x-2 transition-transform duration-200 ${
                pathname === "/" ? "text-[#ff66c4]" : ""
              }`}
            >
              Início
            </Link>
            <Link
              href="/#colecoes"
              className="hover:translate-x-2 transition-transform duration-200 ml-3 opacity-90 hover:opacity-100"
            >
              Estampas
            </Link>
            <Link
              href="/#sobre"
              className="hover:translate-x-2 transition-transform duration-200 opacity-70 hover:opacity-100"
            >
              Sobre
            </Link>
            <Link
              href="/admin"
              className={`hover:translate-x-2 transition-transform duration-200 -ml-1 ${
                pathname === "/admin" ? "text-[#ff66c4]" : "opacity-70 hover:opacity-100"
              }`}
            >
              Admin
            </Link>
          </nav>
        </div>

        {/* Rodapé da Sidebar: Botão Sacola */}
        <div className="mt-8 flex flex-col gap-4">
          <button
            type="button"
            onClick={openCart}
            className="w-full flex items-center justify-between border border-foreground p-3 font-oswald text-xl font-bold uppercase hover:bg-foreground hover:text-background transition-colors group"
          >
            <span>Sacola</span>
            <span className="min-w-[24px] h-[24px] px-1.5 flex items-center justify-center bg-[#ff66c4] text-black font-oswald text-sm font-bold">
              {totalCount}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
