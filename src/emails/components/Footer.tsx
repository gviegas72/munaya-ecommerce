import { Section, Text } from "@react-email/components";
import * as React from "react";

export function EmailFooter() {
  return (
    <Section style={footerStyle}>
      <Text style={footerTextStyle}>
        Munaya Rocks • Porto Alegre, RS • Brasil
      </Text>
      <Text style={footerSubtextStyle}>
        Dúvidas sobre seu pedido? Fale com a gente pelo WhatsApp ou responda a este e-mail.
      </Text>
    </Section>
  );
}

const footerStyle: React.CSSProperties = {
  backgroundColor: "#000000",
  padding: "24px 20px",
  borderTop: "1px solid #1f1f1f",
  textAlign: "center",
};

const footerTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "12px",
  color: "#737373",
  textTransform: "uppercase",
  letterSpacing: "1px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const footerSubtextStyle: React.CSSProperties = {
  margin: "8px 0 0 0",
  fontSize: "11px",
  color: "#525252",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};
