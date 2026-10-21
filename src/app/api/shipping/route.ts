import { NextRequest, NextResponse } from "next/server";
import { calculateDimonaShipping } from "@/lib/dimona";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Endpoint de Cotação de Frete Real da Dimona (Print-on-Demand)
 * Rota: POST /api/shipping e GET /api/shipping?cep=20520050
 */
export async function POST(req: NextRequest) {
  // Limita a 40 consultas de frete por minuto por IP para proteger a cota da API Dimona
  const rateLimit = checkRateLimit(req, "shipping", { limit: 40, windowSec: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Limite de cotações atingido. Tente novamente em alguns segundos." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const cleanZip = String(body.zipcode || body.cep || "").replace(/\D/g, "");

    if (cleanZip.length !== 8) {
      return NextResponse.json(
        { error: "CEP inválido. Deve conter 8 dígitos." },
        { status: 400 }
      );
    }

    const qty = Number(body.quantity || body.qty || 1);

    // Consulta frete real na API v2 da Dimona
    const dimonaQuotes = await calculateDimonaShipping(cleanZip, qty);

    // Consulta endereço completo no ViaCEP (Rua, Bairro, Cidade, UF)
    let location = "";
    let street = "";
    let neighborhood = "";
    let city = "";
    let state = "";

    try {
      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`, {
        headers: { Accept: "application/json" },
      });
      if (viaCepRes.ok) {
        const info = await viaCepRes.json();
        if (!info.erro) {
          street = info.logradouro || "";
          neighborhood = info.bairro || "";
          city = info.localidade || "";
          state = info.uf || "";
          location = `${city}, ${state}`;
        }
      }
    } catch {
      // Ignora erro de geolocalização se serviço de CEP falhar
    }

    if (!Array.isArray(dimonaQuotes)) {
      return NextResponse.json(
        {
          error: "Não foi possível calcular o frete com a Dimona para este CEP.",
          raw: dimonaQuotes,
        },
        { status: 502 }
      );
    }

    // Normaliza para o formato padrão do e-commerce Munaya
    const isTest = Boolean(
      body.is_test ||
      body.price <= 1.05 ||
      body.subtotal <= 1.05 ||
      (Array.isArray(body.items) &&
        body.items.some((it: any) => String(it.id) === "99" || String(it.name || "").toLowerCase().includes("teste")))
    );

    const baseOptions = dimonaQuotes.map((q: any) => ({
      id: String(q.delivery_method_id || q.name).toLowerCase(),
      name: q.name,
      price: Number(q.value),
      formattedPrice: `R$ ${Number(q.value).toFixed(2).replace(".", ",")}`,
      days: `${q.business_days} dias úteis`,
    }));

    const options = isTest
      ? [
          {
            id: "gratis_teste",
            name: "Frete Cortesia (Homologação R$ 1,00)",
            price: 0,
            formattedPrice: "Grátis (R$ 0,00)",
            days: "Homologação Imediata",
          },
          ...baseOptions,
        ]
      : baseOptions;

    return NextResponse.json({
      success: true,
      zipcode: cleanZip,
      location,
      street,
      neighborhood,
      city,
      state,
      options,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ [SHIPPING API] Erro ao calcular frete:", msg);
    return NextResponse.json(
      { error: "Erro interno ao processar cotação de frete.", details: msg },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cep = searchParams.get("cep") || searchParams.get("zipcode") || "";
  const qty = Number(searchParams.get("quantity") || searchParams.get("qty") || 1);

  const cleanZip = cep.replace(/\D/g, "");
  if (cleanZip.length !== 8) {
    return NextResponse.json(
      { error: "Informe um CEP válido de 8 dígitos na query string (?cep=00000000)" },
      { status: 400 }
    );
  }

  return POST(
    new NextRequest(req.url, {
      method: "POST",
      body: JSON.stringify({ zipcode: cleanZip, quantity: qty }),
      headers: { "Content-Type": "application/json" },
    })
  );
}
