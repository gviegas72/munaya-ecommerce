# ADR 006: Adoção do Supabase como PostgreSQL Gerenciado & Storage Nativo

* **Status:** Aprovada e Implementada
* **Data:** 2026-10-22
* **Decisores:** Gabriel Viegas (Fundador/Tech Lead), Antigravity AI Architecture Team
* **Contexto:** Camada de Persistência, Catálogo Dinâmico e Storage de Mídia

---

## 1. Contexto & Problema

Com a decisão de migrar para uma arquitetura Headless própria (ADR 001) e descontinuar plataformas monolíticas (Nuvemshop), a Munaya Rocks necessitava de uma base de dados relacional robusta para gerenciar:
1. Catálogo oficial de estampas, preços dinâmicos, cores e tamanhos.
2. Pedidos de clientes, endereços completos, status de pagamento e histórico de despachos.
3. Cupons promocionais com regras de validade temporal e limites de uso.
4. Hospedagem pública de alta performance para fotos de vitrine e arquivos de arte DTG em alta resolução.

Houve a dúvida natural se o Supabase seria adequado para a maturidade do negócio ou se deveríamos provisionar uma instância dedicada de PostgreSQL.

---

## 2. Decisão Arquitetural

Confirmamos a permanência e aprofundamento do **Supabase** como a espinha dorsal de dados da Munaya Rocks pelos seguintes fundamentos técnicos:

1. **O Supabase É um PostgreSQL Puro (PostgreSQL 15/16):**
   * Não se trata de um banco proprietário ou NoSQL. Por baixo do capô, a aplicação consome tabelas relacionais com chaves primárias, integridade referencial, índices B-Tree e dialeto SQL padrão ANSI.
   * A aplicação pode se conectar tanto via `@supabase/supabase-js` quanto via connection string padrão `postgresql://postgres:...@db...supabase.co:5432/postgres` (utilizando Drizzle, Prisma ou conexões diretas de BI/ERP).

2. **Supabase Storage Integrado:**
   * O bucket público `products` do Supabase Storage resolve nativamente o upload direto de fotos e artes feito pelo lojista no `/admin` via rota `/api/upload`, sem necessidade de contratar e configurar buckets AWS S3 adicionais.

3. **Custo Zero de Infraestrutura (Free Tier Generoso):**
   * O plano gratuito do Supabase oferece banco de dados PostgreSQL com até 500 MB de dados estruturados (o equivalente a dezenas de milhares de pedidos e produtos) e 1 GB de storage de imagens com CDN global, suportando com folga o lançamento e a tração inicial da marca sem gerar custos fixos.

4. **Isolamento de Segurança via Row Level Security (RLS) & Service Role:**
   * O frontend consome leituras públicas controladas de catálogo (`products.is_active = true`), enquanto escritas críticas (criação de pedidos, alteração de status e gestão de cupons) são restritas à chave administrativa `SUPABASE_SERVICE_ROLE_KEY` executada exclusivamente no servidor backend serverless da Vercel.

---

## 3. Consequências

* **Zero Débito Técnico:** Não há necessidade de migrar para outro PostgreSQL no curto ou médio prazo, pois já estamos operando sobre a engine mais sólida e recomendada do mercado.
* **Agilidade de Negócio:** Todas as alterações feitas pelo lojista no painel `/admin` refletem instantaneamente no storefront Next.js em tempo real.
