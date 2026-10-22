import { Section, Row, Column, Heading, Text } from "@react-email/components";
import * as React from "react";

export function EmailHeader() {
  return (
    <Section style={headerStyle}>
      <Row>
        <Column align="center">
          <Heading as="h1" style={titleStyle}>
            MUNAYA<span style={{ color: "#ff66c4" }}>.ROCKS</span>
          </Heading>
          <Text style={subtitleStyle}>
            Headless E-Commerce // Rock Wear
          </Text>
        </Column>
      </Row>
    </Section>
  );
}

const headerStyle: React.CSSProperties = {
  backgroundColor: "#000000",
  padding: "32px 24px",
  borderBottom: "2px solid #262626",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "32px",
  fontWeight: 900,
  letterSpacing: "-1px",
  textTransform: "uppercase",
  color: "#ffffff",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const subtitleStyle: React.CSSProperties = {
  margin: "4px 0 0 0",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "2px",
  color: "#a3a3a3",
  fontWeight: 700,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};
