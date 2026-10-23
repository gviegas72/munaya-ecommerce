import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata = {
  title: "Termos de Serviço | Munaya Rocks",
  description: "Termos e Condições de Uso da plataforma Munaya Rocks.",
};

export default function TermsPage() {
  return (
    <div className="w-full min-h-screen bg-black text-white p-6 md:p-16 max-w-4xl mx-auto font-sans">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#ff66c4] hover:underline mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para a loja
      </Link>

      <div className="flex items-center gap-3 text-[#ff66c4] mb-2 font-mono text-sm uppercase tracking-widest">
        <FileText className="w-5 h-5" />
        <span>Termos e Condições</span>
      </div>

      <h1 className="font-oswald text-4xl md:text-6xl font-black uppercase tracking-tight mb-8">
        Termos de Serviço
      </h1>

      <div className="space-y-6 text-neutral-300 text-sm md:text-base leading-relaxed">
        <p>
          Bem-vindo à <strong>Munaya Rocks</strong>. Ao acessar nossa loja ou realizar uma compra, você concorda com os termos e condições descritos a seguir.
        </p>

        <section className="border-t border-neutral-800 pt-6">
          <h2 className="font-oswald text-2xl font-bold uppercase text-white mb-3">
            1. Modelo de Produção Sob Demanda (Print on Demand)
          </h2>
          <p>
            Nossas camisetas e produtos são confeccionados sob demanda especialmente para você, garantindo exclusividade, toque zero e alta definição de estamparia. O prazo estimado de entrega apresentado no checkout contempla o tempo de produção industrial somado ao prazo de trânsito dos Correios ou transportadora.
          </p>
        </section>

        <section className="border-t border-neutral-800 pt-6">
          <h2 className="font-oswald text-2xl font-bold uppercase text-white mb-3">
            2. Trocas e Devoluções
          </h2>
          <p>
            Em conformidade com o Código de Defesa do Consumidor (CDC), você possui até 7 (sete) dias corridos após o recebimento do pedido para solicitar a devolução ou troca por arrependimento ou defeito de fabricação.
          </p>
        </section>

        <section className="border-t border-neutral-800 pt-6">
          <h2 className="font-oswald text-2xl font-bold uppercase text-white mb-3">
            3. Propriedade Intelectual
          </h2>
          <p>
            Todas as artes, estampas, logotipos, fotografias e identidades visuais da Munaya Rocks são de propriedade exclusiva da marca ou licenciadas, sendo proibida a reprodução ou cópia não autorizada.
          </p>
        </section>

        <div className="pt-8 text-xs font-mono text-neutral-500 uppercase">
          Última atualização: Outubro de 2026 · Munaya Rocks
        </div>
      </div>
    </div>
  );
}
