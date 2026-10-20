# Munaya E-Commerce — Diretrizes de Engenharia e Design (Claude Guidelines)

Este documento define as regras estritas de arquitetura, stack e convenções visuais para o projeto **Munaya**. Todo código gerado deve compilar com 0 erros no build de produção da **Vercel** (`npm run build`).

---

## 1. Stack Técnica & Dependências

- **Framework**: Next.js 16 (App Router com Turbopack)
- **UI Library**: React 19 (Server Components por padrão)
- **Linguagem**: TypeScript 5 (Strict Mode ativado)
- **Estilização**: Tailwind CSS v4 (NÃO criar nem usar `tailwind.config.js` — tokens configurados em `@theme inline` dentro de `src/app/globals.css`)
- **Ícones**: `lucide-react` (exclusivo; não importar `@heroicons`, `react-icons` ou outros)
- **Animações**: `framer-motion`
- **Deploy**: Vercel

---

## 2. Regras Críticas para Evitar Falhas no Build da Vercel

### 🚨 2.1. Diretiva `'use client'` Obrigatória
Todo componente que utilizar:
- Hooks do React (`useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`)
- Contextos da aplicação (ex: `useCart` de `@/context/CartContext`)
- Manipulação de eventos do navegador (`onClick`, `onChange`, `onSubmit`, `onKeyDown`)
- Componentes animados interativos do `framer-motion` (`motion.div`, `AnimatePresence`)

**DEVE conter obrigatoriamente** na primeiríssima linha do arquivo:
```tsx
"use client";
```

### 🚨 2.2. Assincronicidade de `params` e `searchParams` (Next.js 15/16)
Nas rotas dinâmicas do App Router (`page.tsx`), `params` e `searchParams` são `Promise`. **Nunca acesse propriedades diretamente de forma síncrona.**

```tsx
// Correto (Next.js 15/16):
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  // ...
}
```

### 🚨 2.3. Path Aliases e Imports
Sempre use o alias `@/*` apontando para `./src/*`:
- `@/components/...`
- `@/context/...`
- `@/lib/...`
- `@/app/...`

Nunca utilize caminhos relativos longos (ex: `../../components/Navbar`).

### 2.4. Dependências Permitidas
Não introduza novos pacotes no `package.json` sem necessidade. Utilize apenas as bibliotecas já instaladas:
- `clsx`, `tailwind-merge` (e a função `cn` em `@/lib/utils`)
- `lucide-react`
- `framer-motion`
- `next/link`, `next/navigation`, `next/font/google`

---

## 3. Design System & Identidade Visual (Munaya)

- **Tema**: **100% Dark Mode Fixo (Preto Absoluto)**. O site NÃO possui modo claro nem botão de alternância de tema.
- **Tokens de Cores**:
  - Fundo principal: `bg-background` (`#000000`)
  - Texto principal: `text-foreground` (`#ffffff`)
  - Cor de Acento (Pink Punk Munaya): `text-accent`, `bg-accent`, `border-accent` (`#ff66c4`).
    - Usado no logo vetorial vazado (`uploads/logo_v2027_vetor.png`).
    - Usado no contador/badge da sacola de compras (`bg-accent text-black font-bold`).
    - Usado para links ativos e destaques pontuais.
  - Bordas: `border-foreground` ou `border-white/20`.
- **Tipografia**:
  - Títulos, botões, números e chamadas: `font-oswald` (`var(--font-oswald)`), geralmente em `uppercase tracking-tight font-bold`.
  - Corpo de texto, fichas técnicas e descrições: `font-sans` (`var(--font-inter)`).
- **Tratamento de Imagens e Fotos (Regra da Análise de UX)**:
  - **Página de Produto (`/produto/[id]`): COR REAL SEMPRE.** É terminantemente proibido aplicar `grayscale` nas fotos da página de produto, pois o comprador precisa ver a cor real da estampa e do tecido.
  - **Grades / Catálogo / Home:** Preto e branco no estado inicial (`grayscale`), revelando a cor real com transição suave no hover (`hover:grayscale-0 transition-all duration-500`).

---

## 4. Estrutura do Layout Shell (Sidebar & Conteúdo)

O layout raiz (`src/app/layout.tsx`) já encapsula todas as rotas com:
- `<CartProvider>` e a gaveta lateral do carrinho `<CartDrawer />`.
- `<Navbar />` contendo:
  - Header sticky no mobile com logo, botão de sacola e menu sanduíche.
  - Sidebar fixa no desktop (`w-[15%] min-w-[200px]`).
- O `<main>` do layout já possui o deslocamento necessário (`md:ml-[max(15%,200px)]`).

> **ATENÇÃO**: As páginas filhas dentro de `src/app/` **NÃO DEVEM** adicionar margem esquerda (`md:ml-...`) nem recriar o header ou a barra lateral. Elas renderizam diretamente no fluxo normal do `<main>`.

---

## 5. Mapa de Telas e Rotas

- `src/app/page.tsx` → Home (Hero em vídeo com sobreposição de ruído + vitrine de destaques)
- `src/app/categoria/page.tsx` → Shop / Catálogo geral com filtros
- `src/app/produto/[id]/page.tsx` → Detalhe do Produto (Galeria de fotos em cor real + painel lateral de compra)
- `src/app/colecoes/page.tsx` → Índice visual de coleções *(planejada)*
- `src/app/colecoes/[slug]/page.tsx` → Listagem de produtos por coleção *(planejada)*
- `src/app/sobre/page.tsx` e `src/app/caos/page.tsx` → Páginas conceituais/institucionais *(planejadas)*
- `src/context/CartContext.tsx` → Ações do carrinho via `useCart()`: `addItem`, `openCart`, `totalCount`, etc.
