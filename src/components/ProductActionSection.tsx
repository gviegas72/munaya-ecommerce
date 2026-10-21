"use client";

import { useState } from "react";
import { StoreProduct } from "@/lib/nuvemshop";
import { useCart } from "@/context/CartContext";

interface ProductActionSectionProps {
  product: StoreProduct;
}

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  formattedPrice: string;
  days: string;
}

interface ShippingResult {
  location?: string;
  options: ShippingOption[];
}

export function ProductActionSection({ product }: ProductActionSectionProps) {
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { addItem } = useCart();

  // Estados do cálculo de frete
  const [cep, setCep] = useState<string>("");
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [shippingResult, setShippingResult] = useState<ShippingResult | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);

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

    const matchedVariant = product.variants?.find((v) => v.size === selectedSize);

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
      variantId: matchedVariant ? String(matchedVariant.id) : undefined,
    } as any);

    setAddedFeedback(true);
    setTimeout(() => {
      setAddedFeedback(false);
    }, 2000);
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 8);
    if (raw.length > 5) {
      raw = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    }
    setCep(raw);
    setShippingError(null);
  };

  const handleCalculateShipping = async () => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) {
      setShippingError("Informe um CEP completo com 8 dígitos.");
      setShippingResult(null);
      return;
    }

    setIsCalculating(true);
    setShippingError(null);

    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zipcode: clean, quantity: 1 }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.options?.length) {
        setShippingError(data.error || "Não foi possível cotar frete para este CEP.");
        setShippingResult(null);
      } else {
        setShippingResult({
          location: data.location,
          options: data.options,
        });
      }
    } catch {
      setShippingError("Falha de conexão ao calcular frete.");
      setShippingResult(null);
    } finally {
      setIsCalculating(false);
    }
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
            <p className="mt-3 text-accent font-bold text-sm tracking-wide">
              {errorMsg}
            </p>
          )}
        </div>

        <p className="mt-8 text-base md:text-lg opacity-70 leading-relaxed">
          {product.description}
        </p>

        {/* Simulador de Frete Real Dimona */}
        <div className="mt-8 border-t border-foreground/20 pt-6">
          <p className="font-sans font-bold uppercase tracking-widest text-xs mb-3 text-foreground/80">
            Calcular Frete e Prazo de Entrega
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="00000-000"
              maxLength={9}
              value={cep}
              onChange={handleCepChange}
              onKeyDown={(e) => e.key === "Enter" && handleCalculateShipping()}
              className="bg-black/60 border border-foreground/60 px-4 py-3 font-mono text-sm uppercase tracking-wider focus:outline-none focus:border-[#ff66c4] w-36 text-foreground"
            />
            <button
              type="button"
              onClick={handleCalculateShipping}
              disabled={isCalculating}
              className="bg-foreground text-background font-oswald font-black uppercase text-sm tracking-wider px-5 py-3 hover:bg-[#ff66c4] hover:text-black transition-colors disabled:opacity-50"
            >
              {isCalculating ? "Calculando..." : "Calcular"}
            </button>
          </div>

          {shippingError && (
            <p className="mt-2 text-xs font-bold text-[#ff66c4] tracking-wide">
              {shippingError}
            </p>
          )}

          {shippingResult && (
            <div className="mt-4 flex flex-col gap-2">
              {shippingResult.location && (
                <p className="text-xs uppercase font-bold text-foreground/60 tracking-wider">
                  📍 Entrega para {shippingResult.location}
                </p>
              )}
              {shippingResult.options.map((opt) => (
                <div
                  key={opt.id}
                  className="flex justify-between items-center bg-foreground/5 border border-foreground/20 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-xs md:text-sm">
                    {opt.name} ({opt.days})
                  </span>
                  <span className="font-mono font-bold text-[#ff66c4]">
                    {opt.formattedPrice}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
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
