# ADR 005: Gestão Dinâmica de Cupons e Promoções Server-Side

* **Status:** Aprovada e Implementada
* **Data:** 2026-10-21
* **Decisores:** Gabriel Viegas (Fundador/Tech Lead), Antigravity AI Architecture Team
* **Contexto:** Mecânica de Cupons, Conversão de Primeiros Visitantes e Homologação de Frete

---

## 1. Contexto & Problema

Promoções e cupons são essenciais para aquisição de novos clientes e testes operacionais.
Precisávamos atender a 4 cenários simultâneos:
1. **Promoção de Primeira Compra:** Conceder 10% OFF para visitantes não identificados que chegam ao site pela primeira vez.
2. **Ambiente de Testes / Homologação de Frete:** Poder simular e testar pagamentos reais sem cobrar frete do lojista, sem expor publicamente uma opção de "Frete Teste Grátis" na cotação de CEP para os clientes comuns.
3. **Gestão Flexível de Cupons:** Poder criar, pausar, ativar ou excluir cupons pela interface do `/admin`.
4. **Validade Temporal:** Suporte tanto a cupons perenes (sem validade) quanto a cupons sazonais com data limite de expiração (`expires_at`).
5. **Segurança Anti-Fraude:** Impossibilitar que um usuário manipule o HTML/JavaScript local para aplicar cupons inexistentes ou valores de desconto falsos.

---

## 2. Decisão Arquitetural

1. **Camada de Dados Resiliente (`public.coupons` + In-Memory Fallback):**
   * Criada a tabela `coupons` no Supabase com campos para código, tipo (`percentage`, `fixed`, `free_shipping`), valor, subtotal mínimo, data de expiração (`expires_at`), limite de usos (`max_uses`) e status ativo (`is_active`).
   * Mantido um fallback canônico em memória no backend (`src/lib/coupons.ts`) garantindo que cupons vitais (como `PRIMEIRACOMPRA` e `TESTEFRETE`) funcionem mesmo durante manutenções no banco.

2. **Banner de Boas-Vindas (`src/components/PromoBanner.tsx`):**
   * Componente no topo do storefront com cópia de código em 1 clique (`PRIMEIRACOMPRA` - 10% OFF) e persistência de dispensa em `localStorage`.

3. **Cupom Especial `TESTEFRETE`:**
   * Removemos opções públicas fictícias de frete grátis da rota de cotação `/api/shipping`.
   * Criamos o cupom tipo `free_shipping` (`TESTEFRETE`), utilizável exclusivamente no checkout para testes controlados da equipe.

4. **Validação Severa Server-Side no Checkout (`/api/checkout`):**
   * O cliente envia apenas o código do cupom digitado.
   * O servidor valida o cupom, checa expiração, limite de usos, recalcula o desconto sobre os preços oficiais do catálogo e gera o total exato para o Mercado Pago.

---

## 3. Consequências

* **Zero Risco de Fraude de Cupom:** Nenhum desconto é concedido sem validação do backend.
* **Autonomia para Campanhas:** O time da Munaya pode criar campanhas relâmpago de fim de semana pelo `/admin` sem alterar uma linha de código.
