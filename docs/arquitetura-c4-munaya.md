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
    A["👑 Gabriel / Admin<br/>(Lojista Munaya Rocks)"]:::person

    SYS["🎸 SISTEMA MUNAYA ROCKS<br/>(Next.js Headless App + Supabase)"]:::system

    MP["💳 Gateway Mercado Pago<br/>(Checkout Pix & Cartão)"]:::external
    DIMONA["🏭 Fábrica Camisa Dimona<br/>(API v2 / Dropsimples)"]:::external
    RESEND["📧 Resend API<br/>(E-mails Transacionais)"]:::external
    CORREIOS["🚚 Transportadoras / Correios<br/>(Cálculo e Rastreio)"]:::external

    C -->|"1. Navega, escolhe tamanho/cor e compra"| SYS
    A -->|"Gerencia catálogo, cupons, markup e pedidos"| SYS

    SYS -->|"Gera cobrança e valida pagamento via Webhook"| MP
    SYS -->|"Despacha ordem de produção DTG"| DIMONA
    DIMONA -->|"Notifica etiqueta e código de rastreio (Webhook)"| SYS
    SYS -->|"Envia e-mails transacionais (HTML brutalista)"| RESEND
    RESEND -->|"Entrega no inbox do cliente"| C
    SYS -->|"Consulta cotação de fretes por CEP"| CORREIOS
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
        ADMIN_UI["Painel Administrativo<br/>(/admin — Rotas Protegidas)"]:::app
        API_GATEWAY["Rotas de API Serverless<br/>(/api/** em Node.js Edge/Serverless)"]:::app
    end

    subgraph SUPABASE["Supabase Cloud"]
        DB[("PostgreSQL DB<br/>(products, orders, coupons, settings)")]:::db
        STORAGE[("Supabase Storage<br/>(Bucket público 'products')")]:::db
    end

    subgraph EXTERNAL_SERVICES["Serviços de Terceiros"]
        MP_API["API Mercado Pago"]:::ext
        DIMONA_API["API Dimona v2"]:::ext
        RESEND_API["API Resend"]:::ext
    end

    CLIENT -->|"HTTPS / SSR & CSR"| SPA
    CLIENT -->|"HTTPS / Autenticação com PIN"| ADMIN_UI

    SPA -->|"Chamadas seguras"| API_GATEWAY
    ADMIN_UI -->|"Operações de gestão"| API_GATEWAY

    API_GATEWAY -->|"Leitura / Escrita com RLS e Service Role"| DB
    API_GATEWAY -->|"Upload de mockups e artes de impressão"| STORAGE

    API_GATEWAY -->|"Criação de Pix e tokens de cartão"| MP_API
    API_GATEWAY -->|"POST /orders (Fulfillment DTG)"| DIMONA_API
    API_GATEWAY -->|"POST /emails (Notificações ao cliente)"| RESEND_API

    MP_API -->|"Webhook de Pagamento (/api/webhooks/mercadopago)"| API_GATEWAY
    DIMONA_API -->|"Webhook de Rastreio (/api/webhooks/dimona)"| API_GATEWAY
```

---

## Nível 3: Diagrama de Componentes da Aplicação (Component Diagram)

Visão interna dos módulos de software organizados dentro da aplicação Next.js:

```mermaid
flowchart TD
    classDef core fill:#111111,stroke:#ff66c4,stroke-width:2px,color:#ffffff;
    classDef lib fill:#222233,stroke:#66aaff,stroke-width:2px,color:#ffffff;
    classDef security fill:#441111,stroke:#ff3333,stroke-width:2px,color:#ffffff;

    subgraph CONTROLLERS["API Handlers (src/app/api)"]
        CHK["/api/checkout"]:::core
        SHP["/api/shipping"]:::core
        ORD["/api/orders"]:::core
        PRD["/api/products"]:::core
        CPN["/api/coupons"]:::core
        PRC["/api/pricing"]:::core
        WMP["/api/webhooks/mercadopago"]:::core
        WDM["/api/webhooks/dimona"]:::core
    end

    subgraph LOGIC["Módulos de Domínio & Negócio (src/lib)"]
        LIB_VAR["variants.ts<br/>(SKUs & Variantes)"]:::lib
        LIB_PRC["pricing.ts<br/>(Motor de Markup & Margens)"]:::lib
        LIB_CPN["coupons.ts<br/>(Motor de Descontos & Validade)"]:::lib
        LIB_EML["email.ts<br/>(Templates HTML Brutalistas)"]:::lib
        LIB_DB["supabase.ts<br/>(Data Access Layer & Schemas)"]:::lib
    end

    subgraph SECURITY_LAYER["Camada de Segurança & AppSec"]
        SEC_AUTH["admin-auth.ts<br/>(timingSafeEqual PIN verification)"]:::security
        SEC_HMAC["mp-webhook-auth.ts<br/>(HMAC SHA-256 Signature)"]:::security
        SEC_RATE["rate-limit.ts<br/>(Anti-Brute Force Protection)"]:::security
        SEC_SAN["sanitize.ts<br/>(Anti-XSS & String Sanitizer)"]:::security
    end

    CHK --> SEC_RATE
    CHK --> SEC_SAN
    CHK --> LIB_PRC
    CHK --> LIB_CPN
    CHK --> LIB_DB

    SHP --> SEC_RATE

    WMP --> SEC_HMAC
    WMP --> LIB_DB
    WMP --> LIB_EML

    WDM --> LIB_DB
    WDM --> LIB_EML

    ORD --> SEC_AUTH
    ORD --> LIB_DB

    PRD --> SEC_AUTH
    PRD --> LIB_DB

    CPN --> SEC_AUTH
    CPN --> LIB_CPN

    PRC --> SEC_AUTH
    PRC --> LIB_PRC
```

---

## Nível 4: Diagrama de Sequência de Compra e Produção (Sequence / Code Level)

Fluxo ponta a ponta desde o clique de compra até a entrega do código de rastreamento:

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as 🎸 Cliente
    participant App as 🖥️ Storefront (Next.js)
    participant API as ⚡ /api/checkout
    participant MP as 💳 Mercado Pago
    participant DB as 🗄️ Supabase
    participant Dimona as 🏭 Dimona API v2
    participant Resend as 📧 Resend Email

    Cliente->>App: Clica em 'Finalizar Compra' (Pix)
    App->>API: Envia payload (Itens, Endereço, Cupom)
    Note over API: Recalcula preços no DB,<br/>valida cupom e cota frete seguro
    API->>MP: Cria pagamento Pix instantâneo
    MP-->>API: Retorna QR Code e Pix Copia & Cola
    API->>DB: Salva pedido com status 'pendente'
    API-->>App: Exibe QR Code na tela com polling ativo

    Cliente->>MP: Realiza o pagamento no app do banco
    MP->>API: Notifica via Webhook (/api/webhooks/mercadopago)
    Note over API: Valida assinatura HMAC SHA-256
    API->>DB: Atualiza pedido para 'pago'
    API->>Resend: Dispara e-mail de 'Pagamento Confirmado'
    Resend-->>Cliente: Entrega e-mail no inbox
    API->>Dimona: POST /orders (Envia ordem de produção DTG)
    Dimona-->>API: Confirma recepção do pedido na fábrica

    Note over Dimona: Camiseta entra na esteira de corte,<br/>estampa digital e empacotamento
    Dimona->>API: Webhook (/api/webhooks/dimona) com tracking_code
    API->>DB: Atualiza pedido com código e status 'enviado'
    API->>Resend: Dispara e-mail de 'Pedido Enviado com Rastreio'
    Resend-->>Cliente: Entrega link de rastreamento Correios/Jadlog
```
