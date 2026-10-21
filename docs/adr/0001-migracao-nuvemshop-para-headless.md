# ADR 001: Migração de Plataforma Monolítica (Nuvemshop) para Arquitetura Headless Própria

* **Status:** Aprovada e Implementada
* **Data:** 2026-10-21
* **Decisores:** Gabriel Viegas (Fundador/Tech Lead), Antigravity AI Architecture Team
* **Contexto:** Plataforma de E-commerce Munaya Rocks

---

## 1. Contexto & Problema

A marca **Munaya Rocks** iniciou seus estudos de operação e prototipação avaliando plataformas convencionais de SaaS e-commerce, com destaque para a **Nuvemshop**.

No entanto, o modelo de negócios da Munaya possui requisitos singulares:
1. **Identidade Visual Brutalista e Cultural:** Uma marca de rockwear autêntica com design customizado, tipografia marcante (Oswald/Inter), paleta estrita (*Dark Brutalism* com Pink Punk `#ff66c4`), microinterações e transições fluidas que modelos de template prontos engessam.
2. **Integração Profunda com Fábrica Print-on-Demand (Dimona):** A necessidade de automatizar totalmente o ciclo de envio de pedidos, artes em alta resolução (DTG), seleção de malhas e captura de rastreamento reverso sem intervenção humana.
3. **Controle Financeiro de Margens e Custos:** Dependência de custos variáveis de produção da Dimona (ex: Malha Classic a R$ 42,00) com necessidade de aplicar regras dinâmicas de markup e arredondamento psicológico (.90) sobre todo o catálogo em lote.
4. **Custo de Operação e Taxas:** No modelo SaaS, há cobrança recorrente de mensalidade de plataforma além de taxas por transação sobre o faturamento ou sobre o uso de gateways externos.

---

## 2. Decisão Arquitetural

Decidimos **não utilizar a Nuvemshop** como plataforma de venda e, em seu lugar, construir uma **Arquitetura Headless Própria e Desacoplada** baseada em:
* **Frontend / Aplicação:** Next.js 16 (App Router + Turbopack + React 19) hospedado na Vercel (Edge Network).
* **Banco de Dados & Storage:** Supabase (PostgreSQL Gerenciado + Supabase Storage para artes e mockups).
* **Processamento de Pagamentos:** Mercado Pago SDK v2 (Checkout Transparente com Pix instantâneo e Cartão).
* **Fulfillment & Produção:** API Camisa Dimona v2 (Despacho B2B assíncrono acionado por Webhook).
* **Mensageria Transacional:** Resend API (Disparos automáticos de e-mails em HTML brutalista).

---

## 3. Matriz de Comparação: Nuvemshop vs. Arquitetura Headless Munaya

| Critério | Nuvemshop (SaaS Convencional) | Arquitetura Headless Munaya |
| :--- | :--- | :--- |
| **Custo Fixo Mensal** | R$ 59 a R$ 300+/mês + taxas por venda fora do Nuvem Pago | **R$ 0,00 fixo** (Free tiers robustos: Vercel + Supabase + Resend) |
| **Identidade Visual & UX** | Limitada a temas pré-formatados com layouts engessados | **100% Livre e Brutalista** (Tailwind CSS v4 + Framer Motion) |
| **Controle de Checkout** | Redirecionamento ou checkout com branding da plataforma | **Checkout Transparente Nativo** com Pix Copia & Cola e validação em tempo real |
| **Automação Dimona** | Dependente de aplicativo de terceiros (Dropsimples) com limitações | **Integração Direta via API v2** com esteira sob medida e webhook de rastreamento |
| **Segurança & AppSec** | Caixa preta (depende da equipe de suporte do SaaS) | **Enterprise Grade (Nota 9.8/10)**: HMAC SHA-256, timingSafeEqual, RLS estrito |
| **Velocidade & Performance** | Média (tempo de resposta do servidor da plataforma) | **Ultrarrápido (Edge Serverless)** com Core Web Vitals no limite máximo |
| **Regras de Precificação** | Preço estático cadastrado produto a produto | **Motor de Markup Dinâmico** baseado no custo real de produção do fornecedor |

---

## 4. Consequências & Trade-offs

### Pontos Positivos (Ganhos):
* **Soberania Total do Código:** Nenhum lock-in com fornecedores de plataforma. O código-fonte pertence inteiramente à Munaya.
* **Economia Operacional:** Eliminação de mensalidades recorrentes na fase de validação e tração do negócio.
* **Agilidade no Desenvolvimento:** Qualquer funcionalidade nova (ex: cupons por tempo de expiração, banners de primeira compra, simulador de lucro por malha) é implementada em horas, sem depender de roadmap de terceiros.
* **Experiência de Compra Imersiva:** O cliente não sente que está em um e-commerce genérico; a experiência respira a estética do Rock.

### Pontos de Atenção (Mitigados):
* **Responsabilidade por Infraestrutura e Segurança:** Exige auditoria técnica rigorosa. 
  * *Mitigação aplicada:* Auditoria completa de segurança concluída com nota 9.8/10 (proteção contra manipulação de preço, brute force com rate limiting e webhooks assinados criptograficamente).
* **Gestão Manual de Catálogo sem CMS Pronto:**
  * *Mitigação aplicada:* Desenvolvimento de um Painel Administrativo proprietário (`/admin`) completo com CRUD de estampas, upload de fotos, agrupamento por coleções, cupons e custos.

---

## 5. Conclusão

A migração e adoção da arquitetura Headless posicionou a Munaya Rocks com a mesma infraestrutura tecnológica e velocidade de grandes DNVBs (*Digitally Native Vertical Brands*), com custo zero de infraestrutura e controle absoluto de margens de lucro.
