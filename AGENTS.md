<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Munaya Rocks — Diretrizes de Engenharia e Fluxo Git

## 🚫 REGRA ABSOLUTA: PROIBIDO PUSH DIRETO NA MASTER
- O assistente/agente **NUNCA** deve executar `git push origin master` diretamente para entrega de código ou deploy.
- Todas as alterações, novas funcionalidades e correções de bug **DEVEM** obrigatoriamente seguir o fluxo de **Pull Request (PR)**.

## 🌿 Padrão Obrigatório de Ramificação (Branching Strategy)
- Toda nova tarefa deve ser desenvolvida em uma branch dedicada com o prefixo:
  `feature/nome-da-feature`
  - Exemplos:
    - `feature/issue-41-desabilitar-bases-fisicas`
    - `feature/issue-44-remover-preview-email`
    - `feature/issue-42-banner-primeira-compra`

## 🔄 Fluxo de Trabalho Passo a Passo para Entregas:
1. **Criar e Mudar para a Branch:**
   `git checkout -b feature/nome-da-feature`
2. **Desenvolver e Validar Localmente:**
   - Realizar as alterações de código necessárias.
   - Rodar validação de build (`npm run build`) para garantir zero erros de TypeScript e compilação.
3. **Commit Semântico e Push da Branch:**
   - `git add <arquivos>`
   - `git commit -m "tipo(escopo): descrição clara (#issue)"`
   - `git push origin feature/nome-da-feature`
4. **Abrir o Pull Request via GitHub CLI:**
   - `gh pr create --base master --head feature/nome-da-feature --title "..." --body "..."`
5. **Sincronizar com o Board:**
   - A issue correspondente deve ser movida para `status:ready-to-test` com o link do PR no comentário.
6. **Merge e Deploy de Produção:**
   - O merge para a branch `master` (que aciona o deploy oficial de produção na Vercel) **só é realizado após o Fundador testar, aprovar e autorizar** o fechamento do PR (`gh pr merge`).

## 👑 Regra de Ouro do Fundador
- *"Sempre eu preciso testar e validar as histórias"*.
- Nunca fechar nenhuma issue como `status:done` sem validação e homologação explícita do Fundador.

