# Guia de Homologação e Qualidade (QA) — Munaya Rocks

Este documento estabelece as diretrizes de testes e homologação para todas as entregas no e-commerce Munaya Rocks.

## 1. Princípios de Qualidade
- **Mobile First:** Mais de 80% dos clientes compram pelo smartphone. A navegação mobile deve ser fluida, sem scroll horizontal e com botões de toque com no mínimo 48x48px.
- **Dark Mode Brutalista:** Manter coerência visual com fundo escuro (`#0a0a0a`), tipografia de peso e destaque no rosa vibrante (`#ff66c4`).
- **Resiliência de Rede:** Feedback visual claro em conexões 3G/4G oscilantes (skeletons de carregamento e estados desabilitados em botões).

## 2. Checklist Padrão de Homologação do Fundador
Antes de aprovar o merge de qualquer Pull Request para `master`:
1. [ ] Acessar a URL de preview gerada pela Vercel no celular.
2. [ ] Validar o fluxo principal da funcionalidade (Happy Path).
3. [ ] Testar casos extremos (tentar enviar campos vazios, dados inválidos ou clicar repetidamente).
4. [ ] Verificar se o carrinho e checkout continuam funcionando perfeitamente sem regressões.
5. [ ] Confirmar visual em diferentes tamanhos de tela (iPhone, Android, Desktop).
