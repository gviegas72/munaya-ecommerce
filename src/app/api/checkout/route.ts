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

    const cookieMap: Record<string, string> = {};

    function updateCookies(res: Response) {
      let newCookies: string[] = [];
      if (typeof res.headers.getSetCookie === "function") {
        newCookies = res.headers.getSetCookie();
      } else {
        const raw = res.headers.get("set-cookie");
        if (raw) newCookies = raw.split(/,(?=[^;]+;)/g);
      }
      for (const c of newCookies) {
        const [pair] = c.split(";");
        const [k, v] = pair.split("=");
        if (k && v) cookieMap[k.trim()] = v.trim();
      }
    }

    function getCookieHeader(): string {
      return Object.entries(cookieMap)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
    }

    const itemStatuses: Array<{ status: number; location: string | null }> = [];

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

      const currentCookie = getCookieHeader();
      if (currentCookie) {
        headers["Cookie"] = currentCookie;
      }

      const res = await fetch(`${STORE_URL}/comprar/`, {
        method: "POST",
        headers,
        body: params.toString(),
        redirect: "manual",
      });

      itemStatuses.push({ status: res.status, location: res.headers.get("location") });
      updateCookies(res);
    }

    // 2. Submeter 'go_to_checkout' para obter a URL direta do Checkout Transparente da Nuvemshop
    const checkoutHeaders: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Origin: STORE_URL,
      Referer: `${STORE_URL}/comprar/`,
    };
    const finalCookie = getCookieHeader();
    if (finalCookie) {
      checkoutHeaders["Cookie"] = finalCookie;
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

    let bodySnippet = "";
    try {
      bodySnippet = (await chkRes.text()).substring(0, 400);
    } catch {}

    return NextResponse.json({
      success: true,
      checkoutUrl: location || `${STORE_URL}/comprar/`,
      debug: {
        itemStatuses,
        location,
        chkStatus: chkRes.status,
        cookiesPresent: Boolean(finalCookie),
        bodySnippet,
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
