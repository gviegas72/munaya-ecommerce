import { NextRequest, NextResponse } from "next/server";
import { ARTWORK_MAP } from "@/lib/artworks";
import { sanitizeSkuColor } from "@/lib/variants";
import { readFile } from "fs/promises";
import path from "path";

function resolveLocalArtworkPath(skuOrName: string, artParam: string): string {
  if (artParam) {
    try {
      if (artParam.startsWith("http")) {
        const u = new URL(artParam);
        if (
          u.pathname.startsWith("/artes/") ||
          u.pathname.startsWith("/uploads/")
        ) {
          return u.pathname;
        }
        return artParam;
      }
      if (artParam.startsWith("/")) {
        return artParam;
      }
    } catch {
      // ignore URL parse error
    }
  }

  const clean = String(skuOrName || "")
    .toLowerCase()
    .replace(/_/g, "-");
  for (const [key, relPath] of Object.entries(ARTWORK_MAP)) {
    if (clean.includes(key)) {
      return relPath;
    }
  }

  return "/artes/bonzo.jpg";
}

async function loadArtworkDataUri(
  artPathOrUrl: string,
  reqOrigin: string
): Promise<string> {
  try {
    if (artPathOrUrl.startsWith("/")) {
      const diskPath = path.join(
        process.cwd(),
        "public",
        artPathOrUrl.replace(/^\/+/, "")
      );
      try {
        const buf = await readFile(diskPath);
        const ext = path.extname(diskPath).toLowerCase();
        const mime =
          ext === ".png"
            ? "image/png"
            : ext === ".webp"
            ? "image/webp"
            : "image/jpeg";
        return `data:${mime};base64,${buf.toString("base64")}`;
      } catch {
        // Fallback para fetch HTTP caso não esteja no FS da função serverless
        const res = await fetch(`${reqOrigin}${artPathOrUrl}`);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          const mime = res.headers.get("content-type") || "image/jpeg";
          return `data:${mime};base64,${Buffer.from(ab).toString("base64")}`;
        }
      }
    } else if (artPathOrUrl.startsWith("http")) {
      const res = await fetch(artPathOrUrl);
      if (res.ok) {
        const ab = await res.arrayBuffer();
        const mime = res.headers.get("content-type") || "image/jpeg";
        return `data:${mime};base64,${Buffer.from(ab).toString("base64")}`;
      }
    }
  } catch (err) {
    console.warn("Erro ao carregar arte para mockup dinâmico:", err);
  }
  return "";
}

function escapeXml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawColor = searchParams.get("color") || "BRANCA";
  const sku = searchParams.get("sku") || "MUNAYA";
  const name = searchParams.get("name") || "Camiseta Munaya Rocks";
  const art = searchParams.get("art") || "";

  const colorCode = sanitizeSkuColor(rawColor);
  const reqOrigin = new URL(req.url).origin;
  const resolvedArt = resolveLocalArtworkPath(`${sku} ${name}`, art);
  const artworkDataUri = await loadArtworkDataUri(resolvedArt, reqOrigin);

  // Paleta realista por cor da malha
  const isWhite = colorCode === "BRANCA";
  const isGrey = colorCode === "CINZA";

  const shirtPalette = isWhite
    ? {
        label: "BRANCA • ALGODÃO 30.1",
        dotHex: "#ffffff",
        bgTop: "#141414",
        bgBottom: "#080808",
        shirtLight: "#fbfbf9",
        shirtMid: "#f0f0ec",
        shirtDark: "#dcdcd6",
        stroke: "#cfcfc8",
        collarOuter: "#f5f5f2",
        collarInner: "#d4d4ce",
        foldColor: "#c8c8c0",
        foldOpacity: "0.45",
        stitchColor: "#d0d0c8",
      }
    : isGrey
    ? {
        label: "CINZA MESCLA • ALGODÃO 30.1",
        dotHex: "#888888",
        bgTop: "#121212",
        bgBottom: "#070707",
        shirtLight: "#929290",
        shirtMid: "#7d7d7b",
        shirtDark: "#636361",
        stroke: "#555553",
        collarOuter: "#858583",
        collarInner: "#5b5b59",
        foldColor: "#424240",
        foldOpacity: "0.45",
        stitchColor: "#686866",
      }
    : {
        label: "PRETA • ALGODÃO 30.1",
        dotHex: "#111111",
        bgTop: "#181818",
        bgBottom: "#080808",
        shirtLight: "#222222",
        shirtMid: "#151515",
        shirtDark: "#0c0c0c",
        stroke: "#2e2e2e",
        collarOuter: "#1a1a1a",
        collarInner: "#090909",
        foldColor: "#000000",
        foldOpacity: "0.6",
        stitchColor: "#292929",
      };

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1150" width="1000" height="1150">
  <defs>
    <!-- Studio Background -->
    <radialGradient id="studioBg" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="${shirtPalette.bgTop}" />
      <stop offset="100%" stop-color="${shirtPalette.bgBottom}" />
    </radialGradient>

    <!-- Realistic Cotton Fabric Shading -->
    <linearGradient id="shirtBodyGrad" x1="15%" y1="5%" x2="85%" y2="95%">
      <stop offset="0%" stop-color="${shirtPalette.shirtLight}" />
      <stop offset="50%" stop-color="${shirtPalette.shirtMid}" />
      <stop offset="100%" stop-color="${shirtPalette.shirtDark}" />
    </linearGradient>

    <radialGradient id="chestHighlight" cx="50%" cy="38%" r="45%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="${isWhite ? "0.5" : isGrey ? "0.18" : "0.07"}" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Drop Shadow da Camiseta no Estúdio -->
    <filter id="shirtShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="22" stdDeviation="26" flood-color="#000000" flood-opacity="0.75" />
    </filter>

    <!-- Textura Mescla suave para Cinza Mescla -->
    <pattern id="mesclaPattern" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="none" />
      <circle cx="2" cy="2" r="0.9" fill="#ffffff" fill-opacity="0.09" />
      <circle cx="6" cy="5" r="1.1" fill="#000000" fill-opacity="0.12" />
      <circle cx="4" cy="7" r="0.8" fill="#ffffff" fill-opacity="0.07" />
      <circle cx="7" cy="1" r="0.9" fill="#000000" fill-opacity="0.10" />
    </pattern>

    <clipPath id="artworkClip">
      <rect x="305" y="265" width="390" height="475" rx="4" />
    </clipPath>
  </defs>

  <!-- Fundo do Estúdio -->
  <rect width="1000" height="1150" fill="url(#studioBg)" />

  <!-- Grade Sutil de Estúdio -->
  <line x1="0" y1="1040" x2="1000" y2="1040" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1" />

  <!-- Silhueta Principal da Camiseta Classic 30.1 -->
  <g filter="url(#shirtShadow)">
    <path
      d="M 378 108
         C 418 134, 582 134, 622 108
         L 765 152
         L 952 292
         L 872 448
         L 736 378
         L 744 972
         C 610 986, 390 986, 256 972
         L 264 378
         L 128 448
         L 48 292
         L 235 152
         Z"
      fill="url(#shirtBodyGrad)"
      stroke="${shirtPalette.stroke}"
      stroke-width="2"
      stroke-linejoin="round"
    />

    ${
      isGrey
        ? `<path
      d="M 378 108 C 418 134, 582 134, 622 108 L 765 152 L 952 292 L 872 448 L 736 378 L 744 972 C 610 986, 390 986, 256 972 L 264 378 L 128 448 L 48 292 L 235 152 Z"
      fill="url(#mesclaPattern)"
    />`
        : ""
    }

    <!-- Iluminação Volumétrica do Torso -->
    <path
      d="M 378 108 C 418 134, 582 134, 622 108 L 765 152 L 952 292 L 872 448 L 736 378 L 744 972 C 610 986, 390 986, 256 972 L 264 378 L 128 448 L 48 292 L 235 152 Z"
      fill="url(#chestHighlight)"
    />

    <!-- Dobras Naturais do Tecido e Costuras das Mangas -->
    <path d="M 235 152 C 258 235, 264 310, 264 378" fill="none" stroke="${shirtPalette.foldColor}" stroke-width="3" stroke-opacity="${shirtPalette.foldOpacity}" />
    <path d="M 765 152 C 742 235, 736 310, 736 378" fill="none" stroke="${shirtPalette.foldColor}" stroke-width="3" stroke-opacity="${shirtPalette.foldOpacity}" />
    <path d="M 285 420 C 275 590, 272 780, 282 955" fill="none" stroke="${shirtPalette.foldColor}" stroke-width="6" stroke-opacity="0.18" />
    <path d="M 715 420 C 725 590, 728 780, 718 955" fill="none" stroke="${shirtPalette.foldColor}" stroke-width="6" stroke-opacity="0.18" />

    <!-- Costura Dupla nas Mangas e Barra -->
    <line x1="118" y1="430" x2="255" y2="360" stroke="${shirtPalette.stitchColor}" stroke-width="1.5" stroke-dasharray="4 3" />
    <line x1="882" y1="430" x2="745" y2="360" stroke="${shirtPalette.stitchColor}" stroke-width="1.5" stroke-dasharray="4 3" />
    <path d="M 258 954 C 390 968, 610 968, 742 954" fill="none" stroke="${shirtPalette.stitchColor}" stroke-width="1.5" stroke-dasharray="4 3" />

    <!-- Gola Canelada (Ribana Reforçada) -->
    <path
      d="M 378 108 C 425 148, 575 148, 622 108 C 585 178, 415 178, 378 108 Z"
      fill="${shirtPalette.collarInner}"
      stroke="${shirtPalette.stroke}"
      stroke-width="2"
    />
    <path
      d="M 358 116 C 410 198, 590 198, 642 116 C 626 108, 622 108, 622 108 C 575 168, 425 168, 378 108 C 378 108, 372 109, 358 116 Z"
      fill="${shirtPalette.collarOuter}"
      stroke="${shirtPalette.stroke}"
      stroke-width="2"
    />

    <!-- Etiqueta Interna de Gola Munaya Rocks -->
    <rect x="468" y="124" width="64" height="24" rx="2" fill="#111111" stroke="#ff66c4" stroke-width="1" />
    <text x="500" y="139" text-anchor="middle" fill="#ff66c4" font-family="Impact, Arial Black, sans-serif" font-size="10" letter-spacing="1.5">MUNAYA</text>

    <!-- Etiqueta Lateral na Manga Esquerda -->
    <rect x="898" y="346" width="22" height="14" transform="rotate(-28 898 346)" fill="#111111" stroke="#ff66c4" stroke-width="1" />
  </g>

  <!-- Estampa Central Silk Screen no Peito -->
  ${
    artworkDataUri
      ? `<g clip-path="url(#artworkClip)">
          <image
            href="${artworkDataUri}"
            x="305"
            y="265"
            width="390"
            height="475"
            preserveAspectRatio="xMidYMid meet"
          />
        </g>`
      : `<rect x="330" y="290" width="340" height="420" fill="#111111" stroke="#ff66c4" stroke-width="2" />
         <text x="500" y="500" text-anchor="middle" fill="#ff66c4" font-family="Impact, sans-serif" font-size="36" letter-spacing="3">${escapeXml(name.toUpperCase())}</text>`
  }

  <!-- Barra Inferior de Identificação Brutalista do Mockup -->
  <g transform="translate(40, 1062)">
    <rect x="0" y="0" width="920" height="54" fill="#0d0d0d" stroke="#2a2a2a" stroke-width="1.5" />
    <circle cx="28" cy="27" r="9" fill="${shirtPalette.dotHex}" stroke="#ffffff" stroke-width="1.5" />
    <text x="48" y="32" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="15" letter-spacing="2">
      ${escapeXml(name.toUpperCase())} — COR: ${escapeXml(shirtPalette.label)}
    </text>
    <text x="898" y="32" text-anchor="end" fill="#ff66c4" font-family="Courier New, monospace" font-weight="bold" font-size="13" letter-spacing="1.5">
      MOCKUP DINÂMICO MUNAYA
    </text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
