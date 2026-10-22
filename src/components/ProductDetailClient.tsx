"use client";

import { useState } from "react";
import { DatabaseProduct } from "@/lib/supabase";
import { ProductColor, getColorMockupUrl, OFFICIAL_COLORS } from "@/lib/variants";
import { ProductGalleryCarousel } from "@/components/ProductGalleryCarousel";
import { ProductActionSection } from "@/components/ProductActionSection";

interface ProductDetailClientProps {
  product: DatabaseProduct;
  initialImages: string[];
}

export function ProductDetailClient({
  product,
  initialImages,
}: ProductDetailClientProps) {
  const availableColors: ProductColor[] =
    product.colors && product.colors.length > 0
      ? product.colors
      : OFFICIAL_COLORS;

  const [selectedColor, setSelectedColor] = useState<ProductColor>(
    availableColors[0] || OFFICIAL_COLORS[0]
  );

  // URL do mockup dinâmico ou estático para a cor atualmente selecionada
  const activeColorMockupUrl = getColorMockupUrl(product, selectedColor);

  return (
    <div className="flex flex-col md:flex-row w-full flex-1">
      {/* Left Column - Interactive Carousel & Color Mockup Dynamic Switcher */}
      <div className="w-full md:w-[65%] flex flex-col border-b md:border-b-0 md:border-r border-foreground bg-black">
        <ProductGalleryCarousel
          images={initialImages}
          productName={product.name}
          activeColor={selectedColor}
          colorMockupUrl={activeColorMockupUrl}
        />
      </div>

      {/* Right Column - Product details, size, and color picker action */}
      <div className="w-full md:w-[35%] relative">
        <div className="relative md:sticky md:top-0 md:h-[calc(100vh-45px)] flex flex-col justify-between bg-background p-6 md:p-8 md:overflow-y-auto">
          <ProductActionSection
            product={product}
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
          />
        </div>
      </div>
    </div>
  );
}
