# Diretrizes de Git e Deploy — Munaya Rocks

## 1. Regra Fundamental: Proibido Push Direto na Master
- A branch `master` representa o código em produção.
- **Nenhum desenvolvedor ou agente de IA pode executar `git push origin master`.**
- Qualquer tentativa de push direto será bloqueada.

## 2. Nomenclatura Padrão de Branches
Todo desenvolvimento deve ser feito em branches dedicadas:
- `feature/nome-da-funcionalidade` (ex: `feature/pix-recovery-enhancement`)
- `fix/descricao-do-bug` (ex: `fix/checkout-mobile-overflow`)
- `chore/nome-da-manutencao` (ex: `chore/bump-dependencies`)

## 3. Pull Requests e Revisão Automática
1. Crie a branch e realize os commits locais.
2. Envie a branch para o repositório remoto: `git push origin feature/nome-da-feature`.
3. Abra um Pull Request detalhado apontando para `master`.
4. O **Tech Lead da Munaya (Agente IA via n8n)** realizará a auditoria técnica e revisão do diff.
5. O merge só deve ser realizado após aprovação e homologação do Fundador.
