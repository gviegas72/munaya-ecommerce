import { NextRequest, NextResponse } from "next/server";

interface CheckoutItemPayload {
  productId?: string | number;
  nuvemshopId?: string | number;
  size: string;
  quantity: number;
}

const STORE_URL =
  process.env.NEXT_PUBLIC_STORE_URL ||
  "https://munayarocks.lojavirtualnuvem.com.br";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: CheckoutItemPayload[] = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Nenhum item fornecido para o checkout." },
        { status: 400 }
      );
    }

    let cookieHeader = "";

    // 1. Adicionar cada item sequencialmente na sessão da Nuvemshop
    for (const item of items) {
      const productId = String(item.nuvemshopId || item.productId || "375454425");
      const size = String(item.size || "M");
      const quantity = String(item.quantity || 1);

      const params = new URLSearchParams({
        add_to_cart: productId,
        "variation[0]": size,
        quantity,
      });

      const headers: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Origin: STORE_URL,
        Referer: `${STORE_URL}/comprar/`,
      };

      if (cookieHeader) {
        headers["Cookie"] = cookieHeader;
      }

      const res = await fetch(`${STORE_URL}/comprar/`, {
        method: "POST",
        headers,
        body: params.toString(),
        redirect: "manual",
      });

      // Atualizar cookies da sessão
      let newCookies: string[] = [];
      if (typeof res.headers.getSetCookie === "function") {
        newCookies = res.headers.getSetCookie();
      }
      if (!newCookies || newCookies.length === 0) {
        const raw = res.headers.get("set-cookie");
        if (raw) {
          newCookies = raw.split(/,(?=[^;]+;)/g);
        }
      }
      if (newCookies.length > 0) {
        const parsed = newCookies.map((c) => c.split(";")[0].trim()).filter(Boolean);
        cookieHeader = parsed.join("; ");
      }
    }

    // 2. Submeter 'go_to_checkout' para obter a URL direta do Checkout Transparente da Nuvemshop
    const checkoutHeaders: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Origin: STORE_URL,
      Referer: `${STORE_URL}/comprar/`,
    };
    if (cookieHeader) {
      checkoutHeaders["Cookie"] = cookieHeader;
    }

    const chkRes = await fetch(`${STORE_URL}/comprar/`, {
      method: "POST",
      headers: checkoutHeaders,
      body: "go_to_checkout=Iniciar+compra",
      redirect: "manual",
    });

    const location = chkRes.headers.get("location");

    if (location && location.includes("/checkout/")) {
      return NextResponse.json({
        success: true,
        checkoutUrl: location,
      });
    }

    // Caso o checkout direto não tenha retornado 302 com /checkout/, retorna o carrinho padrão
    return NextResponse.json({
      success: true,
      checkoutUrl: location || `${STORE_URL}/comprar/`,
      debug: {
        location,
        chkStatus: chkRes.status,
        cookiesPresent: Boolean(cookieHeader),
      },
    });
  } catch (err: unknown) {
    console.error("❌ [API/CHECKOUT] Erro ao gerar checkout na Nuvemshop:", err);
    return NextResponse.json(
      {
        error: "Falha ao gerar link do checkout.",
        checkoutUrl: `${STORE_URL}/comprar/`,
      },
      { status: 500 }
    );
  }
}
