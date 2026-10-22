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

export interface OrderCreatedProps {
  orderId?: string | number;
  customerName?: string;
  pixCode?: string;
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

export function OrderCreatedEmail({
  orderId = "MNY-8921",
  customerName = "Headbanger",
  pixCode = "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540489.905802BR5913Munaya Rocks6012Porto Alegre62070503***6304ABCD",
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
}: OrderCreatedProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Body style={mainBody}>
        <Container style={containerStyle}>
          <EmailHeader />

          <Section style={contentSection}>
            <Text style={badgeStyle}>Pedido #{orderId} Registrado</Text>
            <Heading as="h2" style={heroTitleStyle}>
              Falta pouco para o seu rock chegar! 🤘
            </Heading>
            <Text style={introParagraph}>
              Olá, <strong>{customerName}</strong>! Recebemos seu pedido. Para
              colocarmos sua estampa na esteira de produção artesanal da
              fábrica, efetue o pagamento via Pix Copia e Cola abaixo:
            </Text>

            {/* Bloco Pix Copia e Cola */}
            {pixCode && (
              <Section style={pixBoxStyle}>
                <Text style={pixTitleStyle}>Código Pix Copia e Cola</Text>
                <div style={pixCodeContainer}>{pixCode}</div>
                <Text style={pixInstructionsStyle}>
                  Abra o aplicativo do seu banco, escolha <strong>Pix Copia e Cola</strong> e cole o código. A aprovação é imediata!
                </Text>
              </Section>
            )}

            {/* Tabela de Itens */}
            <ItemsTable items={items} total={totalAmount} />

            {/* Endereço de Entrega */}
            {deliveryAddress?.street && (
              <Section style={addressSection}>
                <Text style={addressTitleStyle}>Endereço de Entrega</Text>
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

            {/* Botão CTA para acompanhar */}
            <Section style={{ textAlign: "center", marginTop: "32px" }}>
              <Button
                href="https://munayarocks.vercel.app/login"
                style={ctaButtonStyle}
              >
                Acompanhar no Site
              </Button>
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

export default OrderCreatedEmail;

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
  color: "#ff66c4",
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

const pixBoxStyle: React.CSSProperties = {
  backgroundColor: "#171717",
  border: "2px solid #ff66c4",
  padding: "20px",
  margin: "24px 0",
  textAlign: "center",
};

const pixTitleStyle: React.CSSProperties = {
  margin: "0 0 10px 0",
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "1.5px",
  color: "#ff66c4",
};

const pixCodeContainer: React.CSSProperties = {
  backgroundColor: "#0a0a0a",
  border: "1px dashed #404040",
  padding: "12px",
  fontFamily: "monospace",
  fontSize: "11px",
  wordBreak: "break-all",
  color: "#f5f5f5",
  textAlign: "left",
};

const pixInstructionsStyle: React.CSSProperties = {
  margin: "12px 0 0 0",
  fontSize: "12px",
  color: "#a3a3a3",
  lineHeight: "1.4",
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

const ctaButtonStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#000000",
  fontWeight: 900,
  textTransform: "uppercase",
  fontSize: "14px",
  letterSpacing: "1px",
  padding: "14px 28px",
  textDecoration: "none",
  display: "inline-block",
  border: "2px solid #ffffff",
};
