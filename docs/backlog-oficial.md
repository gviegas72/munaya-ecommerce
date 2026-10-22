# 🎸 Backlog Oficial & Governança de Engenharia — Munaya Rocks

> [!IMPORTANT]
> **Fluxo de Trabalho Oficial:**
> 1. Cada funcionalidade é desenvolvida em uma **branch dedicada** (`feat/...`).
> 2. Testes de build e validação técnica rigorosa são executados localmente.
> 3. Notificação detalhada ao Fundador com **instruções exatas de homologação**.
> 4. Merge para `master` e deploy em produção **apenas após o aceite e aprovação explícita do Fundador**.

---

## 🟢 Sprint 1: Blindagem de Margem & Operação Zero Falhas

### [S1-01] Trava de Preço Customizado (`is_custom_price`)
- **Objetivo:** Impedir que produtos com precificação manual/especial tenham seus preços sobrescritos pelo motor de recálculo em lote de markup.
- **Branch:** `feat/price-lock-is-custom-price`
- **Critérios de Aceite:**
  - [x] Coluna `is_custom_price` adicionada na tabela `products` do Supabase (com persistência híbrida e fallback em metadata).
  - [x] No modal de edição do produto no `/admin`, toggle/alerta visual: *"Fixar Preço Individual"*.
  - [x] Badge visual brutalista **`🔒 PREÇO TRAVADO`** exibida no card do catálogo no `/admin`.
  - [x] A rota `POST /api/pricing/apply` filtra e pula automaticamente produtos com `is_custom_price = true`.
- **Status:** ✅ **CONCLUÍDO E HOMOLOGADO PELO FUNDADOR**

---

### [S1-02] Mapeamento De/Para Oficial de SKUs com a Dimona
- **Objetivo:** Vincular os SKUs canônicos Munaya (`MNY-TSH-DIMEBAG-PRETA-G`) aos IDs de produtos e variantes exatos da API v2 da Dimona.
- **Branch:** `feat/dimona-sku-mapping`
- **Critérios de Aceite:**
  - [ ] Estrutura / tabela `sku_dimona_mappings` ou campos de integração para resolução determinística de código de fábrica.
  - [ ] Interface no `/admin` para associar estampa ao ID do catálogo da Dimona (Dimona Product ID / SKU Fábrica).
  - [ ] Webhook do Mercado Pago despachando com os IDs exatos de esteira e artwork URL.
- **Status:** 🟡 **EM ANDAMENTO**

---

## 🟡 Sprint 2: Alavanca de Conversão & Expansão de Sortimento

### [S2-01] Notificações Transacionais via WhatsApp
- **Objetivo:** Disparo de Pix Copia e Cola imediato após o checkout e link de rastreamento pós-despacho da Dimona no WhatsApp do cliente.
- **Branch:** `feat/whatsapp-transactional`
- **Status:** ⏳ **Planejado**

---

### [S2-02] Central de Blanks & Produtos Dinâmicos
- **Objetivo:** Gerenciar tipos de produtos (bonés, canecas, moletons, ecobags) além de camisetas no `/admin` e na vitrine.
- **Branch:** `feat/dynamic-blanks-catalog`
- **Status:** ⏳ **Planejado**

---

## 🔵 Sprint 3: Governança & Auditoria

### [S3-01] Controle de Acesso por Usuários (RBAC) e Logs de Atividade
- **Objetivo:** Múltiplos operadores no `/admin` com papéis restritos e trilha de auditoria no PostgreSQL.
- **Branch:** `feat/rbac-admin-logs`
- **Status:** ⏳ **Planejado**
