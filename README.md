# 🎸 TESTE DE N8N

E-commerce moderno, ultrarrápido e seguro desenvolvido para a **Munaya Rocks**, com arquitetura 100% headless, pagamentos nativos via **Mercado Pago (Pix & Cartão)**, catálogo em nuvem via **Supabase** e integração direta de fábrica print-on-demand com a **Dimona**.

---

## ⚡ Stack Tecnológica

| Camada | Tecnologia | Função |
| :--- | :--- | :--- |
| **Frontend / App** | Next.js 16 (App Router & Turbopack) + React 19 | Interface SSR/SSG otimizada com UX brutalista |
| **Estilização** | Tailwind CSS v4 + Framer Motion | Identidade visual dark mode pura com Pink Punk `#ff66c4` |
| **Banco de Dados** | Supabase (PostgreSQL) | Armazenamento de catálogo, estoque, pedidos e auditoria |
| **Pagamentos** | Mercado Pago SDK v2 | Pix Copia & Cola instantâneo com conciliação via Webhook seguro |
| **Fulfillment / Produção** | API Camisa Dimona v2 | Despacho automático de confecção e fretes (PAC, SEDEX, Jadlog) |
| **Infraestrutura** | Vercel Serverless | Hospedagem global edge de alta disponibilidade |

---

## 🔒 Certificação de Segurança (Score 9.8 / 10 — Enterprise Grade)

A aplicação foi submetida a auditorias completas de AppSec e conta com os seguintes mecanismos ativos:

1. **Recálculo Server-Side de Preço & Frete (`/api/checkout`)**: Preços de produtos e taxas de envio são validados e recalculados diretamente contra o Supabase e a API de frete dos Correios/transportadoras, impossibilitando adulteração de valores no front-end.
2. **Webhook Cryptographic Signature (`/api/webhooks/mercadopago`)**: Validação de integridade HMAC SHA-256 com `crypto.timingSafeEqual` para prevenir falsificação de notificações e Timing Attacks.
3. **Bloqueio de Despacho Não Pago**: O envio de ordens de produção para a esteira da Dimona ocorre exclusivamente via Webhook autenticado pós-liquidação financeira.
4. **Proteção Administrativa e RLS**:
   - Rotas `/api/orders` e `/api/products` (PATCH) protegidas por header `x-admin-pin` verificado no servidor com tempo constante.
   - Políticas RLS no Supabase ativas, garantindo leitura pública de catálogo e isolamento estrito de dados sensíveis de clientes.
5. **Rate Limiting & Anti-DDoS**: Limitador de requisições por IP nas rotas de checkout e cálculo de frete para prevenção de brute-force e exaustão de recursos.
6. **Higienização Anti-XSS**: Sanitização estrita de strings e payloads contra injeção de scripts maliciosos.
7. **Cabeçalhos de Segurança HTTP**: HSTS (`Strict-Transport-Security`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` e `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 📂 Agrupamento de Estampas & Coleções

O catálogo da Munaya Rocks está organizado em 6 agrupamentos canônicos, gerenciáveis diretamente pelo painel `/admin`:

* **Bonzo Series**: Série lendária em homenagem a John Bonham (*Munaya Bonzo*, *Amplificador*).
* **Dimebag & Heavy**: Riffs cortantes e timbres pesados (*Dimebag*, *Cathedral*).
* **Ghost Division**: A atmosfera ritualística do rock contemporâneo (*Ghost*, *Lionheart*).
* **Stoner & Sludge**: Fuzz valvulado e afinações baixas (*Clutch*, *Spiritual Beggars*, *Monster Magnet*, *C.O.C.*).
* **Grunge & Roots**: Seattle sound e atitude anos 90 (*Soundgarden*, *Chico Science*, *3R Árvore*).
* **Rock Classics**: Ícones atemporais do rock mundial (*Rolling Stones*, *Suicidal Tendencies*).

No painel `/admin`, o administrador pode:
* Filtrar produtos com 1 clique por agrupamento.
* Alterar o agrupamento de qualquer estampa através do dropdown de coleção.
* Ajustar preços unitários (com suporte a vírgula ou ponto decimal).
* Alternar visibilidade na loja (Ativo/Pausado) e marcar como Destaque na Home.

---

## 🛒 Persistência de Rascunho no Checkout

Para maximizar a conversão de vendas, o formulário de checkout conta com persistência em tempo real:
* Os dados do cliente (Nome, E-mail, CPF, Telefone, CEP, Endereço, Número) e as opções de frete cotadas são salvos no `localStorage`.
* Caso o cliente saia do checkout para navegar na Home, Estampas ou Sobre, ao retornar para a sacola todos os dados permanecem preenchidos.
* O rascunho é limpo automaticamente apenas quando o pedido é finalizado com sucesso.

---

## 🛠️ Configuração de Variáveis de Ambiente

Para rodar localmente ou na Vercel, certifique-se de configurar as seguintes variáveis no `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://jaxxkyvsgasgaccbejln.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=seu_webhook_secret_aqui

# Camisa Dimona / Dropsimples
DIMONA_API_KEY=sua_chave_dimona_aqui

# Painel Administrativo
ADMIN_PIN=munaya2026
```

---

## 🚀 Como Executar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Compilar build de produção e verificar tipos
npm run build
```

---

## 📖 Documentação Adicional

* [Diagrama de Arquitetura C4 (PDF)](docs/arquitetura-c4-munaya.pdf)
* [Relatório de Integração com Fornecedores](docs/fornecedores.md)
* [Diretrizes de Design & Guidelines Claude](CLAUDE.md)
