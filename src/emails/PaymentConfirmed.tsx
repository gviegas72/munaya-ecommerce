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

export interface PaymentConfirmedProps {
  orderId?: string | number;
  customerName?: string;
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

export function PaymentConfirmedEmail({
  orderId = "MNY-8921",
  customerName = "Headbanger",
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
}: PaymentConfirmedProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Body style={mainBody}>
        <Container style={containerStyle}>
          <EmailHeader />

          <Section style={contentSection}>
            <Text style={badgeStyle}>Pagamento Confirmado • Pedido #{orderId}</Text>
            <Heading as="h2" style={heroTitleStyle}>
              O som tá ligado! Seu pedido entrou em produção ⚡
            </Heading>
            <Text style={introParagraph}>
              E aí, <strong>{customerName}</strong>! Identificamos o seu pagamento com sucesso. A arte da sua estampa já foi enviada para a esteira fabril de impressão artesanal e montagem.
            </Text>

            {/* Banner de Produção Ativa */}
            <Section style={productionBoxStyle}>
              <Text style={productionTitleStyle}>
                Status da Esteira: Em Produção
              </Text>
              <Text style={productionDescStyle}>
                Sua peça está sendo estampada sob demanda em alta definição com malha 100% algodão penteado. Assim que sair da fábrica e for despachada, você receberá o código de rastreamento da transportadora.
              </Text>
            </Section>

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
                Acompanhar Produção
              </Button>
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

export default PaymentConfirmedEmail;

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
  color: "#10b981",
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

const productionBoxStyle: React.CSSProperties = {
  backgroundColor: "#052e16",
  border: "2px solid #10b981",
  padding: "20px",
  margin: "24px 0",
  textAlign: "left",
};

const productionTitleStyle: React.CSSProperties = {
  margin: "0 0 6px 0",
  fontSize: "13px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "1px",
  color: "#34d399",
};

const productionDescStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "13px",
  color: "#e2e8f0",
  lineHeight: "1.5",
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
  backgroundColor: "#ff66c4",
  color: "#000000",
  fontWeight: 900,
  textTransform: "uppercase",
  fontSize: "14px",
  letterSpacing: "1px",
  padding: "14px 28px",
  textDecoration: "none",
  display: "inline-block",
  border: "2px solid #ff66c4",
};
