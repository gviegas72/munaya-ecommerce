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

### [P3 - #11] Assessment de Segurança, Planos de DRP e Backup Automatizado via GitHub Actions
- **Issue:** #29 | **Commits:** `3012091` e `fb04211`
- **Entrega:** Auditoria AppSec completa (Score 9.8/10), 7 Runbooks operacionais de Disaster Recovery (DRP), rotina automatizada de backup lógico do Supabase no GitHub Actions todo domingo à meia-noite (cron) e sob demanda (manual dispatch) com retenção de 90 dias.
- **Status:** ✅ **CONCLUÍDO & HOMOLOGADO**

---

## 🟡 Fase 2: Backlog Oficial Priorizado (Catalogado no GitHub Issues)

> [!NOTE]
> Todos os 11 itens abaixo estão catalogados no **GitHub Issues** com status `status:todo`, devidamente pontuados pela Matriz RICE do Comitê de Produto & Engenharia (PO, Tech Lead e Growth Lead).

### 🚀 Sprint 1: Fundação, Performance Mobile & Recuperação de Receita
1. **[V2 - #06] Otimização Mobile, Lazy Loading & Core Web Vitals (next/image)**
   - **GitHub Issue:** #30 | **RICE Score:** 20.0 | **Commit:** `a736aa3`
   - **Entrega:** Imagens da vitrine e PDP migradas para `next/image` com `priority` nos primeiros 3 itens (LCP imediato), WebP/AVIF responsivo, lazy loading nativo nas peças abaixo da dobra e decoding assíncrono.
   - **Status:** ✅ **CONCLUÍDO & HOMOLOGADO PELO FUNDADOR**
2. **[V2 - #07] Login Social com 1-Clique (Google & Apple via Supabase OAuth)**
   - **GitHub Issue:** #31 | **RICE Score:** 14.4 | **Commit:** `a736aa3`
   - **Entrega:** Botões de autenticação social com 1-clique (Google e Apple) integrados ao Supabase Auth, callback de redirecionamento seguro (`/auth/callback`), design brutalista e sincronização automática de perfil.
   - **Status:** ✅ **CONCLUÍDO & HOMOLOGADO PELO FUNDADOR**
3. **[V2 - #08] Recuperação Automática de Carrinho Abandonado (WhatsApp & Resend)**
   - **GitHub Issue:** #32 | **RICE Score:** 12.6 | **Prioridade:** `priority: P1-alta`
   - **Objetivo:** Disparo inteligente de WhatsApp (Evolution API) e e-mail transacional (Resend) 20 minutos após o abandono com foto da peça e link do carrinho já preenchido.
   - **Status:** 🧪 **PRONTO PARA TESTE PELO FUNDADOR (`status:ready-to-test`)**
4. **[V2 - #01] Rastreamento Avançado de Mídia & Conversão (GA4 & Meta CAPI Server-Side)**
   - **GitHub Issue:** #24 | **RICE Score:** 11.25 | **Prioridade:** `priority: P2-media`
   - **Objetivo:** Disparo de eventos server-side via Meta Graph API e GA4 (`ViewContent`, `AddToCart`, `Purchase`) para otimizar campanhas de tráfego pago sem perda no iOS 14.5+.

---

### 💰 Sprint 2: Aumento de Ticket Médio (AOV) & Aquisição
5. **[V2 - #09] Social Commerce & Catálogo XML para Instagram Shopping / Meta Catalog**
   - **GitHub Issue:** #33 | **RICE Score:** 9.45 | **Prioridade:** `priority: P2-media`
   - **Objetivo:** Feed dinâmico `/api/catalog/meta.xml` para habilitar a 'sacolinha' em posts, reels e stories do Instagram da marca.
6. **[V2 - #04] Motor de Compre Junto & Desconto Progressivo em Kits (Cross-sell / Bundles)**
   - **GitHub Issue:** #27 | **RICE Score:** 8.0 | **Prioridade:** `priority: P1-alta`
   - **Objetivo:** Aumentar o ticket médio (AOV) sugerindo combos com desconto automático na PDP e carrinho (ex: 2 camisetas por R$ 199 ou Camiseta + Boné).
7. **[V2 - #10] Depoimentos e Avaliações de Clientes com Fotos (Social Proof & Reviews)**
   - **GitHub Issue:** #34 | **RICE Score:** 5.6 | **Prioridade:** `priority: P2-media`
   - **Objetivo:** Prova social com estrelas, fotos reais de clientes vestindo as camisetas e aba de moderação no `/admin`.
8. **[V2 - #02] SEO Dinâmico, Sitemap XML & Structured Data (Schema.org)**
   - **GitHub Issue:** #25 | **RICE Score:** 4.8 | **Prioridade:** `priority: P2-media`
   - **Objetivo:** Geração automatizada de `sitemap.xml` e dados estruturados Schema.org para exibição rica no Google (preço e estrelas).

---

### 🎸 Sprint 3: Redução de Trocas, Catálogo Amplo & Imersão Rock
9. **[V2 - #11] Provador Virtual Interativo & Guia Inteligente de Medidas**
   - **GitHub Issue:** #35 | **RICE Score:** 4.8 | **Prioridade:** `priority: P2-media`
   - **Objetivo:** Calculadora interativa (altura, peso e preferência de caimento) recomendando P, M, G, GG ou XGG com base nas medidas da Dimona para zerar trocas.
10. **[V2 - #03] Filtros Avançados na Vitrine & Busca Instantânea**
   - **GitHub Issue:** #26 | **RICE Score:** 2.4 | **Prioridade:** `priority: P2-media`
   - **Objetivo:** Barra de filtros na vitrine para filtrar por tipo de base (Camiseta, Moletom, Boné) e estilo musical.
11. **[V2 - #12] Imersão no Produto / Rock Sound Experience (Microplayer de Riffs na PDP)**
   - **GitHub Issue:** #36 | **RICE Score:** 1.0 | **Prioridade:** `priority: P3-suporte`
   - **Objetivo:** Microplayer sutil opt-in com riffs/samples musicais da estampa carregados via CDN sem impactar a performance.

---

### 🎨 Frentes de UX & Copywriting Transacional (Refinadas pelo PO)
12. **[UX] Criar texto para whatsapp**
   - **GitHub Issue:** #39 | **Prioridade:** `priority: P1-alta` | **Status:** `status:todo`
   - **Entrega do PO:** Matriz completa de 10 gatilhos de WhatsApp (Pix imediato, aprovação Dimona, rastreio, pós-venda, abandono de carrinho 20m/24h), brand persona "Rocker, Prestativo e Sem Frescura", regras anti-ban e critérios de aceite BDD.
13. **[UX] Criar Emails**
   - **GitHub Issue:** #38 | **Prioridade:** `priority: P1-alta` | **Status:** `status:todo`
   - **Entrega do PO:** Design System brutalista dark mode 600px (@react-email), paleta (#050505, #141414, #ff66c4), matriz de 10 e-mails transacionais e de ciclo de vida (Pix, aprovação, rastreio, abandono, boas-vindas, review), subjects de alta abertura e critérios de aceite BDD.


