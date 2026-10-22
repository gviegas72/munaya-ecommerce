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
  const rawBlank = (searchParams.get("blank") || "classic").toLowerCase();
  const sku = searchParams.get("sku") || "MUNAYA";
  const name = searchParams.get("name") || "Camiseta Munaya Rocks";
  const art = searchParams.get("art") || "";

  const colorCode = sanitizeSkuColor(rawColor);
  const reqOrigin = new URL(req.url).origin;
  const resolvedArt = resolveLocalArtworkPath(`${sku} ${name}`, art);
  const artworkDataUri = await loadArtworkDataUri(resolvedArt, reqOrigin);

  const isWhite = colorCode === "BRANCA";
  const isGrey = colorCode === "CINZA";

  // Identificação do Blank
  const isMug = rawBlank.includes("caneca");
  const isCap = rawBlank.includes("bone") || rawBlank.includes("boné");
  const isHoodie = rawBlank.includes("moletom");
  const isTote = rawBlank.includes("ecobag");

  // Paleta de cores da base
  const basePalette = isWhite
    ? {
        label: "BRANCA",
        dotHex: "#ffffff",
        light: "#fcfcfb",
        mid: "#f2f2ee",
        dark: "#dfdfd9",
        stroke: "#cecec7",
        fold: "#bebeb6",
        foldOp: "0.35",
      }
    : isGrey
    ? {
        label: "CINZA MESCLA",
        dotHex: "#888888",
        light: "#969694",
        mid: "#7d7d7b",
        dark: "#626260",
        stroke: "#545452",
        fold: "#3e3e3c",
        foldOp: "0.45",
      }
    : {
        label: "PRETA",
        dotHex: "#111111",
        light: "#252525",
        mid: "#151515",
        dark: "#0b0b0b",
        stroke: "#2f2f2f",
        fold: "#000000",
        foldOp: "0.65",
      };

  let productTypeLabel = "CAMISETA CLASSIC 30.1";
  if (isMug) productTypeLabel = "CANECA CERÂMICA 325ML";
  else if (isCap) productTypeLabel = "BONÉ SNAPBACK PREMIUM";
  else if (isHoodie) productTypeLabel = "MOLETOM HEAVY CANGURU";
  else if (isTote) productTypeLabel = "ECOBAG ALGODÃO CRU";

  let bodySvgContent = "";

  if (isMug) {
    // ☕ MOCKUP DE CANECA DE CERÂMICA
    bodySvgContent = `
    <!-- Sombra da Caneca -->
    <ellipse cx="500" cy="880" rx="260" ry="40" fill="#000000" opacity="0.6" filter="blur(16px)" />
    
    <!-- Alça da Caneca -->
    <path d="M 680 400 C 860 400, 860 680, 680 680" fill="none" stroke="${basePalette.mid}" stroke-width="48" stroke-linecap="round" />
    <path d="M 680 400 C 860 400, 860 680, 680 680" fill="none" stroke="${basePalette.dark}" stroke-width="36" stroke-linecap="round" />

    <!-- Corpo Cilíndrico da Caneca -->
    <rect x="280" y="320" width="440" height="520" rx="30" fill="${basePalette.mid}" stroke="${basePalette.stroke}" stroke-width="3" />
    <rect x="280" y="320" width="440" height="520" rx="30" fill="url(#mugReflection)" />

    <!-- Borda Superior da Caneca (Elipse) -->
    <ellipse cx="500" cy="320" rx="220" ry="45" fill="${basePalette.dark}" stroke="${basePalette.stroke}" stroke-width="3" />
    <ellipse cx="500" cy="320" rx="195" ry="36" fill="${isWhite ? "#261a14" : "#1a1a1a"}" />

    <!-- Estampa Curvada na Superfície da Caneca -->
    ${
      artworkDataUri
        ? `<g clip-path="url(#mugPrintClip)">
            <image href="${artworkDataUri}" x="320" y="380" width="360" height="400" preserveAspectRatio="xMidYMid meet" />
           </g>`
        : `<text x="500" y="580" text-anchor="middle" fill="#ff66c4" font-family="Impact, sans-serif" font-size="34">${escapeXml(name.toUpperCase())}</text>`
    }
    `;
  } else if (isCap) {
    // 🧢 MOCKUP DE BONÉ SNAPBACK
    bodySvgContent = `
    <ellipse cx="500" cy="850" rx="340" ry="50" fill="#000000" opacity="0.65" filter="blur(18px)" />

    <!-- Copa Estruturada do Boné -->
    <path d="M 230 640 C 210 380, 410 250, 500 240 C 590 250, 790 380, 770 640 Z" fill="${basePalette.mid}" stroke="${basePalette.stroke}" stroke-width="3" />
    <!-- Costura central e gomos -->
    <path d="M 500 240 L 500 640" stroke="${basePalette.fold}" stroke-width="2.5" stroke-dasharray="4 3" />
    <path d="M 500 240 Q 360 420 230 640" stroke="${basePalette.fold}" stroke-width="2" />
    <path d="M 500 240 Q 640 420 770 640" stroke="${basePalette.fold}" stroke-width="2" />
    
    <!-- Botão Superior -->
    <ellipse cx="500" cy="240" rx="20" ry="14" fill="${basePalette.dark}" stroke="${basePalette.stroke}" stroke-width="2" />

    <!-- Aba Reta / Curva Frontal -->
    <path d="M 160 640 C 260 590, 740 590, 840 640 C 860 760, 140 760, 160 640 Z" fill="${basePalette.dark}" stroke="${basePalette.stroke}" stroke-width="3" />
    <path d="M 190 660 C 310 615, 690 615, 810 660" fill="none" stroke="${basePalette.fold}" stroke-width="2" stroke-dasharray="5 3" />

    <!-- Estampa Silk / Patch Frontal -->
    ${
      artworkDataUri
        ? `<g clip-path="url(#capPrintClip)">
            <image href="${artworkDataUri}" x="360" y="380" width="280" height="230" preserveAspectRatio="xMidYMid meet" />
           </g>`
        : `<text x="500" y="510" text-anchor="middle" fill="#ff66c4" font-family="Impact, sans-serif" font-size="28">${escapeXml(name.toUpperCase())}</text>`
    }
    `;
  } else if (isHoodie) {
    // 🧥 MOCKUP DE MOLETOM CANGURU COM CAPUZ
    bodySvgContent = `
    <!-- Silhueta Pesada de Moletom 3 Cabos -->
    <g filter="url(#shirtShadow)">
      <path
        d="M 330 110 C 410 130, 590 130, 670 110 L 830 160 L 980 340 L 890 530 L 760 440 L 770 980 C 620 995, 380 995, 230 980 L 240 440 L 110 530 L 20 340 L 170 160 Z"
        fill="${basePalette.mid}"
        stroke="${basePalette.stroke}"
        stroke-width="3"
      />
      <!-- Capuz e Cordões -->
      <path d="M 330 110 C 350 40, 650 40, 670 110 C 600 230, 400 230, 330 110 Z" fill="${basePalette.dark}" stroke="${basePalette.stroke}" stroke-width="3" />
      <path d="M 430 200 L 430 350" stroke="#eeeeee" stroke-width="5" stroke-linecap="round" />
      <path d="M 570 200 L 570 350" stroke="#eeeeee" stroke-width="5" stroke-linecap="round" />

      <!-- Bolso Canguru Frontal -->
      <path d="M 320 720 L 680 720 L 710 930 L 290 930 Z" fill="${basePalette.dark}" stroke="${basePalette.stroke}" stroke-width="2.5" />
      <path d="M 320 720 L 290 930" stroke="${basePalette.fold}" stroke-width="3" />
      <path d="M 680 720 L 710 930" stroke="${basePalette.fold}" stroke-width="3" />
    </g>

    <!-- Estampa no Peito do Moletom -->
    ${
      artworkDataUri
        ? `<g clip-path="url(#hoodiePrintClip)">
            <image href="${artworkDataUri}" x="325" y="270" width="350" height="420" preserveAspectRatio="xMidYMid meet" />
           </g>`
        : `<text x="500" y="470" text-anchor="middle" fill="#ff66c4" font-family="Impact, sans-serif" font-size="34">${escapeXml(name.toUpperCase())}</text>`
    }
    `;
  } else if (isTote) {
    // 👜 MOCKUP DE ECOBAG 100% ALGODÃO CRU
    bodySvgContent = `
    <!-- Alças Reforçadas 60cm -->
    <path d="M 380 440 L 380 120 C 380 90, 620 90, 620 120 L 620 440" fill="none" stroke="${isWhite ? "#e0d8c3" : basePalette.dark}" stroke-width="36" stroke-linecap="round" />
    <path d="M 380 440 L 380 120 C 380 90, 620 90, 620 120 L 620 440" fill="none" stroke="${isWhite ? "#efe7d3" : basePalette.mid}" stroke-width="26" stroke-linecap="round" />

    <!-- Corpo Retangular da Ecobag -->
    <g filter="url(#shirtShadow)">
      <rect x="240" y="380" width="520" height="600" rx="8" fill="${isWhite ? "#ece4d0" : basePalette.mid}" stroke="${isWhite ? "#d8ceb8" : basePalette.stroke}" stroke-width="3" />
      <line x1="240" y1="430" x2="760" y2="430" stroke="${isWhite ? "#d0c6af" : basePalette.fold}" stroke-width="3" stroke-dasharray="6 4" />
      <!-- Dobras laterais de folga -->
      <line x1="280" y1="430" x2="280" y2="975" stroke="${isWhite ? "#d0c6af" : basePalette.fold}" stroke-width="2" opacity="0.4" />
      <line x1="720" y1="430" x2="720" y2="975" stroke="${isWhite ? "#d0c6af" : basePalette.fold}" stroke-width="2" opacity="0.4" />
    </g>

    <!-- Estampa Centralizada na Ecobag -->
    ${
      artworkDataUri
        ? `<g clip-path="url(#totePrintClip)">
            <image href="${artworkDataUri}" x="315" y="470" width="370" height="440" preserveAspectRatio="xMidYMid meet" />
           </g>`
        : `<text x="500" y="680" text-anchor="middle" fill="#ff66c4" font-family="Impact, sans-serif" font-size="34">${escapeXml(name.toUpperCase())}</text>`
    }
    `;
  } else {
    // 👕 MOCKUP DE CAMISETA CLASSIC / QUALITY / ESTONADA
    bodySvgContent = `
    <g filter="url(#shirtShadow)">
      <path
        d="M 378 108 C 418 134, 582 134, 622 108 L 765 152 L 952 292 L 872 448 L 736 378 L 744 972 C 610 986, 390 986, 256 972 L 264 378 L 128 448 L 48 292 L 235 152 Z"
        fill="url(#shirtBodyGrad)"
        stroke="${basePalette.stroke}"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <!-- Dobras Naturais -->
      <path d="M 235 152 C 258 235, 264 310, 264 378" fill="none" stroke="${basePalette.fold}" stroke-width="3" stroke-opacity="${basePalette.foldOp}" />
      <path d="M 765 152 C 742 235, 736 310, 736 378" fill="none" stroke="${basePalette.fold}" stroke-width="3" stroke-opacity="${basePalette.foldOp}" />
      <!-- Gola Canelada -->
      <path d="M 378 108 C 425 148, 575 148, 622 108 C 585 178, 415 178, 378 108 Z" fill="${basePalette.dark}" stroke="${basePalette.stroke}" stroke-width="2" />
      <path d="M 358 116 C 410 198, 590 198, 642 116 C 626 108, 622 108, 622 108 C 575 168, 425 168, 378 108 C 378 108, 372 109, 358 116 Z" fill="${basePalette.mid}" stroke="${basePalette.stroke}" stroke-width="2" />
      <!-- Etiqueta Interna Munaya -->
      <rect x="468" y="124" width="64" height="24" rx="2" fill="#111111" stroke="#ff66c4" stroke-width="1" />
      <text x="500" y="139" text-anchor="middle" fill="#ff66c4" font-family="Impact, Arial Black, sans-serif" font-size="10" letter-spacing="1.5">MUNAYA</text>
    </g>

    <!-- Estampa Silk Screen no Peito -->
    ${
      artworkDataUri
        ? `<g clip-path="url(#artworkClip)">
            <image href="${artworkDataUri}" x="305" y="265" width="390" height="475" preserveAspectRatio="xMidYMid meet" />
           </g>`
        : `<text x="500" y="500" text-anchor="middle" fill="#ff66c4" font-family="Impact, sans-serif" font-size="36">${escapeXml(name.toUpperCase())}</text>`
    }
    `;
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1150" width="1000" height="1150">
  <defs>
    <!-- Studio Background -->
    <radialGradient id="studioBg" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#181818" />
      <stop offset="100%" stop-color="#080808" />
    </radialGradient>

    <!-- Shading Gradients -->
    <linearGradient id="shirtBodyGrad" x1="15%" y1="5%" x2="85%" y2="95%">
      <stop offset="0%" stop-color="${basePalette.light}" />
      <stop offset="50%" stop-color="${basePalette.mid}" />
      <stop offset="100%" stop-color="${basePalette.dark}" />
    </linearGradient>

    <linearGradient id="mugReflection" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25" />
      <stop offset="25%" stop-color="#ffffff" stop-opacity="0.05" />
      <stop offset="70%" stop-color="#000000" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.3" />
    </linearGradient>

    <filter id="shirtShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="22" stdDeviation="26" flood-color="#000000" flood-opacity="0.75" />
    </filter>

    <clipPath id="artworkClip">
      <rect x="305" y="265" width="390" height="475" rx="4" />
    </clipPath>
    <clipPath id="mugPrintClip">
      <rect x="320" y="380" width="360" height="400" rx="8" />
    </clipPath>
    <clipPath id="capPrintClip">
      <rect x="360" y="380" width="280" height="230" rx="6" />
    </clipPath>
    <clipPath id="hoodiePrintClip">
      <rect x="325" y="270" width="350" height="420" rx="4" />
    </clipPath>
    <clipPath id="totePrintClip">
      <rect x="315" y="470" width="370" height="440" rx="6" />
    </clipPath>
  </defs>

  <!-- Fundo do Estúdio -->
  <rect width="1000" height="1150" fill="url(#studioBg)" />
  <line x1="0" y1="1040" x2="1000" y2="1040" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1" />

  ${bodySvgContent}

  <!-- Barra Inferior de Identificação Brutalista do Mockup -->
  <g transform="translate(40, 1062)">
    <rect x="0" y="0" width="920" height="54" fill="#0d0d0d" stroke="#2a2a2a" stroke-width="1.5" />
    <circle cx="28" cy="27" r="9" fill="${basePalette.dotHex}" stroke="#ffffff" stroke-width="1.5" />
    <text x="48" y="32" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="14" letter-spacing="1.5">
      ${escapeXml(name.toUpperCase())} — ${escapeXml(productTypeLabel)} (${escapeXml(basePalette.label)})
    </text>
    <text x="898" y="32" text-anchor="end" fill="#ff66c4" font-family="Courier New, monospace" font-weight="bold" font-size="12" letter-spacing="1.5">
      ESTEIRA OFICIAL DIMONA
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
