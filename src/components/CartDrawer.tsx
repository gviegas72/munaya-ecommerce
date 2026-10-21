"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Plus, Minus, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { CATALOG_VARIANTS } from "@/lib/catalog-variants";

const PRODUCT_ID_TO_KEY: Record<string, string> = {
  "1": "bonzo",
  "2": "dimebag",
  "3": "ghost",
  "4": "cathedral",
  "5": "amplificador",
  "6": "clutch",
  "7": "soundgarden",
  "8": "chico",
  "9": "rolling",
  "10": "spiritual",
  "11": "lionheart",
  "12": "suicidal",
  "13": "3r",
  "14": "monstermagnet",
  "15": "coc",
};

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    totalCount,
    formattedTotalPrice,
  } = useCart();

  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeCart]);

  // Bloquear scroll do body quando a gaveta estiver aberta
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCheckout = () => {
    if (items.length === 0) return;

    try {
      setIsCheckingOut(true);
      setErrorMsg(null);

      const tokens = items.map((it) => {
        let variantId = (it as any).variantId;

        // 1. Tentar mapear pelo productId numérico
        if (!variantId && it.productId) {
          const key = PRODUCT_ID_TO_KEY[String(it.productId)];
          if (key && CATALOG_VARIANTS[key]) {
            variantId = CATALOG_VARIANTS[key][it.size];
          }
        }

        // 2. Tentar mapear por correspondência de nome
        if (!variantId) {
          const itemKey = (it.name || "").toLowerCase();
          for (const [key, map] of Object.entries(CATALOG_VARIANTS)) {
            if (itemKey.includes(key)) {
              variantId = map[it.size];
              break;
            }
          }
        }

        // 3. Fallback seguro
        if (!variantId) {
          variantId =
            (CATALOG_VARIANTS.bonzo && CATALOG_VARIANTS.bonzo[it.size]) ||
            it.nuvemshopId ||
            "1622729750";
        }

        return `${variantId}-${it.quantity || 1}`;
      });

      // Redireciona para o Checkout Headless próprio na Vercel (Design fiel do Claude)
      window.location.href = "/?screen=checkout";
    } catch (err) {
      console.error("Erro no checkout:", err);
      setErrorMsg("Erro ao iniciar finalização. Tente novamente.");
      setIsCheckingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
        aria-label="Fechar Sacola"
      />

      {/* Slide-over Drawer */}
      <aside
        className="relative w-full max-w-[440px] h-full bg-background text-foreground border-l border-foreground p-6 md:p-8 flex flex-col justify-between z-10 shadow-2xl animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Sacola de Compras"
      >
        {/* Topo / Header */}
        <div className="flex items-center justify-between pb-6 border-b border-foreground/20">
          <div className="flex items-baseline gap-3">
            <h2 className="font-oswald text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
              Sacola
            </h2>
            {totalCount > 0 && (
              <span className="font-oswald text-lg font-bold px-2 py-0.5 bg-[#ff66c4] text-black">
                {totalCount} {totalCount === 1 ? "item" : "itens"}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={closeCart}
            className="w-10 h-10 border border-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
            aria-label="Fechar sacola"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Corpo / Lista de Itens */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <p className="font-sans text-sm md:text-base font-bold uppercase tracking-widest opacity-50 mb-6">
                Vazia. Nada de barulho ainda.
              </p>
              <Link
                href="/categoria"
                onClick={closeCart}
                className="inline-block bg-foreground text-background font-oswald text-xl uppercase font-black px-6 py-3 hover:bg-[#ff66c4] hover:text-black transition-colors"
              >
                Explorar Coleção
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 pb-6 border-b border-foreground/15 last:border-b-0"
              >
                {/* Thumbnail */}
                <div className="w-20 h-24 flex-shrink-0 bg-black/40 border border-foreground/20 overflow-hidden relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-center transition-all duration-300"
                  />
                </div>

                {/* Detalhes do Produto */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-oswald text-2xl font-bold uppercase tracking-tight leading-tight truncate">
                    {item.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-sans text-xs font-bold uppercase tracking-widest text-[#ff66c4]">
                      {item.size} • {item.color || "Preta"}
                    </span>
                    {item.sku && (
                      <span className="font-mono text-[10px] text-foreground/50 border border-foreground/20 px-1.5 py-0.5 rounded">
                        {item.sku}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-oswald text-xl font-bold">
                    {item.formattedPrice}
                  </p>

                  {/* Controles de Quantidade */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center border border-foreground">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-oswald text-base font-bold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-xs font-bold uppercase tracking-wider opacity-60 hover:opacity-100 hover:text-[#ff66c4] transition-colors"
                    >
                      Tirar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé / Subtotal & Fechar Pedido */}
        {items.length > 0 && (
          <div className="pt-6 border-t border-foreground/20 flex flex-col gap-4">
            <div className="flex items-baseline justify-between font-oswald uppercase">
              <span className="text-xl font-bold opacity-60">Total</span>
              <span className="text-4xl md:text-5xl font-black">
                {formattedTotalPrice}
              </span>
            </div>

            <p className="text-xs opacity-60 font-sans tracking-wide">
              Frete e pagamento calculados na etapa seguinte.
            </p>

            {errorMsg && (
              <p className="text-xs text-accent font-bold">{errorMsg}</p>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full bg-foreground text-background font-oswald text-2xl md:text-3xl uppercase font-black py-5 md:py-6 flex items-center justify-center gap-2 hover:bg-[#ff66c4] hover:text-black transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Preparando Pit...</span>
                </>
              ) : (
                "Fechar Pedido"
              )}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
