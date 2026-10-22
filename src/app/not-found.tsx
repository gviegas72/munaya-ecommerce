import Link from "next/link";
import { ArrowLeft, Disc } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center p-6 text-center bg-black text-white">
      <div className="relative mb-6">
        <Disc className="w-24 h-24 text-[#ff66c4] animate-spin-slow opacity-80" />
        <span className="absolute inset-0 flex items-center justify-center font-oswald text-2xl font-black">
          404
        </span>
      </div>

      <h1 className="font-oswald text-4xl md:text-7xl font-black uppercase tracking-tighter max-w-2xl leading-none">
        Faixa Não Encontrada
      </h1>

      <p className="mt-4 text-neutral-400 font-sans text-sm md:text-base max-w-md uppercase tracking-wider">
        A estampa ou página que você procurou saiu do setlist ou o link foi digitado incorretamente.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/categoria"
          className="bg-white text-black px-8 py-3.5 font-oswald text-lg font-black uppercase tracking-wider hover:bg-[#ff66c4] hover:text-black transition-all transform -skew-x-12 inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5 transform skew-x-12" />
          <span className="transform skew-x-12">Ver Todo o Catálogo</span>
        </Link>
        <Link
          href="/"
          className="border border-neutral-700 hover:border-white px-8 py-3.5 font-oswald text-lg font-black uppercase tracking-wider text-neutral-300 hover:text-white transition-all transform -skew-x-12"
        >
          <span className="transform skew-x-12">Voltar à Home</span>
        </Link>
      </div>
    </div>
  );
}
