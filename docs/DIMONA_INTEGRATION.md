# Integração Oficial Camisa Dimona (Dropsimples API v2)

Este documento descreve os fluxos técnicos de integração com a fábrica Dimona para produção sob demanda (Print-on-Demand).

## 1. Fluxo de Cotação de Frete
- **Endpoint:** `POST /api/v2/shipping`
- **Autenticação:** Header `api-token: {DIMONA_API_TOKEN}`
- **Parâmetros:** CEP de destino, dimensões estimadas e lista de SKUs/produtos.
- **Retorno:** Modalidades de frete disponíveis (PAC, SEDEX, Transportadora) com valor e prazo em dias úteis.

## 2. Despacho Automático de Pedido
- **Endpoint:** `POST /api/v2/order`
- **Condição Crítica:** Somente após o webhook do Mercado Pago confirmar o pagamento com `status == 'approved'` e validação HMAC SHA-256.
- **Idempotência:** A chave `external_id` (ID do pedido na Munaya) deve ser enviada para evitar duplicidade na fábrica.
- **Saldo de Carteira (B2B):** A conta da Munaya no painel da Dimona deve possuir saldo suficiente para cobrir os custos de produção e frete.

## 3. Rastreamento e Notificações de Status
- O código de rastreio (`tracking_code`) é obtido via pooling diário ou atualização na API.
- Ao ser postado, o webhook ou rotina atualiza o pedido no Supabase para `status = 'enviado'` e dispara notificação automática via WhatsApp e E-mail.
