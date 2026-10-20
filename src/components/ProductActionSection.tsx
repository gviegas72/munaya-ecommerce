"use client";

import { useState } from "react";
import { StoreProduct } from "@/lib/nuvemshop";
import { useCart } from "@/context/CartContext";

interface ProductActionSectionProps {
  product: StoreProduct;
}

export function ProductActionSection({ product }: ProductActionSectionProps) {
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { addItem } = useCart();

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

    // Adiciona o produto na sacola headless e abre a gaveta lateral
    addItem({
      productId: product.id,
      nuvemshopId: String(product.nuvemshopId || product.id || "375454425"),
      name: product.name,
      price: product.rawPrice || 119,
      size: selectedSize,
      image: product.image,
      checkoutUrl: product.checkoutUrl,
      quantity: 1,
    });

    setAddedFeedback(true);
    setTimeout(() => {
      setAddedFeedback(false);
    }, 2000);
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
          className={`w-full font-oswald text-3xl md:text-4xl uppercase font-black py-6 md:py-8 transition-all ${
            addedFeedback
              ? "bg-[#ff66c4] text-black scale-[1.02]"
              : "bg-foreground text-background hover:scale-[1.02] active:scale-95"
          }`}
        >
          {addedFeedback ? "No Pit! 🤘" : "Add to Pit"}
        </button>
      </div>
    </div>
  );
}
