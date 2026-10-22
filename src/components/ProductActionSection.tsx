"use client";

import { useState } from "react";
import { DatabaseProduct } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";
import {
  OFFICIAL_COLORS,
  OFFICIAL_SIZES,
  SIZE_MEASUREMENTS_TABLE,
  generateVariantSku,
  getColorMockupUrl,
  blankTypeToSkuType,
  ProductColor,
} from "@/lib/variants";
import { DIMONA_BLANKS, getProductBlankPrice } from "@/lib/dimona-mapping";
import { Ruler, Check, X } from "lucide-react";

interface ProductActionSectionProps {
  product: DatabaseProduct;
  selectedColor?: ProductColor;
  onColorChange?: (color: ProductColor) => void;
  selectedBlank?: string;
  onBlankChange?: (blank: string) => void;
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

export function ProductActionSection({
  product,
  selectedColor: externalColor,
  onColorChange,
  selectedBlank: externalBlank,
  onBlankChange,
}: ProductActionSectionProps) {
  // Blanks / Bases ativas (Multi-Blank Desacoplado)
  const availableBlanks: string[] =
    product.available_blanks && product.available_blanks.length > 0
      ? product.available_blanks
      : ["classic", "moletom", "caneca", "bone", "ecobag"];

  const [internalBlank, setInternalBlank] = useState<string>(
    availableBlanks[0] || "classic"
  );
  const selectedBlank = externalBlank || internalBlank;
  const currentBlankDef = DIMONA_BLANKS[selectedBlank] || DIMONA_BLANKS.classic;

  // Cores ativas (se produto tiver cores customizadas no banco ou as 3 oficiais)
  const availableColors: ProductColor[] =
    product.colors && product.colors.length > 0
      ? product.colors
      : OFFICIAL_COLORS;

  const [internalColor, setInternalColor] = useState<ProductColor>(
    availableColors[0] || OFFICIAL_COLORS[0]
  );
  const selectedColor = externalColor || internalColor;

  const handleSelectColor = (col: ProductColor) => {
    setInternalColor(col);
    if (onColorChange) {
      onColorChange(col);
    }
  };

  // Tamanhos disponíveis para a base selecionada
  const currentAvailableSizes: string[] =
    currentBlankDef.availableSizes && currentBlankDef.availableSizes.length > 0
      ? currentBlankDef.availableSizes
      : product.sizes && product.sizes.length > 0
      ? product.sizes
      : Array.from(OFFICIAL_SIZES);

  const [selectedSize, setSelectedSize] = useState<string>(
    currentAvailableSizes.includes("M") ? "M" : currentAvailableSizes[0] || "UNICO"
  );

  const handleSelectBlank = (bKey: string) => {
    setInternalBlank(bKey);
    if (onBlankChange) {
      onBlankChange(bKey);
    }
    const def = DIMONA_BLANKS[bKey] || DIMONA_BLANKS.classic;
    if (def.availableSizes && !def.availableSizes.includes(selectedSize)) {
      setSelectedSize(def.availableSizes[0] || "UNICO");
    }
  };

  const [qty, setQty] = useState<number>(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState<boolean>(false);
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { addItem, totalCount, openCart } = useCart();

  // Estados do cálculo de frete
  const [cep, setCep] = useState<string>("");
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [shippingResult, setShippingResult] = useState<ShippingResult | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);

  // Preço dinâmico para a base física selecionada
  const currentPrice = getProductBlankPrice(
    Number(product.price),
    selectedBlank,
    product.blank_prices
  );

  // SKU Oficial da Variante com tipo dinâmico da base: MNY-[TIPO]-[NOME]-[COR]-[TAM]
  const skuType = blankTypeToSkuType(selectedBlank);
  const currentSku = generateVariantSku(
    product.sku || product.name,
    selectedColor.name,
    selectedSize,
    skuType
  );

  const handleAddToPit = () => {
    if (!selectedSize) {
      setErrorMsg("Escolha um tamanho antes de adicionar.");
      return;
    }

    setErrorMsg(null);

    const activeMockupUrl = getColorMockupUrl(product, selectedColor, selectedBlank);

    // Adiciona o produto na sacola headless com SKU, Cor, Base e Tamanho oficiais e abre a gaveta imediatamente
    addItem({
      productId: product.id,
      name: `${product.name} • ${currentBlankDef.shortLabel}`,
      price: currentPrice,
      size: selectedSize,
      color: selectedColor.name,
      blankType: selectedBlank,
      sku: currentSku,
      image: activeMockupUrl,
      quantity: qty,
    });
    openCart();

    setAddedFeedback(true);
    setTimeout(() => {
      setAddedFeedback(false);
    }, 2500);
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
        {/* SKU Oficial & Disponibilidade */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-foreground/60 border border-foreground/20 px-2 py-0.5 rounded bg-black/40">
            REF: <span className="text-[#ff66c4] font-black">{currentSku}</span>
          </span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border border-emerald-500/20 px-2 py-0.5 rounded bg-emerald-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Em Estoque
          </span>
        </div>

        <h1 className="font-oswald text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mt-2">
          {product.name}
        </h1>
        <p className="mt-3 font-oswald text-3xl md:text-4xl font-bold text-[#ff66c4]">
          R$ {Number(currentPrice).toFixed(2).replace(".", ",")}
        </p>

        {/* Central de Blanks / Escolha da Base Física */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2.5">
            <p className="font-sans font-bold uppercase tracking-widest text-xs md:text-sm">
              Escolha a Base: <span className="text-[#ff66c4] font-black">{currentBlankDef.shortLabel}</span>
            </p>
            <span className="text-[11px] text-foreground/50 uppercase font-mono">
              {currentBlankDef.category === "vestuario" ? "Vestuário" : "Acessório"}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableBlanks.map((bKey) => {
              const bDef = DIMONA_BLANKS[bKey] || {
                id: bKey,
                shortLabel: bKey.toUpperCase(),
                suggestedPrice: product.price,
                category: "vestuario",
              };
              const isSelected = selectedBlank === bKey;
              const bPrice = getProductBlankPrice(
                Number(product.price),
                bKey,
                product.blank_prices
              );
              return (
                <button
                  key={bKey}
                  type="button"
                  onClick={() => handleSelectBlank(bKey)}
                  className={`flex flex-col items-start p-2.5 border-2 transition-all cursor-pointer text-left ${
                    isSelected
                      ? "border-[#ff66c4] bg-[#ff66c4]/15 shadow-[0_0_12px_rgba(255,102,196,0.3)] text-white scale-[1.02]"
                      : "border-foreground/30 hover:border-foreground/80 bg-black/40 text-foreground/80 hover:text-white"
                  }`}
                >
                  <span className="font-oswald uppercase text-xs md:text-sm font-black tracking-wider leading-tight">
                    {bDef.shortLabel}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#ff66c4] mt-0.5">
                    R$ {Number(bPrice).toFixed(2).replace(".", ",")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Seleção de Cores Oficiais */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2.5">
            <p className="font-sans font-bold uppercase tracking-widest text-xs md:text-sm">
              Cor: <span className="text-[#ff66c4] font-black">{selectedColor.name}</span>
            </p>
            <span className="text-[11px] text-foreground/50 uppercase font-mono">
              Padrão: Preta
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {availableColors.map((col) => {
              const isSelected = selectedColor.name === col.name;
              return (
                <button
                  key={col.name}
                  type="button"
                  onClick={() => handleSelectColor(col)}
                  className={`flex items-center gap-2 px-3 py-2 border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#ff66c4] bg-[#ff66c4]/15 shadow-[0_0_12px_rgba(255,102,196,0.3)] text-white"
                      : "border-foreground/30 hover:border-foreground/80 bg-black/40 text-foreground/80 hover:text-white"
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-white/40 inline-block shrink-0 shadow-inner"
                    style={{ backgroundColor: col.hex }}
                  />
                  <span className="font-oswald uppercase text-xs md:text-sm tracking-wider font-bold">
                    {col.name}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#ff66c4]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Seleção de Tamanho & Guia de Medidas */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2.5">
            <p className="font-sans font-bold uppercase tracking-widest text-xs md:text-sm">
              Tamanho:{" "}
              <span className="text-[#ff66c4] font-black">
                {selectedSize === "UNICO" ? "Único" : selectedSize}
              </span>
            </p>
            {currentBlankDef.category === "vestuario" && (
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(true)}
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-foreground/70 hover:text-[#ff66c4] transition-colors underline underline-offset-4 cursor-pointer"
              >
                <Ruler className="w-3.5 h-3.5" />
                Guia de Medidas
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {currentAvailableSizes.map((size) => {
              const isSelected = selectedSize === size;
              const isUnico = size === "UNICO";
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setSelectedSize(size);
                    setErrorMsg(null);
                  }}
                  className={`${
                    isUnico ? "px-5 h-12 md:h-13" : "w-13 h-13 md:w-14 md:h-14"
                  } border-2 font-oswald text-base md:text-lg font-black flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#ff66c4] text-black border-[#ff66c4] scale-105 shadow-[0_0_12px_rgba(255,102,196,0.4)]"
                      : "border-foreground/40 hover:border-foreground text-foreground hover:bg-foreground/10"
                  }`}
                >
                  {isUnico ? "Tamanho Único" : size}
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

        {/* Seleção de Quantidade */}
        <div className="mt-6">
          <p className="font-sans font-bold uppercase tracking-widest text-xs md:text-sm mb-2.5">
            Quantidade
          </p>
          <div className="inline-flex items-stretch border-2 border-foreground">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Diminuir quantidade"
              className="w-12 h-12 border-r-2 border-foreground font-oswald text-2xl font-bold flex items-center justify-center hover:bg-foreground hover:text-background transition-colors disabled:opacity-35 cursor-pointer"
            >
              –
            </button>
            <div className="w-16 h-12 flex items-center justify-center font-oswald text-2xl font-bold">
              {qty}
            </div>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(10, q + 1))}
              disabled={qty >= 10}
              aria-label="Aumentar quantidade"
              className="w-12 h-12 border-l-2 border-foreground font-oswald text-2xl font-bold flex items-center justify-center hover:bg-foreground hover:text-background transition-colors disabled:opacity-35 cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* Descrição do Produto */}
        <p className="mt-6 text-sm md:text-base opacity-75 leading-relaxed">
          {product.description}
        </p>

        {/* Simulador de Frete Real Dimona */}
        <div className="mt-6 border-t border-foreground/20 pt-5">
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
              className="bg-black/60 border border-foreground/60 px-4 py-2.5 font-mono text-sm uppercase tracking-wider focus:outline-none focus:border-[#ff66c4] w-36 text-foreground"
            />
            <button
              type="button"
              onClick={handleCalculateShipping}
              disabled={isCalculating}
              className="bg-foreground text-background font-oswald font-black uppercase text-sm tracking-wider px-5 py-2.5 hover:bg-[#ff66c4] hover:text-black transition-colors disabled:opacity-50 cursor-pointer"
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
          className={`w-full font-oswald text-2xl md:text-3xl uppercase font-bold py-5 md:py-6 transition-all cursor-pointer ${
            addedFeedback
              ? "bg-[#ff66c4] text-black scale-[1.02]"
              : "bg-foreground text-background hover:scale-[1.02] active:scale-95 hover:bg-[#ff66c4] hover:text-black"
          }`}
        >
          {addedFeedback ? `Na sacola ✕${totalCount}` : "Adicione a sacola"}
        </button>
      </div>

      {/* Modal Guia de Medidas */}
      {isSizeGuideOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsSizeGuideOpen(false)}
        >
          <div
            className="bg-[#0e0e0e] border-2 border-foreground/30 max-w-lg w-full p-6 relative shadow-[0_0_30px_rgba(0,0,0,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4 border-b border-foreground/20 pb-3">
              <div>
                <h3 className="font-oswald text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
                  Tabela de Medidas (cm)
                </h3>
                <p className="text-xs text-foreground/60 uppercase font-mono mt-0.5">
                  Camisetas Munaya Rocks • Algodão Penteado 30.1
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="w-8 h-8 flex items-center justify-center border border-foreground/30 hover:border-[#ff66c4] hover:text-[#ff66c4] text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border border-foreground/20">
                <thead className="bg-foreground/10 text-foreground uppercase">
                  <tr>
                    <th className="p-2.5 border-b border-r border-foreground/20 font-bold">Tam</th>
                    <th className="p-2.5 border-b border-r border-foreground/20 font-bold">Tórax (Largura)</th>
                    <th className="p-2.5 border-b border-r border-foreground/20 font-bold">Altura (Comp.)</th>
                    <th className="p-2.5 border-b border-r border-foreground/20 font-bold">Manga</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_MEASUREMENTS_TABLE.map((row) => {
                    const isCurrent = row.size === selectedSize;
                    return (
                      <tr
                        key={row.size}
                        className={`border-b border-foreground/10 transition-colors ${
                          isCurrent
                            ? "bg-[#ff66c4]/15 font-bold text-[#ff66c4]"
                            : "hover:bg-foreground/5 text-foreground/80"
                        }`}
                      >
                        <td className="p-2.5 border-r border-foreground/20 font-oswald text-base font-bold">
                          {row.size} {isCurrent && "★"}
                        </td>
                        <td className="p-2.5 border-r border-foreground/20">{row.torax} cm</td>
                        <td className="p-2.5 border-r border-foreground/20">{row.altura} cm</td>
                        <td className="p-2.5">{row.manga} cm</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-foreground/5 border border-foreground/15 text-[11px] text-foreground/70 leading-relaxed">
              <p className="font-bold uppercase text-white mb-1">Como medir:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li><span className="font-semibold text-white">Tórax:</span> Medir de uma axila à outra em uma camiseta aberta.</li>
                <li><span className="font-semibold text-white">Altura:</span> Do ponto mais alto da gola até a barra inferior.</li>
                <li><span className="font-semibold text-white">Variação:</span> Pode haver variação de até 2 cm devido à estonagem artesanal.</li>
              </ul>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="bg-foreground text-background font-oswald font-black uppercase text-sm tracking-wider px-6 py-2.5 hover:bg-[#ff66c4] hover:text-black transition-colors cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
