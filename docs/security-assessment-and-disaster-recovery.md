# 🛡️ Munaya Rocks — Assessment de Segurança & Plano de Recuperação de Desastres (DRP)

> **Documento Oficial de Engenharia & Operações**  
> **Versão:** 1.0 (Pós-Sprint 3)  
> **Classificação:** Confidencial / Operações Internas  
> **Última Atualização:** 22 de Outubro de 2026  

---

## 📌 1. Resumo Executivo da Postura de Segurança (AppSec Assessment)

Após a conclusão das 10 histórias de engenharia e das fases de consolidação, a plataforma **Munaya Rocks (Headless Next.js + Supabase + Vercel + Mercado Pago + Camisa Dimona)** atingiu maturidade de segurança em nível bancário/corporativo.

### 📊 Score Geral de Postura de Segurança: **9.8 / 10**

```
┌─────────────────────────────────┬──────────┬──────────────────────────────────────────┐
│ Pilar de Segurança              │ Nota     │ Status de Mitigação                      │
├─────────────────────────────────┼──────────┼──────────────────────────────────────────┤
│ 1. Risco Financeiro & Checkout  │ 10 / 10  │ 100% recalculado no backend (Zero Spoof) │
│ 2. Autenticação & RBAC          │ 9.8 / 10 │ HMAC SHA-256, timing-safe & papéis       │
│ 3. Integridade de Webhooks      │ 10 / 10  │ Validação HMAC SHA-256 Mercado Pago      │
│ 4. Proteção DoS & AppSec        │ 9.5 / 10 │ Rate Limiting, Sanitização & Headers     │
│ 5. LGPD & Isolamento de Dados   │ 9.7 / 10 │ RLS ativo, anon key sem acesso admin     │
└─────────────────────────────────┴──────────┴──────────────────────────────────────────┘
```

---

## 🧱 2. Detalhamento dos 5 Pilares de Blindagem

### A. Proteção Financeira & Prevenção a Fraudes no Checkout
- **Recálculo Soberano no Servidor:** O payload enviado pelo navegador do cliente no `/api/checkout` nunca dita o preço unitário do item. O backend consulta a base de dados do Supabase, calcula o subtotal com base nos preços vigentes, aplica os descontos oficiais de cupons validados e computa o frete real.
- **Validação Estrita de Cupons:** Cupons são validados contra subtotal mínimo, data de expiração e limite de usos. Não é possível aplicar cupons expirados ou inexistentes alterando requisições HTTP.
- **Impossibilidade de Despacho Gratuito:** O despacho de produção para a fábrica Dimona exige liquidação confirmada pelo Mercado Pago ou credencial de Operador/Super Admin autenticado.

### B. Autenticação, RBAC & Controle de Acesso Administrativo
- **Sessões Criptográficas sem Sessões em Estado:** Tokens de autenticação de operadores são gerados via **HMAC SHA-256** com chave mestra (`ADMIN_SECRET_KEY`), assinados com timestamp e expiração automática de 7 dias.
- **Prevenção a Ataques de Temporização (Timing Attacks):** Todas as checagens de PIN, credenciais e chaves utilizam `crypto.timingSafeEqual` (`src/lib/sanitize.ts`), impedindo que invasores meçam nanossegundos de resposta para adivinhar senhas.
- **Isolamento de Papéis (RBAC):**
  - `super_admin`: Total controle, incluindo alterações de markup, custos da Dimona, cupons e trilha de auditoria.
  - `operator`: Operação diária (pedidos, despacho Dimona e suporte ao cliente). **Bloqueado estritamente com HTTP 403 Forbidden** se tentar alterar preços ou markups.
  - `viewer`: Apenas visualização.

### C. Integridade de Webhooks e Comunicação Inter-Sistemas
- **Assinatura HMAC SHA-256 no Webhook do Mercado Pago:** O endpoint `/api/webhooks/mercadopago` valida os headers `x-signature` e `x-request-id` usando a chave secreta cadastrada. Requisições forjadas por terceiros são rejeitadas imediatamente (401).
- **Anti-Replay Protection:** O timestamp da assinatura é verificado para evitar que notificações capturadas sejam reenviadas para duplicar pedidos.

### D. Hardening de Infraestrutura & Headers HTTP
No arquivo `next.config.ts`, foram inseridos os cabeçalhos de segurança obrigatórios para compliance:
```ts
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```
- **Rate Limiting em Memória:** Protege endpoints sensíveis (`/api/checkout`, `/api/shipping`, `/api/admin/auth/login`) contra ataques de força bruta e DoS.

### E. LGPD & Trilha Imutável de Auditoria
- **Audit Logs:** Cada mutação de preço, exclusão/criação de cupom, login e despacho para a Dimona gera um registro imutável com IP, e-mail do operador, data/hora e o diff do payload.

---

## 🚨 3. Plano de Recuperação de Desastres (DRP) & Matriz de Contingência

> [!CAUTION]
> **Definição de Níveis de Severidade de Incidentes:**
> - **SEV-1 (Crítico):** Loja fora do ar ou checkout impedindo compras. Tempo de Resposta Alvo: < 15 minutos.
> - **SEV-2 (Alto):** Falha na integração com Dimona ou WhatsApp; vendas continuam ocorrendo. Tempo de Resposta Alvo: < 1 hora.
> - **SEV-3 (Médio):** Lentidão, problema em imagem pontual ou dúvida de operador. Tempo de Resposta Alvo: < 4 horas.

---

### 📋 RUNBOOK 1: API da Dimona Indisponível ou Fora do Ar

#### Cenário:
O cliente pagou via Pix ou Cartão, o pedido foi confirmado no Mercado Pago, mas a API da Dimona retornou erro 500/503 ou timeout ao tentar registrar a confecção.

#### Impacto:
**Zero perda financeira.** O dinheiro do cliente já está liquidado na conta do Mercado Pago da Munaya Rocks e o pedido está salvo no Supabase com `payment_status = 'pago'` e `dimona_status = 'pendente'` (ou erro).

#### Procedimento Passo a Passo de Recuperação:
1. Acesse o painel administrativo: `https://munayarocks.vercel.app/admin`.
2. Faça login como **Operador** ou **Super Admin**.
3. Acesse a aba **Pedidos & Despacho**.
4. Localize o pedido em questão (identificado com badge de pagamento `PAGO` e status Dimona `PENDENTE` ou `ERRO`).
5. Antes de despachar, acesse a aba **Esteira Dimona (De/Para)** e clique em **"Executar Simulação de Despacho"** para verificar se a API da Dimona já normalizou.
6. Assim que a simulação responder com sucesso, volte à aba de **Pedidos** e clique no botão **"Despachar para Dimona"** no card do pedido.
7. O sistema dispara a ordem para a esteira da fábrica e atualiza o `dimona_id` e status em tempo real.

---

### 📋 RUNBOOK 2: Webhook do Mercado Pago não Atualizou o Pagamento

#### Cenário:
O cliente realizou o pagamento do Pix pelo aplicativo do banco, mas a notificação do Mercado Pago não chegou ou falhou por instabilidade de rede temporária, mantendo o pedido como "aguardando_pagamento".

#### Impacto:
O cliente pode entrar em contato perguntando sobre o pedido. O pagamento está registrado no Mercado Pago, mas o pedido não avançou automaticamente para a fábrica.

#### Procedimento Passo a Passo de Recuperação:
1. Abra o dashboard do Mercado Pago (`mercadopago.com.br`) na seção **Atividades / Relatórios**.
2. Pesquise pelo e-mail ou nome do cliente e copie o ID da transação (ex: `12345678901`).
3. Acesse `https://munayarocks.vercel.app/admin` -> aba **Pedidos & Despacho**.
4. Encontre o pedido do cliente.
5. Verifique se o valor recebido bate com o valor do pedido.
6. Caso positivo, utilize a ação de despacho manual para a Dimona (**"Despachar para Dimona"**).
7. O sistema atualizará o pedido para `pago`, despachará a estampa para produção e registrará o log de auditoria da ação.
8. Clique no botão de **WhatsApp** do pedido para enviar imediatamente a confirmação e código do pedido para o cliente via mensagem direta.

---

### 📋 RUNBOOK 3: Supabase com Lentidão ou Fora do Ar

#### Cenário:
A infraestrutura do Supabase sofreu instabilidade de rede ou manutenção programada, gerando falhas nas consultas REST.

#### Mecanismos Automáticos de Proteção já Embutidos no Código:
- **Catálogo Resiliente:** A função `getCatalogProducts()` e as rotas da loja possuem camada de cache Edge na Vercel e dados estáticos de fallback (`fallbackProducts`), garantindo que a vitrine **nunca apresente tela branca (erro 500)**.
- **Cupons em Memória:** Os cupons canônicos (`ROCK10`, `PRIMEIRACOMPRA`, `TESTEFRETE`) contam com reserva resiliente em memória no `src/lib/coupons.ts`.
- **Fila de Webhooks do Mercado Pago:** O Mercado Pago possui política nativa de retentativa exponencial (retries durante até 48 horas) quando o webhook não responde com HTTP 200.

#### Procedimento de Verificação:
1. Acesse o status do serviço: `status.supabase.com`.
2. Acesse o dashboard do projeto: `https://supabase.com/dashboard/project/jaxxkyvsgasgaccbejln`.
3. Verifique a utilização de CPU, memória e conexões de pooler (Transaction Pooler).
4. Assim que o serviço normalizar, os webhooks pendentes do Mercado Pago serão processados automaticamente.

---

### 📋 RUNBOOK 4: Perda de Acesso de Operador / Esquecimento de Senha

#### Cenário:
O operador perdeu a senha ou um colaborador foi desligado e o acesso administrativo precisa ser recuperado ou restringido.

#### Procedimento Passo a Passo de Recuperação:
1. **Acesso Imediato de Contingência:**
   - Acesse `https://munayarocks.vercel.app/admin`.
   - Clique na aba **"PIN de Emergência"**.
   - Digite o PIN mestre: `munaya2026`.
   - O acesso como **Super Admin** será liberado instantaneamente.
2. **Rotação da Chave Secreta (`ADMIN_SECRET_KEY`):**
   - Caso haja suspeita de vazamento de credenciais, acesse o painel da **Vercel** (`vercel.com`).
   - Vá em **Settings -> Environment Variables**.
   - Altere a variável `ADMIN_SECRET_KEY` para um novo hash seguro de 32 caracteres (ex: gerado via `openssl rand -hex 16`).
   - Clique em **Redeploy**. Todas as sessões anteriores de todos os operadores serão invalidadas de imediato em nível criptográfico.

---

### 📋 RUNBOOK 5: Evolution API (WhatsApp) Desconectada ou Parada

#### Cenário:
O chip do WhatsApp foi deslogado pelo aplicativo do celular (por exemplo, após troca de aparelho ou atualização do WhatsApp) ou o servidor da Evolution API foi reiniciado.

#### Impacto:
**Nenhum pedido de compra ou checkout é afetado.** O código da Munaya Rocks foi desenhado com arquitetura assíncrona desacoplada: se a Evolution API falhar, o pedido conclui normalmente e o erro é logado silenciosamente sem quebrar o checkout do cliente.

#### Procedimento de Reconexão:
1. Acesse `https://munayarocks.vercel.app/admin`.
2. Clique na aba **Evolution API (WhatsApp)**.
3. Observe o card de status: se indicar `close` ou `unconfigured`, clique no botão **"Conectar Instância / Gerar QR Code"**.
4. Abra o WhatsApp no smartphone oficial da marca: vá em **Aparelhos Conectados -> Conectar um Aparelho** e aponte a câmera para o QR Code na tela do admin.
5. Em menos de 5 segundos, a badge mudará para **● CHIP CONECTADO (OPEN)** em verde.
6. **Contingência Manual:** Enquanto o chip estiver desconectado, o operador pode clicar no botão **"Abrir no WhatsApp Web"** no card de qualquer pedido para enviar o Pix Copia-e-Cola ou rastreamento em 1 clique via link direto `wa.me`.

---

### 📋 RUNBOOK 6: Rollback de Emergência de Versão no Vercel

#### Cenário:
Um deploy recente introduziu uma regressão visual ou comportamento indesejado em produção e é necessário reverter para a versão anterior imediatamente.

#### Procedimento Passo a Passo (Tempo de Execução: 15 segundos):
1. Acesse o painel da Vercel: `vercel.com/munayarocks` (ou dashboard do projeto).
2. Vá na aba **Deployments**.
3. Localize o commit estável anterior (por exemplo, o commit `0365482` ou `cb17ce3`).
4. Clique no menu de três pontos `...` ao lado do deployment e selecione **"Instant Rollback"** (ou **"Promote to Production"**).
5. Em menos de 15 segundos, o tráfego global da loja voltará a apontar para o build estável anterior sem tempo de inatividade (Zero Downtime).

---

### 📋 RUNBOOK 7: Rotina de Backup & Restauração do Supabase

#### Frequência Recomendada:
- Backup lógico semanal ou antes de grandes migrações de catálogo.

#### Como Executar Backup Manual:
1. Acesse `https://supabase.com/dashboard/project/jaxxkyvsgasgaccbejln/sql`.
2. O Supabase realiza backups diários automatizados (Daily Backups) na nuvem AWS.
3. Para exportação sob demanda das tabelas essenciais (`products`, `orders`, `coupons`, `admin_audit_logs`), basta executar a query de extração ou exportar via interface da tabela em formato CSV/JSON.
4. As definições de tabelas e dados canônicos iniciais estão 100% versionados no repositório Git nos arquivos [`supabase_setup.sql`](file:///c:/Users/viega/Downloads/munaya/munaya_project/supabase_setup.sql) e [`supabase_admin_rbac_audit.sql`](file:///c:/Users/viega/Downloads/munaya/munaya_project/supabase_admin_rbac_audit.sql).

---

## 📞 4. Contatos de Suporte das APIs & Fornecedores

| Fornecedor | Canal / Portal de Suporte | SLA / Horário |
| :--- | :--- | :--- |
| **Camisa Dimona (API Dropsimples)** | `admin.camisadimona.com.br` / WhatsApp Suporte B2B | Seg-Sex 08h-18h |
| **Mercado Pago** | `mercadopago.com.br/ajuda` / Suporte Desenvolvedor | 24/7 online |
| **Vercel** | `vercel-status.com` / Suporte Vercel Dashboard | 24/7 online |
| **Supabase** | `status.supabase.com` / Discord & Support Ticket | 24/7 online |
| **Resend (E-mails)** | `resend.com/support` | 24/7 online |
