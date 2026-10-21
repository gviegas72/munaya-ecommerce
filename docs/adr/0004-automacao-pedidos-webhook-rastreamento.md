# ADR 004: Automação Transacional e Rastreamento de Pedidos via Webhook

* **Status:** Aprovada e Implementada
* **Data:** 2026-10-21
* **Decisores:** Gabriel Viegas (Fundador/Tech Lead), Antigravity AI Architecture Team
* **Contexto:** Ciclo de Vida do Pedido, Comunicação com o Cliente e Rastreamento

---

## 1. Contexto & Problema

O cliente de e-commerce moderno exige atualizações instantâneas e transparentes sobre o status da sua compra:
1. Confirmação imediata do Pix e recibo do pedido.
2. Aviso de início de confecção na fábrica.
3. Notificação com código de rastreamento no momento do despacho para a transportadora ou Correios.

Sem automação, o lojista precisaria entrar manualmente no portal da Dimona, copiar códigos de rastreio um a um e colar em e-mails manuais para cada cliente.

---

## 2. Decisão Arquitetural

Implementamos uma esteira 100% assíncrona orientada a eventos:

1. **Liquidação e Disparo de Produção:**
   * O cliente paga via Pix/Cartão no Mercado Pago.
   * O webhook `/api/webhooks/mercadopago` valida a assinatura criptográfica HMAC SHA-256 e confirma o status do pedido no Supabase.
   * Se o pedido estiver pago e não for homologação/dry-run, a rota despacha automaticamente a ordem de confecção para a API da Dimona (`POST /orders`).
   * O e-mail transacional de "Pagamento Confirmado" é disparado via Resend.

2. **Captura Reversa de Rastreamento (Webhook Dimona):**
   * Criamos o endpoint `/api/webhooks/dimona` cadastrado no sistema da Dimona.
   * Assim que a fábrica embala e gera a etiqueta nos Correios/Jadlog, o webhook da Dimona notifica nossa API com o status `shipped` e o `tracking_code`.
   * Nossa API atualiza o registro no Supabase e dispara automaticamente o e-mail de "Pedido Enviado" com o link de rastreamento clicável para o cliente.

3. **Fallback Administrativo no Painel `/admin`:**
   * Caso haja qualquer contingência, o lojista conta com botões manuais no painel para:
     * Disparar ou forçar e-mail de criação, confirmação ou envio com inserção manual de código de rastreio.
     * Despacho manual direto para a Dimona com 1 clique.

---

## 3. Consequências

* **Zero Trabalho Operacional Repetitivo:** Todo o fluxo desde o clique de compra até a entrega do código de rastreio funciona no piloto automático.
* **Experiência do Consumidor Premium:** Comunicação contínua e estilizada no padrão de design brutalista da marca.
