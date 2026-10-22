import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
} from "@react-email/components";
import * as React from "react";
import { EmailHeader } from "./components/Header";
import { EmailFooter } from "./components/Footer";
import { ItemsTable, EmailItemProps } from "./components/ItemsTable";

export interface OrderShippedProps {
  orderId?: string | number;
  customerName?: string;
  trackingCode?: string;
  trackingUrl?: string;
  carrierName?: string;
  totalAmount?: number;
  items?: EmailItemProps[];
  deliveryAddress?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipcode: string;
  };
}

export function OrderShippedEmail({
  orderId = "MNY-8921",
  customerName = "Headbanger",
  trackingCode = "NL123456789BR",
  trackingUrl = "https://rastreamento.correios.com.br/app/index.php",
  carrierName = "Correios (PAC)",
  totalAmount = 89.9,
  items = [
    {
      name: "Bonzo Drum Series",
      size: "M",
      color: "Preta",
      quantity: 1,
      price: 89.9,
    },
  ],
  deliveryAddress = {
    street: "Av. Osvaldo Aranha",
    number: "1020",
    complement: "Apto 402",
    neighborhood: "Bom Fim",
    city: "Porto Alegre",
    state: "RS",
    zipcode: "90035-190",
  },
}: OrderShippedProps) {
  const finalTrackingUrl =
    trackingUrl ||
    `https://rastreamento.correios.com.br/app/index.php?codigo=${encodeURIComponent(
      trackingCode || ""
    )}`;

  return (
    <Html lang="pt-BR">
      <Head />
      <Body style={mainBody}>
        <Container style={containerStyle}>
          <EmailHeader />

          <Section style={contentSection}>
            <Text style={badgeStyle}>Pedido #{orderId} a Caminho</Text>
            <Heading as="h2" style={heroTitleStyle}>
              Seu rock está na estrada! 📦🚚
            </Heading>
            <Text style={introParagraph}>
              Boas notícias, <strong>{customerName}</strong>! Sua peça foi
              produzida com sucesso, embalada e despachada pela fábrica. Agora é só
              acompanhar o trajeto até a sua porta.
            </Text>

            {/* Bloco de Rastreamento */}
            <Section style={trackingBoxStyle}>
              <Text style={trackingHeaderStyle}>
                Código de Rastreamento ({carrierName})
              </Text>
              <div style={trackingCodeContainer}>{trackingCode}</div>
              <div style={{ marginTop: "16px" }}>
                <Button href={finalTrackingUrl} style={trackingButtonStyle}>
                  Rastrear Pacote Agora ➔
                </Button>
              </div>
            </Section>

            {/* Tabela de Itens */}
            <ItemsTable items={items} total={totalAmount} />

            {/* Endereço de Entrega */}
            {deliveryAddress?.street && (
              <Section style={addressSection}>
                <Text style={addressTitleStyle}>Endereço de Destino</Text>
                <Text style={addressTextStyle}>
                  {deliveryAddress.street}, {deliveryAddress.number}
                  {deliveryAddress.complement ? ` - ${deliveryAddress.complement}` : ""}
                  <br />
                  {deliveryAddress.neighborhood} — {deliveryAddress.city}/
                  {deliveryAddress.state}
                  <br />
                  CEP: {deliveryAddress.zipcode}
                </Text>
              </Section>
            )}

            {/* Botão Secundário de Suporte */}
            <Section style={{ textAlign: "center", marginTop: "32px" }}>
              <Button
                href="https://munayarocks.vercel.app/login"
                style={secondaryButtonStyle}
              >
                Ver Detalhes do Pedido
              </Button>
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

export default OrderShippedEmail;

const mainBody: React.CSSProperties = {
  backgroundColor: "#050505",
  color: "#ffffff",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  margin: 0,
  padding: "20px 0",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#0e0e0e",
  border: "2px solid #262626",
};

const contentSection: React.CSSProperties = {
  padding: "32px 28px",
};

const badgeStyle: React.CSSProperties = {
  fontSize: "12px",
  textTransform: "uppercase",
  fontWeight: 800,
  letterSpacing: "2px",
  color: "#38bdf8",
  margin: 0,
};

const heroTitleStyle: React.CSSProperties = {
  margin: "8px 0 0 0",
  fontSize: "26px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "-0.5px",
  color: "#ffffff",
  lineHeight: 1.2,
};

const introParagraph: React.CSSProperties = {
  margin: "14px 0 0 0",
  fontSize: "15px",
  color: "#d4d4d4",
  lineHeight: "1.6",
};

const trackingBoxStyle: React.CSSProperties = {
  backgroundColor: "#082f49",
  border: "2px solid #38bdf8",
  padding: "22px 20px",
  margin: "24px 0",
  textAlign: "center",
};

const trackingHeaderStyle: React.CSSProperties = {
  margin: "0 0 10px 0",
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "1.5px",
  color: "#7dd3fc",
};

const trackingCodeContainer: React.CSSProperties = {
  backgroundColor: "#031a29",
  border: "1px dashed #0284c7",
  padding: "12px",
  fontFamily: "monospace",
  fontSize: "18px",
  fontWeight: 800,
  letterSpacing: "2px",
  color: "#ffffff",
  display: "inline-block",
  margin: "0 auto",
};

const trackingButtonStyle: React.CSSProperties = {
  backgroundColor: "#38bdf8",
  color: "#000000",
  fontWeight: 900,
  textTransform: "uppercase",
  fontSize: "13px",
  letterSpacing: "1px",
  padding: "12px 24px",
  textDecoration: "none",
  display: "inline-block",
  border: "2px solid #38bdf8",
};

const addressSection: React.CSSProperties = {
  marginTop: "24px",
  paddingTop: "16px",
  borderTop: "1px solid #1f1f1f",
};

const addressTitleStyle: React.CSSProperties = {
  margin: "0 0 8px 0",
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "1px",
  color: "#a3a3a3",
};

const addressTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "14px",
  color: "#ffffff",
  lineHeight: "1.5",
};

const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  color: "#ffffff",
  fontWeight: 800,
  textTransform: "uppercase",
  fontSize: "13px",
  letterSpacing: "1px",
  padding: "12px 24px",
  textDecoration: "none",
  display: "inline-block",
  border: "1px solid #404040",
};
