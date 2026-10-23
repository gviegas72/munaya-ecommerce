import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade | Munaya Rocks",
  description:
    "Política de Privacidade e Proteção de Dados (LGPD) da Munaya Rocks.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full min-h-screen bg-black text-white p-6 md:p-16 max-w-4xl mx-auto font-sans">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#ff66c4] hover:underline mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para a loja
      </Link>

      <div className="flex items-center gap-3 text-[#ff66c4] mb-2 font-mono text-sm uppercase tracking-widest">
        <ShieldCheck className="w-5 h-5" />
        <span>Segurança & LGPD</span>
      </div>

      <h1 className="font-oswald text-4xl md:text-6xl font-black uppercase tracking-tight mb-8">
        Política de Privacidade
      </h1>

      <div className="space-y-6 text-neutral-300 text-sm md:text-base leading-relaxed">
        <p>
          A <strong>Munaya Rocks</strong> preza pela total privacidade, transparência e segurança dos dados dos seus clientes. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos seus dados pessoais de acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
        </p>

        <section className="border-t border-neutral-800 pt-6">
          <h2 className="font-oswald text-2xl font-bold uppercase text-white mb-3">
            1. Dados Coletados
          </h2>
          <p className="mb-2">Coletamos apenas as informações estritamente necessárias para a prestação dos nossos serviços:</p>
          <ul className="list-disc pl-5 space-y-1 text-neutral-400">
            <li><strong>Identificação e Contato:</strong> Nome completo, e-mail, telefone/WhatsApp e CPF (exigido para emissão de documentos fiscais e despacho de frete).</li>
            <li><strong>Endereço de Entrega:</strong> CEP, logradouro, número, complemento, bairro, cidade e estado.</li>
            <li><strong>Autenticação Social:</strong> Quando você opta por fazer login com sua conta Google ou Apple, recebemos apenas seu nome público e endereço de e-mail verificado. Não temos acesso a senhas da sua conta Google ou dados privados.</li>
          </ul>
        </section>

        <section className="border-t border-neutral-800 pt-6">
          <h2 className="font-oswald text-2xl font-bold uppercase text-white mb-3">
            2. Finalidade do Tratamento de Dados
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-neutral-400">
            <li>Processamento de pagamentos através de intermediadores seguros (Mercado Pago). Não armazenamos números de cartão de crédito.</li>
            <li>Produção e envio sob demanda dos pedidos físicos através dos parceiros logísticos e industriais oficiais.</li>
            <li>Comunicação transacional: envio de código Pix, status de produção, confirmação de pedido e código de rastreamento de transporte via e-mail e WhatsApp.</li>
            <li>Prevenção a fraudes e segurança das transações.</li>
          </ul>
        </section>

        <section className="border-t border-neutral-800 pt-6">
          <h2 className="font-oswald text-2xl font-bold uppercase text-white mb-3">
            3. Compartilhamento Seguro com Parceiros
          </h2>
          <p>
            A Munaya Rocks não vende, aluga ou transfere dados pessoais para terceiros para fins de marketing. O compartilhamento ocorre exclusivamente com parceiros essenciais à operação:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-neutral-400">
            <li><strong>Intermediador de Pagamento:</strong> Mercado Pago (para liquidação das transações financeiras).</li>
            <li><strong>Parceiro de Produção & Logística:</strong> Camisa Dimona e Correios/Transportadoras (estritamente os dados de entrega para envio da encomenda).</li>
            <li><strong>Infraestrutura & Nuvem:</strong> Supabase e Vercel (servidores com criptografia de ponta a ponta).</li>
          </ul>
        </section>

        <section className="border-t border-neutral-800 pt-6">
          <h2 className="font-oswald text-2xl font-bold uppercase text-white mb-3">
            4. Seus Direitos (LGPD)
          </h2>
          <p>
            Você tem o direito de solicitar a qualquer momento o acesso, confirmação de tratamento, correção de dados incompletos ou a exclusão definitiva da sua conta e dados pessoais através dos nossos canais de atendimento.
          </p>
        </section>

        <section className="border-t border-neutral-800 pt-6">
          <h2 className="font-oswald text-2xl font-bold uppercase text-white mb-3">
            5. Contato do Encarregado de Dados
          </h2>
          <p>
            Para dúvidas sobre esta política ou para exercer seus direitos de privacidade, entre em contato através do e-mail oficial: <strong>contato@munayarocks.com.br</strong>.
          </p>
        </section>

        <div className="pt-8 text-xs font-mono text-neutral-500 uppercase">
          Última atualização: Outubro de 2026 · Munaya Rocks
        </div>
      </div>
    </div>
  );
}
