# 📐 Arquitetura C4 da Plataforma Munaya Rocks

Documentação arquitetural baseada no modelo **C4 (Context, Container, Component, Code)** para visualização detalhada da plataforma de e-commerce Munaya Rocks.

---

## Nível 1: Diagrama de Contexto de Sistema (Context Diagram)

O diagrama de contexto detalha como os clientes e o lojista interagem com a plataforma Munaya Rocks e como o sistema se integra aos serviços externos parceiros.

```mermaid
flowchart TD
    classDef person fill:#ff66c4,stroke:#ffffff,stroke-width:2px,color:#000000,font-weight:bold;
    classDef system fill:#111111,stroke:#ff66c4,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef external fill:#222222,stroke:#888888,stroke-width:1px,color:#dddddd;

    C["🎸 Cliente Munaya<br/>(Fã de Rockwear)"]:::person
    A["👑 Equipe / Admin<br/>(Lojista Munaya Rocks)"]:::person

    SYS["🎸 SISTEMA MUNAYA ROCKS<br/>(Next.js 16 + React 19 + Supabase BaaS)"]:::system

    MP["💳 Gateway Mercado Pago<br/>(Checkout Pix Dinâmico)"]:::external
    DIMONA["🏭 Fábrica Camisa Dimona<br/>(API v2 + Webhook Rastreio)"]:::external
    EVOLUTION["💬 Evolution API<br/>(WhatsApp Transacional v1/v2)"]:::external
    RESEND["📧 Resend API<br/>(E-mails com @react-email)"]:::external
    VIACEP["📍 ViaCEP API<br/>(Higienização de Endereço)"]:::external
    SUPABASE["🗄️ Supabase Cloud<br/>(PostgreSQL RLS + Auth + CDN)"]:::external

    C -->|"1. Navega, customiza mockups, compra e acessa /account"| SYS
    A -->|"Gerencia catálogo, blanks, cupons, clientes e auditoria RBAC"| SYS

    SYS -->|"Cria cobrança Pix e valida HMAC-SHA256"| MP
    SYS -->|"Despacha ordem de produção DTG após liquidação"| DIMONA
    DIMONA -->|"Notifica etiqueta e código de rastreio (Webhook)"| SYS
    SYS -->|"Envia Pix Copia & Cola, confirmação e rastreio via WhatsApp"| EVOLUTION
    EVOLUTION -->|"Entrega no WhatsApp do cliente"| C
    SYS -->|"Envia e-mails transacionais responsivos Dark Mode"| RESEND
    RESEND -->|"Entrega no inbox do cliente"| C
    SYS -->|"Consulta CEP para cotação e autofill"| VIACEP
    SYS -->|"Persistência segura, autenticação e storage"| SUPABASE
```

---

## Nível 2: Diagrama de Contêineres (Container Diagram)

Detalha as aplicações, bancos de dados, storages e fronteiras de rede que compõem o ecossistema Munaya Rocks.

```mermaid
flowchart TB
    classDef user fill:#ff66c4,stroke:#ffffff,stroke-width:2px,color:#000000,font-weight:bold;
    classDef app fill:#111111,stroke:#ff66c4,stroke-width:2px,color:#ffffff;
    classDef db fill:#003311,stroke:#00ff66,stroke-width:2px,color:#ffffff;
    classDef ext fill:#222222,stroke:#666666,stroke-width:1px,color:#cccccc;

    CLIENT["Navegador Web / Mobile<br/>(Safari, Chrome, etc.)"]:::user

    subgraph VERCEL["Infraestrutura Vercel (Edge Serverless)"]
        SPA["Storefront Web UI<br/>(Next.js App Router / React 19)"]:::app
        ACCOUNT_UI["Área do Cliente<br/>(/account — Pedidos e Senha)"]:::app
        ADMIN_UI["Painel Administrativo<br/>(/admin — Blanks, Cupons, RBAC e WhatsApp)"]:::app
        API_GATEWAY["Rotas de API Serverless Hardened<br/>(/api/** em Node.js Edge/Serverless)"]:::app
    end

    subgraph SUPABASE["Supabase Cloud"]
        DB[("PostgreSQL DB com RLS<br/>(products, blanks, orders, customers, coupons, audit_logs)")]:::db
        AUTH["Supabase Auth & RBAC<br/>(Sessões seguras & Hash)"]:::db
        STORAGE[("Supabase Storage CDN<br/>(Mockups e Artes HD 300 DPI)")]:::db
    end

    subgraph EXTERNAL_SERVICES["Serviços de Terceiros Conectados"]
        MP_API["API Mercado Pago (Pix)"]:::ext
        DIMONA_API["API Dimona v2 (POD)"]:::ext
        EVOLUTION_API["Evolution API (WhatsApp v1/v2)"]:::ext
        RESEND_API["API Resend (@react-email)"]:::ext
        VIACEP_API["API ViaCEP"]:::ext
    end

    CLIENT -->|"HTTPS / HSTS / SSR & CSR"| SPA
    CLIENT -->|"Autenticação do Consumidor"| ACCOUNT_UI
    CLIENT -->|"Autenticação RBAC timingSafeEqual"| ADMIN_UI

    SPA -->|"Chamadas seguras"| API_GATEWAY
    ACCOUNT_UI -->|"Consulta pedidos e perfil"| API_GATEWAY
    ADMIN_UI -->|"Operações de gestão e auditoria"| API_GATEWAY

    API_GATEWAY -->|"Leitura / Escrita com RLS e Service Role"| DB
    API_GATEWAY -->|"Autenticação e verificação de tokens"| AUTH
    API_GATEWAY -->|"Mockups dinâmicos e artes de estampa"| STORAGE

    API_GATEWAY -->|"Criação de Pix instantâneo"| MP_API
    API_GATEWAY -->|"POST /orders (Fulfillment DTG)"| DIMONA_API
    API_GATEWAY -->|"POST /message/sendText (WhatsApp)"| EVOLUTION_API
    API_GATEWAY -->|"POST /emails (Templates transacionais)"| RESEND_API
    API_GATEWAY -->|"GET /{cep}/json (Autofill postal)"| VIACEP_API

    MP_API -->|"Webhook de Pagamento HMAC-SHA256"| API_GATEWAY
    DIMONA_API -->|"Webhook de Status e Rastreio"| API_GATEWAY
```

---

## Nível 3: Diagrama de Componentes da Aplicação (Component Diagram)

Visão interna dos módulos de software organizados dentro da aplicação Next.js:

```mermaid
flowchart TD
    classDef core fill:#111111,stroke:#ff66c4,stroke-width:2px,color:#ffffff;
    classDef lib fill:#222233,stroke:#66aaff,stroke-width:2px,color:#ffffff;
    classDef notify fill:#064e3b,stroke:#059669,stroke-width:2px,color:#ffffff;
    classDef security fill:#441111,stroke:#ff3333,stroke-width:2px,color:#ffffff;

    subgraph CONTROLLERS["API Route Handlers (src/app/api)"]
        CHK["/api/checkout"]:::core
        SHP["/api/shipping"]:::core
        ORD["/api/orders"]:::core
        PRD["/api/products"]:::core
        CPN["/api/coupons"]:::core
        PRC["/api/pricing"]:::core
        CST["/api/customers"]:::core
        WA_CFG["/api/whatsapp/config"]:::core
        WMP["/api/webhooks/mercadopago"]:::core
        WDM["/api/webhooks/dimona"]:::core
    end

    subgraph LOGIC["Módulos de Domínio & Negócio (src/lib)"]
        LIB_DIM["dimona.ts & dimona-mapping.ts<br/>(SKUs de Blanks & Fulfillment)"]:::lib
        LIB_PRC["pricing.ts<br/>(Motor de Markup & Margens)"]:::lib
        LIB_CPN["coupons.ts<br/>(Motor de Descontos & Validade)"]:::lib
        LIB_DB["supabase.ts<br/>(Data Access Layer & Schemas)"]:::lib
    end

    subgraph NOTIFICATION["Disparadores de Mensageria Multicanal"]
        LIB_WA["whatsapp.ts<br/>(Evolution API v1/v2 + Fallback wa.me)"]:::notify
        LIB_EML["email.ts<br/>(Templates @react-email via Resend)"]:::notify
    end

    subgraph SECURITY_LAYER["Camada de Segurança & AppSec"]
        SEC_AUTH["admin-auth.ts & audit.ts<br/>(timingSafeEqual & Log RBAC)"]:::security
        SEC_HMAC["mp-webhook-auth.ts<br/>(HMAC SHA-256 Signature)"]:::security
        SEC_RATE["rate-limit.ts<br/>(Anti-Brute Force Protection)"]:::security
        SEC_SAN["sanitize.ts<br/>(Anti-XSS & String Sanitizer)"]:::security
    end

    CHK --> SEC_RATE
    CHK --> SEC_SAN
    CHK --> LIB_PRC
    CHK --> LIB_CPN
    CHK --> LIB_DB
    CHK --> LIB_WA
    CHK --> LIB_EML

    SHP --> SEC_RATE
    SHP --> LIB_DIM

    WMP --> SEC_HMAC
    WMP --> LIB_DB
    WMP --> LIB_DIM
    WMP --> LIB_WA
    WMP --> LIB_EML

    WDM --> LIB_DB
    WDM --> LIB_WA
    WDM --> LIB_EML

    ORD --> SEC_AUTH
    ORD --> LIB_DB

    PRD --> SEC_AUTH
    PRD --> LIB_DB

    CPN --> SEC_AUTH
    CPN --> LIB_CPN

    PRC --> SEC_AUTH
    PRC --> LIB_PRC

    WA_CFG --> SEC_AUTH
```

---

## Nível 4: Diagrama de Sequência de Compra, Produção e Notificação

Fluxo ponta a ponta desde o clique de compra até a entrega do código de rastreamento pelos dois canais:

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as 🎸 Cliente
    participant App as 🖥️ Storefront (Next.js)
    participant API as ⚡ /api/checkout
    participant MP as 💳 Mercado Pago
    participant DB as 🗄️ Supabase
    participant WA as 💬 WhatsApp (Evolution API)
    participant Resend as 📧 Resend Email (@react-email)
    participant Dimona as 🏭 Dimona API v2

    Cliente->>App: Clica em 'Finalizar Compra' (Pix)
    App->>API: Envia payload (Itens, Endereço, Cupom)
    Note over API: Recalcula preços no DB,<br/>valida cupom e cota frete Dimona/ViaCEP
    API->>MP: Cria pagamento Pix instantâneo
    MP-->>API: Retorna QR Code e Pix Copia & Cola
    API->>DB: Salva pedido com status 'pendente'
    API->>WA: Dispara mensagem com Pix Copia & Cola
    API->>Resend: Dispara OrderCreatedEmail com instrução Pix
    API-->>App: Exibe QR Code na tela com polling ativo

    Cliente->>MP: Realiza o pagamento no app do banco
    MP->>API: Notifica via Webhook (/api/webhooks/mercadopago)
    Note over API: Valida assinatura HMAC SHA-256 e liquidação
    API->>DB: Atualiza pedido para 'pago'
    API->>WA: Dispara comprovante de pagamento confirmado
    API->>Resend: Dispara PaymentConfirmedEmail
    API->>Dimona: POST /orders (Envia ordem com Blank oficial e Arte 300 DPI)
    Dimona-->>API: Confirma recepção do pedido na fábrica

    Note over Dimona: Camiseta entra na esteira de corte,<br/>estampa digital DTG e empacotamento
    Dimona->>API: Webhook (/api/webhooks/dimona) com tracking_code
    API->>DB: Atualiza pedido com código e status 'enviado'
    API->>WA: Dispara notificação com link de rastreio Correios/Jadlog
    API->>Resend: Dispara OrderShippedEmail com link de rastreio
    WA-->>Cliente: Entrega no celular do cliente
    Resend-->>Cliente: Entrega no inbox do cliente
```
