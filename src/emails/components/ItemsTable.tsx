import { Section, Text } from "@react-email/components";
import * as React from "react";

export interface EmailItemProps {
  name: string;
  size?: string;
  color?: string;
  blank?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  unit_price?: number;
}

export function ItemsTable({
  items = [],
  total = 0,
}: {
  items: EmailItemProps[];
  total: number;
}) {
  return (
    <Section style={{ marginTop: "24px" }}>
      <Text style={headingStyle}>Itens Selecionados</Text>
      <table
        border={0}
        cellPadding={0}
        cellSpacing={0}
        width="100%"
        style={{ borderCollapse: "collapse" }}
      >
        <tbody>
          {items.map((it, idx) => {
            const quantity = it.quantity || it.qty || 1;
            const price = Number(it.price || it.unit_price || 0);
            return (
              <tr key={idx}>
                <td style={itemCellLeft}>
                  <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "14px" }}>
                    {it.name}
                  </span>
                  <span style={{ color: "#a3a3a3", fontSize: "12px", display: "block", marginTop: "2px" }}>
                    {it.color ? `${it.color} • ` : ""}
                    Tam: {it.size || "M"}
                  </span>
                </td>
                <td align="center" style={itemCellCenter}>
                  {quantity}x
                </td>
                <td align="right" style={itemCellRight}>
                  R$ {(price * quantity).toFixed(2).replace(".", ",")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={totalContainer}>
        <span style={{ fontSize: "13px", textTransform: "uppercase", color: "#a3a3a3", fontWeight: 700 }}>
          Total do Pedido:
        </span>
        <span style={{ fontSize: "26px", fontWeight: 900, color: "#ff66c4", marginLeft: "10px" }}>
          R$ {Number(total).toFixed(2).replace(".", ",")}
        </span>
      </div>
    </Section>
  );
}

const headingStyle: React.CSSProperties = {
  margin: "0 0 12px 0",
  fontSize: "15px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "1px",
  color: "#ffffff",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const itemCellLeft: React.CSSProperties = {
  padding: "10px 0",
  borderBottom: "1px solid #1f1f1f",
  textAlign: "left",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const itemCellCenter: React.CSSProperties = {
  padding: "10px 0",
  borderBottom: "1px solid #1f1f1f",
  fontSize: "14px",
  color: "#d4d4d4",
  fontWeight: 600,
  width: "50px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const itemCellRight: React.CSSProperties = {
  padding: "10px 0",
  borderBottom: "1px solid #1f1f1f",
  fontSize: "14px",
  color: "#ffffff",
  fontWeight: 700,
  textAlign: "right",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const totalContainer: React.CSSProperties = {
  marginTop: "16px",
  paddingTop: "14px",
  borderTop: "2px solid #262626",
  textAlign: "right",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};
