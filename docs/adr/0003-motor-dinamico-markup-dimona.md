# ADR 003: Motor Dinâmico de Custos Dimona e Markup de Venda

* **Status:** Aprovada e Implementada
* **Data:** 2026-10-21
* **Decisores:** Gabriel Viegas (Fundador/Tech Lead), Antigravity AI Architecture Team
* **Contexto:** Política de Precificação Automatizada baseada em Custo de Produção B2B

---

## 1. Contexto & Problema

No modelo de negócios print-on-demand com a Dimona, o custo do produto é determinado pela matéria-prima (tipo da malha da camiseta) somada ao custo da impressão digital DTG.
Por exemplo:
* Camiseta Classic 30.1 Algodão Penteado: Custo B2B Dimona = **R$ 42,00**
* Camiseta Quality Premium: Custo B2B Dimona = **R$ 48,00**
* Camiseta Estonada Rockwear: Custo B2B Dimona = **R$ 55,00**

Se o lojista cadastrar preços estáticos manuais na vitrine:
1. Sempre que a Dimona reajustar o custo das malhas, o lojista precisará editar estampa por estampa.
2. O risco de corrosão da margem líquida (após desconto de taxas do gateway do Mercado Pago e tributos) é muito alto.
3. Falta visibilidade em tempo real sobre quanto sobra de lucro limpo por camiseta vendida.

---

## 2. Decisão Arquitetural

Criamos um **Motor Centralizado de Precificação Dinâmica (`src/lib/pricing.ts`)** integrado à aba **"Custos & Markup"** no painel `/admin`:

1. **Configuração dos Custos Base de Blanks/Malhas:** O administrador cadastra/ajusta o custo de produção de cada linha da Dimona.
2. **Definição de Markup:** Escolha entre **Margem Percentual (%)** (ex: `+114.05%`) ou **Multiplicador de Custo (x)** (ex: `2.14x`).
3. **Arredondamento Psicológico Comercial:**
   * Opção `,90`: Transforma o resultado no final psicológico padrão do e-commerce (ex: R$ 42,00 * 2.14 = R$ 89,88 -> **R$ 89,90**).
   * Opção `,00`: Arredonda para o inteiro mais próximo (ex: R$ 90,00).
   * Opção `Exato`: Sem manipulação de centavos.
4. **Simulador de Margens em Tempo Real:** Exibe antes de salvar:
   * Preço de venda sugerido.
   * Lucro bruto em R$ e margem bruta (%).
   * Dedução estimada de taxa do gateway (~4.5% Mercado Pago).
   * Lucro líquido estimado em R$.
5. **Atualização do Catálogo em Lote (`POST /api/pricing/apply`):** Botão administrativo de um clique que recalcula e atualiza o preço de venda de todas as estampas no Supabase simultaneamente.

---

## 3. Consequências

* **Agilidade Estratégica:** Reajustes de preço da fábrica levam menos de 10 segundos para serem refletidos em toda a loja.
* **Segurança Financeira:** Garante que nenhuma peça seja vendida abaixo da margem de lucro mínima desejada pela Munaya Rocks.
