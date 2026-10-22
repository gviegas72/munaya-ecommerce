"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

type AuthMode = "login" | "register";
type AccountTab = "pedidos" | "dados" | "senha";

interface AccountProfile {
  nome: string;
  email: string;
  cpf: string;
  fone: string;
  cep: string;
  rua: string;
  num: string;
  compl: string;
  bairro: string;
  cidade: string;
  uf: string;
}

const EMPTY_PROFILE: AccountProfile = {
  nome: "",
  email: "",
  cpf: "",
  fone: "",
  cep: "",
  rua: "",
  num: "",
  compl: "",
  bairro: "",
  cidade: "",
  uf: "",
};

const dg = (s: string) => String(s || "").replace(/\D/g, "");

const maskCpf = (v: string) => {
  const d = dg(v).slice(0, 11);
  if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
  return d;
};

const maskFone = (v: string) => {
  const d = dg(v).slice(0, 11);
  if (d.length > 10) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length > 6) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return d;
};

const maskCep = (v: string) => {
  const d = dg(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

const formatBrl = (n: number) =>
  Number(n || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

function getOrderStatusInfo(status: string, dimonaOrderId?: string) {
  const st = String(status || "").toLowerCase();
  if (st === "shipped" || st === "enviado") {
    return { label: "Enviado", bg: "#10b981", fg: "#000000" };
  }
  if (st === "paid" || st === "approved" || st === "in_production" || dimonaOrderId) {
    return { label: "Em produção", bg: "#ffffff", fg: "#000000" };
  }
  if (st === "cancelled" || st === "canceled" || st === "rejected") {
    return { label: "Cancelado", bg: "#ef4444", fg: "#ffffff" };
  }
  return { label: "Aguardando Pix", bg: "#ff66c4", fg: "#000000" };
}

export default function LoginPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string>("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Estados de Autenticação (Deslogado)
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState("");

  // Estados da Área do Cliente (Logado — Design Claude v3)
  const [acctTab, setAcctTab] = useState<AccountTab>("pedidos");
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [copiedPixId, setCopiedPixId] = useState<string | null>(null);

  // Aba: Dados Cadastrais
  const [acctForm, setAcctForm] = useState<AccountProfile>(EMPTY_PROFILE);
  const [acctErrors, setAcctErrors] = useState<Record<string, string>>({});
  const [acctMsg, setAcctMsg] = useState("");
  const [savingAcct, setSavingAcct] = useState(false);

  // Aba: Senha
  const [pwForm, setPwForm] = useState({ atual: "", nova: "", conf: "" });
  const [pwErr, setPwErr] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  // Carrega Pedidos e Perfil do Cliente no Supabase
  const loadCustomerArea = async (token: string, userObj: any) => {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/account/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        const p = data.profile || {};
        const nextProfile: AccountProfile = {
          nome: p.nome || userObj?.user_metadata?.full_name || "",
          email: p.email || userObj?.email || "",
          cpf: maskCpf(p.cpf || ""),
          fone: maskFone(p.fone || ""),
          cep: maskCep(p.cep || ""),
          rua: p.rua || "",
          num: p.num || "",
          compl: p.compl || "",
          bairro: p.bairro || "",
          cidade: p.cidade || "",
          uf: String(p.uf || "").toUpperCase(),
        };
        setAcctForm(nextProfile);

        // Sincroniza com o localStorage para o checkout da Home aproveitar automaticamente
        try {
          window.localStorage.setItem(
            "munaya.conta.v1",
            JSON.stringify({ account: nextProfile, orders: [] })
          );
        } catch (e) {}
      }
    } catch (err) {
      console.error("Erro ao carregar Área do Cliente:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          const usr = sessionData.session.user;
          const tok = sessionData.session.access_token;
          setCurrentUser(usr);
          setAccessToken(tok);
          loadCustomerArea(tok, usr);
        }
      } catch (err) {
        // Sem sessão ativa
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setCurrentUser(session.user);
          setAccessToken(session.access_token);
          loadCustomerArea(session.access_token, session.user);
        } else {
          setCurrentUser(null);
          setAccessToken("");
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setRegisterSuccessMsg("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setErrorMsg("E-mail ou senha incorretos. Verifique suas credenciais.");
        return;
      }

      if (data?.user && data?.session) {
        setCurrentUser(data.user);
        setAccessToken(data.session.access_token);
        loadCustomerArea(data.session.access_token, data.user);
      }
    } catch (err: any) {
      setErrorMsg("Erro de comunicação ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setRegisterSuccessMsg("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Informe um e-mail válido.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("As duas senhas digitadas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        setErrorMsg(result.error || "Erro ao cadastrar conta.");
        setLoading(false);
        return;
      }

      const { data: loginData } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (loginData?.user && loginData?.session) {
        setCurrentUser(loginData.user);
        setAccessToken(loginData.session.access_token);
        loadCustomerArea(loginData.session.access_token, loginData.user);
      } else {
        setRegisterSuccessMsg("Conta criada com sucesso! Faça login abaixo.");
        setAuthMode("login");
      }
    } catch (err: any) {
      setErrorMsg("Erro de comunicação ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    try {
      window.localStorage.removeItem("munaya.conta.v1");
    } catch (e) {}
    setCurrentUser(null);
    setAccessToken("");
    setOrders([]);
  };

  // Atualização de campos de Dados Cadastrais + Busca ViaCEP automática
  const updateAcctField = (key: keyof AccountProfile, rawVal: string) => {
    let val = rawVal;
    if (key === "cpf") val = maskCpf(rawVal);
    if (key === "fone") val = maskFone(rawVal);
    if (key === "cep") val = maskCep(rawVal);
    if (key === "uf") val = rawVal.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);

    setAcctForm((prev) => ({ ...prev, [key]: val }));
    setAcctErrors((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setAcctMsg("");

    if (key === "cep") {
      const digits = dg(val);
      if (digits.length === 8) {
        fetch(`https://viacep.com.br/ws/${digits}/json/`)
          .then((r) => r.json())
          .then((info) => {
            if (!info.erro) {
              setAcctForm((prev) => ({
                ...prev,
                rua: info.logradouro || prev.rua,
                bairro: info.bairro || prev.bairro,
                cidade: info.localidade || prev.cidade,
                uf: info.uf || prev.uf,
              }));
            }
          })
          .catch(() => {});
      }
    }
  };

  const handleSaveAcct = async () => {
    const errors: Record<string, string> = {};
    if (!acctForm.email || !acctForm.email.includes("@")) {
      errors.email = "E-mail inválido.";
    }
    if (String(acctForm.nome).trim().split(/\s+/).length < 2) {
      errors.nome = "Informe nome e sobrenome.";
    }
    if (dg(acctForm.cpf).length !== 11) {
      errors.cpf = "CPF incompleto (11 dígitos).";
    }
    if (dg(acctForm.fone).length < 10) {
      errors.fone = "Telefone incompleto.";
    }
    if (dg(acctForm.cep).length !== 8) {
      errors.cep = "CEP de 8 dígitos.";
    }
    (["rua", "num", "bairro", "cidade"] as const).forEach((k) => {
      if (!String(acctForm[k]).trim()) errors[k] = "Obrigatório.";
    });
    if (String(acctForm.uf).trim().length !== 2) {
      errors.uf = "2 letras.";
    }

    if (Object.keys(errors).length > 0) {
      setAcctErrors(errors);
      setAcctMsg("");
      return;
    }

    setSavingAcct(true);
    setAcctMsg("");

    try {
      const res = await fetch("/api/account/orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(acctForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAcctErrors({ nome: data.error || "Erro ao salvar." });
        return;
      }

      // Sincroniza também no localStorage para pré-preencher o checkout na loja
      try {
        window.localStorage.setItem(
          "munaya.conta.v1",
          JSON.stringify({ account: acctForm, orders: [] })
        );
        window.localStorage.setItem(
          "munaya.draft.checkout",
          JSON.stringify({
            ckForm: acctForm,
            ckCep: acctForm.cep,
            ckCity: `${acctForm.cidade}, ${acctForm.uf}`,
          })
        );
      } catch (e) {}

      setAcctErrors({});
      setAcctMsg("Dados salvos.");
    } catch (err) {
      setAcctErrors({ nome: "Falha de conexão ao salvar." });
    } finally {
      setSavingAcct(false);
    }
  };

  const handleSavePw = async () => {
    setPwErr("");
    setPwMsg("");

    if (String(pwForm.nova).length < 6) {
      setPwErr("Nova senha: mínimo 6 caracteres.");
      return;
    }
    if (pwForm.nova !== pwForm.conf) {
      setPwErr("As senhas não conferem.");
      return;
    }

    setSavingPw(true);
    try {
      // Se preencheu senha atual, valida antes
      if (pwForm.atual && currentUser?.email) {
        const { error: checkErr } = await supabase.auth.signInWithPassword({
          email: currentUser.email,
          password: pwForm.atual,
        });
        if (checkErr) {
          setPwErr("Senha atual incorreta.");
          setSavingPw(false);
          return;
        }
      }

      const { error } = await supabase.auth.updateUser({
        password: pwForm.nova,
      });

      if (error) {
        setPwErr(error.message || "Não foi possível atualizar a senha.");
        return;
      }

      setPwForm({ atual: "", nova: "", conf: "" });
      setPwMsg("Senha atualizada.");
    } catch (err) {
      setPwErr("Erro ao trocar senha.");
    } finally {
      setSavingPw(false);
    }
  };

  const firstName = acctForm.nome
    ? String(acctForm.nome).trim().split(/\s+/)[0]
    : currentUser?.email
    ? String(currentUser.email).split("@")[0]
    : "Cliente";

  if (checkingAuth) {
    return (
      <div className="min-h-[85vh] w-full flex flex-col items-center justify-center p-8 bg-black text-white">
        <Loader2 className="w-8 h-8 text-[#ff66c4] animate-spin mb-3" />
        <span className="font-oswald text-sm uppercase tracking-widest text-neutral-400">
          Carregando Área do Cliente...
        </span>
      </div>
    );
  }

  // ============================================================================
  // VISÃO LOGADA: ÁREA DO CLIENTE COMPLETA (DESIGN CLAUDE V3)
  // ============================================================================
  if (currentUser) {
    return (
      <div
        className="w-full min-h-screen bg-black text-white box-border"
        style={{ padding: "clamp(16px, 4vw, 32px)" }}
      >
        {/* Topo: Nome, E-mail e Botão Sair */}
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div
              className="font-bold uppercase tracking-[0.22em]"
              style={{ fontSize: "13px", color: "#ff66c4" }}
            >
              Área do cliente
            </div>
            <h1
              className="font-oswald font-bold uppercase m-0 mt-3"
              style={{
                fontSize: "clamp(44px, 6vw, 88px)",
                letterSpacing: "-0.05em",
                lineHeight: 0.92,
              }}
            >
              {firstName}
            </h1>
            <p
              className="m-0 mt-2.5 font-bold uppercase tracking-[0.08em] opacity-60"
              style={{ fontSize: "15px" }}
            >
              {currentUser.email}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="cursor-pointer border-2 border-white bg-transparent text-white hover:bg-white hover:text-black font-oswald font-bold uppercase transition-colors"
            style={{ fontSize: "20px", padding: "12px 22px" }}
          >
            Sair
          </button>
        </div>

        {/* Abas: Pedidos | Dados cadastrais | Senha */}
        <div className="mt-8 flex flex-wrap gap-2">
          {(
            [
              { id: "pedidos", label: `Pedidos${orders.length ? ` (${orders.length})` : ""}` },
              { id: "dados", label: "Dados cadastrais" },
              { id: "senha", label: "Senha" },
            ] as const
          ).map((t) => {
            const active = acctTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setAcctTab(t.id);
                  setAcctMsg("");
                  setPwMsg("");
                  setPwErr("");
                }}
                className="cursor-pointer border-2 border-white font-oswald font-bold uppercase transition-colors"
                style={{
                  fontSize: "20px",
                  padding: "11px 20px",
                  background: active ? "#ffffff" : "transparent",
                  color: active ? "#000000" : "#ffffff",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ABA 1: PEDIDOS */}
        {acctTab === "pedidos" && (
          <div className="mt-9 max-w-[900px]">
            {loadingOrders ? (
              <div className="border-2 border-white p-8 flex items-center gap-3">
                <Loader2 className="w-6 h-6 text-[#ff66c4] animate-spin" />
                <span className="font-oswald text-xl uppercase font-bold">
                  Sincronizando seus pedidos...
                </span>
              </div>
            ) : orders.length === 0 ? (
              <div className="border-2 border-white p-8">
                <p
                  className="m-0 font-oswald font-bold uppercase"
                  style={{ fontSize: "28px" }}
                >
                  Nenhum pedido ainda
                </p>
                <p
                  className="m-0 mt-2.5 opacity-70"
                  style={{ fontSize: "16px", lineHeight: 1.5 }}
                >
                  Quando você fechar um pedido ele aparece aqui, com prazo e rastreio.
                </p>
                <Link
                  href="/?screen=categoria"
                  className="inline-block mt-6 bg-white text-black hover:bg-[#ff66c4] hover:text-black font-oswald font-bold uppercase transition-colors"
                  style={{ fontSize: "22px", padding: "14px 22px" }}
                >
                  Ver a coleção
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {orders.map((o) => {
                  const isOpen = openOrderId === o.id;
                  const itemsList = Array.isArray(o.items) ? o.items : [];
                  const totalQty = itemsList.reduce(
                    (acc: number, it: any) => acc + Number(it.quantity || it.qty || 1),
                    0
                  );
                  const dateStr = o.created_at
                    ? new Date(o.created_at).toLocaleDateString("pt-BR")
                    : "";
                  const statusInfo = getOrderStatusInfo(o.status, o.dimona_order_id);
                  const addressLine = o.street
                    ? `${o.street}, ${o.number || "S/N"}${
                        o.complement ? ` · ${o.complement}` : ""
                      } — ${o.neighborhood || ""}`
                    : "Endereço informado no pedido";
                  const shippingLine = `${o.shipping_carrier || "Entrega"} · ${
                    o.city || ""
                  }/${o.state || ""} · CEP ${o.zipcode || ""}`;
                  const paymentLine =
                    o.payment_method === "credit_card" || o.payment_method === "cartao"
                      ? "Cartão de crédito"
                      : "PIX";

                  return (
                    <div key={o.id} className="border-2 border-white">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setOpenOrderId(isOpen ? null : o.id)}
                        className="cursor-pointer flex flex-wrap items-center justify-between gap-5 p-5 hover:bg-neutral-950 transition-colors"
                      >
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <span
                            className="font-oswald font-bold uppercase leading-none"
                            style={{ fontSize: "30px" }}
                          >
                            #{o.id}
                          </span>
                          <span
                            className="font-bold uppercase tracking-[0.08em] opacity-60"
                            style={{ fontSize: "13px" }}
                          >
                            {dateStr} · {totalQty} {totalQty === 1 ? "item" : "itens"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-5">
                          <span
                            className="font-bold uppercase tracking-[0.1em]"
                            style={{
                              fontSize: "12px",
                              background: statusInfo.bg,
                              color: statusInfo.fg,
                              border: `2px solid ${statusInfo.bg}`,
                              padding: "6px 12px",
                            }}
                          >
                            {statusInfo.label}
                          </span>
                          <span
                            className="font-oswald font-bold whitespace-nowrap"
                            style={{ fontSize: "28px" }}
                          >
                            {formatBrl(o.total_amount)}
                          </span>
                          <span
                            className="font-bold uppercase tracking-[0.1em] opacity-60"
                            style={{ fontSize: "12px" }}
                          >
                            {isOpen ? "Fechar" : "Detalhes"}
                          </span>
                        </div>
                      </div>

                      {isOpen && (
                        <div
                          className="border-t-2 border-white p-5 grid gap-6"
                          style={{
                            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                          }}
                        >
                          {/* Coluna 1: Itens */}
                          <div className="flex flex-col gap-2.5">
                            <span
                              className="font-bold uppercase tracking-[0.14em] opacity-55"
                              style={{ fontSize: "11px" }}
                            >
                              Itens
                            </span>
                            {itemsList.map((it: any, idx: number) => {
                              const q = Number(it.quantity || it.qty || 1);
                              const p = Number(it.price || it.unit_price || 0);
                              return (
                                <div
                                  key={idx}
                                  className="flex items-baseline justify-between gap-3.5"
                                >
                                  <span className="font-semibold" style={{ fontSize: "15px" }}>
                                    {it.name}
                                  </span>
                                  <span
                                    className="opacity-70 whitespace-nowrap"
                                    style={{ fontSize: "14px" }}
                                  >
                                    Tam {it.size || "M"} · {q} un · {formatBrl(p * q)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Coluna 2: Entrega */}
                          <div className="flex flex-col gap-2.5">
                            <span
                              className="font-bold uppercase tracking-[0.14em] opacity-55"
                              style={{ fontSize: "11px" }}
                            >
                              Entrega
                            </span>
                            <span style={{ fontSize: "15px", lineHeight: 1.5 }}>
                              {addressLine}
                            </span>
                            <span
                              className="opacity-70"
                              style={{ fontSize: "14px", lineHeight: 1.5 }}
                            >
                              {shippingLine}
                            </span>
                          </div>

                          {/* Coluna 3: Pagamento & Rastreio */}
                          <div className="flex flex-col gap-2.5">
                            <span
                              className="font-bold uppercase tracking-[0.14em] opacity-55"
                              style={{ fontSize: "11px" }}
                            >
                              Pagamento
                            </span>
                            <span style={{ fontSize: "15px", lineHeight: 1.5 }}>
                              {paymentLine}
                            </span>

                            <span
                              className="font-bold uppercase tracking-[0.14em] opacity-55 mt-2"
                              style={{ fontSize: "11px" }}
                            >
                              Rastreio
                            </span>
                            {o.tracking_code ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-[#ff66c4] font-bold">
                                  {o.tracking_code}
                                </span>
                                {o.tracking_url && (
                                  <a
                                    href={o.tracking_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs uppercase font-bold underline text-white hover:text-[#ff66c4]"
                                  >
                                    <span>Rastrear</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="font-mono text-sm opacity-75">
                                {statusInfo.label === "Aguardando Pix"
                                  ? "Aguardando confirmação do pagamento"
                                  : "Código será enviado assim que postado"}
                              </span>
                            )}

                            {/* Se ainda estiver aguardando Pix e houver pix_code, permite copiar */}
                            {statusInfo.label === "Aguardando Pix" && o.pix_code && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(o.pix_code);
                                  setCopiedPixId(o.id);
                                  setTimeout(() => setCopiedPixId(null), 2500);
                                }}
                                className="mt-2 inline-flex items-center justify-center gap-2 border border-[#ff66c4] bg-[#ff66c4] text-black font-oswald text-sm font-bold uppercase py-2 px-3 cursor-pointer"
                              >
                                {copiedPixId === o.id ? (
                                  <>
                                    <Check className="w-4 h-4" />
                                    <span>Código PIX Copiado!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4" />
                                    <span>Copiar Código PIX</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA 2: DADOS CADASTRAIS */}
        {acctTab === "dados" && (
          <div className="mt-9 max-w-[760px]">
            <div className="grid grid-cols-12 gap-[18px]">
              {(
                [
                  { k: "nome", label: "Nome completo", span: "col-span-12", ph: "Como está no documento", mode: "text", max: 80 },
                  { k: "email", label: "E-mail", span: "col-span-12", ph: "voce@email.com", mode: "email", max: 80, readOnly: true },
                  { k: "cpf", label: "CPF", span: "col-span-12 md:col-span-6", ph: "000.000.000-00", mode: "numeric", max: 14 },
                  { k: "fone", label: "Celular", span: "col-span-12 md:col-span-6", ph: "(11) 90000-0000", mode: "numeric", max: 16 },
                  { k: "cep", label: "CEP", span: "col-span-12 md:col-span-4", ph: "00000-000", mode: "numeric", max: 9 },
                  { k: "rua", label: "Rua", span: "col-span-12 md:col-span-8", ph: "Nome da rua", mode: "text", max: 80 },
                  { k: "num", label: "Número", span: "col-span-6 md:col-span-3", ph: "000", mode: "numeric", max: 10 },
                  { k: "compl", label: "Complemento", span: "col-span-6 md:col-span-4", ph: "Apto, bloco (opcional)", mode: "text", max: 60 },
                  { k: "bairro", label: "Bairro", span: "col-span-12 md:col-span-5", ph: "Bairro", mode: "text", max: 60 },
                  { k: "cidade", label: "Cidade", span: "col-span-9 md:col-span-9", ph: "Cidade", mode: "text", max: 60 },
                  { k: "uf", label: "UF", span: "col-span-3 md:col-span-3", ph: "RS", mode: "text", max: 2 },
                ] as const
              ).map((f) => {
                const err = acctErrors[f.k];
                return (
                  <label
                    key={f.k}
                    className={`${f.span} flex flex-col gap-[7px] min-w-0`}
                  >
                    <span
                      className="font-bold uppercase tracking-[0.1em] opacity-70"
                      style={{ fontSize: "12px" }}
                    >
                      {f.label}
                    </span>
                    <input
                      type="text"
                      value={acctForm[f.k]}
                      readOnly={"readOnly" in f && f.readOnly}
                      onChange={(e) => updateAcctField(f.k, e.target.value)}
                      placeholder={f.ph}
                      inputMode={f.mode as any}
                      maxLength={f.max}
                      className="w-full box-border bg-transparent text-white font-sans font-semibold focus:outline-none"
                      style={{
                        border: `2px solid ${err ? "#ff66c4" : "#ffffff"}`,
                        fontSize: "17px",
                        padding: "13px 14px",
                        opacity: "readOnly" in f && f.readOnly ? 0.65 : 1,
                      }}
                    />
                    {err && (
                      <span
                        className="font-bold uppercase tracking-[0.06em]"
                        style={{ fontSize: "12px", color: "#ff66c4" }}
                      >
                        {err}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-[18px]">
              <button
                type="button"
                disabled={savingAcct}
                onClick={handleSaveAcct}
                className="border-none bg-white text-black hover:bg-[#ff66c4] hover:text-black font-oswald font-bold uppercase cursor-pointer transition-colors disabled:opacity-50"
                style={{ fontSize: "24px", padding: "16px 28px" }}
              >
                {savingAcct ? "Salvando..." : "Salvar dados"}
              </button>
              {acctMsg && (
                <span
                  className="font-bold uppercase tracking-[0.08em]"
                  style={{ fontSize: "13px", color: "#ff66c4" }}
                >
                  {acctMsg}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ABA 3: SENHA */}
        {acctTab === "senha" && (
          <div className="mt-9 max-w-[480px] flex flex-col gap-5">
            {(
              [
                { k: "atual", label: "Senha atual" },
                { k: "nova", label: "Nova senha" },
                { k: "conf", label: "Confirmar nova senha" },
              ] as const
            ).map((f) => (
              <label key={f.k} className="flex flex-col gap-[7px]">
                <span
                  className="font-bold uppercase tracking-[0.1em] opacity-70"
                  style={{ fontSize: "12px" }}
                >
                  {f.label}
                </span>
                <input
                  type="password"
                  value={pwForm[f.k]}
                  onChange={(e) => {
                    setPwForm((prev) => ({ ...prev, [f.k]: e.target.value }));
                    setPwErr("");
                    setPwMsg("");
                  }}
                  placeholder="••••••"
                  autoComplete="off"
                  className="w-full box-border bg-transparent border-2 border-white text-white font-sans font-semibold focus:outline-none focus:border-[#ff66c4]"
                  style={{ fontSize: "17px", padding: "13px 14px" }}
                />
              </label>
            ))}

            {pwErr && (
              <p
                className="m-0 font-bold uppercase tracking-[0.08em]"
                style={{ fontSize: "13px", color: "#ff66c4" }}
              >
                {pwErr}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-[18px]">
              <button
                type="button"
                disabled={savingPw}
                onClick={handleSavePw}
                className="border-none bg-white text-black hover:bg-[#ff66c4] hover:text-black font-oswald font-bold uppercase cursor-pointer transition-colors disabled:opacity-50"
                style={{ fontSize: "24px", padding: "16px 28px" }}
              >
                {savingPw ? "Atualizando..." : "Trocar senha"}
              </button>
              {pwMsg && (
                <span
                  className="font-bold uppercase tracking-[0.08em]"
                  style={{ fontSize: "13px", color: "#ff66c4" }}
                >
                  {pwMsg}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // VISÃO DESLOGADA: ENTRAR / CRIAR CONTA (DESIGN CLAUDE V3)
  // ============================================================================
  return (
    <div
      className="w-full min-h-screen bg-black text-white box-border flex flex-col justify-center max-w-[560px]"
      style={{ padding: "clamp(16px, 4vw, 32px)" }}
    >
      <div
        className="font-bold uppercase tracking-[0.22em]"
        style={{ fontSize: "13px", color: "#ff66c4" }}
      >
        Área do cliente
      </div>
      <h1
        className="font-oswald font-bold uppercase m-0 mt-3"
        style={{
          fontSize: "clamp(48px, 7vw, 92px)",
          letterSpacing: "-0.05em",
          lineHeight: 0.92,
        }}
      >
        {authMode === "login" ? "Entrar" : "Criar conta"}
      </h1>

      {/* Abas estilo Claude v3 */}
      <div className="mt-7 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setAuthMode("login");
            setErrorMsg("");
          }}
          className="cursor-pointer border-2 border-white font-oswald font-bold uppercase transition-colors"
          style={{
            fontSize: "18px",
            padding: "10px 20px",
            background: authMode === "login" ? "#ffffff" : "transparent",
            color: authMode === "login" ? "#000000" : "#ffffff",
          }}
        >
          Já tenho conta
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode("register");
            setErrorMsg("");
          }}
          className="cursor-pointer border-2 border-white font-oswald font-bold uppercase transition-colors"
          style={{
            fontSize: "18px",
            padding: "10px 20px",
            background: authMode === "register" ? "#ffffff" : "transparent",
            color: authMode === "register" ? "#000000" : "#ffffff",
          }}
        >
          Criar conta
        </button>
      </div>

      {registerSuccessMsg && (
        <div className="mt-6 border-2 border-emerald-500 bg-emerald-950/60 text-emerald-200 p-3.5 text-xs flex items-center gap-2 font-bold uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{registerSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mt-6 border-2 border-[#ff66c4] bg-neutral-950 text-[#ff66c4] p-3.5 text-xs flex items-center gap-2 font-bold uppercase tracking-wider">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#ff66c4]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {authMode === "login" ? (
        <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-[7px]">
            <span
              className="font-bold uppercase tracking-[0.1em] opacity-70"
              style={{ fontSize: "12px" }}
            >
              E-mail
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              inputMode="email"
              className="w-full box-border bg-transparent border-2 border-white text-white font-sans font-semibold focus:outline-none focus:border-[#ff66c4]"
              style={{ fontSize: "17px", padding: "14px" }}
            />
          </label>

          <div className="flex flex-col gap-[7px]">
            <div className="flex items-center justify-between">
              <span
                className="font-bold uppercase tracking-[0.1em] opacity-70"
                style={{ fontSize: "12px" }}
              >
                Senha
              </span>
              <Link
                href="/esqueci-senha"
                className="font-bold uppercase tracking-[0.08em] text-[#ff66c4] hover:underline"
                style={{ fontSize: "12px" }}
              >
                Esqueci minha senha
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                autoComplete="current-password"
                className="w-full box-border bg-transparent border-2 border-white text-white font-sans font-semibold focus:outline-none focus:border-[#ff66c4] pr-12"
                style={{ fontSize: "17px", padding: "14px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full border-none bg-white text-black hover:bg-[#ff66c4] hover:text-black font-oswald font-bold uppercase cursor-pointer transition-colors disabled:opacity-50"
            style={{ fontSize: "28px", padding: "18px 0" }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-[7px]">
            <span
              className="font-bold uppercase tracking-[0.1em] opacity-70"
              style={{ fontSize: "12px" }}
            >
              E-mail
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              inputMode="email"
              className="w-full box-border bg-transparent border-2 border-white text-white font-sans font-semibold focus:outline-none focus:border-[#ff66c4]"
              style={{ fontSize: "17px", padding: "14px" }}
            />
          </label>

          <label className="flex flex-col gap-[7px]">
            <span
              className="font-bold uppercase tracking-[0.1em] opacity-70"
              style={{ fontSize: "12px" }}
            >
              Criar senha (mínimo 6 caracteres)
            </span>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              autoComplete="new-password"
              className="w-full box-border bg-transparent border-2 border-white text-white font-sans font-semibold focus:outline-none focus:border-[#ff66c4]"
              style={{ fontSize: "17px", padding: "14px" }}
            />
          </label>

          <label className="flex flex-col gap-[7px]">
            <span
              className="font-bold uppercase tracking-[0.1em] opacity-70"
              style={{ fontSize: "12px" }}
            >
              Confirmar senha
            </span>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••"
              autoComplete="new-password"
              className="w-full box-border bg-transparent border-2 border-white text-white font-sans font-semibold focus:outline-none focus:border-[#ff66c4]"
              style={{ fontSize: "17px", padding: "14px" }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full border-none bg-[#ff66c4] text-black hover:bg-white hover:text-black font-oswald font-bold uppercase cursor-pointer transition-colors disabled:opacity-50"
            style={{ fontSize: "28px", padding: "18px 0" }}
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>
      )}

      <p
        className="m-0 mt-7 opacity-70"
        style={{ fontSize: "15px", lineHeight: 1.55 }}
      >
        Acesse sua conta para acompanhar seus pedidos em tempo real, consultar códigos de rastreamento e manter seu endereço salvo para as próximas compras.
      </p>

      <Link
        href="/?screen=categoria"
        className="self-start mt-4 font-bold uppercase tracking-[0.1em] border-b border-white pb-0.5 opacity-75 hover:opacity-100"
        style={{ fontSize: "13px" }}
      >
        Ir para a coleção
      </Link>
    </div>
  );
}
