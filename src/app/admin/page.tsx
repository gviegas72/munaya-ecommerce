"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  EyeOff,
  Search,
  MessageCircle,
  Truck,
  DollarSign,
  Layers,
  Lock,
  LogOut,
  Mail,
} from "lucide-react";

interface OrderItem {
  name: string;
  size?: string;
  qty?: number;
  quantity?: number;
  price?: number;
  unit_price?: number;
  sku?: string;
  image_url?: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_cpf: string;
  customer_phone?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  total_amount: number;
  shipping_amount: number;
  shipping_carrier?: string;
  payment_method: string;
  payment_status: string;
  dimona_id?: string;
  dimona_status?: string;
  tracking_code?: string;
  tracking_url?: string;
  items: OrderItem[];
  created_at: string;
}

interface Product {
  id: number;
  slug: string;
  name: string;
  subtitle?: string;
  price: number;
  compare_at_price?: number;
  image_url: string;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  badge?: string;
}

export interface CollectionInfo {
  id: string;
  name: string;
  tag: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  defaultProductIds: number[];
}

export const ADMIN_COLLECTIONS: CollectionInfo[] = [
  {
    id: "bonzo",
    name: "Bonzo Series",
    tag: "Bonzo Series",
    color: "#ff66c4",
    badgeBg: "bg-pink-950/60 border-[#ff66c4]",
    badgeText: "text-[#ff66c4]",
    defaultProductIds: [1, 5],
  },
  {
    id: "dimebag",
    name: "Dimebag & Heavy",
    tag: "Dimebag & Heavy",
    color: "#ef4444",
    badgeBg: "bg-red-950/60 border-red-500",
    badgeText: "text-red-400",
    defaultProductIds: [2, 4],
  },
  {
    id: "ghost",
    name: "Ghost Division",
    tag: "Ghost Division",
    color: "#a855f7",
    badgeBg: "bg-purple-950/60 border-purple-500",
    badgeText: "text-purple-400",
    defaultProductIds: [3, 11],
  },
  {
    id: "stoner",
    name: "Stoner & Sludge",
    tag: "Stoner & Sludge",
    color: "#eab308",
    badgeBg: "bg-amber-950/60 border-amber-500",
    badgeText: "text-amber-400",
    defaultProductIds: [6, 10, 14, 15],
  },
  {
    id: "grunge",
    name: "Grunge & Roots",
    tag: "Grunge & Roots",
    color: "#10b981",
    badgeBg: "bg-emerald-950/60 border-emerald-500",
    badgeText: "text-emerald-400",
    defaultProductIds: [7, 8, 13],
  },
  {
    id: "classics",
    name: "Rock Classics",
    tag: "Rock Classics",
    color: "#38bdf8",
    badgeBg: "bg-sky-950/60 border-sky-500",
    badgeText: "text-sky-400",
    defaultProductIds: [9, 12],
  },
];

export function getProductCollection(prod: Product): CollectionInfo | undefined {
  if (prod.badge) {
    const matchByBadge = ADMIN_COLLECTIONS.find(
      (c) => c.tag.toLowerCase() === prod.badge?.toLowerCase()
    );
    if (matchByBadge) return matchByBadge;
  }
  return ADMIN_COLLECTIONS.find((c) => c.defaultProductIds.includes(prod.id));
}

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<"orders" | "catalog">("orders");

  // Estados de Pedidos
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  // Estados do Catálogo
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [savingProductId, setSavingProductId] = useState<number | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [catalogSearch, setCatalogSearch] = useState<string>("");

  useEffect(() => {
    const savedPin = localStorage.getItem("munaya_admin_token");
    if (savedPin === "munaya2026") {
      setIsAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthed) {
      loadOrders();
      loadProducts();
    }
  }, [isAuthed]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === "munaya2026") {
      setIsAuthed(true);
      localStorage.setItem("munaya_admin_token", "munaya2026");
      setAuthError("");
    } else {
      setAuthError("PIN incorreto. Tente novamente.");
    }
  };

  const handleLogout = () => {
    setIsAuthed(false);
    localStorage.removeItem("munaya_admin_token");
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const savedPin = localStorage.getItem("munaya_admin_token") || "munaya2026";
      const res = await fetch("/api/orders", {
        headers: {
          "x-admin-pin": savedPin,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error("Erro ao carregar pedidos:", e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const savedPin = localStorage.getItem("munaya_admin_token") || "munaya2026";
      const res = await fetch("/api/products?admin=true", {
        headers: {
          "x-admin-pin": savedPin,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (e) {
      console.error("Erro ao carregar catálogo:", e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleUpdateProduct = async (prod: Product) => {
    setSavingProductId(prod.id);
    const cleanPrice = Number(String(prod.price).replace(",", "."));
    if (isNaN(cleanPrice) || cleanPrice <= 0) {
      alert("Por favor, digite um preço válido (ex: 99.90 ou 99,90).");
      setSavingProductId(null);
      return;
    }
    const cleanOrder = parseInt(String(prod.display_order), 10) || 1;

    try {
      const savedPin = localStorage.getItem("munaya_admin_token") || "munaya2026";
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": savedPin,
        },
        body: JSON.stringify({
          id: prod.id,
          price: cleanPrice,
          display_order: cleanOrder,
          is_active: Boolean(prod.is_active),
          is_featured: Boolean(prod.is_featured),
          badge: prod.badge || "",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg(`Produto #${prod.id} (${prod.name}) atualizado!`);
        setTimeout(() => setActionMsg(""), 3000);
      } else {
        const errText =
          typeof data.error === "object"
            ? JSON.stringify(data.error)
            : String(data.error || "Erro desconhecido");
        alert("Erro ao salvar: " + errText);
      }
    } catch (e: any) {
      console.error("Erro:", e);
      alert("Erro ao salvar: " + (e?.message || String(e)));
    } finally {
      setSavingProductId(null);
    }
  };

  const handleConfirmPayment = async (order: Order) => {
    if (!confirm(`Confirmar o recebimento do pagamento do pedido #${order.id} e despachar agora?`)) {
      return;
    }
    await handleDispatchDimona(order);
  };

  const handleSendEmail = async (order: Order, type: "created" | "paid" | "shipped") => {
    let trackingCode = order.tracking_code;
    if (type === "shipped" && !trackingCode) {
      const input = prompt(
        "Digite o código de rastreamento da transportadora/Correios:",
        "BR" + order.id.replace(/\D/g, "") + "MY"
      );
      if (!input) return;
      trackingCode = input.trim();
    }

    setActionMsg(`Enviando e-mail (${type}) para ${order.customer_email}...`);
    try {
      const savedPin = localStorage.getItem("munaya_admin_token") || "munaya2026";
      const res = await fetch("/api/orders/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": savedPin,
        },
        body: JSON.stringify({
          order_id: order.id,
          type,
          tracking_code: trackingCode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg(`✉️ E-mail enviado com sucesso para ${order.customer_email}!`);
        setTimeout(() => setActionMsg(""), 3500);
        loadOrders();
      } else {
        alert("Erro no envio do e-mail: " + (data.error || "Falha"));
      }
    } catch (e: any) {
      alert("Erro ao enviar e-mail: " + (e?.message || String(e)));
    }
  };

  const handleDispatchDimona = async (order: Order) => {
    if (!confirm(`Deseja despachar o pedido ${order.id} para a fábrica Dimona agora?`)) {
      return;
    }
    setActionMsg(`Despachando pedido ${order.id} para a Dimona...`);
    try {
      const savedPin = localStorage.getItem("munaya_admin_token") || "munaya2026";
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": savedPin,
        },
        body: JSON.stringify({
          id: order.id,
          customer: {
            name: order.customer_name,
            email: order.customer_email,
            cpf: order.customer_cpf,
            phone: order.customer_phone,
          },
          address: {
            street: order.street,
            number: order.number,
            complement: order.complement,
            neighborhood: order.neighborhood,
            city: order.city,
            state: order.state,
            zipcode: order.zipcode,
          },
          shipping_speed: "PAC",
          items: order.items,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg(`✅ Pedido ${order.id} despachado com sucesso para a Dimona!`);
        loadOrders();
      } else {
        alert("Erro no despacho: " + (data.error || "Falha"));
      }
    } catch (e) {
      console.error("Erro:", e);
    }
  };

  // Métricas
  const totalFaturamento = orders
    .filter((o) => o.payment_status === "pago")
    .reduce((acc, cur) => acc + Number(cur.total_amount || 0), 0);

  const totalPagos = orders.filter((o) => o.payment_status === "pago").length;
  const totalDimona = orders.filter((o) => !!o.dimona_id).length;

  const filteredOrders = orders.filter((o) => {
    const q = orderSearch.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_email.toLowerCase().includes(q) ||
      (o.dimona_id && o.dimona_id.toLowerCase().includes(q))
    );
  });

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md border-2 border-white bg-black p-8 shadow-[8px_8px_0px_#ff66c4]">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-8 h-8 text-[#ff66c4]" />
            <h1 className="font-oswald text-3xl font-black uppercase tracking-tight">
              Munaya Admin
            </h1>
          </div>
          <p className="text-sm text-neutral-400 mb-6 uppercase tracking-wider font-semibold">
            Central de Gestão e Operações // Acesso Restrito
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-bold tracking-widest text-neutral-300 mb-2">
                PIN de Segurança
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Digite o PIN..."
                autoFocus
                className="w-full bg-neutral-900 border-2 border-white px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-[#ff66c4]"
              />
            </div>

            {authError && (
              <p className="text-xs uppercase font-bold text-[#ff66c4]">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-white text-black font-oswald text-xl font-black uppercase py-3 tracking-wider hover:bg-[#ff66c4] transition-colors"
            >
              Entrar no Painel
            </button>
          </form>

          <div className="mt-8 pt-4 border-t border-neutral-800 text-center">
            <Link
              href="/"
              className="text-xs uppercase font-bold text-neutral-500 hover:text-white"
            >
              ← Voltar para a Loja
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Top Bar */}
      <header className="border-b-2 border-white bg-black px-6 py-4 sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-oswald text-2xl md:text-3xl font-black uppercase tracking-tighter">
            Munaya<span className="text-[#ff66c4]">.Admin</span>
          </Link>
          <span className="hidden sm:inline-block text-xs bg-neutral-900 text-neutral-400 px-3 py-1 font-mono uppercase border border-neutral-700">
            Headless v2.0
          </span>
        </div>

        {actionMsg && (
          <div className="bg-[#ff66c4] text-black px-4 py-1 text-xs font-bold uppercase tracking-wider animate-pulse">
            {actionMsg}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 text-xs uppercase font-bold text-neutral-400 hover:text-white border border-neutral-700 px-3 py-2 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver Loja</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs uppercase font-bold text-neutral-400 hover:text-[#ff66c4] border border-neutral-700 px-3 py-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex border-b-2 border-white">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-6 py-3 font-oswald text-xl uppercase font-black tracking-tight transition-all ${
              activeTab === "orders"
                ? "bg-white text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Pedidos & Despacho ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("catalog")}
            className={`flex items-center gap-2 px-6 py-3 font-oswald text-xl uppercase font-black tracking-tight transition-all ${
              activeTab === "catalog"
                ? "bg-white text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Catálogo & Vitrine ({products.length})</span>
          </button>
        </div>

        {/* TAB 1: PEDIDOS */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-neutral-800 bg-neutral-950 p-4">
                <span className="text-xs uppercase font-bold text-neutral-500 tracking-wider">
                  Total de Pedidos
                </span>
                <p className="font-oswald text-3xl md:text-4xl font-bold mt-1">
                  {orders.length}
                </p>
              </div>

              <div className="border border-neutral-800 bg-neutral-950 p-4">
                <span className="text-xs uppercase font-bold text-neutral-500 tracking-wider">
                  Faturamento Pago
                </span>
                <p className="font-oswald text-3xl md:text-4xl font-bold mt-1 text-[#ff66c4]">
                  R$ {totalFaturamento.toFixed(2).replace(".", ",")}
                </p>
              </div>

              <div className="border border-neutral-800 bg-neutral-950 p-4">
                <span className="text-xs uppercase font-bold text-neutral-500 tracking-wider">
                  Pedidos Pagos (Pix)
                </span>
                <p className="font-oswald text-3xl md:text-4xl font-bold mt-1 text-emerald-400">
                  {totalPagos}
                </p>
              </div>

              <div className="border border-neutral-800 bg-neutral-950 p-4">
                <span className="text-xs uppercase font-bold text-neutral-500 tracking-wider">
                  Na Esteira Dimona
                </span>
                <p className="font-oswald text-3xl md:text-4xl font-bold mt-1 text-sky-400">
                  {totalDimona}
                </p>
              </div>
            </div>

            {/* Filter and Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-950 p-4 border border-neutral-800">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-3.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Buscar por ID, cliente, e-mail ou Dimona ID..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <button
                onClick={loadOrders}
                disabled={loadingOrders}
                className="flex items-center gap-2 border border-white px-4 py-2.5 text-xs uppercase font-bold hover:bg-white hover:text-black transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loadingOrders ? "animate-spin" : ""}`}
                />
                <span>Atualizar</span>
              </button>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="border border-neutral-800 p-12 text-center text-neutral-500 uppercase tracking-widest font-bold">
                Nenhum pedido encontrado.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const isPaid = order.payment_status === "pago";
                  const hasDimona = Boolean(order.dimona_id);
                  const cleanPhone = (order.customer_phone || "").replace(/\D/g, "");

                  return (
                    <div
                      key={order.id}
                      className="border-2 border-neutral-800 bg-neutral-950 p-6 space-y-4 hover:border-neutral-600 transition-colors"
                    >
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-oswald text-2xl font-bold tracking-tight">
                            #{order.id}
                          </span>

                          {/* Status Badge */}
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-950 border border-emerald-500 text-emerald-400 px-2.5 py-0.5 text-xs uppercase font-bold tracking-wider">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Pago
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-950 border border-amber-500 text-amber-400 px-2.5 py-0.5 text-xs uppercase font-bold tracking-wider">
                              <Clock className="w-3.5 h-3.5" />
                              Aguardando Pix
                            </span>
                          )}

                          {hasDimona && (
                            <span className="inline-flex items-center gap-1 bg-sky-950 border border-sky-500 text-sky-400 px-2.5 py-0.5 text-xs uppercase font-bold tracking-wider">
                              <Truck className="w-3.5 h-3.5" />
                              Dimona #{order.dimona_id}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-neutral-400 font-mono">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleString("pt-BR")
                            : "Recente"}
                        </div>
                      </div>

                      {/* Order Body Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        {/* Column 1: Cliente */}
                        <div className="space-y-1">
                          <span className="text-xs uppercase font-bold text-neutral-500 tracking-wider">
                            Cliente
                          </span>
                          <p className="font-bold text-white text-base">
                            {order.customer_name}
                          </p>
                          <p className="text-neutral-400 text-xs">
                            {order.customer_email}
                          </p>
                          <p className="text-neutral-400 text-xs font-mono">
                            CPF: {order.customer_cpf}
                          </p>
                          {order.customer_phone && (
                            <div className="pt-2">
                              <a
                                href={`https://wa.me/55${cleanPhone}?text=Ol%C3%A1%20${encodeURIComponent(order.customer_name)},%20sou%20da%20Munaya%20Rocks%20sobre%20seu%20pedido%20${order.id}!`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 border border-emerald-800 px-2.5 py-1 bg-emerald-950/40"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp: {order.customer_phone}</span>
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Column 2: Entrega */}
                        <div className="space-y-1">
                          <span className="text-xs uppercase font-bold text-neutral-500 tracking-wider">
                            Endereço de Entrega
                          </span>
                          <p className="text-white">
                            {order.street}, {order.number}
                            {order.complement ? ` - ${order.complement}` : ""}
                          </p>
                          <p className="text-neutral-400 text-xs">
                            {order.neighborhood} — {order.city}/{order.state}
                          </p>
                          <p className="text-neutral-400 text-xs font-mono">
                            CEP: {order.zipcode}
                          </p>
                          {order.shipping_carrier && (
                            <p className="text-neutral-500 text-xs pt-1">
                              Envio: {order.shipping_carrier} (R${" "}
                              {Number(order.shipping_amount || 0).toFixed(2)})
                            </p>
                          )}
                        </div>

                        {/* Column 3: Itens e Totais */}
                        <div className="space-y-2">
                          <span className="text-xs uppercase font-bold text-neutral-500 tracking-wider">
                            Itens do Pedido ({Array.isArray(order.items) ? order.items.length : 0})
                          </span>
                          <div className="space-y-1 max-h-36 overflow-y-auto pr-2">
                            {Array.isArray(order.items) &&
                              order.items.map((it, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-xs border-b border-neutral-900 pb-1"
                                >
                                  <div>
                                    <span className="font-bold text-white">
                                      {it.name}
                                    </span>
                                    <span className="text-neutral-400 ml-1">
                                      [{it.size || "M"}] x{it.qty || it.quantity || 1}
                                    </span>
                                  </div>
                                  <span className="font-mono text-neutral-300">
                                    R$ {Number(it.price || it.unit_price || 119).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                          </div>
                          <div className="pt-2 border-t border-neutral-800 flex justify-between items-baseline">
                            <span className="text-xs uppercase font-bold text-neutral-400">
                              Total Pago
                            </span>
                            <span className="font-oswald text-2xl font-bold text-[#ff66c4]">
                              R$ {Number(order.total_amount).toFixed(2).replace(".", ",")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-900">
                        <div className="flex items-center gap-3">
                          {order.tracking_url && (
                            <a
                              href={order.tracking_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Rastrear na Transportadora</span>
                            </a>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleSendEmail(order, isPaid ? "paid" : "created")}
                            title="Reenviar e-mail de notificação para o cliente"
                            className="inline-flex items-center gap-1.5 border border-neutral-700 bg-neutral-900 text-neutral-300 px-3 py-1.5 text-xs uppercase font-bold tracking-wider hover:text-white hover:border-neutral-500 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5 text-[#ff66c4]" />
                            <span>{isPaid ? "E-mail Pago" : "E-mail Pix"}</span>
                          </button>

                          <button
                            onClick={() => handleSendEmail(order, "shipped")}
                            title="Enviar código de rastreamento por e-mail"
                            className="inline-flex items-center gap-1.5 border border-sky-800 bg-sky-950/40 text-sky-400 px-3 py-1.5 text-xs uppercase font-bold tracking-wider hover:bg-sky-900/60 transition-colors"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>E-mail Rastreio</span>
                          </button>

                          {!isPaid && (
                            <button
                              onClick={() => handleConfirmPayment(order)}
                              className="inline-flex items-center gap-2 bg-emerald-500 text-black px-4 py-2 text-xs uppercase font-black tracking-wider hover:bg-white transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirmar Pagamento & Despachar</span>
                            </button>
                          )}

                          {!hasDimona && isPaid && (
                            <button
                              onClick={() => handleDispatchDimona(order)}
                              className="inline-flex items-center gap-2 bg-[#ff66c4] text-black px-4 py-2 text-xs uppercase font-black tracking-wider hover:bg-white transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Despachar Agora na Dimona</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CATÁLOGO */}
        {activeTab === "catalog" && (() => {
          const collectionCounts = ADMIN_COLLECTIONS.map((c) => {
            const prods = products.filter((p) => {
              const col = getProductCollection(p);
              return col?.id === c.id;
            });
            return {
              ...c,
              count: prods.length,
              activeCount: prods.filter((p) => p.is_active).length,
            };
          });

          const uncategorizedCount = products.filter(
            (p) => !getProductCollection(p)
          ).length;

          const filteredProducts = products.filter((prod) => {
            if (selectedCollection !== "all") {
              const col = getProductCollection(prod);
              if (selectedCollection === "none") {
                if (col) return false;
              } else {
                if (!col || col.id !== selectedCollection) return false;
              }
            }
            if (catalogSearch.trim()) {
              const q = catalogSearch.toLowerCase();
              const col = getProductCollection(prod);
              const matchesSearch =
                prod.name.toLowerCase().includes(q) ||
                prod.slug.toLowerCase().includes(q) ||
                String(prod.id).includes(q) ||
                (col && col.name.toLowerCase().includes(q));
              if (!matchesSearch) return false;
            }
            return true;
          });

          return (
            <div className="space-y-6">
              {/* Header do Catálogo */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-950 p-4 border border-neutral-800">
                <div>
                  <h2 className="font-oswald text-2xl font-bold uppercase tracking-tight">
                    Gestão de Coleções & Estampas
                  </h2>
                  <p className="text-xs text-neutral-400 uppercase tracking-wider">
                    Agrupe estampas nas coleções da Munaya, ajuste preços e controle a vitrine diretamente no Supabase.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={loadProducts}
                    disabled={loadingProducts}
                    className="flex items-center gap-2 border border-white px-4 py-2 text-xs uppercase font-bold hover:bg-white hover:text-black transition-colors"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${loadingProducts ? "animate-spin" : ""}`}
                    />
                    <span>Recarregar Catálogo</span>
                  </button>
                </div>
              </div>

              {/* Barra de Filtros por Coleção / Agrupamento */}
              <div className="bg-neutral-950 p-4 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#ff66c4]" />
                    Filtrar por Agrupamento de Estampas:
                  </span>
                  <span className="text-xs font-mono text-neutral-500">
                    Mostrando {filteredProducts.length} de {products.length} estampas
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {/* Botão Todas */}
                  <button
                    onClick={() => setSelectedCollection("all")}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-all ${
                      selectedCollection === "all"
                        ? "bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                        : "bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-white hover:border-neutral-500"
                    }`}
                  >
                    Todas ({products.length})
                  </button>

                  {/* Botões de Cada Coleção */}
                  {collectionCounts.map((col) => {
                    const isSelected = selectedCollection === col.id;
                    return (
                      <button
                        key={col.id}
                        onClick={() => setSelectedCollection(col.id)}
                        className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-white text-black border-white shadow-[0_0_12px_rgba(255,102,196,0.3)]"
                            : "bg-neutral-900 text-neutral-300 border-neutral-700 hover:border-neutral-500"
                        }`}
                        style={{
                          borderLeftWidth: "4px",
                          borderLeftColor: col.color,
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: col.color }}
                        />
                        <span>{col.name}</span>
                        <span className="text-[11px] opacity-75 font-mono">
                          ({col.count})
                        </span>
                      </button>
                    );
                  })}

                  {uncategorizedCount > 0 && (
                    <button
                      onClick={() => setSelectedCollection("none")}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-all ${
                        selectedCollection === "none"
                          ? "bg-white text-black border-white"
                          : "bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-white"
                      }`}
                    >
                      Sem Coleção ({uncategorizedCount})
                    </button>
                  )}
                </div>

                {/* Busca Textual */}
                <div className="pt-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Pesquisar estampa por nome, slug ou #ID..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#ff66c4]"
                    />
                  </div>
                </div>
              </div>

              {/* Grid de Produtos */}
              {filteredProducts.length === 0 ? (
                <div className="border border-neutral-800 p-12 text-center text-neutral-500 uppercase tracking-widest font-bold">
                  Nenhuma estampa encontrada para o filtro selecionado.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((prod) => {
                    const isSaving = savingProductId === prod.id;
                    const col = getProductCollection(prod);

                    return (
                      <div
                        key={prod.id}
                        className={`border-2 p-5 space-y-4 bg-neutral-950 transition-colors ${
                          prod.is_active
                            ? "border-neutral-800 hover:border-neutral-600"
                            : "border-red-950 opacity-60"
                        }`}
                      >
                        {/* Header: Imagem & Metadados */}
                        <div className="flex gap-4">
                          <div className="w-20 h-24 bg-neutral-900 border border-neutral-800 flex-none overflow-hidden relative">
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                            {/* Status Ativo na foto */}
                            <span
                              className={`absolute bottom-0 inset-x-0 text-[9px] uppercase font-bold text-center py-0.5 ${
                                prod.is_active
                                  ? "bg-emerald-900/90 text-emerald-200"
                                  : "bg-red-900/90 text-red-200"
                              }`}
                            >
                              {prod.is_active ? "Ativo" : "Pausado"}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-mono text-neutral-500">
                                #{prod.id}
                              </span>

                              {/* Badge de Coleção */}
                              {col ? (
                                <span
                                  className={`text-[10px] uppercase font-bold px-2 py-0.5 border ${col.badgeBg} ${col.badgeText}`}
                                >
                                  {col.name}
                                </span>
                              ) : (
                                <span className="text-[10px] uppercase font-bold bg-neutral-800 text-neutral-400 px-1.5 py-0.5">
                                  Sem Coleção
                                </span>
                              )}

                              {prod.is_featured && (
                                <span className="text-[10px] uppercase font-bold bg-amber-950 border border-amber-500 text-amber-300 px-1.5 py-0.5">
                                  ★ Destaque
                                </span>
                              )}
                            </div>

                            <h3 className="font-oswald text-xl font-bold uppercase truncate mt-1">
                              {prod.name}
                            </h3>
                            <p className="text-xs text-neutral-400 truncate font-mono">
                              slug: {prod.slug}
                            </p>
                          </div>
                        </div>

                        {/* Seletor de Coleção / Agrupamento */}
                        <div className="pt-2 border-t border-neutral-900">
                          <label className="block text-[11px] uppercase font-bold text-neutral-400 mb-1">
                            Agrupamento / Coleção
                          </label>
                          <select
                            value={col ? col.tag : prod.badge || ""}
                            onChange={(e) => {
                              const newBadge = e.target.value;
                              setProducts((prev) =>
                                prev.map((p) =>
                                  p.id === prod.id ? { ...p, badge: newBadge } : p
                                )
                              );
                            }}
                            className="w-full bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff66c4]"
                          >
                            <option value="">(Sem coleção específica)</option>
                            {ADMIN_COLLECTIONS.map((c) => (
                              <option key={c.id} value={c.tag}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Preço e Ordem na Vitrine */}
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-900">
                          <div>
                            <label className="block text-[11px] uppercase font-bold text-neutral-400 mb-1">
                              Preço (R$)
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={prod.price}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProducts((prev) =>
                                  prev.map((p) =>
                                    p.id === prod.id ? { ...p, price: val as any } : p
                                  )
                                );
                              }}
                              className="w-full bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-[#ff66c4]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] uppercase font-bold text-neutral-400 mb-1">
                              Ordem Vitrine
                            </label>
                            <input
                              type="number"
                              value={prod.display_order}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setProducts((prev) =>
                                  prev.map((p) =>
                                    p.id === prod.id ? { ...p, display_order: val } : p
                                  )
                                );
                              }}
                              className="w-full bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-[#ff66c4]"
                            />
                          </div>
                        </div>

                        {/* Toggles: Ativo e Destaque */}
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-xs">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={prod.is_active}
                              onChange={(e) => {
                                const val = e.target.checked;
                                setProducts((prev) =>
                                  prev.map((p) =>
                                    p.id === prod.id ? { ...p, is_active: val } : p
                                  )
                                );
                              }}
                              className="w-4 h-4 accent-[#ff66c4]"
                            />
                            <span className="uppercase font-bold text-neutral-300">
                              {prod.is_active ? "Ativo na Loja" : "Pausado"}
                            </span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={prod.is_featured}
                              onChange={(e) => {
                                const val = e.target.checked;
                                setProducts((prev) =>
                                  prev.map((p) =>
                                    p.id === prod.id ? { ...p, is_featured: val } : p
                                  )
                                );
                              }}
                              className="w-4 h-4 accent-[#ff66c4]"
                            />
                            <span className="uppercase font-bold text-neutral-300">
                              Destaque Home
                            </span>
                          </label>
                        </div>

                        {/* Botão Salvar Alterações */}
                        <button
                          onClick={() => handleUpdateProduct(prod)}
                          disabled={isSaving}
                          className="w-full bg-white text-black font-oswald text-base font-black uppercase py-2 tracking-wider hover:bg-[#ff66c4] transition-colors disabled:opacity-50"
                        >
                          {isSaving ? "Salvando..." : "Salvar Alterações"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
