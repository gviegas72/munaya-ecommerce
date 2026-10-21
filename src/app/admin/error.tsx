"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro capturado no Admin:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg border-2 border-red-600 bg-black p-8 shadow-[8px_8px_0px_#ff66c4] space-y-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <h1 className="font-oswald text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
            Falha no Carregamento
          </h1>
        </div>

        <p className="text-sm text-neutral-300 font-mono">
          Ocorreu uma instabilidade ao renderizar o painel administrativo:
        </p>

        <div className="p-4 bg-neutral-950 border border-neutral-800 text-xs font-mono text-red-400 overflow-x-auto break-all">
          {error?.message || "Erro inesperado de renderização."}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => {
              try {
                localStorage.removeItem("munaya_admin_token");
              } catch {}
              reset();
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-oswald text-base font-black uppercase py-3 px-4 tracking-wider hover:bg-[#ff66c4] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Recarregar Painel
          </button>

          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 border border-neutral-700 bg-neutral-900 text-white font-oswald text-base font-bold uppercase py-3 px-4 tracking-wider hover:border-white transition-colors text-center"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar à Loja
          </Link>
        </div>
      </div>
    </div>
  );
}
