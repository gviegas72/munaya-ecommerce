import { NextRequest, NextResponse } from "next/server";
import { calculateDimonaShipping } from "@/lib/dimona";

/**
 * Endpoint de Cotação de Frete Real da Dimona (Print-on-Demand)
 * Rota: POST /api/shipping e GET /api/shipping?cep=20520050
 */
export async function POST(req: NextRequest) {
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

    // Consulta cidade e estado no ViaCEP para melhor experiência do usuário
    let location = "";
    try {
      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`, {
        headers: { Accept: "application/json" },
      });
      if (viaCepRes.ok) {
        const info = await viaCepRes.json();
        if (!info.erro) {
          location = `${info.localidade}, ${info.uf}`;
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
    const options = dimonaQuotes.map((q: any) => ({
      id: String(q.delivery_method_id || q.name).toLowerCase(),
      name: q.name,
      price: Number(q.value),
      formattedPrice: `R$ ${Number(q.value).toFixed(2).replace(".", ",")}`,
      days: `${q.business_days} dias úteis`,
    }));

    return NextResponse.json({
      success: true,
      zipcode: cleanZip,
      location,
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
