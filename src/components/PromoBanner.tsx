"use client";

import { useEffect, useState } from "react";
import { Sparkles, Copy, Check, X } from "lucide-react";

export function PromoBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Exibe apenas se o usuário não tiver descartado anteriormente
    try {
      const dismissed = localStorage.getItem("munaya_first_purchase_dismissed");
      if (!dismissed) {
        setIsVisible(true);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleCopy = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText("ROCK10");
      }
      localStorage.setItem("munaya_coupon", "ROCK10");
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem("munaya_first_purchase_dismissed", "true");
    } catch {
      // Ignora erro de storage
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-full bg-[#0d0d0d] border-b-2 border-[#ff66c4] text-white px-3 py-2.5 relative z-30 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm">
        {/* Mensagem Promocional */}
        <div className="flex items-center gap-2 font-bold tracking-wide">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#ff66c4]/20 text-[#ff66c4] shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <span>
            PRIMEIRA VEZ NO MOSH PIT? GANHE <strong className="text-[#ff66c4]">10% OFF</strong> COM O CUPOM{" "}
            <span className="font-mono bg-[#ff66c4] text-black px-2 py-0.5 font-black tracking-wider text-xs md:text-sm mx-1">
              ROCK10
            </span>
          </span>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-white text-black font-oswald uppercase text-xs font-black px-3 py-1.5 hover:bg-[#ff66c4] transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-black" />
                <span>Copiado! 🤘</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copiar ROCK10</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            title="Fechar aviso"
            aria-label="Fechar banner"
            className="text-neutral-400 hover:text-white p-2 hover:bg-neutral-800 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
