"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { ProductColor } from "@/lib/variants";
import { extractYouTubeId, getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from "@/lib/youtube";

interface ProductGalleryCarouselProps {
  images: string[];
  productName: string;
  activeColor?: ProductColor;
  colorMockupUrl?: string;
  activeBlankLabel?: string;
  videoUrl?: string;
}

interface MediaItem {
  type: "image" | "video";
  url: string;
  videoId?: string;
}

export function ProductGalleryCarousel({
  images,
  productName,
  activeColor,
  colorMockupUrl,
  activeBlankLabel,
  videoUrl,
}: ProductGalleryCarouselProps) {
  const validImages = (images || [])
    .map((u) => String(u || "").trim())
    .filter(Boolean);

  const baseGallery =
    validImages.length > 0
      ? validImages.slice(0, 6)
      : ["/uploads/modelo_bonzo_01.jpg"];

  // Substitui a foto principal (índice 0) pelo mockup dinâmico/específico da cor selecionada
  const imageGallery = useMemo(() => {
    if (!colorMockupUrl) return baseGallery;
    const next = [...baseGallery];
    next[0] = colorMockupUrl;
    return next;
  }, [baseGallery, colorMockupUrl]);

  // Extrai o ID do YouTube de forma segura
  const youtubeId = useMemo(() => {
    return videoUrl ? extractYouTubeId(videoUrl) : null;
  }, [videoUrl]);

  // Lista combinada de mídias (Fotos + Vídeo Opcional como última mídia)
  const mediaItems: MediaItem[] = useMemo(() => {
    const list: MediaItem[] = imageGallery.map((url) => ({
      type: "image",
      url,
    }));

    if (youtubeId) {
      list.push({
        type: "video",
        url: getYouTubeThumbnailUrl(youtubeId),
        videoId: youtubeId,
      });
    }

    return list;
  }, [imageGallery, youtubeId]);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Ao trocar a cor ou base selecionada, volta imediatamente para a foto #1 (mockup dinâmico)
  useEffect(() => {
    setActiveIndex(0);
  }, [activeColor?.name, colorMockupUrl, activeBlankLabel]);

  const hasMultiple = mediaItems.length > 1;
  const safeIndex = activeIndex < mediaItems.length ? activeIndex : 0;
  const currentItem = mediaItems[safeIndex];

  const handlePrev = () => {
    if (!hasMultiple) return;
    setActiveIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const handleNext = () => {
    if (!hasMultiple) return;
    setActiveIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0]?.clientX ?? null;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;
    if (Math.abs(diff) >= minSwipeDistance) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div className="w-full flex flex-col bg-black select-none">
      {/* Mídia Principal em Destaque (Foto ou Vídeo YouTube) */}
      <div
        className="relative w-full h-[58vh] md:h-[84vh] bg-black overflow-hidden border-b border-foreground group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {currentItem?.type === "video" && currentItem.videoId ? (
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            <iframe
              src={getYouTubeEmbedUrl(currentItem.videoId)}
              title={`${productName} — Vídeo oficial`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <Image
            key={currentItem?.url}
            src={currentItem?.url || "/uploads/modelo_bonzo_01.jpg"}
            alt={`${productName} (${activeColor?.name || "Preta"}) — Mídia ${safeIndex + 1} de ${mediaItems.length}`}
            fill
            priority={safeIndex === 0}
            loading={safeIndex === 0 ? "eager" : "lazy"}
            sizes="(max-width: 768px) 100vw, 65vw"
            quality={88}
            className="w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-105"
          />
        )}

        {/* Badge da Cor/Base Ativa no canto superior direito (oculta durante a exibição do vídeo) */}
        {activeColor && currentItem?.type !== "video" && (
          <div className="absolute top-4 right-4 z-10 bg-black/85 border border-foreground/50 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full border border-white/60 inline-block shrink-0"
              style={{ backgroundColor: activeColor.hex }}
            />
            <span>
              {activeBlankLabel ? `${activeBlankLabel} • ` : ""}Cor: <strong className="text-[#ff66c4]">{activeColor.name}</strong>
            </span>
          </div>
        )}

        {/* Contador e Setas de Navegação */}
        {hasMultiple && (
          <>
            <div className="absolute top-4 left-4 z-10 bg-black/80 border border-foreground/50 px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-1.5">
              {currentItem?.type === "video" ? (
                <>
                  <Play className="w-3 h-3 text-[#ff66c4] fill-[#ff66c4]" />
                  <span>VÍDEO YOUTUBE</span>
                </>
              ) : (
                <span>
                  {String(safeIndex + 1).padStart(2, "0")} / {String(mediaItems.length).padStart(2, "0")}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handlePrev}
              aria-label="Mídia anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-black/75 border-2 border-foreground text-foreground flex items-center justify-center hover:bg-[#ff66c4] hover:text-black hover:border-[#ff66c4] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Próxima mídia"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-black/75 border-2 border-foreground text-foreground flex items-center justify-center hover:bg-[#ff66c4] hover:text-black hover:border-[#ff66c4] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" strokeWidth={2.5} />
            </button>

            {/* Indicador Mobile de Swipe */}
            {currentItem?.type !== "video" && (
              <div className="md:hidden absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
                <span className="bg-black/75 border border-foreground/30 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-foreground/80">
                  ← Deslize para ver mais →
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Faixa de Miniaturas Clicáveis */}
      {hasMultiple && (
        <div className="w-full bg-neutral-950 border-b border-foreground p-3 md:p-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {mediaItems.map((item, idx) => {
              const isSelected = idx === safeIndex;
              const isVideo = item.type === "video";
              return (
                <button
                  key={`${item.url}-${idx}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={isVideo ? "Ver vídeo do produto" : `Ver foto ${idx + 1}`}
                  aria-pressed={isSelected}
                  className={`relative w-18 h-22 md:w-22 md:h-28 flex-shrink-0 overflow-hidden border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#ff66c4] ring-2 ring-[#ff66c4]/40 scale-[1.03] opacity-100"
                      : "border-foreground/30 opacity-60 hover:opacity-100 hover:border-foreground"
                  }`}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={item.url}
                      alt={isVideo ? `${productName} — Miniatura do Vídeo` : `${productName} — Miniatura ${idx + 1}`}
                      fill
                      loading="lazy"
                      sizes="90px"
                      quality={60}
                      className="w-full h-full object-cover object-center"
                    />
                    {isVideo && (
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                        <span className="w-7 h-7 rounded-full bg-[#ff66c4] text-black flex items-center justify-center shadow-lg">
                          <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                        </span>
                      </div>
                    )}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                      isSelected
                        ? "bg-[#ff66c4] text-black"
                        : "bg-black/80 text-white"
                    }`}
                  >
                    {isVideo ? "VÍDEO" : idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
