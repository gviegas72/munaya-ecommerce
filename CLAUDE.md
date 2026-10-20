# Munaya E-Commerce — Diretrizes de Engenharia e Design (Claude Guidelines)

Este documento define as regras estritas de arquitetura, stack e convenções de código para o projeto **Munaya**. Todo código gerado deve compilar com 0 erros no build de produção da **Vercel** (`npm run build`).

---

## 1. Stack Técnica e Versões

- **Framework**: Next.js 16 (App Router com Turbopack)
- **UI Library**: React 19 (Server Components por padrão)
- **Linguagem**: TypeScript 5 (Strict Mode ativado)
- **Estilização**: Tailwind CSS v4 (NÃO criar e nem usar `tailwind.config.js` — configurações em `@theme inline` no `globals.css`)
- **Ícones**: `lucide-react` (não importar `@heroicons`, `react-icons` ou `phosphor`)
- **Animações**: `framer-motion`
- **Tema / Dark Mode**: `next-themes` (classe dark no `<html>`)
- **Deploy**: Vercel

---

## 2. Regras Críticas para Evitar Falhas no Build da Vercel

### 🚨 2.1. Diretiva `'use client'` Obrigatória
Todo componente que utilizar:
- Hooks do React (`useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`)
- Contextos da aplicação (ex: `useCart` de `@/context/CartContext`)
- Manipulação de eventos (`onClick`, `onChange`, `onSubmit`, `onKeyDown`)
- Componentes interativos do `framer-motion` (`motion.div`, `AnimatePresence`)

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

### 🚨 2.4. Dependências Permitidas
Não invente novos pacotes sem aviso prévio. Apenas utilize o que já está no `package.json`:
- `clsx`, `tailwind-merge` (ou `cn` em `@/lib/utils`)
- `lucide-react`
- `framer-motion`
- `next-themes`
- `next/link`, `next/navigation`, `next/font/google`

### 🚨 2.5. Links e Imagens
- Use `<Link href="...">` de `next/link` para navegação interna.
- Para imagens externas, use `<img>` com `alt` sem tags vazias, ou `<Image>` de `next/image` (o `next.config.ts` já aceita qualquer host HTTPS via `remotePatterns`).

---

## 3. Design System & Identidade Visual (Munaya)

- **Universo da Marca**: Rock lifestyle, irreverente, pesado, minimalista, brutalista moderno, de alto impacto.
- **Tipografia**:
  - Títulos e tags de impacto: `font-oswald` (`var(--font-oswald)`).
  - Texto corrido e interface: `font-sans` (`var(--font-inter)`).
- **Cores & Tokens**:
  - Fundo principal: `bg-background` (Dark padrão `#000000`, Light `#ffffff`).
  - Texto principal: `text-foreground` (Dark `#ffffff`, Light `#000000`).
  - Linhas e bordas: `border-foreground` ou `border-white/20`.
  - Destaques sutis em preto e branco com efeitos de hover (ex: `grayscale hover:grayscale-0 transition-all duration-500`).

---

## 4. Estrutura de Telas e Layout Base

O arquivo `src/app/layout.tsx` já implementa:
- `<ThemeProvider attribute="class" defaultTheme="dark">`
- `<CartProvider>` e `<CartDrawer />`
- `<Navbar />` fixa lateral no desktop (`md:ml-[max(15%,200px)]`).

**Importante**: As páginas em `src/app/` NÃO devem duplicar o header/menu lateral nem o `CartDrawer`. O conteúdo da página ocupa a área principal `<main>` já reservada pelo layout.

### Mapeamento de Arquivos:
- `src/app/page.tsx` → Home (Hero e vitrine)
- `src/app/categoria/page.tsx` → Catálogo e listagem de produtos com filtros
- `src/app/produto/[id]/page.tsx` → Página de detalhe do produto (coluna de imagens + ação de compra)
- `src/components/` → Componentes modulares (`Navbar.tsx`, `CartDrawer.tsx`, `ProductActionSection.tsx`, etc.)
- `src/context/CartContext.tsx` → Hook `useCart()` com `addItem`, `openCart`, `isOpen`, etc.
