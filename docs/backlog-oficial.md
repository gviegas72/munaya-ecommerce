# 🎸 Backlog Oficial & Governança de Engenharia — Munaya Rocks

> [!IMPORTANT]
> **Status Geral do Projeto:**
> - **100% das 10 Histórias Prioritárias da Fase 1 foram desenvolvidas, testadas, homologadas pelo Fundador e publicadas em Produção na Vercel.**
> - Branches de Produção sincronizadas: `master` e `claude-export`.

---

## 🟢 Fase 1: Core E-Commerce, Experiência do Cliente & Governança (100% CONCLUÍDA)

### [P0 - #01] Rota Canônica de Produto (`/produto/[slug]`)
- **Issue:** #13 | **Commit:** `4f828cf`
- **Entrega:** PDP indexável, SSR dinâmico, meta tags sociais OpenGraph, Breadcrumb e URLs amigáveis.
- **Status:** ✅ **CONCLUÍDO & HOMOLOGADO**

### [P0 - #02] Ação "Ver Produto na Loja" no `/admin`
- **Issue:** #11 | **Commit:** `1da85f9`
- **Entrega:** Link direto nos cards do catálogo e no modal de edição abrindo a PDP correspondente da vitrine.
- **Status:** ✅ **CONCLUÍDO & HOMOLOGADO**

### [P0 - #03] Recuperação de Senha por E-mail (OTP)
- **Issue:** #15 | **Commit:** `8f2f281`
- **Entrega:** Fluxo em duas etapas via Supabase Auth com código OTP de 6 dígitos e redefinição segura de senha.
- **Status:** ✅ **CONCLUÍDO & HOMOLOGADO**

### [P0 - #03.1] Área do Cliente Logada (`/minha-conta`)
- **Issue:** #23 | **Commit:** `d99b244`
- **Entrega:** Painel do cliente com histórico de pedidos, status em tempo real, rastreio, dados cadastrais e troca de senha.
- **Status:** ✅ **CONCLUÍDO & HOMOLOGADO**

### [P1 - #04] Notificações Transacionais via WhatsApp (Evolution API)
- **Issue:** #19 | **Commit:** `fc81b2d`
- **Entrega:** Disparo automático de Pix Copia e Cola imediato e link de rastreio dos Correios/transportadora via WhatsApp, com aba de pareamento QR Code no `/admin` e botão de contingência `wa.me`.
- **Status:** ✅ **CONCLUÍDO & HOMOLOGADO**

### [P1 - #05] Suporte a Múltiplas Imagens & Carrossel Fotográfico
- **Issue:** #12 | **Commit:** `150b064`
- **Entrega:** Até 6 imagens por produto, carrossel interativo na vitrine com navegação touch/desktop, modal fullscreen e upload no `/admin`.
- **Status:** ✅ **CONCLUÍDO & HOMOLOGADO**

### [P1 - #06] Variação de Cores com Troca Dinâmica de Mockups
- **Issue:** #14 | **Commit:** `4269e82`
- **Entrega:** Seletor de cores (Preta, Branca, Cinza Mescla, Estonada), SKU inteligente e troca fluida de mockups de alta resolução.
- **Status:** ✅ **CONCLUÍDO & HOMOLOGADO**

### [P2 - #07] Central de Blanks & Desacoplamento de Bases
- **Issue:** #20 | **Commit:** `fc9a9f5`
- **Entrega:** Desacoplamento de estampas e modelos físicos. Suporte nativo a Bonés, Canecas e Moletons além de Camisetas clássicas, quality e estonadas com precificação individual por blank.
- **Status:** ✅ **CONCLUÍDO & HOMOLOGADO**

### [P2 - #08] Gestão e Histórico de Compras de Clientes no `/admin`
- **Issue:** #16 | **Commit:** `3281103`
- **Entrega:** Nova aba dedicada `👥 Clientes` com KPIs (Total de Clientes, LTV Médio, Taxa de Recompra, Ticket Médio), busca em tempo real e drawer de perfil com histórico completo.
- **Status:** ✅ **CONCLUÍDO & HOMOLOGADO**

### [P3 - #09] Templates Transacionais de E-mail com `@react-email`
- **Issue:** #22 | **Commit:** `0365482`
- **Entrega:** Três templates responsivos e versionados (`OrderCreated`, `PaymentConfirmed`, `OrderShipped`), integração Resend e aba de pré-visualização desktop/mobile com disparo de testes no `/admin`.
- **Status:** ✅ **CONCLUÍDO & HOMOLOGADO**

### [P3 - #10] Autenticação por Usuários (RBAC), Permissões e Auditoria
- **Issue:** #21 | **Commits:** `cb17ce3` e `1c7b14e`
- **Entrega:** Login individual por e-mail e senha, papéis (`super_admin`, `operator`, `viewer`), bloqueio estrito 403 para mutações financeiras por operadores, trilha de auditoria imutável (`audit_logs`) e nova aba `🛡️ Auditoria`.
- **Status:** ✅ **CONCLUÍDO & HOMOLOGADO**

---

## 🟡 Fase 2: Backlog Futuro (Catalogado no GitHub Issues)

> [!NOTE]
> Estes itens estão devidamente criados e catalogados no **GitHub Issues** com status `status:todo`, prontos para serem puxados quando iniciarmos a próxima sprint.

### [V2 - #01] Rastreamento Avançado de Mídia & Conversão (GA4 & Meta CAPI)
- **GitHub Issue:** #24
- **Objetivo:** Instalação e disparo de eventos de e-commerce (`view_item`, `add_to_cart`, `begin_checkout`, `purchase`) para mensuração de ROAS em tráfego pago (Instagram, Google Ads, TikTok).
- **Prioridade:** Média (`priority: P2-media`)

### [V2 - #02] SEO Dinâmico, Sitemap XML & Structured Data (Schema.org)
- **GitHub Issue:** #25
- **Objetivo:** Geração automatizada de `sitemap.xml` indexando todas as rotas `/produto/[slug]` no Google Search Console, acompanhado de dados estruturados Schema.org (`Product`, `Offer`, `AggregateRating`) para exibição com estrelas e preço nos resultados de busca do Google.
- **Prioridade:** Média (`priority: P2-media`)

### [V2 - #03] Filtros Avançados na Vitrine & Busca Instantânea
- **GitHub Issue:** #26
- **Objetivo:** Adicionar barra de filtros interativos na home/categoria permitindo filtrar produtos por tipo de base (Camiseta, Moletom, Boné, Caneca), estilo musical e faixa de preço.
- **Prioridade:** Média (`priority: P2-media`)

### [V2 - #04] Motor de Compre Junto & Desconto Progressivo (Kits / Bundles)
- **GitHub Issue:** #27
- **Objetivo:** Aumentar o ticket médio (AOV) sugerindo combos com desconto automático na PDP e na gaveta do carrinho.
- **Prioridade:** Alta (`priority: P1-alta`)

### [V2 - #05] Integração com ERP / Emissão de Nota Fiscal (Bling / Tiny)
- **GitHub Issue:** #28
- **Objetivo:** Conexão direta com ERP Bling ou Tiny para emissão automatizada de NF-e e controle de estoque centralizado.
- **Prioridade:** Suporte (`priority: P3-suporte`)
