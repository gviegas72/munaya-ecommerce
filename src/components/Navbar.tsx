import Link from "next/link"
import { ThemeToggle } from "./ThemeToggle"

export function Navbar() {
  return (
    <aside className="w-full md:w-[15%] md:fixed md:h-screen border-b md:border-b-0 md:border-r border-foreground flex flex-col justify-between p-6 bg-background z-50">
      <div className="flex flex-col gap-12">
        <Link href="/" className="hover:opacity-70 transition-opacity">
          {/* Logo no modo claro (Letras pretas) */}
          <img src="/logo-light.svg" alt="Munaya Logo" className="w-24 h-auto block dark:hidden" />
          {/* Logo no modo escuro (Letras brancas) */}
          <img src="/logo-dark.svg" alt="Munaya Logo" className="w-24 h-auto hidden dark:block" />
        </Link>
        <nav className="flex flex-col gap-8 mt-4">
          <Link href="/categoria" className="font-oswald uppercase text-2xl font-bold hover:translate-x-2 transition-transform duration-200">
            Shop
          </Link>
          <Link href="#" className="font-oswald uppercase text-2xl font-bold hover:translate-x-2 transition-transform duration-200 ml-4">
            Coleções
          </Link>
          <Link href="#" className="font-oswald uppercase text-2xl font-bold hover:translate-x-2 transition-transform duration-200">
            Sobre
          </Link>
          <Link href="#" className="font-oswald uppercase text-2xl font-bold hover:translate-x-2 transition-transform duration-200 -ml-2">
            Caos
          </Link>
        </nav>
      </div>
      <div className="mt-12 md:mt-0 flex flex-col gap-4">
        <ThemeToggle />
      </div>
    </aside>
  )
}
