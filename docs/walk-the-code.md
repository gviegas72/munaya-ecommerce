# 🧭 Roteiro Preparatório: Walk the Code — Munaya Rocks

Guia detalhado para a sessão de **Walk the Code** do projeto **Munaya Rocks**, com o mapa dos diretórios, responsabilidade de cada arquivo e pontos-chave de atenção para leitura e comentários.

---

## 🗺️ Mapa de Diretórios e Navegação

```text
munaya_project/
├── docs/                      # Documentação de Arquitetura, ADRs e Fornecedores
│   ├── adr/                   # Architecture Decision Records (ADR 001 a ADR 005)
│   ├── arquitetura-c4-munaya.md # Diagramas C4 em Mermaid (Contexto, Contêiner, Componentes, Sequência)
│   └── fornecedores.md        # Dimona, Resend, Mercado Pago, etc.
│
├── src/
│   ├── app/                   # App Router (Rotas de UI e API Serverless)
│   │   ├── admin/             # Painel Administrativo (/admin) + Error Boundary
│   │   ├── api/               # Endpoints REST Serverless
│   │   │   ├── checkout/      # Recálculo server-side e criação de cobrança MP
│   │   │   ├── coupons/       # CRUD de cupons e validação
│   │   │   ├── orders/        # Gestão de pedidos e reconciliação
│   │   │   ├── pricing/       # Motor de markup, simulações e atualização em lote
│   │   │   ├── products/      # CRUD de estampas e coleções
│   │   │   ├── shipping/      # Cotação de fretes
│   │   │   ├── upload/        # Upload de mockups e artes para o Supabase Storage
│   │   │   └── webhooks/      # Webhooks de liquidação (MP) e rastreamento (Dimona)
│   │   ├── categoria/         # Filtros por coleções
│   │   ├── produto/[id]/      # PDP - Página de Detalhe de Produto com seleção de cor/tamanho
│   │   ├── layout.tsx         # Layout raiz com PromoBanner, CartDrawer e ThemeProvider
│   │   └── page.tsx           # Home com vitrine brutalista e coleções
│   │
│   ├── components/            # Componentes React reutilizáveis
│   │   ├── Navbar.tsx         # Cabeçalho brutalista com logo redondo SVG e sacola
│   │   ├── CartDrawer.tsx     # Gaveta lateral de carrinho com cálculo de frete e cupom
│   │   ├── PromoBanner.tsx    # Banner de primeiro visitante com cupom PRIMEIRACOMPRA
│   │   └── ThemeProvider.tsx  # Suporte a tema Dark brutalista
│   │
│   ├── context/               # Contextos de estado global
│   │   └── CartContext.tsx    # Gerenciamento de itens, sacola, persistência e cupons
│   │
│   └── lib/                   # Camada de Domínio, Negócio e Segurança
│       ├── admin-auth.ts      # Validação de credencial com crypto.timingSafeEqual
│       ├── coupons.ts         # Motor de cupons com regras de validade e cache
│       ├── email.ts           # Templates HTML e integração com a API do Resend
│       ├── mp-webhook-auth.ts # Verificação criptográfica HMAC SHA-256 do Mercado Pago
│       ├── pricing.ts         # Motor de precificação dinâmica, markup e arredondamento
│       ├── rate-limit.ts      # Proteção contra DoS e brute-force
│       ├── sanitize.ts        # Sanitização de entradas anti-XSS
│       ├── supabase.ts        # Conexão resiliente ao PostgreSQL e schemas de dados
│       └── variants.ts        # Geração dinâmica do SKU canônico [MUNAYA]-[NOME]-[COR]-[TAM]
```

---

## 🔍 Paradas Principais do "Walk the Code"

Durante a nossa sessão guiada, passaremos pelos 5 pilares fundamentais:

### 1. O Ciclo do Pedido & Prevenção de Fraudes (`src/app/api/checkout/route.ts`)
* **O que ver:** Como o backend ignora os preços enviados pelo navegador e busca o valor canônico no banco de dados.
* **O que ver:** A validação do cupom e o cálculo do total exato enviado para o Mercado Pago.

### 2. A Liquidação e Despacho Fabril (`src/app/api/webhooks/mercadopago/route.ts` e `/dimona/route.ts`)
* **O que ver:** Como a assinatura do Mercado Pago é verificada antes de qualquer ação.
* **O que ver:** A esteira que liga o pagamento aprovado diretamente à ordem de produção na Dimona.
* **O que ver:** O retorno da Dimona entregando o rastreamento e o e-mail disparado pelo Resend.

### 3. A Estratégia de SKUs e Variantes (`src/lib/variants.ts`)
* **O que ver:** A lógica pura que sintetiza `MUNAYA-DIMEBAG-PRETA-PP` em tempo de execução quando o cliente interage com a vitrine.
* **O que ver:** A restrição das cores às três oficiais (Preta, Branca e Cinza) e a grade completa de tamanhos.

### 4. O Motor de Markup & Margens (`src/lib/pricing.ts` e `src/app/admin/page.tsx`)
* **O que ver:** Como a taxa do gateway (~4.5%) e o custo de confecção da Dimona geram o preço sugerido com final `.90`.
* **O que ver:** A rotina que atualiza o catálogo inteiro no Supabase com um clique.

### 5. O Painel de Controle Brutalista (`src/app/admin/page.tsx`)
* **O que ver:** O isolamento das 4 abas (Pedidos, Catálogo, Cupons e Custos).
* **O que ver:** Os modais de edição completa e upload direto de imagens para a nuvem.
