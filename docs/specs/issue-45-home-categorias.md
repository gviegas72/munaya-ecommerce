## Contexto
A Home e a página de categorias da Munaya são a principal entrada para conversão, mas hoje elas ainda parecem estáticas e dependem de alterações manuais em código ou de ajustes pontuais sem um processo claro de edição.

O desafio é permitir que a equipe de marketing e operação consiga editar o conteúdo e a organização visual dessas páginas sem depender de desenvolvimento para cada ajuste pequeno.

## Objetivo
Permitir que o admin edite a Home e a página de categorias da loja, com atualização imediata no front-end, preservando a identidade visual da marca e mantendo a experiência mobile/desktop consistente.

## Escopo
### 1) Edição da Home
- Alterar texto principal do hero
- Ajustar CTA principal
- Trocar imagem ou vídeo de fundo
- Editar subtítulo / linha editorial
- Configurar destaque de coleções e itens em destaque
- Ajustar ordem dos blocos da landing page
- Ativar/desativar seções específicas

### 2) Edição da página de categorias
- Ajustar título e subtítulo da página
- Definir ordem dos produtos na vitrine
- Configurar itens em destaque ou “featured”
- Controlar filtros visuais e texto guia da categoria
- Revisar espaçamento, labels e organização visual da grade

### 3) Estrutura de dados
- Criar modelo de configuração para página inicial e categorias
- Manter versões por ambiente (produtivo e preview, se necessário)
- Preservar fallback seguro quando um campo não estiver preenchido

## Requisitos de negócio
- O conteúdo deve ser editável pelo painel administrativo sem necessidade de deploy manual.
- O admin deve visualizar a página e o impacto das alterações antes de publicar.
- A marca deve manter a estética dark mode, com pink punk como principal acento visual.
- A edição deve funcionar em desktop e mobile.
- A experiência de compra não pode ficar quebrada ou lenta.

## Critérios de aceite
- [ ] O administrador consegue alterar os principais textos da Home e da página de categorias pelo admin.
- [ ] O layout da Home e da vitrine pode ser reorganizado sem alterar a estrutura principal do front-end.
- [ ] Alterações salvas refletem na loja em poucos segundos.
- [ ] Campos vazios ou ausentes exibem conteúdo padrão da marca.
- [ ] Os campos editáveis respeitam a identidade visual vigente.
- [ ] O responsivo continua funcionando sem quebra de layout.
- [ ] O site mantém carregamento e desempenho aceitáveis.

## Tarefas técnicas
- [ ] Mapear os campos editáveis da Home e da página de categorias
- [ ] Definir persistência em banco/propriedades do admin
- [ ] Criar endpoints do admin para salvar e recuperar estas configurações
- [ ] Criar UI de edição dentro do admin
- [ ] Integrar o front-end para consumir essas configurações
- [ ] Validar preview e publicação no storefront
- [ ] Testar mobile, desktop e regressão de layout

## Observações
Este item tem impacto direto em conversão e percepção de marca. A prioridade é que a página seja facilmente atualizável pelo time, sem depender da engenharia para pequenas mudanças de marketing.
