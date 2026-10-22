import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/render";
import { OrderCreatedEmail } from "@/emails/OrderCreated";
import { PaymentConfirmedEmail } from "@/emails/PaymentConfirmed";
import { OrderShippedEmail } from "@/emails/OrderShipped";
import { sendRawEmail } from "@/lib/email";
import { verifyAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const MOCK_ORDER = {
  orderId: "MNY-TEST-9921",
  customerName: "Rockstar Munaya",
  pixCode:
    "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540489.905802BR5913Munaya Rocks6012Porto Alegre62070503***6304ABCD",
  totalAmount: 139.8,
  carrierName: "Correios (Sedex)",
  trackingCode: "NL987654321BR",
  trackingUrl: "https://rastreamento.correios.com.br/app/index.php?codigo=NL987654321BR",
  items: [
    {
      name: "Bonzo Drum Series",
      size: "G",
      color: "Preta",
      quantity: 1,
      price: 89.9,
    },
    {
      name: "Caneca Pantera Dimebag",
      size: "Único",
      color: "Branca",
      quantity: 1,
      price: 49.9,
    },
  ],
  deliveryAddress: {
    street: "Rua Gonçalo de Carvalho",
    number: "777",
    complement: "Sala 302",
    neighborhood: "Independência",
    city: "Porto Alegre",
    state: "RS",
    zipcode: "90035-170",
  },
};

/**
 * GET /api/emails/preview?template=created|paid|shipped
 * Retorna o HTML renderizado do template para preview em iframe ou navegador.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const template = searchParams.get("template") || "created";

    let html = "";
    if (template === "paid") {
      html = await render(
        PaymentConfirmedEmail({
          orderId: MOCK_ORDER.orderId,
          customerName: MOCK_ORDER.customerName,
          totalAmount: MOCK_ORDER.totalAmount,
          items: MOCK_ORDER.items,
          deliveryAddress: MOCK_ORDER.deliveryAddress,
        })
      );
    } else if (template === "shipped") {
      html = await render(
        OrderShippedEmail({
          orderId: MOCK_ORDER.orderId,
          customerName: MOCK_ORDER.customerName,
          trackingCode: MOCK_ORDER.trackingCode,
          trackingUrl: MOCK_ORDER.trackingUrl,
          carrierName: MOCK_ORDER.carrierName,
          totalAmount: MOCK_ORDER.totalAmount,
          items: MOCK_ORDER.items,
          deliveryAddress: MOCK_ORDER.deliveryAddress,
        })
      );
    } else {
      html = await render(
        OrderCreatedEmail({
          orderId: MOCK_ORDER.orderId,
          customerName: MOCK_ORDER.customerName,
          pixCode: MOCK_ORDER.pixCode,
          totalAmount: MOCK_ORDER.totalAmount,
          items: MOCK_ORDER.items,
          deliveryAddress: MOCK_ORDER.deliveryAddress,
        })
      );
    }

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao renderizar template" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/emails/preview
 * Dispara um e-mail de teste real com o template selecionado para o e-mail informado.
 */
export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminAuth(req)) {
      return NextResponse.json(
        { success: false, error: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { to, template } = body;

    const cleanTo = String(to || "").trim().toLowerCase();
    if (!cleanTo || !cleanTo.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Informe um endereço de e-mail válido para o teste." },
        { status: 400 }
      );
    }

    let html = "";
    let subject = "";

    if (template === "paid") {
      html = await render(
        PaymentConfirmedEmail({
          orderId: MOCK_ORDER.orderId,
          customerName: MOCK_ORDER.customerName,
          totalAmount: MOCK_ORDER.totalAmount,
          items: MOCK_ORDER.items,
          deliveryAddress: MOCK_ORDER.deliveryAddress,
        })
      );
      subject = `[TESTE] 🔥 Pagamento confirmado! Pedido #${MOCK_ORDER.orderId} em produção`;
    } else if (template === "shipped") {
      html = await render(
        OrderShippedEmail({
          orderId: MOCK_ORDER.orderId,
          customerName: MOCK_ORDER.customerName,
          trackingCode: MOCK_ORDER.trackingCode,
          trackingUrl: MOCK_ORDER.trackingUrl,
          carrierName: MOCK_ORDER.carrierName,
          totalAmount: MOCK_ORDER.totalAmount,
          items: MOCK_ORDER.items,
          deliveryAddress: MOCK_ORDER.deliveryAddress,
        })
      );
      subject = `[TESTE] 📦 Barulho a caminho! Pedido #${MOCK_ORDER.orderId} despachado`;
    } else {
      html = await render(
        OrderCreatedEmail({
          orderId: MOCK_ORDER.orderId,
          customerName: MOCK_ORDER.customerName,
          pixCode: MOCK_ORDER.pixCode,
          totalAmount: MOCK_ORDER.totalAmount,
          items: MOCK_ORDER.items,
          deliveryAddress: MOCK_ORDER.deliveryAddress,
        })
      );
      subject = `[TESTE] 🤘 Pedido #${MOCK_ORDER.orderId} registrado! Falta pouco`;
    }

    const sendRes = await sendRawEmail({
      to: cleanTo,
      subject,
      html,
    });

    if (!sendRes.success) {
      return NextResponse.json(
        { success: false, error: sendRes.error || "Erro no envio pelo Resend." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `E-mail de teste '${template || "created"}' enviado com sucesso para ${cleanTo}!`,
      simulated: sendRes.simulated || false,
      id: sendRes.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro no envio de teste." },
      { status: 500 }
    );
  }
}
