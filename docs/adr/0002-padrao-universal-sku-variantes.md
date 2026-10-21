# ADR 002: Padrão Universal de SKU e Estratégia de Variantes

* **Status:** Aprovada e Implementada
* **Data:** 2026-10-21
* **Decisores:** Gabriel Viegas (Fundador/Tech Lead), Antigravity AI Architecture Team
* **Contexto:** Identificação unívoca de produtos entre Frontend, Supabase e Fábrica Dimona

---

## 1. Contexto & Problema

Com a expansão do catálogo de camisetas da Munaya Rocks, cada estampa pode ser produzida em múltiplas cores e múltiplos tamanhos.
Sem uma convenção rígida de SKU (*Stock Keeping Unit*), ocorrem falhas graves na operação:
1. Ambiguidade na esteira de produção da Dimona sobre qual tamanho ou cor estampar.
2. Dificuldade de controle de estoque e de conferência de pedidos no painel `/admin`.
3. Inconsistência nos pedidos registrados no banco de dados.

---

## 2. Decisão Arquitetural

Definimos a **Estrutura Canônica de SKU Munaya**:

```text
[MUNAYA]-[NOME_DA_ESTAMPA]-[COR]-[TAMANHO]
```

### Exemplos Reais:
* `MUNAYA-DIMEBAG-PRETA-PP`
* `MUNAYA-BONZO-BRANCA-G`
* `MUNAYA-CLUTCH-CINZA-GG`

### Regras de Negócio e Governança:
1. **Sanitização de Nome:** O nome da estampa é convertido para letras maiúsculas sem acentos, caracteres especiais ou espaços substituídos por hífens (`DIMEBAG`, `CHICO-SCIENCE`, `AMPLIFICADOR`).
2. **Cores Canônicas Iniciais:** Limitadas a 3 variações sólidas universais para camisetas rockwear:
   * **PRETA** (`#111111`) — Padrão do catálogo.
   * **BRANCA** (`#FFFFFF`)
   * **CINZA** (`#666666`)
3. **Grade de Tamanhos:** Grade completa padrão adulto unissex:
   * `PP`, `P`, `M`, `G`, `GG`, `XGG`.
4. **Montagem Dinâmica no Frontend:**
   * O banco de dados armazena o SKU base da estampa (ex: `MUNAYA-DIMEBAG`).
   * No momento em que o cliente seleciona a cor e o tamanho na PDP (*Product Detail Page*), o SKU da variante é sintetizado dinamicamente via helper `generateVariantSku(...)` e persistido nos itens do pedido.

---

## 3. Consequências

* **Rastreabilidade Ponta a Ponta:** Tanto o cliente quanto o lojista e a fábrica sabem exatamente a peça exata sem necessidade de consultar descrições textuais soltas.
* **Pronto para Integração Dimona:** Facilita o mapeamento De/Para com as referências internas da Dimona para injeção automática na API v2.
