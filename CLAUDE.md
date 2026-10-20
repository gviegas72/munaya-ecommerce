# Munaya E-Commerce — Diretrizes de Engenharia e Design (Claude Guidelines)

Este documento define as regras estritas de arquitetura, stack e convenções visuais para o projeto **Munaya**. Todo código gerado deve compilar com 0 erros no build de produção da **Vercel** (`npm run build`).

---

## 1. Stack Técnica & Dependências

- **Framework**: Next.js 16 (App Router com Turbopack)
- **UI Library**: React 19 (Server Components por padrão)
- **Linguagem**: TypeScript 5 (Strict Mode ativado)
- **Estilização**: Tailwind CSS v4 (NÃO criar nem usar `tailwind.config.js` — tokens em `@theme inline` dentro de `src/app/globals.css`)
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

- **Tema**: **100% Dark Mode Fixo (Preto Absoluto)**. 
  - O site NÃO possui modo claro e NÃO deve exibir botão de alternância de tema (`ThemeToggle`).
  - O `ThemeProvider` usa obrigatoriamente `forcedTheme="dark"`.
- **Cores & Tokens**:
  - Fundo principal: `bg-background` (`#000000`).
  - Texto principal: `text-foreground` (`#ffffff`).
  - Cor de Acento (Pink Punk Munaya): `#ff66c4` (token `--color-accent`, classes `text-accent`, `bg-accent`, `border-accent`).
    - É a **ÚNICA** cor de destaque do site. Proibido usar cores genéricas do Tailwind como `red-600`, `blue-500`, etc.
    - Mensagens de erro, validação e avisos também utilizam `text-accent`.
    - Sobre qualquer elemento com fundo rosa (`bg-accent` ou `#ff66c4`), o texto deve ser **preto** (`text-black font-bold`).
    - Usado no logo vetorial vazado (`uploads/logo_v2027_vetor.png`).
    - Usado no badge de contagem da sacola (`bg-accent text-black font-bold`).
  - Bordas e divisores: `border-foreground` ou `border-white/20`.
- **Tipografia**:
  - Títulos, botões, números e chamadas: `font-oswald` (`var(--font-oswald)`), em `uppercase tracking-tight font-bold`.
  - Corpo de texto, fichas técnicas e descrições: `font-sans` (`var(--font-inter)`).
- **Tratamento de Imagens e Fotos (Regra Definitiva)**:
  - **TODAS as imagens de produtos e coleções são coloridas em todas as páginas** (Home, Coleções, Catálogo, Detalhe do Produto e Carrinho).
  - O filtro `grayscale` **NÃO DEVE** ser aplicado em imagens de catálogo ou produtos.

---

## 4. Estrutura do Layout Shell (Sidebar & Conteúdo)

O layout raiz (`src/app/layout.tsx`) já encapsula todas as rotas com:
- `<ThemeProvider attribute="class" forcedTheme="dark">`
- `<CartProvider>` e a gaveta lateral do carrinho `<CartDrawer />`.
- `<Navbar />` contendo o header mobile e a sidebar fixa no desktop (`w-[15%] min-w-[200px]`).
- O `<main>` do layout já possui o deslocamento lateral necessário (`md:ml-[max(15%,200px)]`).

> **ATENÇÃO**: As páginas filhas dentro de `src/app/` **NÃO DEVEM** adicionar margem lateral (`md:ml-...`) nem recriar o header ou a barra lateral. Elas renderizam diretamente no fluxo normal do `<main>`.

---

## 5. Mapa de Telas e Rotas

- `src/app/page.tsx` → Home (Hero em vídeo com ruído + vitrine de destaques com fotos coloridas)
- `src/app/categoria/page.tsx` → Shop / Catálogo geral com filtros
- `src/app/produto/[id]/page.tsx` → Detalhe do Produto (Galeria de fotos coloridas em alta definição + painel lateral de compra)
- `src/app/colecoes/page.tsx` → Índice visual de coleções *(planejada)*
- `src/app/colecoes/[slug]/page.tsx` → Listagem de produtos por coleção *(planejada)*
- `src/app/sobre/page.tsx` e `src/app/caos/page.tsx` → Páginas conceituais/institucionais *(planejadas)*
- `src/context/CartContext.tsx` → Ações do carrinho via `useCart()`: `addItem`, `openCart`, `totalCount`, etc.
