"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";

export default function RecoverCartPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "already_paid">("loading");
  const [message, setMessage] = useState("Restaurando sua sacola exclusiva...");
  const [cartInfo, setCartInfo] = useState<any>(null);

  useEffect(() => {
    async function recover() {
      if (typeof window === "undefined") return;

      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const cupom = params.get("cupom") || "VOLTA5";

      if (!token) {
        setStatus("error");
        setMessage("Link de recuperação inválido ou incompleto.");
        return;
      }

      try {
        const res = await fetch(`/api/checkout/recover?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setStatus("error");
          setMessage(data?.error || "Carrinho não encontrado ou expirado.");
          return;
        }

        if (data.already_recovered) {
          setStatus("already_paid");
          setMessage("Este pedido já foi finalizado e aprovado com sucesso!");
          return;
        }

        const draft = data.draft;
        setCartInfo(draft);

        // 1. Restaura itens na sacola (localStorage)
        if (Array.isArray(draft.items) && draft.items.length > 0) {
          try {
            window.localStorage.setItem("munaya.sacola.v1", JSON.stringify(draft.items));
            window.dispatchEvent(new Event("storage"));
          } catch (e) {}
        }

        // 2. Aplica cupom se houver
        const activeCoupon = cupom || draft.coupon_code || "VOLTA5";
        try {
          window.localStorage.setItem("munaya.cupom.v1", activeCoupon);
        } catch (e) {}

        // 3. Preenche dados cadastrais do cliente
        if (draft.customer_name || draft.customer_email || draft.customer_phone) {
          try {
            const profile = {
              nome: draft.customer_name || "",
              email: draft.customer_email || "",
              cpf: draft.customer_cpf || "",
              fone: draft.customer_phone || "",
              cep: draft.zipcode || "",
              rua: draft.street || "",
              num: draft.number || "",
              compl: "",
              bairro: draft.neighborhood || "",
              cidade: draft.city || "",
              uf: draft.state || "",
            };
            window.localStorage.setItem(
              "munaya.conta.v1",
              JSON.stringify({ account: profile, orders: [] })
            );
          } catch (e) {}
        }

        setStatus("success");
        setMessage("Sacola restaurada com sucesso! Redirecionando para o fechamento...");

        // Redireciona para a home abrindo o carrinho/checkout em 1.5s
        setTimeout(() => {
          window.location.href = `/?recuperado=1&cupom=${encodeURIComponent(activeCoupon)}`;
        }, 1500);
      } catch (err: any) {
        setStatus("error");
        setMessage("Erro ao conectar com os servidores da loja. Tente novamente.");
      }
    }

    recover();
  }, []);

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full border-2 border-white/20 bg-neutral-950 p-8 flex flex-col items-center gap-6">
        <div className="font-oswald text-4xl font-black uppercase tracking-tight text-[#ff66c4]">
          Munaya Rocks
        </div>

        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="w-10 h-10 animate-spin text-[#ff66c4]" />
            <p className="font-mono text-sm uppercase tracking-widest text-neutral-300">
              {message}
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <div className="font-oswald text-2xl font-bold uppercase text-white">
              Sua sacola está pronta!
            </div>
            <p className="text-sm text-neutral-300">{message}</p>
            {cartInfo?.items && (
              <div className="w-full border-t border-neutral-800 pt-3 text-xs text-neutral-400 text-left font-mono">
                {cartInfo.items.map((it: any, i: number) => (
                  <div key={i} className="truncate">
                    • {it.qty || 1}x {it.name} ({it.size || "M"})
                  </div>
                ))}
              </div>
            )}
            <a
              href="/?recuperado=1"
              className="mt-4 w-full bg-[#ff66c4] text-black font-oswald text-xl font-bold uppercase py-3 px-6 hover:bg-white transition-colors flex items-center justify-center gap-2"
            >
              <span>Ir pro Checkout</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        )}

        {status === "already_paid" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <div className="font-oswald text-2xl font-bold uppercase text-white">
              Pedido Já Confirmado
            </div>
            <p className="text-sm text-neutral-300">{message}</p>
            <Link
              href="/login"
              className="mt-4 w-full bg-white text-black font-oswald text-xl font-bold uppercase py-3 px-6 hover:bg-[#ff66c4] transition-colors"
            >
              Acompanhar Pedido
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <AlertCircle className="w-12 h-12 text-[#ff66c4]" />
            <div className="font-oswald text-2xl font-bold uppercase text-white">
              Ops! Algo deu errado
            </div>
            <p className="text-sm text-neutral-300">{message}</p>
            <Link
              href="/categoria"
              className="mt-4 w-full bg-white text-black font-oswald text-xl font-bold uppercase py-3 px-6 hover:bg-[#ff66c4] transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Ver Coleção</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
