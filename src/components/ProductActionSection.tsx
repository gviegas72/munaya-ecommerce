"use client";

import { useState } from "react";
import { StoreProduct } from "@/lib/nuvemshop";

interface ProductActionSectionProps {
  product: StoreProduct;
}

export function ProductActionSection({ product }: ProductActionSectionProps) {
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const availableSizes =
    product.variants?.length > 0
      ? product.variants.map((v) => v.size)
      : ["P", "M", "G", "GG"];

  const handleAddToPit = () => {
    if (!selectedSize) {
      setErrorMsg("Por favor, selecione um tamanho antes de adicionar.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    const selectedVariant = product.variants?.find(
      (v) => v.size.toUpperCase() === selectedSize.toUpperCase()
    );

    // Se tivermos a URL de checkout da Nuvemshop
    let destinationUrl = product.checkoutUrl;
    if (selectedVariant?.id) {
      // Se tivermos o ID da variação, pode ir direto com parâmetro de variante
      destinationUrl = `${product.checkoutUrl}?variant=${selectedVariant.id}`;
    }

    // Redireciona diretamente para o checkout/produto na Nuvemshop
    window.location.href = destinationUrl;
  };

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex flex-col">
        <h1 className="font-oswald text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mt-8 md:mt-0">
          {product.name}
        </h1>
        <p className="mt-4 font-oswald text-4xl font-bold opacity-80">
          {product.price}
        </p>

        <div className="mt-8">
          <p className="font-sans font-bold uppercase tracking-widest text-xs md:text-sm mb-4">
            Escolha o tamanho
          </p>
          <div className="flex flex-wrap gap-3">
            {availableSizes.map((size) => {
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setSelectedSize(size);
                    setErrorMsg(null);
                  }}
                  className={`w-16 h-16 border-2 font-oswald text-2xl font-black flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-foreground text-background border-foreground scale-105"
                      : "border-foreground hover:bg-foreground/20 text-foreground"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>

          {errorMsg && (
            <p className="mt-3 text-red-500 font-bold text-sm tracking-wide">
              {errorMsg}
            </p>
          )}
        </div>

        <p className="mt-8 text-base md:text-lg opacity-70 leading-relaxed">
          {product.description}
        </p>
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={handleAddToPit}
          disabled={loading}
          className="w-full bg-foreground text-background font-oswald text-3xl md:text-4xl uppercase font-black py-6 md:py-8 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          {loading ? "Indo para o Pit..." : "Add to Pit"}
        </button>
      </div>
    </div>
  );
}
