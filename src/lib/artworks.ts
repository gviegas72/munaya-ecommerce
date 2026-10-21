/**
 * Mapeamento e gerador de URLs públicas para as estampas da Munaya Rocks
 * Hospedadas com custo zero na CDN do Vercel (/public/artes)
 */

export const ARTWORK_MAP: Record<string, string> = {
  bonzo: "/artes/bonzo.jpg",
  dimebag: "/artes/dimebag.jpg",
  ghost: "/artes/ghost.jpg",
  cathedral: "/artes/cathedral.jpg",
  amplificador: "/artes/amplificador.jpg",
  clutch: "/artes/clutch.jpg",
  soundgarden: "/artes/soundgarden.jpg",
  chico: "/artes/chico.jpg",
  "rolling-stones": "/artes/rolling-stones.jpg",
  rolling: "/artes/rolling-stones.jpg",
  spiritualbeggars: "/artes/spiritualbeggars.png",
  spiritual: "/artes/spiritualbeggars.png",
  lionheart: "/artes/lionheart.jpg",
  "suicidal-tendencies": "/artes/suicidal-tendencies.png",
  suicidal: "/artes/suicidal-tendencies.png",
  "3r-arvore": "/artes/3r-arvore.png",
  arvore: "/artes/3r-arvore.png",
  "3r": "/artes/3r-arvore.png",
  monstermagnet: "/artes/monstermagnet.jpg",
  coc: "/artes/coc.jpg",
};

/**
 * Retorna a URL pública completa da estampa para ser enviada à API da Dimona
 * @param identifier SKU ou nome do produto (ex: "MUNAYA-DIMEBAG-PRETA-G" ou "Camiseta Ghost")
 * @param baseUrl URL base da loja (padrão: https://munayarocks.vercel.app)
 */
export function getArtworkUrl(
  identifier: string,
  baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://munayarocks.vercel.app"
): string {
  if (!identifier) return `${baseUrl}/artes/bonzo.jpg`;

  const clean = identifier.toLowerCase().replace(/_/g, "-");
  for (const [key, path] of Object.entries(ARTWORK_MAP)) {
    if (clean.includes(key)) {
      return `${baseUrl}${path}`;
    }
  }

  // Fallback caso não encontre
  return `${baseUrl}/artes/bonzo.jpg`;
}
