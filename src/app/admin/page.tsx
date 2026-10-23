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
  Tag,
  Plus,
  Trash2,
  Upload,
  X,
  Image as ImageIcon,
  AlertCircle,
  Pencil,
  Calendar,
  Infinity as InfinityIcon,
  ToggleLeft,
  ToggleRight,
  Percent,
  Calculator,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Play,
  Users,
  Phone,
  MapPin,
  ShoppingCart,
  UserCheck,
  ShieldCheck,
  Shield,
  ShieldAlert,
  FileText,
  Check,
  Smartphone,
  Monitor,
} from "lucide-react";
import { Coupon } from "@/lib/coupons";
import { PricingSettings, DEFAULT_PRICING_SETTINGS, calculateSellingPrice, calculateFinancialSummary } from "@/lib/pricing";
import {
  OFFICIAL_COLORS,
  OFFICIAL_SIZES,
  generateBaseSku,
  generateVariantSku,
  ProductColor,
} from "@/lib/variants";
import {
  DIMONA_BLANKS,
  resolveDimonaSku,
} from "@/lib/dimona-mapping";
import { AggregatedCustomer } from "@/app/api/customers/route";


interface CouponFormData {
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  min_subtotal: number;
  description: string;
  is_active: boolean;
  is_perennial: boolean;
  expires_at: string;
  max_uses: string;
}

const INITIAL_COUPON_FORM: CouponFormData = {
  code: "",
  type: "percentage",
  value: 10,
  min_subtotal: 0,
  description: "",
  is_active: true,
  is_perennial: true,
  expires_at: "",
  max_uses: "",
};

interface NewProductForm {
  name: string;
  slug: string;
  sku: string;
  colors: ProductColor[];
  sizes: string[];
  subtitle: string;
  description: string;
  price: string;
  compare_at_price: string;
  image_url: string;
  artwork_url: string;
  gallery: string[];
  badge: string;
  is_active: boolean;
  is_featured: boolean;
  is_custom_price: boolean;
  dimona_product_id: string;
  blank_type: string;
  available_blanks?: string[];
  blank_prices?: Record<string, number>;
  display_order: number;
}

const INITIAL_NEW_PRODUCT: NewProductForm = {
  name: "",
  slug: "",
  sku: "MNY-TSH-NOVA",
  colors: OFFICIAL_COLORS, // Preta, Branca e Cinza
  sizes: Array.from(OFFICIAL_SIZES), // PP, P, M, G, GG, XGG
  subtitle: "100% Algodão Premium Silk Screen",
  description: "",
  price: "89.90",
  compare_at_price: "119.00",
  image_url: "",
  artwork_url: "",
  gallery: [],
  badge: "Bonzo Series",
  is_active: true,
  is_featured: false,
  is_custom_price: false,
  dimona_product_id: "",
  blank_type: "classic",
  available_blanks: ["classic", "moletom", "caneca", "bone", "ecobag"],
  blank_prices: {},
  display_order: 10,
};

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
  sku?: string;
  colors?: ProductColor[];
  sizes?: string[];
  subtitle?: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  image_url: string;
  artwork_url?: string;
  gallery?: string[];
  is_active: boolean;
  is_featured: boolean;
  is_custom_price?: boolean;
  dimona_product_id?: string;
  blank_type?: string;
  available_blanks?: string[];
  blank_prices?: Record<string, number>;
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
  const [mounted, setMounted] = useState(false);
  const [pin, setPin] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<"orders" | "customers" | "catalog" | "coupons" | "pricing" | "dimona" | "whatsapp" | "emails" | "audit">("orders");

  // Estados de Autenticação RBAC e Sessão
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    name: string;
    role: "super_admin" | "operator" | "viewer";
  } | null>(null);
  const [loginMode, setLoginMode] = useState<"credentials" | "pin">("credentials");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Estados da Trilha de Auditoria (Audit Logs)
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditFilterAction, setAuditFilterAction] = useState("all");
  const [auditSearch, setAuditSearch] = useState("");
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);

  // Estados da Central de Templates de E-mail (@react-email)
  const [emailPreviewTemplate, setEmailPreviewTemplate] = useState<"created" | "paid" | "shipped">("created");
  const [emailPreviewMode, setEmailPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [emailTestRecipient, setEmailTestRecipient] = useState("");
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [emailTestFeedback, setEmailTestFeedback] = useState("");
  const [emailTestError, setEmailTestError] = useState("");

  // Estados de Gestão de Clientes
  const [customers, setCustomers] = useState<AggregatedCustomer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<AggregatedCustomer | null>(null);

  // Estados da Evolution API (WhatsApp Transacional)
  const [evoSettings, setEvoSettings] = useState({
    baseUrl: "",
    instanceName: "munaya",
    apiKey: "",
    enabled: true,
  });
  const [evoStatus, setEvoStatus] = useState<{
    configured: boolean;
    state: string;
    qrcodeBase64?: string | null;
    pairingCode?: string | null;
    error?: string;
  }>({ configured: false, state: "unconfigured" });
  const [loadingEvo, setLoadingEvo] = useState(false);
  const [savingEvo, setSavingEvo] = useState(false);
  const [testingEvo, setTestingEvo] = useState(false);
  const [evoTestPhone, setEvoTestPhone] = useState("");
  const [evoFeedback, setEvoFeedback] = useState("");
  const [evoError, setEvoError] = useState("");

  // Estados de Pedidos
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [whatsappPreview, setWhatsappPreview] = useState<{
    orderId: string;
    customerName: string;
    type: "created" | "paid" | "shipped";
    phone: string;
    text: string;
    wa_me_url: string;
    simulated?: boolean;
  } | null>(null);
  // Estados de Gestão de Cupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponSearch, setCouponSearch] = useState("");
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCouponCode, setEditingCouponCode] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState<CouponFormData>(INITIAL_COUPON_FORM);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [deletingCouponCode, setDeletingCouponCode] = useState<string | null>(null);
  // Estados de Precificação Dinâmica & Custos Dimona
  const [pricingSettings, setPricingSettings] = useState<PricingSettings>(DEFAULT_PRICING_SETTINGS);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [savingPricing, setSavingPricing] = useState(false);
  const [applyingPricing, setApplyingPricing] = useState(false);
  const [pricingFeedback, setPricingFeedback] = useState("");

  // Estados da Esteira Dimona (De/Para)
  const [dimonaSearch, setDimonaSearch] = useState("");
  const [dimonaFilterBlank, setDimonaFilterBlank] = useState("all");
  const [simulatingDimona, setSimulatingDimona] = useState(false);
  const [dimonaSimulationResult, setDimonaSimulationResult] = useState<any | null>(null);
  const [updatingBlankId, setUpdatingBlankId] = useState<number | null>(null);



  // Estados do Catálogo
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [savingProductId, setSavingProductId] = useState<number | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [catalogSearch, setCatalogSearch] = useState<string>("");

  // Estados de Cadastro de Nova Estampa & Upload
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState<NewProductForm>(INITIAL_NEW_PRODUCT);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);

  // Estados de Edição Completa de Estampa
  const [editingProduct, setEditingProduct] = useState<
    (NewProductForm & { id: number }) | null
  >(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [uploadingEditArtwork, setUploadingEditArtwork] = useState(false);
  const [newGalleryUrlInput, setNewGalleryUrlInput] = useState("");
  const [editGalleryUrlInput, setEditGalleryUrlInput] = useState("");

  useEffect(() => {
    setMounted(true);
    try {
      const savedToken = localStorage.getItem("munaya_admin_token");
      const savedUserStr = localStorage.getItem("munaya_admin_user");
      if (savedToken) {
        if (savedUserStr) {
          try {
            const parsed = JSON.parse(savedUserStr);
            setCurrentUser(parsed);
          } catch {
            // fallback
          }
        }
        if (savedToken === "munaya2026") {
          setCurrentUser({
            id: "adm_super_master",
            email: "admin@munayarocks.com.br",
            name: "Master Admin (PIN)",
            role: "super_admin",
          });
        }
        setIsAuthed(true);
      }
    } catch (e) {
      console.warn("Storage inacessível:", e);
    }
  }, []);

  useEffect(() => {
    if (isAuthed) {
      loadOrders();
      loadCustomers();
      loadProducts();
      loadCoupons();
      loadPricing();
      loadEvolutionConfig();
      if (!currentUser || currentUser.role === "super_admin") {
        loadAuditLogs();
      }
    }
  }, [isAuthed, currentUser?.role]);

  const getAuthHeaders = (extra: Record<string, string> = {}) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("munaya_admin_token") || "munaya2026"
        : "munaya2026";
    return {
      "x-admin-pin": token,
      "x-admin-token": token,
      Authorization: `Bearer ${token}`,
      ...extra,
    };
  };

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const res = await fetch("/api/customers", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.customers)) {
        setCustomers(data.customers);
      }
    } catch (e) {
      console.error("Erro ao carregar clientes:", e);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadEvolutionConfig = async () => {
    setLoadingEvo(true);
    try {
      const res = await fetch("/api/whatsapp/config", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        if (data.settings) {
          setEvoSettings({
            baseUrl: data.settings.baseUrl || "",
            instanceName: data.settings.instanceName || "munaya",
            apiKey: data.settings.apiKey || "",
            enabled:
              data.settings.enabled !== undefined
                ? Boolean(data.settings.enabled)
                : true,
          });
        }
        if (data.status) {
          setEvoStatus(data.status);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar config Evolution API:", e);
    } finally {
      setLoadingEvo(false);
    }
  };

  const handleSaveEvolutionConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEvo(true);
    setEvoFeedback("");
    setEvoError("");
    try {
      const savedPin =
        localStorage.getItem("munaya_admin_token") || "munaya2026";
      const res = await fetch("/api/whatsapp/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": savedPin,
        },
        body: JSON.stringify(evoSettings),
      });
      const data = await res.json();
      if (data.success) {
        if (data.status) setEvoStatus(data.status);
        setEvoFeedback(
          data.status?.state === "open"
            ? "✅ Credenciais salvas! Instância conectada (OPEN) e pronta para disparos automáticos."
            : "✅ Credenciais salvas no Supabase! Verifique o status da instância abaixo."
        );
      } else {
        setEvoError(data.error || "Erro ao salvar credenciais.");
      }
    } catch (err: any) {
      setEvoError("Falha de conexão ao salvar credenciais.");
    } finally {
      setSavingEvo(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTestRecipient.trim() || !emailTestRecipient.includes("@")) {
      setEmailTestError("Informe um endereço de e-mail válido para o teste.");
      return;
    }
    setSendingTestEmail(true);
    setEmailTestFeedback("");
    setEmailTestError("");
    try {
      const savedPin =
        localStorage.getItem("munaya_admin_token") || "munaya2026";
      const res = await fetch("/api/emails/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": savedPin,
        },
        body: JSON.stringify({
          to: emailTestRecipient.trim(),
          template: emailPreviewTemplate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailTestFeedback(
          data.simulated
            ? `✅ E-mail '${emailPreviewTemplate}' renderizado com sucesso! (Modo simulado: configure RESEND_API_KEY no servidor para envio externo).`
            : `✅ E-mail transacional '${emailPreviewTemplate}' disparado com sucesso via Resend para ${emailTestRecipient}!`
        );
      } else {
        setEmailTestError(data.error || "Erro ao disparar e-mail de teste.");
      }
    } catch {
      setEmailTestError("Falha de conexão ao enviar e-mail de teste.");
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleFetchEvolutionQr = async () => {
    setLoadingEvo(true);
    setEvoError("");
    try {
      const savedPin =
        localStorage.getItem("munaya_admin_token") || "munaya2026";
      const res = await fetch("/api/whatsapp/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": savedPin,
        },
        body: JSON.stringify({ action: "qrcode" }),
      });
      const data = await res.json();
      if (data.success && data.status) {
        setEvoStatus(data.status);
      } else {
        setEvoError(data.error || "Não foi possível obter o QR Code.");
      }
    } catch {
      setEvoError("Erro ao consultar QR Code na Evolution API.");
    } finally {
      setLoadingEvo(false);
    }
  };

  const handleSendTestEvolution = async () => {
    if (!evoTestPhone.trim()) {
      setEvoError("Informe um número com DDD para enviar o teste (ex: 51999999999).");
      return;
    }
    setTestingEvo(true);
    setEvoFeedback("");
    setEvoError("");
    try {
      const savedPin =
        localStorage.getItem("munaya_admin_token") || "munaya2026";
      const res = await fetch("/api/whatsapp/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": savedPin,
        },
        body: JSON.stringify({
          action: "test",
          phone: evoTestPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEvoFeedback(
          `🚀 Mensagem de teste disparada via Evolution API para +${data.result?.phone}! Confira no seu WhatsApp.`
        );
      } else {
        setEvoError(
          data.error ||
            "A instância ainda não está conectada ou as credenciais estão incorretas."
        );
      }
    } catch {
      setEvoError("Erro ao disparar mensagem de teste.");
    } finally {
      setTestingEvo(false);
    }
  };

  const selectQuickAccount = (email: string, pass: string) => {
    setLoginMode("credentials");
    setLoginEmail(email);
    setLoginPassword(pass);
    setAuthError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setAuthError("");
    try {
      const payload =
        loginMode === "pin"
          ? { pin: pin.trim() }
          : { email: loginEmail.trim(), password: loginPassword.trim() };

      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.token && data.user) {
        localStorage.setItem("munaya_admin_token", data.token);
        localStorage.setItem("munaya_admin_user", JSON.stringify(data.user));
        setCurrentUser(data.user);
        setIsAuthed(true);
        setPin("");
        setLoginPassword("");
        setActionMsg(`✓ Conectado como ${data.user.name} (${data.user.role.toUpperCase()})`);
        setTimeout(() => setActionMsg(""), 3500);
      } else {
        setAuthError(data.error || "Credenciais inválidas. Tente novamente.");
      }
    } catch {
      setAuthError("Erro de conexão com o servidor ao autenticar.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthed(false);
    setCurrentUser(null);
    localStorage.removeItem("munaya_admin_token");
    localStorage.removeItem("munaya_admin_user");
  };

  const loadAuditLogs = async (customAction?: string, customSearch?: string) => {
    setLoadingAudit(true);
    try {
      const savedToken = localStorage.getItem("munaya_admin_token") || "munaya2026";
      const params = new URLSearchParams();
      params.set("limit", "100");
      const act = customAction !== undefined ? customAction : auditFilterAction;
      const srch = customSearch !== undefined ? customSearch : auditSearch;
      if (act && act !== "all") params.set("action", act);
      if (srch && srch.trim()) params.set("search", srch.trim());

      const res = await fetch(`/api/admin/audit?${params.toString()}`, {
        headers: {
          "x-admin-pin": savedToken,
          "x-admin-token": savedToken,
          Authorization: `Bearer ${savedToken}`,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setAuditLogs(data.logs);
      }
    } catch (e) {
      console.error("Erro ao carregar auditoria:", e);
    } finally {
      setLoadingAudit(false);
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/orders", {
        headers: getAuthHeaders(),
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

  const loadPricing = async () => {
    setLoadingPricing(true);
    try {
      const res = await fetch("/api/pricing", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.settings && data.settings.fabrics) {
        setPricingSettings({
          ...DEFAULT_PRICING_SETTINGS,
          ...data.settings,
          fabrics: {
            ...DEFAULT_PRICING_SETTINGS.fabrics,
            ...data.settings.fabrics,
          },
        });
      }
    } catch (e) {
      console.error("Erro ao carregar regras de precificação:", e);
    } finally {
      setLoadingPricing(false);
    }
  };

  const handleSavePricing = async () => {
    setSavingPricing(true);
    setPricingFeedback("");
    try {
      const savedPin = localStorage.getItem("munaya_admin_token") || "munaya2026";
      const res = await fetch("/api/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": savedPin,
        },
        body: JSON.stringify(pricingSettings),
      });
      const data = await res.json();
      if (data.success) {
        setPricingFeedback("Regras de precificação e custos salvas com sucesso!");
        setTimeout(() => setPricingFeedback(""), 3500);
      } else {
        setPricingFeedback("Erro ao salvar: " + (data.error || "Tente novamente."));
      }
    } catch {
      setPricingFeedback("Falha de conexão ao salvar regras.");
    } finally {
      setSavingPricing(false);
    }
  };

  const handleApplyPricingBatch = async () => {
    if (
      !confirm(
        "Deseja recalcular e atualizar os preços de venda de todas as peças do catálogo da loja com base nos custos Dimona e na margem de markup configurada?"
      )
    ) {
      return;
    }

    setApplyingPricing(true);
    setPricingFeedback("");
    try {
      const savedPin = localStorage.getItem("munaya_admin_token") || "munaya2026";
      const res = await fetch("/api/pricing/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": savedPin,
        },
      });
      const data = await res.json();
      if (data.success) {
        setPricingFeedback("✓ " + (data.updated_count || 0) + " produtos tiveram seus preços atualizados no catálogo!");
        loadProducts();
        setTimeout(() => setPricingFeedback(""), 4500);
      } else {
        setPricingFeedback("Erro ao aplicar: " + (data.error || "Tente novamente."));
      }
    } catch {
      setPricingFeedback("Falha de conexão ao atualizar em lote.");
    } finally {
      setApplyingPricing(false);
    }
  };

  const loadCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const res = await fetch("/api/coupons", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.coupons)) {
        setCoupons(data.coupons);
      }
    } catch (e) {
      console.error("Erro ao carregar cupons:", e);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const openCreateCoupon = () => {
    setEditingCouponCode(null);
    setCouponForm(INITIAL_COUPON_FORM);
    setCouponError("");
    setCouponSuccess("");
    setShowCouponModal(true);
  };

  const openEditCoupon = (cp: Coupon) => {
    setEditingCouponCode(cp.code);
    setCouponForm({
      code: cp.code,
      type: cp.type,
      value: cp.value,
      min_subtotal: cp.min_subtotal || 0,
      description: cp.description || "",
      is_active: cp.is_active,
      is_perennial: !cp.expires_at,
      expires_at: cp.expires_at ? cp.expires_at.slice(0, 10) : "",
      max_uses: cp.max_uses ? String(cp.max_uses) : "",
    });
    setCouponError("");
    setCouponSuccess("");
    setShowCouponModal(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponForm.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (!cleanCode) {
      setCouponError("Informe o código do cupom (ex: ROCK10, TESTEFRETE).");
      return;
    }
    setSavingCoupon(true);
    setCouponError("");
    setCouponSuccess("");

    try {
      const savedPin = localStorage.getItem("munaya_admin_token") || "munaya2026";
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": savedPin,
        },
        body: JSON.stringify({
          code: cleanCode,
          type: couponForm.type,
          value: couponForm.type === "free_shipping" ? 100 : Number(couponForm.value || 0),
          min_subtotal: Number(couponForm.min_subtotal || 0),
          description: couponForm.description.trim() || ("Cupom " + cleanCode),
          is_active: couponForm.is_active,
          expires_at: couponForm.is_perennial ? null : (couponForm.expires_at || null),
          max_uses: couponForm.max_uses ? Number(couponForm.max_uses) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCouponError(data.error || "Erro ao salvar cupom.");
      } else {
        setCouponSuccess("Cupom salvo com sucesso!");
        loadCoupons();
        setTimeout(() => {
          setShowCouponModal(false);
          setCouponSuccess("");
        }, 1200);
      }
    } catch {
      setCouponError("Falha de conexão ao salvar cupom.");
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleToggleCoupon = async (cp: Coupon) => {
    try {
      const savedPin = localStorage.getItem("munaya_admin_token") || "munaya2026";
      const newStatus = !cp.is_active;
      // Atualização otimista
      setCoupons((prev) =>
        prev.map((item) => (item.code === cp.code ? { ...item, is_active: newStatus } : item))
      );

      await fetch("/api/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": savedPin,
        },
        body: JSON.stringify({
          ...cp,
          is_active: newStatus,
        }),
      });

      setActionMsg("Cupom " + cp.code + " " + (newStatus ? "ativado" : "inativado") + " com sucesso!");
      setTimeout(() => setActionMsg(""), 2500);
    } catch {
      loadCoupons();
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente o cupom " + code + "?")) return;
    setDeletingCouponCode(code);
    try {
      const savedPin = localStorage.getItem("munaya_admin_token") || "munaya2026";
      await fetch("/api/coupons?code=" + encodeURIComponent(code), {
        method: "DELETE",
        headers: { "x-admin-pin": savedPin },
      });
      setCoupons((prev) => prev.filter((c) => c.code !== code));
      setActionMsg("Cupom " + code + " excluído.");
      setTimeout(() => setActionMsg(""), 2500);
    } catch {
      loadCoupons();
    } finally {
      setDeletingCouponCode(null);
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/products?admin=true", {
        headers: getAuthHeaders(),
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

  const handleFileUpload = async (
    file: File,
    field: "image_url" | "artwork_url"
  ): Promise<string | null> => {
    if (field === "image_url") setUploadingImage(true);
    if (field === "artwork_url") setUploadingArtwork(true);
    try {
      const savedPin =
        localStorage.getItem("munaya_admin_token") || "munaya2026";
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-admin-pin": savedPin,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        if (field === "image_url") {
          setNewProduct((prev) => {
            const nextGallery = [...(prev.gallery || []), data.url]
              .filter(Boolean)
              .slice(0, 6);
            return {
              ...prev,
              image_url: nextGallery[0] || data.url,
              gallery: nextGallery,
            };
          });
        } else {
          setNewProduct((prev) => ({ ...prev, [field]: data.url }));
        }
        setActionMsg(`Upload concluído com sucesso!`);
        setTimeout(() => setActionMsg(""), 3000);
        return data.url;
      } else {
        alert("Erro no upload da imagem: " + (data.error || "Tente novamente"));
        return null;
      }
    } catch (e: any) {
      alert("Falha de rede no upload: " + (e?.message || String(e)));
      return null;
    } finally {
      if (field === "image_url") setUploadingImage(false);
      if (field === "artwork_url") setUploadingArtwork(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim()) {
      setCreateError("Digite o nome da estampa.");
      return;
    }
    setCreatingProduct(true);
    setCreateError("");
    setCreateSuccess("");
    try {
      const savedPin =
        localStorage.getItem("munaya_admin_token") || "munaya2026";
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": savedPin,
        },
        body: JSON.stringify(newProduct),
      });
      const data = await res.json();
      if (data.success) {
        setCreateSuccess("🎸 Estampa cadastrada com sucesso!");
        setTimeout(() => {
          setShowNewProductModal(false);
          setCreateSuccess("");
          setNewProduct(INITIAL_NEW_PRODUCT);
        }, 1200);
        await loadProducts();
      } else {
        setCreateError(data.error || "Erro ao cadastrar produto.");
      }
    } catch (e: any) {
      setCreateError(e?.message || "Erro de rede ao cadastrar produto.");
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir permanentemente a estampa "${prod.name}" (ID #${prod.id})?`
      )
    ) {
      return;
    }
    setDeletingProductId(prod.id);
    try {
      const savedPin =
        localStorage.getItem("munaya_admin_token") || "munaya2026";
      const res = await fetch(`/api/products?id=${prod.id}`, {
        method: "DELETE",
        headers: {
          "x-admin-pin": savedPin,
        },
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg(
          `Estampa #${prod.id} (${prod.name}) removida com sucesso!`
        );
        setTimeout(() => setActionMsg(""), 3500);
        setProducts((prev) => prev.filter((p) => p.id !== prod.id));
      } else {
        alert("Erro ao excluir: " + (data.error || "Tente novamente"));
      }
    } catch (e: any) {
      alert("Erro ao excluir: " + (e?.message || String(e)));
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleOpenEdit = (prod: Product) => {
    const initialGallery =
      prod.gallery && Array.isArray(prod.gallery) && prod.gallery.length > 0
        ? prod.gallery.slice(0, 6)
        : prod.image_url
        ? [prod.image_url]
        : [];
    setEditingProduct({
      id: prod.id,
      name: prod.name || "",
      slug: prod.slug || "",
      sku: prod.sku || generateBaseSku(prod.name || prod.slug || ""),
      colors:
        prod.colors && prod.colors.length > 0
          ? prod.colors
          : OFFICIAL_COLORS,
      sizes:
        prod.sizes && prod.sizes.length > 0
          ? prod.sizes
          : Array.from(OFFICIAL_SIZES),
      subtitle: prod.subtitle || "100% Algodão Premium Silk Screen",
      description: prod.description || "",
      price: String(prod.price || "89.90"),
      compare_at_price: prod.compare_at_price
        ? String(prod.compare_at_price)
        : "",
      image_url: initialGallery[0] || prod.image_url || "",
      artwork_url: prod.artwork_url || prod.image_url || "",
      gallery: initialGallery,
      badge: prod.badge || "",
      is_active: prod.is_active !== undefined ? prod.is_active : true,
      is_featured: prod.is_featured !== undefined ? prod.is_featured : false,
      is_custom_price: prod.is_custom_price !== undefined ? prod.is_custom_price : false,
      dimona_product_id: prod.dimona_product_id || "",
      blank_type: prod.blank_type || "classic",
      available_blanks:
        prod.available_blanks && prod.available_blanks.length > 0
          ? prod.available_blanks
          : ["classic", "moletom", "caneca", "bone", "ecobag"],
      blank_prices: prod.blank_prices || {},
      display_order: prod.display_order || 10,
    });
    setEditGalleryUrlInput("");
    setEditError("");
    setEditSuccess("");
  };

  const handleEditFileUpload = async (
    file: File,
    field: "image_url" | "artwork_url"
  ): Promise<string | null> => {
    if (field === "image_url") setUploadingEditImage(true);
    if (field === "artwork_url") setUploadingEditArtwork(true);
    try {
      const savedPin =
        localStorage.getItem("munaya_admin_token") || "munaya2026";
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-admin-pin": savedPin,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        if (field === "image_url") {
          setEditingProduct((prev) => {
            if (!prev) return null;
            const nextGallery = [...(prev.gallery || []), data.url]
              .filter(Boolean)
              .slice(0, 6);
            return {
              ...prev,
              image_url: nextGallery[0] || data.url,
              gallery: nextGallery,
            };
          });
        } else {
          setEditingProduct((prev) =>
            prev ? { ...prev, [field]: data.url } : null
          );
        }
        setActionMsg(`Upload de nova imagem concluído!`);
        setTimeout(() => setActionMsg(""), 3000);
        return data.url;
      } else {
        alert("Erro no upload da imagem: " + (data.error || "Tente novamente"));
        return null;
      }
    } catch (e: any) {
      alert("Falha de rede no upload: " + (e?.message || String(e)));
      return null;
    } finally {
      if (field === "image_url") setUploadingEditImage(false);
      if (field === "artwork_url") setUploadingEditArtwork(false);
    }
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editingProduct.name.trim()) {
      setEditError("O nome da estampa é obrigatório.");
      return;
    }
    const cleanPrice = Number(String(editingProduct.price).replace(",", "."));
    if (isNaN(cleanPrice) || cleanPrice < 0) {
      setEditError("Preço numérico inválido.");
      return;
    }

    setSavingEdit(true);
    setEditError("");
    setEditSuccess("");

    try {
      const savedPin =
        localStorage.getItem("munaya_admin_token") || "munaya2026";

      const cleanGallery = (editingProduct.gallery || [])
        .map((u) => String(u || "").trim())
        .filter(Boolean)
        .slice(0, 6);
      const coverUrl = cleanGallery[0] || editingProduct.image_url || "";
      const finalGallery =
        cleanGallery.length > 0
          ? cleanGallery
          : coverUrl
          ? [coverUrl]
          : [];

      const updatesPayload: any = {
        id: editingProduct.id,
        name: editingProduct.name.trim(),
        slug: editingProduct.slug.trim(),
        sku: editingProduct.sku.trim().toUpperCase(),
        colors: editingProduct.colors,
        sizes: editingProduct.sizes,
        subtitle: editingProduct.subtitle.trim(),
        description: editingProduct.description.trim(),
        price: cleanPrice,
        compare_at_price: editingProduct.compare_at_price
          ? Number(String(editingProduct.compare_at_price).replace(",", "."))
          : null,
        image_url: coverUrl,
        artwork_url: editingProduct.artwork_url,
        gallery: finalGallery,
        badge: editingProduct.badge || null,
        is_active: editingProduct.is_active,
        is_featured: editingProduct.is_featured,
        is_custom_price: editingProduct.is_custom_price,
        dimona_product_id: editingProduct.dimona_product_id ? editingProduct.dimona_product_id.trim().toUpperCase() : "",
        blank_type: editingProduct.blank_type || "classic",
        available_blanks: editingProduct.available_blanks,
        blank_prices: editingProduct.blank_prices,
        display_order:
          parseInt(String(editingProduct.display_order), 10) || 10,
      };

      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": savedPin,
        },
        body: JSON.stringify(updatesPayload),
      });

      const data = await res.json();
      if (data.success) {
        setEditSuccess("🎸 Estampa atualizada com sucesso!");
        // Atualiza a lista local de produtos
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? {
                  ...p,
                  name: editingProduct.name.trim(),
                  slug: editingProduct.slug.trim(),
                  sku: editingProduct.sku.trim().toUpperCase(),
                  colors: editingProduct.colors,
                  sizes: editingProduct.sizes,
                  subtitle: editingProduct.subtitle.trim(),
                  description: editingProduct.description.trim(),
                  price: cleanPrice,
                  compare_at_price: editingProduct.compare_at_price
                    ? Number(
                        String(editingProduct.compare_at_price).replace(
                          ",",
                          "."
                        )
                      )
                    : undefined,
                  image_url: coverUrl,
                  artwork_url: editingProduct.artwork_url,
                  gallery: finalGallery,
                  badge: editingProduct.badge || undefined,
                  is_active: editingProduct.is_active,
                  is_featured: editingProduct.is_featured,
                  is_custom_price: editingProduct.is_custom_price,
                  display_order:
                    parseInt(String(editingProduct.display_order), 10) || 10,
                }
              : p
          )
        );
        setTimeout(() => {
          setEditingProduct(null);
          setEditSuccess("");
        }, 1200);
      } else {
        setEditError(data.error || "Erro ao atualizar estampa.");
      }
    } catch (e: any) {
      setEditError(e?.message || "Erro de rede ao atualizar estampa.");
    } finally {
      setSavingEdit(false);
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

  const handleSendWhatsApp = async (
    order: Order,
    type: "created" | "paid" | "shipped"
  ) => {
    let trackingCode = order.tracking_code;
    if (type === "shipped" && !trackingCode) {
      const input = prompt(
        "Digite o código de rastreamento da transportadora/Correios:",
        "BR" + order.id.replace(/\D/g, "") + "MY"
      );
      if (!input) return;
      trackingCode = input.trim();
    }

    setActionMsg(`Gerando notificação WhatsApp (${type}) para #${order.id}...`);
    try {
      const savedPin =
        localStorage.getItem("munaya_admin_token") || "munaya2026";
      const res = await fetch("/api/orders/whatsapp", {
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
      if (data.success && data.result) {
        setActionMsg(
          `📲 Notificação WhatsApp (${type}) processada para +${data.result.phone || order.customer_phone}!`
        );
        setTimeout(() => setActionMsg(""), 3500);
        setWhatsappPreview({
          orderId: order.id,
          customerName: order.customer_name,
          type,
          phone: data.result.phone,
          text: data.result.text,
          wa_me_url: data.result.wa_me_url,
          simulated: data.result.simulated,
        });
        loadOrders();
      } else {
        alert("Erro ao processar WhatsApp: " + (data.error || "Falha"));
      }
    } catch (e: any) {
      alert("Erro ao processar WhatsApp: " + (e?.message || String(e)));
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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md border-2 border-neutral-800 bg-black p-8 text-center space-y-4">
          <div className="w-8 h-8 border-2 border-[#ff66c4] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-oswald uppercase text-xs tracking-widest text-neutral-400">
            Carregando Munaya Admin...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 md:p-6 font-sans">
        <div className="w-full max-w-md border-2 border-white bg-black p-6 md:p-8 shadow-[8px_8px_0px_#ff66c4]">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-8 h-8 text-[#ff66c4]" />
            <h1 className="font-oswald text-3xl font-black uppercase tracking-tight">
              Munaya Admin
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mb-6 uppercase tracking-wider font-semibold">
            Central de Gestão e Operações // RBAC & Auditoria
          </p>

          {/* Seletor de Modo de Autenticação */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-900 border border-neutral-800 mb-5">
            <button
              type="button"
              onClick={() => {
                setLoginMode("credentials");
                setAuthError("");
              }}
              className={`py-2 text-xs font-oswald uppercase tracking-wider font-bold transition-all ${
                loginMode === "credentials"
                  ? "bg-white text-black shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Login Individual
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode("pin");
                setAuthError("");
              }}
              className={`py-2 text-xs font-oswald uppercase tracking-wider font-bold transition-all ${
                loginMode === "pin"
                  ? "bg-white text-black shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              PIN de Emergência
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginMode === "credentials" ? (
              <>
                <div>
                  <label className="block text-[11px] uppercase font-bold tracking-widest text-neutral-300 mb-1.5">
                    E-mail do Operador
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="operador@munayarocks.com.br"
                    required
                    autoFocus
                    className="w-full bg-neutral-900 border-2 border-neutral-700 px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#ff66c4]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold tracking-widest text-neutral-300 mb-1.5">
                    Senha de Acesso
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-neutral-900 border-2 border-neutral-700 px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#ff66c4]"
                  />
                </div>

                {/* Chips de Atalho de Teste para Homologação */}
                <div className="pt-2 border-t border-neutral-900">
                  <p className="text-[10px] uppercase font-mono text-neutral-500 mb-2">
                    Perfis Pré-Configurados para Teste (QA):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        selectQuickAccount("admin@munayarocks.com.br", "munaya2026!")
                      }
                      className="text-[10px] font-mono px-2 py-1 bg-pink-950/60 border border-[#ff66c4]/60 text-pink-300 hover:bg-[#ff66c4] hover:text-black transition-colors"
                      title="Permissão total para finanças, preços, catálogo e auditoria"
                    >
                      👑 Super Admin
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        selectQuickAccount("operador@munayarocks.com.br", "operador2026!")
                      }
                      className="text-[10px] font-mono px-2 py-1 bg-cyan-950/60 border border-cyan-500/60 text-cyan-300 hover:bg-cyan-400 hover:text-black transition-colors"
                      title="Permissão para pedidos, clientes e despacho Dimona"
                    >
                      🛠️ Operador
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        selectQuickAccount("viewer@munayarocks.com.br", "viewer2026!")
                      }
                      className="text-[10px] font-mono px-2 py-1 bg-amber-950/60 border border-amber-500/60 text-amber-300 hover:bg-amber-400 hover:text-black transition-colors"
                      title="Visualização somente leitura de relatórios e catálogo"
                    >
                      👁️ Visualizador
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-[11px] uppercase font-bold tracking-widest text-neutral-300 mb-1.5">
                  PIN Mestre de Recuperação
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Digite o PIN (ex: munaya2026)..."
                  autoFocus
                  required
                  className="w-full bg-neutral-900 border-2 border-neutral-700 px-3 py-2.5 text-white font-mono text-base focus:outline-none focus:border-[#ff66c4]"
                />
                <p className="text-[10px] text-neutral-500 font-mono mt-1.5">
                  Acesso mestre direto com perfil Super Admin de emergência.
                </p>
              </div>
            )}

            {authError && (
              <div className="p-3 bg-red-950/80 border border-red-500 text-red-200 text-xs font-mono">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-white text-black font-oswald text-lg font-black uppercase py-3 tracking-wider hover:bg-[#ff66c4] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Entrar no Painel</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-neutral-800 text-center">
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

  const handleQuickUpdateBlank = async (productId: number, newBlank: string) => {
    setUpdatingBlankId(productId);
    try {
      const savedPin = localStorage.getItem("munaya_admin_token") || "munaya2026";
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-pin": savedPin },
        body: JSON.stringify({ id: productId, blank_type: newBlank }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg(`Blank atualizado para ${newBlank.toUpperCase()} com sucesso!`);
        setTimeout(() => setActionMsg(""), 3000);
        await loadProducts();
      } else {
        alert("Erro ao atualizar blank: " + (data.error || "Erro desconhecido"));
      }
    } catch (e: any) {
      alert("Erro de rede: " + (e?.message || String(e)));
    } finally {
      setUpdatingBlankId(null);
    }
  };

  const handleSimulateDimona = async (prod: Product) => {
    setSimulatingDimona(true);
    setDimonaSimulationResult(null);
    try {
      const savedPin = localStorage.getItem("munaya_admin_token") || "munaya2026";
      const res = await fetch("/api/dimona/test-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-pin": savedPin },
        body: JSON.stringify({
          productId: prod.id,
          color: prod.colors?.[0]?.name || "Preta",
          size: prod.sizes?.[0] || "M",
          blank_type: prod.blank_type || "classic",
        }),
      });
      const data = await res.json();
      setDimonaSimulationResult(data);
    } catch (e: any) {
      setDimonaSimulationResult({
        success: false,
        error: "Falha de rede ao simular pedido Dimona: " + (e?.message || String(e)),
      });
    } finally {
      setSimulatingDimona(false);
    }
  };

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
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-neutral-800 bg-neutral-950 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-neutral-300 font-bold truncate max-w-[150px] md:max-w-[200px]">
                {currentUser.email}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider ${
                  currentUser.role === "super_admin"
                    ? "bg-pink-950/80 border border-[#ff66c4] text-[#ff66c4]"
                    : currentUser.role === "operator"
                    ? "bg-cyan-950/80 border border-cyan-400 text-cyan-300"
                    : "bg-amber-950/80 border border-amber-400 text-amber-300"
                }`}
              >
                {currentUser.role === "super_admin"
                  ? "SUPER ADMIN"
                  : currentUser.role === "operator"
                  ? "OPERADOR"
                  : "VISUALIZADOR"}
              </span>
            </div>
          )}

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
            title="Encerrar sessão administrativa"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex border-b-2 border-white overflow-x-auto">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-6 py-3 font-oswald text-xl uppercase font-black tracking-tight transition-all shrink-0 ${
              activeTab === "orders"
                ? "bg-white text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Pedidos & Despacho ({orders.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("customers");
              if (customers.length === 0) loadCustomers();
            }}
            className={`flex items-center gap-2 px-6 py-3 font-oswald text-xl uppercase font-black tracking-tight transition-all shrink-0 ${
              activeTab === "customers"
                ? "bg-white text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Clientes ({customers.length})</span>
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

          <button
            onClick={() => setActiveTab("coupons")}
            className={`flex items-center gap-2 px-6 py-3 font-oswald text-xl uppercase font-black tracking-tight transition-all ${
              activeTab === "coupons"
                ? "bg-white text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Tag className="w-5 h-5" />
            <span>Cupons ({coupons.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`flex items-center gap-2 px-6 py-3 font-oswald text-xl uppercase font-black tracking-tight transition-all ${
              activeTab === "pricing"
                ? "bg-white text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Calculator className="w-5 h-5" />
            <span>Custos & Markup</span>
          </button>

          <button
            onClick={() => setActiveTab("dimona")}
            className={`flex items-center gap-2 px-6 py-3 font-oswald text-xl uppercase font-black tracking-tight transition-all ${
              activeTab === "dimona"
                ? "bg-[#ff66c4] text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Layers className="w-5 h-5" />
            <span>Esteira Dimona (De/Para)</span>
          </button>

          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`flex items-center gap-2 px-6 py-3 font-oswald text-xl uppercase font-black tracking-tight transition-all ${
              activeTab === "whatsapp"
                ? "bg-emerald-500 text-black"
                : "text-emerald-400 hover:text-white"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span>Evolution API (WhatsApp)</span>
            {evoStatus.state === "open" && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black inline-block" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("emails")}
            className={`flex items-center gap-2 px-6 py-3 font-oswald text-xl uppercase font-black tracking-tight transition-all shrink-0 ${
              activeTab === "emails"
                ? "bg-purple-600 text-white"
                : "text-purple-400 hover:text-white"
            }`}
          >
            <Mail className="w-5 h-5" />
            <span>Templates de E-mail (@react-email)</span>
          </button>

          {(!currentUser || currentUser.role === "super_admin") && (
            <button
              onClick={() => {
                setActiveTab("audit");
                loadAuditLogs();
              }}
              className={`flex items-center gap-2 px-6 py-3 font-oswald text-xl uppercase font-black tracking-tight transition-all shrink-0 ${
                activeTab === "audit"
                  ? "bg-amber-400 text-black"
                  : "text-amber-400 hover:text-white"
              }`}
            >
              <Shield className="w-5 h-5" />
              <span>🛡️ Auditoria</span>
            </button>
          )}
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
                            onClick={() => handleSendWhatsApp(order, isPaid ? "paid" : "created")}
                            title="Disparar / Visualizar notificação WhatsApp (Pix Copia-e-Cola ou Pagamento Confirmado)"
                            className="inline-flex items-center gap-1.5 border border-emerald-700 bg-emerald-950/50 text-emerald-300 px-3 py-1.5 text-xs uppercase font-bold tracking-wider hover:bg-emerald-500 hover:text-black transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{isPaid ? "WhatsApp Pago" : "WhatsApp Pix"}</span>
                          </button>

                          <button
                            onClick={() => handleSendWhatsApp(order, "shipped")}
                            title="Disparar / Visualizar código de rastreamento via WhatsApp"
                            className="inline-flex items-center gap-1.5 border border-emerald-800 bg-neutral-900 text-emerald-400 px-3 py-1.5 text-xs uppercase font-bold tracking-wider hover:border-emerald-400 hover:text-white transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp Rastreio</span>
                          </button>

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

        {/* TAB 2: CLIENTES & HISTÓRICO DE COMPRAS */}
        {activeTab === "customers" && (() => {
          const totalCustomers = customers.length;
          const buyers = customers.filter((c) => c.total_orders > 0);
          const totalRevenue = customers.reduce((acc, c) => acc + (c.total_spent || 0), 0);
          const avgLtv = buyers.length > 0 ? totalRevenue / buyers.length : 0;
          const topCustomer = customers.reduce(
            (max: AggregatedCustomer | null, c) =>
              (c.total_spent || 0) > (max?.total_spent || 0) ? c : max,
            null
          );

          const filteredCustomers = customers.filter((c) => {
            if (!customerSearch.trim()) return true;
            const term = customerSearch.trim().toLowerCase();
            const cleanCpf = (c.cpf || "").replace(/\D/g, "");
            const cleanPhone = (c.phone || "").replace(/\D/g, "");
            return (
              c.name.toLowerCase().includes(term) ||
              c.email.toLowerCase().includes(term) ||
              cleanCpf.includes(term) ||
              cleanPhone.includes(term) ||
              c.addresses.some(
                (a) =>
                  a.city.toLowerCase().includes(term) ||
                  a.state.toLowerCase().includes(term)
              )
            );
          });

          return (
            <div className="space-y-6">
              {/* Stat Cards de Clientes */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-neutral-800 bg-neutral-950 p-4">
                  <span className="text-xs uppercase font-bold text-neutral-500 tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-neutral-400" />
                    Total de Clientes
                  </span>
                  <p className="font-oswald text-3xl md:text-4xl font-bold mt-1 text-white">
                    {totalCustomers}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    {buyers.length} com compras registradas
                  </p>
                </div>

                <div className="border border-neutral-800 bg-neutral-950 p-4">
                  <span className="text-xs uppercase font-bold text-neutral-500 tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#ff66c4]" />
                    LTV Consolidado
                  </span>
                  <p className="font-oswald text-3xl md:text-4xl font-bold mt-1 text-[#ff66c4]">
                    R$ {totalRevenue.toFixed(2).replace(".", ",")}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Faturamento total acumulado
                  </p>
                </div>

                <div className="border border-neutral-800 bg-neutral-950 p-4">
                  <span className="text-xs uppercase font-bold text-neutral-500 tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    LTV Médio / Cliente
                  </span>
                  <p className="font-oswald text-3xl md:text-4xl font-bold mt-1 text-emerald-400">
                    R$ {avgLtv.toFixed(2).replace(".", ",")}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Média por comprador ativo
                  </p>
                </div>

                <div className="border border-neutral-800 bg-neutral-950 p-4">
                  <span className="text-xs uppercase font-bold text-neutral-500 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Cliente VIP (Maior LTV)
                  </span>
                  <p className="font-oswald text-xl md:text-2xl font-bold mt-1 text-amber-300 truncate" title={topCustomer?.name || "Nenhum"}>
                    {topCustomer ? topCustomer.name.split(" ")[0] : "—"}
                  </p>
                  <p className="text-[11px] text-amber-400/80 mt-1 font-mono">
                    {topCustomer ? `R$ ${topCustomer.total_spent.toFixed(2).replace(".", ",")}` : "Sem histórico"}
                  </p>
                </div>
              </div>

              {/* Barra de Busca e Ações */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-950 p-4 border border-neutral-800">
                <div className="relative flex-1 min-w-[260px]">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, e-mail, telefone, CPF ou cidade..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadCustomers}
                    disabled={loadingCustomers}
                    className="flex items-center gap-2 border border-white px-4 py-2.5 text-xs uppercase font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingCustomers ? "animate-spin" : ""}`} />
                    <span>Recarregar Clientes</span>
                  </button>
                </div>
              </div>

              {/* Tabela de Clientes */}
              {loadingCustomers ? (
                <div className="p-12 text-center border border-neutral-800 bg-neutral-950 text-neutral-400 font-mono text-sm">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-[#ff66c4]" />
                  Carregando cadastro de clientes e métricas de LTV...
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-12 text-center border border-neutral-800 bg-neutral-950 text-neutral-400">
                  <Users className="w-8 h-8 mx-auto mb-3 text-neutral-600" />
                  <p className="text-base font-bold text-white uppercase font-oswald">Nenhum cliente encontrado</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {customerSearch ? "Tente buscar por outro termo ou limpe a busca." : "Nenhum pedido ou cadastro foi realizado ainda."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-neutral-800 bg-neutral-950">
                  <table className="w-full text-left font-sans text-xs">
                    <thead className="bg-neutral-900/80 uppercase font-oswald tracking-wider text-neutral-400 text-sm border-b border-neutral-800">
                      <tr>
                        <th className="p-3.5">Cliente</th>
                        <th className="p-3.5">CPF</th>
                        <th className="p-3.5">WhatsApp / Contato</th>
                        <th className="p-3.5">Localização</th>
                        <th className="p-3.5 text-center">Pedidos</th>
                        <th className="p-3.5 text-right">LTV Total</th>
                        <th className="p-3.5 text-right">Última Compra</th>
                        <th className="p-3.5 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 font-mono">
                      {filteredCustomers.map((cust) => {
                        const cleanPhone = cust.phone.replace(/\D/g, "");
                        const waUrl = cleanPhone
                          ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                              `Olá ${cust.name.split(" ")[0]}! Aqui é da equipe Munaya Rocks.`
                            )}`
                          : null;
                        const latestAddress = cust.addresses[0];
                        const formattedCpf = cust.cpf
                          ? cust.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
                          : "—";

                        return (
                          <tr
                            key={cust.id}
                            className="hover:bg-neutral-900/40 transition-colors"
                          >
                            <td className="p-3.5">
                              <div className="font-sans font-bold text-sm text-white">
                                {cust.name}
                              </div>
                              <div className="text-neutral-400 text-xs font-mono">
                                {cust.email}
                              </div>
                              {cust.has_account && (
                                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                                  <UserCheck className="w-2.5 h-2.5" />
                                  Conta no Site
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 text-neutral-300">
                              {formattedCpf}
                            </td>

                            <td className="p-3.5">
                              {cleanPhone ? (
                                <a
                                  href={waUrl || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-bold group"
                                  title="Iniciar conversa no WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                  <span>{cust.phone}</span>
                                </a>
                              ) : (
                                <span className="text-neutral-600">—</span>
                              )}
                            </td>

                            <td className="p-3.5 text-neutral-300 font-sans text-xs">
                              {latestAddress ? (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                                  <span>
                                    {latestAddress.city}/{latestAddress.state}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-neutral-600">—</span>
                              )}
                            </td>

                            <td className="p-3.5 text-center">
                              <span className="px-2 py-0.5 text-xs font-bold rounded bg-neutral-900 border border-neutral-700 text-white">
                                {cust.total_orders} {cust.total_orders === 1 ? "pedido" : "pedidos"}
                              </span>
                            </td>

                            <td className="p-3.5 text-right font-bold text-sm text-[#ff66c4]">
                              R$ {cust.total_spent.toFixed(2).replace(".", ",")}
                            </td>

                            <td className="p-3.5 text-right text-neutral-400 text-xs">
                              {cust.last_order_at
                                ? new Date(cust.last_order_at).toLocaleDateString("pt-BR")
                                : "—"}
                            </td>

                            <td className="p-3.5 text-center">
                              <button
                                onClick={() => setSelectedCustomer(cust)}
                                className="px-3 py-1.5 bg-neutral-900 hover:bg-white hover:text-black border border-neutral-700 text-neutral-200 text-xs uppercase font-bold tracking-wider transition-colors cursor-pointer"
                              >
                                Ver Ficha
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* MODAL DE FICHA COMPLETA DO CLIENTE */}
              {selectedCustomer && (
                <div
                  className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
                  onClick={() => setSelectedCustomer(null)}
                >
                  <div
                    className="bg-[#0e0e0e] border-2 border-neutral-700 max-w-3xl w-full p-6 md:p-8 relative shadow-[0_0_50px_rgba(0,0,0,0.95)] my-8 max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Topo do Modal */}
                    <div className="flex justify-between items-start border-b border-neutral-800 pb-4 mb-6">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h2 className="font-oswald text-3xl md:text-4xl font-black uppercase text-white tracking-tight">
                            {selectedCustomer.name}
                          </h2>
                          {selectedCustomer.total_spent >= 200 && (
                            <span className="font-oswald text-xs uppercase px-2 py-0.5 bg-amber-400 text-black font-black">
                              VIP
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-xs text-neutral-400 mt-1">
                          {selectedCustomer.email}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(null)}
                        className="w-9 h-9 flex items-center justify-center border border-neutral-700 hover:border-[#ff66c4] hover:text-[#ff66c4] text-neutral-300 transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Resumo de Indicadores Cadastrais */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      <div className="bg-neutral-950 border border-neutral-800 p-3">
                        <span className="text-[10px] uppercase font-bold text-neutral-500">
                          Documento CPF
                        </span>
                        <p className="font-mono text-xs font-bold text-neutral-200 mt-0.5">
                          {selectedCustomer.cpf || "Não informado"}
                        </p>
                      </div>

                      <div className="bg-neutral-950 border border-neutral-800 p-3">
                        <span className="text-[10px] uppercase font-bold text-neutral-500">
                          WhatsApp / Telefone
                        </span>
                        <p className="font-mono text-xs font-bold text-emerald-400 mt-0.5">
                          {selectedCustomer.phone || "Não informado"}
                        </p>
                      </div>

                      <div className="bg-neutral-950 border border-neutral-800 p-3">
                        <span className="text-[10px] uppercase font-bold text-neutral-500">
                          Total de Pedidos
                        </span>
                        <p className="font-oswald text-xl font-bold text-white mt-0.5">
                          {selectedCustomer.total_orders}
                        </p>
                      </div>

                      <div className="bg-neutral-950 border border-neutral-800 p-3">
                        <span className="text-[10px] uppercase font-bold text-neutral-500">
                          LTV (Total Comprado)
                        </span>
                        <p className="font-oswald text-xl font-bold text-[#ff66c4] mt-0.5">
                          R$ {selectedCustomer.total_spent.toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                    </div>

                    {/* Botão de Contato Rápido via WhatsApp */}
                    {selectedCustomer.phone && (
                      <div className="mb-6 flex items-center gap-3">
                        <a
                          href={`https://wa.me/55${selectedCustomer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Olá ${selectedCustomer.name.split(" ")[0]}! Aqui é da equipe Munaya Rocks. Tudo bem?`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-emerald-500 text-black px-4 py-2 font-oswald text-sm font-black uppercase tracking-wider hover:bg-emerald-400 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Chamar no WhatsApp ({selectedCustomer.phone})</span>
                        </a>
                      </div>
                    )}

                    {/* Endereços de Entrega Registrados */}
                    <div className="mb-6">
                      <h3 className="font-oswald text-lg uppercase font-bold text-neutral-200 tracking-wider mb-2.5 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#ff66c4]" />
                        Endereços de Entrega ({selectedCustomer.addresses.length})
                      </h3>
                      {selectedCustomer.addresses.length === 0 ? (
                        <p className="text-xs text-neutral-500 font-mono italic">
                          Nenhum endereço registrado ainda.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {selectedCustomer.addresses.map((addr, idx) => (
                            <div
                              key={idx}
                              className="bg-neutral-950 border border-neutral-800 p-3 text-xs font-mono text-neutral-300"
                            >
                              <p className="font-bold text-white">
                                {addr.street}, {addr.number}
                                {addr.complement ? ` - ${addr.complement}` : ""}
                              </p>
                              <p className="text-neutral-400 mt-0.5">
                                {addr.neighborhood} — {addr.city}/{addr.state}
                              </p>
                              <p className="text-neutral-500 text-[11px] mt-0.5">
                                CEP: {addr.zipcode}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Histórico Completo de Pedidos */}
                    <div>
                      <h3 className="font-oswald text-lg uppercase font-bold text-neutral-200 tracking-wider mb-3 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-[#ff66c4]" />
                        Linha do Tempo de Pedidos ({selectedCustomer.orders.length})
                      </h3>
                      {selectedCustomer.orders.length === 0 ? (
                        <p className="text-xs text-neutral-500 font-mono italic">
                          Nenhum pedido realizado ainda.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {selectedCustomer.orders.map((ord) => {
                            const isPaid = ["pago", "aprovado", "approved", "completed"].includes(
                              String(ord.payment_status).toLowerCase()
                            );
                            return (
                              <div
                                key={ord.id}
                                className="bg-neutral-950 border border-neutral-800 p-4 space-y-2.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-white">
                                      Pedido #{ord.id}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                                        isPaid
                                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                                          : "bg-amber-950/60 text-amber-400 border border-amber-500/30"
                                      }`}
                                    >
                                      {ord.payment_status}
                                    </span>
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-neutral-900 border border-neutral-700 text-neutral-300">
                                      {ord.payment_method}
                                    </span>
                                  </div>

                                  <div className="font-oswald text-lg font-bold text-[#ff66c4]">
                                    R$ {ord.total_amount.toFixed(2).replace(".", ",")}
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-neutral-400 gap-2">
                                  <span>
                                    📅 {new Date(ord.created_at).toLocaleString("pt-BR")}
                                  </span>
                                  {ord.tracking_code && (
                                    <span className="text-sky-400 font-bold">
                                      📦 Rastreio: {ord.tracking_code}
                                    </span>
                                  )}
                                </div>

                                {/* Itens do Pedido */}
                                {ord.items && ord.items.length > 0 && (
                                  <div className="pt-2 border-t border-neutral-800/50">
                                    <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                                      Itens do Pedido ({ord.items.length}):
                                    </span>
                                    <div className="space-y-1">
                                      {ord.items.map((it: any, iIdx: number) => (
                                        <div
                                          key={iIdx}
                                          className="flex items-center justify-between text-xs font-mono text-neutral-300 bg-neutral-900/50 px-2 py-1"
                                        >
                                          <span>
                                            {it.name || "Camiseta Munaya"} • {it.color || "Preta"} / {it.size || "M"} (x{it.quantity || it.qty || 1})
                                          </span>
                                          <span className="text-neutral-400">
                                            R$ {Number(it.price || it.unit_price || 0).toFixed(2).replace(".", ",")}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Rodapé do Modal */}
                    <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(null)}
                        className="px-6 py-2 border border-neutral-700 text-neutral-300 uppercase font-bold text-xs tracking-wider hover:bg-white hover:text-black transition-colors cursor-pointer"
                      >
                        Fechar Ficha
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 3: CATÁLOGO */}
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
                    onClick={() => setShowNewProductModal(true)}
                    className="flex items-center gap-2 bg-[#ff66c4] text-black px-4 py-2 text-xs uppercase font-bold hover:bg-white transition-colors shadow-[0_0_15px_rgba(255,102,196,0.35)]"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ Nova Estampa</span>
                  </button>

                  <button
                    onClick={loadProducts}
                    disabled={loadingProducts}
                    className="flex items-center gap-2 border border-white px-4 py-2 text-xs uppercase font-bold hover:bg-white hover:text-black transition-colors"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${loadingProducts ? "animate-spin" : ""}`}
                    />
                    <span>Recarregar</span>
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

                              {prod.is_custom_price && (
                                <span className="text-[10px] uppercase font-bold bg-[#ff66c4]/20 border border-[#ff66c4] text-[#ff66c4] px-1.5 py-0.5 font-mono">
                                  🔒 Preço Travado
                                </span>
                              )}

                              <span className="text-[10px] uppercase font-bold bg-neutral-900 border border-neutral-700 text-neutral-300 px-1.5 py-0.5 font-mono">
                                🏭 {prod.blank_type ? prod.blank_type.toUpperCase() : "CLASSIC"}
                              </span>

                              <span className="text-[10px] uppercase font-bold bg-neutral-900 border border-neutral-700 text-neutral-300 px-1.5 py-0.5 font-mono">
                                📷 {prod.gallery && prod.gallery.length > 0 ? prod.gallery.length : 1} {(prod.gallery && prod.gallery.length > 1) ? "fotos" : "foto"}
                              </span>

                              {prod.dimona_product_id && (
                                <span className="text-[10px] uppercase font-bold bg-cyan-950/80 border border-cyan-500 text-cyan-300 px-1.5 py-0.5 font-mono">
                                  DIM: {prod.dimona_product_id}
                                </span>
                              )}
                            </div>

                            <h3 className="font-oswald text-xl font-bold uppercase truncate mt-1">
                              {prod.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-[#ff66c4] font-mono font-bold tracking-wider">
                                {prod.sku || generateBaseSku(prod.name)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-xs text-neutral-400 truncate font-mono">
                                slug: {prod.slug}
                              </p>
                              <a
                                href={`/produto/${prod.slug || prod.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-neutral-500 hover:text-[#ff66c4] transition-colors inline-flex items-center"
                                title="Abrir na loja"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Cores e Tamanhos da Grade */}
                        <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-500 font-bold uppercase text-[10px]">
                              Cores:
                            </span>
                            <div className="flex items-center gap-1">
                              {(prod.colors && prod.colors.length > 0
                                ? prod.colors
                                : OFFICIAL_COLORS
                              ).map((c) => (
                                <span
                                  key={c.name}
                                  title={c.name}
                                  className="w-3 h-3 rounded-full border border-neutral-700"
                                  style={{ backgroundColor: c.hex }}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 font-mono text-[10px] text-neutral-400">
                            {(prod.sizes && prod.sizes.length > 0
                              ? prod.sizes
                              : OFFICIAL_SIZES
                            ).map((s) => (
                              <span
                                key={s}
                                className="px-1 bg-neutral-900 border border-neutral-800"
                              >
                                {s}
                              </span>
                            ))}
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

                        {/* Botões: Ver na Loja, Editar Completo, Salvar Rápido e Excluir */}
                        <div className="flex items-center gap-2 pt-1 flex-wrap sm:flex-nowrap">
                          <a
                            href={`/produto/${prod.slug || prod.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center justify-center gap-1.5 border font-oswald text-xs font-bold uppercase px-3 py-2 transition-colors ${
                              prod.is_active
                                ? "border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white hover:border-[#ff66c4] hover:bg-[#ff66c4]/15"
                                : "border-neutral-800 bg-neutral-950 text-neutral-500 hover:text-neutral-300 opacity-60 hover:opacity-100"
                            }`}
                            title={
                              prod.is_active
                                ? "Ver página deste produto na loja (abre em nova aba)"
                                : "Produto Pausado/Rascunho (não visível para clientes anônimos na vitrine)"
                            }
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#ff66c4]" />
                            <span>Ver na Loja</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="flex items-center justify-center gap-1.5 border border-[#ff66c4] bg-[#ff66c4]/10 text-[#ff66c4] hover:bg-[#ff66c4] hover:text-black font-oswald text-xs font-bold uppercase px-3 py-2 transition-colors"
                            title="Editar todos os dados, fotos, arte e descrição da estampa"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            onClick={() => handleUpdateProduct(prod)}
                            disabled={isSaving}
                            className="flex-1 bg-white text-black font-oswald text-sm font-black uppercase py-2 tracking-wider hover:bg-[#ff66c4] transition-colors disabled:opacity-50"
                          >
                            {isSaving ? "Salvando..." : "Salvar Rápido"}
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            disabled={deletingProductId === prod.id}
                            title="Excluir estampa do catálogo"
                            className="px-3 py-2 border border-red-900 bg-neutral-900 text-red-400 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 3: CUPONS DE DESCONTO */}
        {activeTab === "coupons" && (
          <div className="space-y-6">
            {/* Header com Estatísticas e Botão Novo Cupom */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-950 p-4 border border-neutral-800">
              <div>
                <h2 className="font-oswald text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <Tag className="w-6 h-6 text-[#ff66c4]" />
                  Cupons Promocionais & Descontos
                </h2>
                <p className="text-xs text-neutral-400 uppercase tracking-wider">
                  Crie, edite, ative, inative e configure validade para cupons da loja e homologação.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={loadCoupons}
                  disabled={loadingCoupons}
                  title="Atualizar lista"
                  className="p-2 border border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white hover:border-white transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingCoupons ? "animate-spin" : ""}`} />
                </button>

                <button
                  type="button"
                  onClick={openCreateCoupon}
                  className="bg-[#ff66c4] text-black font-oswald text-sm font-black uppercase px-4 py-2 hover:bg-white transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(255,102,196,0.3)]"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Novo Cupom</span>
                </button>
              </div>
            </div>

            {/* Barra de Busca e Filtros Rápidos */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[260px] max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Buscar cupom por código ou descrição..."
                  value={couponSearch}
                  onChange={(e) => setCouponSearch(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-4 py-2 text-sm text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-[#ff66c4]"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-mono uppercase">
                <span className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-neutral-300">
                  Total: <strong className="text-white">{coupons.length}</strong>
                </span>
                <span className="bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 text-emerald-400">
                  Ativos: <strong>{coupons.filter((c) => c.is_active).length}</strong>
                </span>
                <span className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-neutral-400">
                  Inativos: <strong>{coupons.filter((c) => !c.is_active).length}</strong>
                </span>
              </div>
            </div>

            {/* Grid de Cupons */}
            {loadingCoupons && coupons.length === 0 ? (
              <div className="text-center py-16 border border-neutral-800 bg-neutral-950">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#ff66c4] mb-3" />
                <p className="font-oswald text-lg uppercase tracking-wider text-neutral-400">
                  Carregando cupons da loja...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {coupons
                  .filter((cp) => {
                    if (!couponSearch) return true;
                    const q = couponSearch.toLowerCase();
                    return cp.code.toLowerCase().includes(q) || (cp.description || "").toLowerCase().includes(q);
                  })
                  .map((cp) => {
                    const isExpired = cp.expires_at && new Date() > new Date(cp.expires_at);
                    const formattedExp = cp.expires_at
                      ? new Date(cp.expires_at).toLocaleDateString("pt-BR")
                      : null;

                    return (
                      <div
                        key={cp.code}
                        className={`border-2 bg-neutral-950 p-5 space-y-4 transition-all ${
                          cp.is_active && !isExpired
                            ? "border-neutral-800 hover:border-[#ff66c4]"
                            : "border-neutral-900 opacity-75 bg-neutral-950/50"
                        }`}
                      >
                        {/* Header do Card com Código e Status Toggle */}
                        <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xl font-black tracking-wider text-[#ff66c4]">
                              {cp.code}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleCoupon(cp)}
                            title={cp.is_active ? "Clique para inativar" : "Clique para ativar"}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                              cp.is_active
                                ? "bg-emerald-950 border border-emerald-500 text-emerald-400 hover:bg-emerald-900"
                                : "bg-neutral-900 border border-neutral-700 text-neutral-400 hover:bg-neutral-800"
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${cp.is_active ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"}`} />
                            {cp.is_active ? "Ativo" : "Inativo"}
                          </button>
                        </div>

                        {/* Descrição e Tipo */}
                        <div className="space-y-2 text-sm">
                          <p className="font-bold text-white text-base leading-snug">
                            {cp.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                            <span className="bg-white/10 px-2 py-0.5 rounded text-white font-bold">
                              {cp.type === "percentage"
                                ? `${cp.value}% OFF`
                                : cp.type === "free_shipping"
                                ? "Frete Grátis (R$ 0)"
                                : `R$ ${Number(cp.value).toFixed(2).replace(".", ",")} OFF`}
                            </span>

                            {cp.min_subtotal ? (
                              <span className="text-neutral-400">
                                Mín: R$ {Number(cp.min_subtotal).toFixed(2).replace(".", ",")}
                              </span>
                            ) : (
                              <span className="text-neutral-500">Sem pedido mínimo</span>
                            )}
                          </div>

                          {/* Validade */}
                          <div className="pt-2 border-t border-neutral-900 text-xs font-mono flex items-center justify-between">
                            {formattedExp ? (
                              isExpired ? (
                                <span className="text-red-400 font-bold flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  Expirou em {formattedExp}
                                </span>
                              ) : (
                                <span className="text-neutral-300 flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                                  Validade: {formattedExp}
                                </span>
                              )
                            ) : (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <InfinityIcon className="w-3.5 h-3.5" />
                                Cupom Perene (Sem Validade)
                              </span>
                            )}

                            <span className="text-neutral-400">
                              {cp.max_uses ? `${cp.used_count || 0} / ${cp.max_uses} usos` : `${cp.used_count || 0} usos`}
                            </span>
                          </div>
                        </div>

                        {/* Ações: Copiar, Editar, Excluir */}
                        <div className="pt-2 border-t border-neutral-800 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(cp.code);
                                setActionMsg(`Código ${cp.code} copiado!`);
                                setTimeout(() => setActionMsg(""), 2000);
                              }
                            }}
                            className="flex-1 border border-neutral-700 bg-neutral-900 text-white font-oswald text-xs font-bold uppercase py-2 tracking-wider hover:bg-white hover:text-black transition-colors text-center"
                          >
                            Copiar
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditCoupon(cp)}
                            title="Editar cupom"
                            className="p-2 border border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white hover:border-[#ff66c4] transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(cp.code)}
                            disabled={deletingCouponCode === cp.code}
                            title="Excluir cupom"
                            className="p-2 border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-red-400 hover:border-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* MODAL: CRIAR / EDITAR CUPOM */}
        {showCouponModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-xl bg-neutral-950 border-2 border-[#ff66c4] shadow-[0_0_50px_rgba(255,102,196,0.3)] p-6 space-y-6 my-8">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#ff66c4] text-black flex items-center justify-center font-black">
                    <Tag className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-oswald text-2xl font-bold uppercase tracking-tight text-white">
                      {editingCouponCode ? `Editar Cupom: ${editingCouponCode}` : "Cadastrar Novo Cupom"}
                    </h3>
                    <p className="text-xs text-neutral-400 uppercase tracking-wider">
                      Configure descontos, tipo de benefício, regras e validade
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="text-neutral-400 hover:text-white p-2 hover:bg-neutral-900 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Formulário */}
              <form onSubmit={handleSaveCoupon} className="space-y-4">
                {/* Código */}
                <div>
                  <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                    Código do Cupom *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingCouponCode}
                    placeholder="EX: PRIMEIRACOMPRA, TESTEFRETE, ROCK10"
                    value={couponForm.code}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                      })
                    }
                    className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-white font-mono text-base uppercase tracking-wider focus:outline-none focus:border-[#ff66c4] disabled:opacity-50"
                  />
                  {editingCouponCode && (
                    <p className="text-[11px] text-neutral-500 mt-1">
                      O código é o identificador único e não pode ser renomeado. Para mudar, crie outro.
                    </p>
                  )}
                </div>

                {/* Descrição Amigável */}
                <div>
                  <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                    Descrição Promocional
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 10% OFF na primeira compra ou Frete Grátis de Homologação"
                    value={couponForm.description}
                    onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ff66c4]"
                  />
                </div>

                {/* Tipo de Desconto */}
                <div>
                  <label className="block text-xs uppercase font-bold text-neutral-300 mb-2">
                    Tipo de Benefício
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setCouponForm({ ...couponForm, type: "percentage" })}
                      className={`p-3 border-2 text-center transition-all cursor-pointer ${
                        couponForm.type === "percentage"
                          ? "border-[#ff66c4] bg-[#ff66c4]/10 text-white font-bold"
                          : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-600"
                      }`}
                    >
                      <Percent className="w-5 h-5 mx-auto mb-1 text-[#ff66c4]" />
                      <span className="font-oswald text-sm uppercase block">Porcentagem</span>
                      <span className="text-[10px] font-mono text-neutral-400">% de desconto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCouponForm({ ...couponForm, type: "fixed" })}
                      className={`p-3 border-2 text-center transition-all cursor-pointer ${
                        couponForm.type === "fixed"
                          ? "border-[#ff66c4] bg-[#ff66c4]/10 text-white font-bold"
                          : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-600"
                      }`}
                    >
                      <DollarSign className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                      <span className="font-oswald text-sm uppercase block">Valor Fixo</span>
                      <span className="text-[10px] font-mono text-neutral-400">R$ de desconto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCouponForm({ ...couponForm, type: "free_shipping", value: 100 })}
                      className={`p-3 border-2 text-center transition-all cursor-pointer ${
                        couponForm.type === "free_shipping"
                          ? "border-[#ff66c4] bg-[#ff66c4]/10 text-white font-bold"
                          : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-600"
                      }`}
                    >
                      <Truck className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
                      <span className="font-oswald text-sm uppercase block">Frete Grátis</span>
                      <span className="text-[10px] font-mono text-neutral-400">Zera frete (R$ 0)</span>
                    </button>
                  </div>
                </div>

                {/* Valor do Desconto e Pedido Mínimo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                      {couponForm.type === "percentage"
                        ? "Valor (% OFF) *"
                        : couponForm.type === "fixed"
                        ? "Valor (R$ OFF) *"
                        : "Desconto no Frete"}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      disabled={couponForm.type === "free_shipping"}
                      value={couponForm.type === "free_shipping" ? "100" : couponForm.value}
                      onChange={(e) => setCouponForm({ ...couponForm, value: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-white font-mono text-base focus:outline-none focus:border-[#ff66c4] disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                      Pedido Mínimo (R$)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00 (sem mínimo)"
                      value={couponForm.min_subtotal}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, min_subtotal: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-white font-mono text-base focus:outline-none focus:border-[#ff66c4]"
                    />
                  </div>
                </div>

                {/* Validade: Perene vs Data Específica */}
                <div className="p-4 bg-neutral-900/50 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs uppercase text-white block">
                        Validade do Cupom
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {couponForm.is_perennial
                          ? "Cupom perene: nunca expira, fica ativo enquanto você desejar."
                          : "Expira automaticamente no final do dia selecionado."}
                      </span>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={couponForm.is_perennial}
                        onChange={(e) => setCouponForm({ ...couponForm, is_perennial: e.target.checked })}
                        className="w-4 h-4 accent-[#ff66c4]"
                      />
                      <span className="text-xs font-bold uppercase text-white font-mono">
                        Perene (Sem Validade)
                      </span>
                    </label>
                  </div>

                  {!couponForm.is_perennial && (
                    <div className="pt-2 border-t border-neutral-800">
                      <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                        Data de Expiração *
                      </label>
                      <input
                        type="date"
                        required={!couponForm.is_perennial}
                        value={couponForm.expires_at}
                        onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#ff66c4]"
                      />
                    </div>
                  )}
                </div>

                {/* Limite de Usos & Status Ativo */}
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                      Limite de Usos (Opcional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ilimitado"
                      value={couponForm.max_uses}
                      onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#ff66c4]"
                    />
                  </div>

                  <div className="pt-5">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={couponForm.is_active}
                        onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                        className="w-4 h-4 accent-[#ff66c4]"
                      />
                      <span className="text-sm font-bold uppercase text-white">
                        Cupom Ativo na Loja
                      </span>
                    </label>
                  </div>
                </div>

                {/* Mensagens de Feedback */}
                {couponError && (
                  <p className="text-xs font-bold text-[#ff66c4] bg-[#ff66c4]/10 p-2.5 border border-[#ff66c4]/30">
                    {couponError}
                  </p>
                )}
                {couponSuccess && (
                  <p className="text-xs font-bold text-emerald-400 bg-emerald-950/40 p-2.5 border border-emerald-500/30">
                    {couponSuccess}
                  </p>
                )}

                {/* Botões de Ação */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setShowCouponModal(false)}
                    className="border border-neutral-700 bg-neutral-900 text-neutral-300 font-oswald text-sm uppercase px-5 py-2.5 hover:text-white hover:border-white transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={savingCoupon}
                    className="bg-[#ff66c4] text-black font-oswald text-sm font-black uppercase px-6 py-2.5 hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingCoupon ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <span>{editingCouponCode ? "Salvar Alterações" : "Criar Cupom"}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* MODAL: CADASTRAR NOVA ESTAMPA */}
        {showNewProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-neutral-950 border-2 border-white shadow-[0_0_50px_rgba(255,102,196,0.3)] p-6 space-y-6 my-8">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#ff66c4] text-black flex items-center justify-center font-black">
                    <Plus className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="font-oswald text-2xl font-bold uppercase tracking-tight text-white">
                      Cadastrar Nova Estampa
                    </h3>
                    <p className="text-xs text-neutral-400 uppercase tracking-wider">
                      Adicione uma nova estampa e publique na vitrine da Munaya Rocks
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewProductModal(false)}
                  className="text-neutral-400 hover:text-white p-2 hover:bg-neutral-900 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateProduct} className="space-y-6">
                {createError && (
                  <div className="bg-red-950/80 border border-red-500 text-red-200 p-3 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                    <span>{createError}</span>
                  </div>
                )}

                {createSuccess && (
                  <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 p-3 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                    <span>{createSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coluna 1: Dados do Produto */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                        Nome da Estampa *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Camiseta Pantera Cowboys"
                        value={newProduct.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          const autoSlug = val
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-+|-+$/g, "");
                          setNewProduct((prev) => ({
                            ...prev,
                            name: val,
                            slug:
                              prev.slug === "" ||
                              prev.slug === autoSlug.slice(0, -1)
                                ? autoSlug
                                : prev.slug,
                          }));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-[#ff66c4] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                          Slug (URL)
                        </label>
                        <input
                          type="text"
                          placeholder="pantera-cowboys"
                          value={newProduct.slug}
                          onChange={(e) =>
                            setNewProduct((prev) => ({
                              ...prev,
                              slug: e.target.value,
                            }))
                          }
                          className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs font-mono text-neutral-300 focus:border-[#ff66c4] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                          Coleção Oficial
                        </label>
                        <select
                          value={newProduct.badge}
                          onChange={(e) =>
                            setNewProduct((prev) => ({
                              ...prev,
                              badge: e.target.value,
                            }))
                          }
                          className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs text-white focus:border-[#ff66c4] focus:outline-none font-bold"
                        >
                          {ADMIN_COLLECTIONS.map((c) => (
                            <option key={c.id} value={c.tag}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                          Preço Venda (R$) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="89.90"
                          value={newProduct.price}
                          onChange={(e) =>
                            setNewProduct((prev) => ({
                              ...prev,
                              price: e.target.value,
                            }))
                          }
                          className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm font-mono text-[#ff66c4] font-bold focus:border-[#ff66c4] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                          Preço "De" (R$)
                        </label>
                        <input
                          type="text"
                          placeholder="119.00"
                          value={newProduct.compare_at_price}
                          onChange={(e) =>
                            setNewProduct((prev) => ({
                              ...prev,
                              compare_at_price: e.target.value,
                            }))
                          }
                          className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm font-mono text-neutral-400 focus:border-[#ff66c4] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Grade Nuvemshop: SKU, Cores e Tamanhos */}
                    <div className="border border-neutral-800 bg-neutral-900/60 p-3 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs uppercase font-bold text-neutral-200">
                            SKU Base *
                          </label>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            Fórmula: MUNAYA-[NOME]-[COR]-[TAM]
                          </span>
                        </div>
                        <input
                          type="text"
                          required
                          value={newProduct.sku}
                          onChange={(e) =>
                            setNewProduct((prev) => ({
                              ...prev,
                              sku: e.target.value.toUpperCase(),
                            }))
                          }
                          className="w-full bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-xs font-mono font-bold text-[#ff66c4] focus:outline-none focus:border-[#ff66c4] uppercase"
                        />
                        <p className="text-[10px] text-neutral-400 mt-1 font-mono">
                          Exemplo de SKU:{" "}
                          <span className="text-white font-bold">
                            {generateVariantSku(
                              newProduct.sku || newProduct.name,
                              newProduct.colors[0]?.name || "Preta",
                              newProduct.sizes[0] || "M"
                            )}
                          </span>
                        </p>
                      </div>

                      {/* Cores */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] uppercase font-bold text-neutral-300">
                            Cores Disponíveis (Preto é padrão)
                          </label>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            Mockups dinâmicos automáticos
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {OFFICIAL_COLORS.map((col) => {
                            const isChecked = newProduct.colors.some(
                              (c) => c.name === col.name
                            );
                            return (
                              <button
                                type="button"
                                key={col.name}
                                onClick={() => {
                                  setNewProduct((prev) => {
                                    const exists = prev.colors.some(
                                      (c) => c.name === col.name
                                    );
                                    if (exists && prev.colors.length === 1) {
                                      alert(
                                        "A estampa deve ter pelo menos uma cor ativa!"
                                      );
                                      return prev;
                                    }
                                    const next = exists
                                      ? prev.colors.filter(
                                          (c) => c.name !== col.name
                                        )
                                      : [...prev.colors, col];
                                    return { ...prev, colors: next };
                                  });
                                }}
                                className={`flex items-center gap-2 p-2 border text-xs font-bold uppercase transition-all ${
                                  isChecked
                                    ? "border-[#ff66c4] bg-neutral-950 text-white"
                                    : "border-neutral-800 bg-neutral-900 text-neutral-500 hover:border-neutral-700"
                                }`}
                              >
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-neutral-600 flex-shrink-0"
                                  style={{ backgroundColor: col.hex }}
                                />
                                <span className="text-[11px] truncate">
                                  {col.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Configuração opcional de mockup dedicado por cor ativa */}
                        {newProduct.colors.length > 0 && (
                          <div className="mt-3 space-y-2 pt-2 border-t border-neutral-800">
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                              Mockup Dedicado por Cor (Opcional — fallback automático para /api/mockup):
                            </span>
                            {newProduct.colors.map((c) => (
                              <div
                                key={c.name}
                                className="flex items-center gap-2 bg-neutral-950 p-2 border border-neutral-800 text-xs"
                              >
                                <span
                                  className="w-3 h-3 rounded-full border border-neutral-600 flex-shrink-0"
                                  style={{ backgroundColor: c.hex }}
                                />
                                <span className="font-bold uppercase text-[11px] w-14">
                                  {c.name}:
                                </span>
                                <input
                                  type="text"
                                  placeholder={`URL do mockup ${c.name} (https://...)`}
                                  value={c.mockupUrl || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewProduct((prev) => ({
                                      ...prev,
                                      colors: prev.colors.map((colItem) =>
                                        colItem.name === c.name
                                          ? { ...colItem, mockupUrl: val }
                                          : colItem
                                      ),
                                    }));
                                  }}
                                  className="flex-1 bg-neutral-900 border border-neutral-700 px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-[#ff66c4]"
                                />
                                <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 px-2 py-1 text-[10px] font-bold uppercase border border-neutral-600 transition-colors">
                                  Upload
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const url = await handleFileUpload(file, "image_url");
                                        if (url) {
                                          setNewProduct((prev) => ({
                                            ...prev,
                                            colors: prev.colors.map((colItem) =>
                                              colItem.name === c.name
                                                ? { ...colItem, mockupUrl: url }
                                                : colItem
                                            ),
                                          }));
                                        }
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Tamanhos */}
                      <div>
                        <label className="block text-[11px] uppercase font-bold text-neutral-300 mb-1.5">
                          Tamanhos Disponíveis
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {OFFICIAL_SIZES.map((sz) => {
                            const isChecked = newProduct.sizes.includes(sz);
                            return (
                              <button
                                type="button"
                                key={sz}
                                onClick={() => {
                                  setNewProduct((prev) => {
                                    const exists = prev.sizes.includes(sz);
                                    if (exists && prev.sizes.length === 1) {
                                      alert(
                                        "A estampa deve ter pelo menos um tamanho ativo!"
                                      );
                                      return prev;
                                    }
                                    const next = exists
                                      ? prev.sizes.filter((s) => s !== sz)
                                      : [...prev.sizes, sz];
                                    return { ...prev, sizes: next };
                                  });
                                }}
                                className={`px-2.5 py-1 text-xs font-bold uppercase border transition-all ${
                                  isChecked
                                    ? "bg-white text-black border-white"
                                    : "bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-white"
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                        Subtítulo / Tecido
                      </label>
                      <input
                        type="text"
                        placeholder="100% Algodão Premium Silk Screen"
                        value={newProduct.subtitle}
                        onChange={(e) =>
                          setNewProduct((prev) => ({
                            ...prev,
                            subtitle: e.target.value,
                          }))
                        }
                        className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs text-neutral-300 focus:border-[#ff66c4] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                        Descrição Breve
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Detalhes sobre a estampa, corte e caimento..."
                        value={newProduct.description}
                        onChange={(e) =>
                          setNewProduct((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs text-neutral-300 focus:border-[#ff66c4] focus:outline-none resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={newProduct.is_active}
                          onChange={(e) =>
                            setNewProduct((prev) => ({
                              ...prev,
                              is_active: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 accent-[#ff66c4]"
                        />
                        <span className="uppercase font-bold text-neutral-200">
                          Ativo na Loja
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={newProduct.is_featured}
                          onChange={(e) =>
                            setNewProduct((prev) => ({
                              ...prev,
                              is_featured: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 accent-[#ff66c4]"
                        />
                        <span className="uppercase font-bold text-neutral-200">
                          Destaque Home
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Coluna 2: Uploads de Imagens & Arte */}
                  <div className="space-y-4">
                    {/* Galeria de Fotos do Produto (Até 6 imagens) */}
                    <div className="border border-neutral-800 p-3 bg-neutral-900/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs uppercase font-bold text-neutral-200">
                          1. Galeria de Fotos do Produto (Até 6 fotos) *
                        </label>
                        <span className="text-[10px] font-mono text-[#ff66c4] font-bold">
                          {(newProduct.gallery || []).length} / 6 fotos
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400">
                        A 1ª foto (marcada como <strong>★ CAPA</strong>) é exibida na vitrine da Home. As demais aparecem no carrossel da página do produto.
                      </p>

                      {/* Controles de Upload e Adição por URL */}
                      {(newProduct.gallery || []).length < 6 && (
                        <div className="space-y-2">
                          <label className="flex items-center justify-center gap-2 border border-neutral-600 bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-2 text-xs font-bold uppercase cursor-pointer transition-colors">
                            <Upload className="w-4 h-4 text-[#ff66c4]" />
                            <span>
                              {uploadingImage
                                ? "Enviando foto(s)..."
                                : "+ Enviar Foto(s) do Computador"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              disabled={uploadingImage}
                              onChange={async (e) => {
                                const files = Array.from(e.target.files || []);
                                for (const f of files) {
                                  await handleFileUpload(f, "image_url");
                                }
                                e.target.value = "";
                              }}
                              className="hidden"
                            />
                          </label>

                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="Cole uma URL de foto (https://...)"
                              value={newGalleryUrlInput}
                              onChange={(e) => setNewGalleryUrlInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const clean = newGalleryUrlInput.trim();
                                  if (!clean) return;
                                  setNewProduct((prev) => {
                                    const next = [...(prev.gallery || []), clean].slice(0, 6);
                                    return { ...prev, gallery: next, image_url: next[0] || "" };
                                  });
                                  setNewGalleryUrlInput("");
                                }
                              }}
                              className="flex-1 bg-neutral-950 border border-neutral-700 px-2.5 py-1.5 text-xs text-neutral-200 focus:border-[#ff66c4] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const clean = newGalleryUrlInput.trim();
                                if (!clean) return;
                                setNewProduct((prev) => {
                                  const next = [...(prev.gallery || []), clean].slice(0, 6);
                                  return { ...prev, gallery: next, image_url: next[0] || "" };
                                });
                                setNewGalleryUrlInput("");
                              }}
                              className="px-3 py-1.5 bg-[#ff66c4] text-black font-oswald text-xs font-black uppercase tracking-wider hover:bg-white transition-colors"
                            >
                              + URL
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Grid de Miniaturas da Galeria */}
                      {(newProduct.gallery || []).length === 0 ? (
                        <div className="border border-dashed border-neutral-700 bg-neutral-950 p-4 text-center text-neutral-500 text-xs uppercase font-bold">
                          Nenhuma foto adicionada. Envie do computador ou cole uma URL acima.
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2.5 pt-1">
                          {(newProduct.gallery || []).map((imgUrl, idx) => (
                            <div
                              key={`${imgUrl}-${idx}`}
                              className={`relative border-2 bg-neutral-950 overflow-hidden group ${
                                idx === 0 ? "border-[#ff66c4]" : "border-neutral-700"
                              }`}
                            >
                              <div className="w-full h-24 relative">
                                <img
                                  src={imgUrl}
                                  alt={`Foto ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {idx === 0 ? (
                                  <span className="absolute top-1 left-1 bg-[#ff66c4] text-black text-[9px] font-black uppercase px-1.5 py-0.5">
                                    ★ CAPA
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setNewProduct((prev) => {
                                        const list = [...(prev.gallery || [])];
                                        const [chosen] = list.splice(idx, 1);
                                        const next = [chosen, ...list];
                                        return { ...prev, gallery: next, image_url: next[0] || "" };
                                      })
                                    }
                                    className="absolute top-1 left-1 bg-black/85 hover:bg-[#ff66c4] text-white hover:text-black text-[9px] font-bold uppercase px-1.5 py-0.5 border border-neutral-600 transition-colors"
                                    title="Definir como foto principal de capa"
                                  >
                                    Definir Capa
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    setNewProduct((prev) => {
                                      const next = (prev.gallery || []).filter((_, i) => i !== idx);
                                      return { ...prev, gallery: next, image_url: next[0] || "" };
                                    })
                                  }
                                  className="absolute top-1 right-1 bg-black/85 text-white hover:text-red-400 p-1"
                                  title="Remover foto"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Reordenação ← / → */}
                              <div className="flex items-center justify-between bg-black/90 border-t border-neutral-800 px-1.5 py-1 text-[10px] font-mono text-neutral-400">
                                <span>#{idx + 1}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() =>
                                      setNewProduct((prev) => {
                                        const list = [...(prev.gallery || [])];
                                        const tmp = list[idx - 1];
                                        list[idx - 1] = list[idx];
                                        list[idx] = tmp;
                                        return { ...prev, gallery: list, image_url: list[0] || "" };
                                      })
                                    }
                                    className="px-1 hover:text-white disabled:opacity-30"
                                    title="Mover para esquerda"
                                  >
                                    ←
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === (newProduct.gallery || []).length - 1}
                                    onClick={() =>
                                      setNewProduct((prev) => {
                                        const list = [...(prev.gallery || [])];
                                        const tmp = list[idx + 1];
                                        list[idx + 1] = list[idx];
                                        list[idx] = tmp;
                                        return { ...prev, gallery: list, image_url: list[0] || "" };
                                      })
                                    }
                                    className="px-1 hover:text-white disabled:opacity-30"
                                    title="Mover para direita"
                                  >
                                    →
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Arte de Impressão Dimona */}
                    <div className="border border-neutral-800 p-3 bg-neutral-900/60 space-y-2">
                      <label className="block text-xs uppercase font-bold text-neutral-200">
                        2. Arquivo da Arte de Impressão (Dimona Print File)
                      </label>
                      <p className="text-[10px] text-neutral-400">
                        PNG transparente em alta resolução (300 DPI) para
                        despacho à fábrica Dimona.
                      </p>

                      <div className="flex gap-3 items-center">
                        {newProduct.artwork_url ? (
                          <div className="w-16 h-16 bg-neutral-950 border border-neutral-700 flex-shrink-0 relative overflow-hidden">
                            <img
                              src={newProduct.artwork_url}
                              alt="Arte Preview"
                              className="w-full h-full object-contain p-1"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setNewProduct((prev) => ({
                                  ...prev,
                                  artwork_url: "",
                                }))
                              }
                              className="absolute top-1 right-1 bg-black/80 text-white p-0.5 hover:text-red-400"
                              title="Remover arte"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-neutral-950 border border-dashed border-neutral-700 flex flex-col items-center justify-center flex-shrink-0 text-neutral-600">
                            <Upload className="w-4 h-4 mb-1" />
                            <span className="text-[8px] uppercase font-bold">
                              Arte
                            </span>
                          </div>
                        )}

                        <div className="flex-1 space-y-2">
                          <label className="flex items-center justify-center gap-2 border border-neutral-600 bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 text-xs font-bold uppercase cursor-pointer transition-colors">
                            <Upload className="w-3.5 h-3.5 text-[#ff66c4]" />
                            <span>
                              {uploadingArtwork
                                ? "Enviando arte..."
                                : "Upload da Arte"}
                            </span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg"
                              disabled={uploadingArtwork}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file)
                                  handleFileUpload(file, "artwork_url");
                              }}
                              className="hidden"
                            />
                          </label>

                          <input
                            type="text"
                            placeholder="Ou cole a URL da arte (https://...)"
                            value={newProduct.artwork_url}
                            onChange={(e) =>
                              setNewProduct((prev) => ({
                                ...prev,
                                artwork_url: e.target.value,
                              }))
                            }
                            className="w-full bg-neutral-950 border border-neutral-700 px-2 py-1 text-xs text-neutral-300 focus:border-[#ff66c4] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Integração & Esteira Dimona (De/Para) */}
                    <div className="border border-neutral-800 p-3 bg-neutral-900/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs uppercase font-bold text-neutral-200">
                          3. 🏭 Mapeamento De/Para Dimona
                        </label>
                        <span className="text-[10px] font-mono text-[#ff66c4] bg-[#ff66c4]/10 px-1.5 py-0.5 border border-[#ff66c4]/30">
                          Fábrica Print-on-Demand
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] uppercase font-bold text-neutral-300 mb-1">
                            Blank / Malha Base
                          </label>
                          <select
                            value={newProduct.blank_type || "classic"}
                            onChange={(e) =>
                              setNewProduct((prev) => ({
                                ...prev,
                                blank_type: e.target.value,
                              }))
                            }
                            className="w-full bg-neutral-950 border border-neutral-700 px-2 py-1.5 text-xs text-white focus:border-[#ff66c4] focus:outline-none"
                          >
                            {Object.values(DIMONA_BLANKS).map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name} (R$ {b.factoryCost.toFixed(2)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] uppercase font-bold text-neutral-300 mb-1">
                            ID Modelo Dimona (Opcional)
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: DIM-4921"
                            value={newProduct.dimona_product_id || ""}
                            onChange={(e) =>
                              setNewProduct((prev) => ({
                                ...prev,
                                dimona_product_id: e.target.value.toUpperCase(),
                              }))
                            }
                            className="w-full bg-neutral-950 border border-neutral-700 px-2 py-1.5 text-xs font-mono text-cyan-300 uppercase focus:border-[#ff66c4] focus:outline-none"
                          />
                        </div>

                        {/* Multi-Blank: Seleção de Bases Físicas para esta estampa */}
                        <div className="col-span-2 pt-2 border-t border-neutral-800">
                          <label className="block text-[11px] uppercase font-bold text-neutral-300 mb-1.5">
                            Bases Físicas Disponíveis para esta Estampa (Multi-Blank)
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.values(DIMONA_BLANKS).map((b) => {
                              const isChecked = (newProduct.available_blanks || []).includes(b.id);
                              const customPrice = newProduct.blank_prices?.[b.id] ?? b.suggestedPrice;
                              return (
                                <div
                                  key={b.id}
                                  className={`flex items-center justify-between p-2 border ${
                                    isChecked
                                      ? "border-[#ff66c4]/60 bg-neutral-950"
                                      : "border-neutral-800 bg-neutral-950/40 opacity-60"
                                  }`}
                                >
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const current = newProduct.available_blanks || [];
                                        const next = e.target.checked
                                          ? [...current, b.id]
                                          : current.filter((x) => x !== b.id);
                                        setNewProduct((prev) => ({
                                          ...prev,
                                          available_blanks: next,
                                        }));
                                      }}
                                      className="accent-[#ff66c4] w-4 h-4"
                                    />
                                    <div>
                                      <p className="text-xs font-bold text-white uppercase">{b.shortLabel}</p>
                                      <p className="text-[10px] text-neutral-400 font-mono">
                                        Custo: R$ {b.factoryCost.toFixed(2)}
                                      </p>
                                    </div>
                                  </label>

                                  <div className="flex items-center gap-1">
                                    <span className="text-[11px] text-neutral-400 font-mono">R$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={customPrice}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setNewProduct((prev) => ({
                                          ...prev,
                                          blank_prices: {
                                            ...(prev.blank_prices || {}),
                                            [b.id]: val,
                                          },
                                        }));
                                      }}
                                      className="w-20 bg-neutral-900 border border-neutral-700 px-1.5 py-0.5 text-xs text-white font-mono text-right focus:border-[#ff66c4] focus:outline-none"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setShowNewProductModal(false)}
                    className="px-5 py-2.5 border border-neutral-700 text-neutral-300 hover:text-white uppercase font-bold text-xs tracking-wider"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={
                      creatingProduct || uploadingImage || uploadingArtwork
                    }
                    className="flex items-center gap-2 bg-[#ff66c4] text-black font-oswald text-base font-black uppercase px-6 py-2.5 tracking-wider hover:bg-white transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,102,196,0.4)]"
                  >
                    {creatingProduct ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Cadastrando...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 stroke-[3]" />
                        <span>Publicar Estampa no Catálogo</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDITAR ESTAMPA EXISTENTE */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-neutral-950 border-2 border-[#ff66c4] shadow-[0_0_50px_rgba(255,102,196,0.35)] p-6 space-y-6 my-8">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#ff66c4] text-black flex items-center justify-center font-black">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-oswald text-2xl font-bold uppercase tracking-tight text-white">
                        Editar Estampa #{editingProduct.id}
                      </h3>
                      <span className="font-mono text-xs text-[#ff66c4] bg-[#ff66c4]/10 border border-[#ff66c4]/30 px-2 py-0.5">
                        {editingProduct.slug}
                      </span>
                      <a
                        href={`/produto/${editingProduct.slug || editingProduct.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-oswald uppercase tracking-wider text-neutral-300 hover:text-white bg-neutral-900 hover:bg-[#ff66c4] hover:text-black border border-neutral-700 hover:border-[#ff66c4] px-2.5 py-1 transition-colors ml-1"
                        title="Ver página deste produto na loja em nova aba"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#ff66c4]" />
                        <span>Ver na Loja</span>
                      </a>
                    </div>
                    <p className="text-xs text-neutral-400 uppercase tracking-wider">
                      Atualize fotos, arte Dimona, preços, coleção e informações na vitrine
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="text-neutral-400 hover:text-white p-2 hover:bg-neutral-900 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveEditProduct} className="space-y-6">
                {editError && (
                  <div className="bg-red-950/80 border border-red-500 text-red-200 p-3 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                    <span>{editError}</span>
                  </div>
                )}

                {editSuccess && (
                  <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 p-3 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                    <span>{editSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coluna 1: Dados Principais */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                        Nome da Estampa *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingProduct.name}
                        onChange={(e) =>
                          setEditingProduct((prev) =>
                            prev ? { ...prev, name: e.target.value } : null
                          )
                        }
                        className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-[#ff66c4] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                          Slug (URL)
                        </label>
                        <input
                          type="text"
                          value={editingProduct.slug}
                          onChange={(e) =>
                            setEditingProduct((prev) =>
                              prev ? { ...prev, slug: e.target.value } : null
                            )
                          }
                          className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs font-mono text-neutral-300 focus:border-[#ff66c4] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                          Coleção Oficial
                        </label>
                        <select
                          value={editingProduct.badge}
                          onChange={(e) =>
                            setEditingProduct((prev) =>
                              prev ? { ...prev, badge: e.target.value } : null
                            )
                          }
                          className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs text-white focus:border-[#ff66c4] focus:outline-none font-bold"
                        >
                          <option value="">(Sem coleção específica)</option>
                          {ADMIN_COLLECTIONS.map((c) => (
                            <option key={c.id} value={c.tag}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                          Preço Venda (R$) *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProduct.price}
                          onChange={(e) =>
                            setEditingProduct((prev) =>
                              prev ? { ...prev, price: e.target.value } : null
                            )
                          }
                          className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm font-mono text-[#ff66c4] font-bold focus:border-[#ff66c4] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                          Preço "De" (R$)
                        </label>
                        <input
                          type="text"
                          placeholder="119.00"
                          value={editingProduct.compare_at_price}
                          onChange={(e) =>
                            setEditingProduct((prev) =>
                              prev
                                ? { ...prev, compare_at_price: e.target.value }
                                : null
                            )
                          }
                          className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm font-mono text-neutral-400 focus:border-[#ff66c4] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Grade Nuvemshop: SKU, Cores e Tamanhos */}
                    <div className="border border-neutral-800 bg-neutral-900/60 p-3 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs uppercase font-bold text-neutral-200">
                            SKU Base *
                          </label>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            Fórmula: MUNAYA-[NOME]-[COR]-[TAM]
                          </span>
                        </div>
                        <input
                          type="text"
                          required
                          value={editingProduct.sku}
                          onChange={(e) =>
                            setEditingProduct((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    sku: e.target.value.toUpperCase(),
                                  }
                                : null
                            )
                          }
                          className="w-full bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-xs font-mono font-bold text-[#ff66c4] focus:outline-none focus:border-[#ff66c4] uppercase"
                        />
                        <p className="text-[10px] text-neutral-400 mt-1 font-mono">
                          Exemplo de SKU:{" "}
                          <span className="text-white font-bold">
                            {generateVariantSku(
                              editingProduct.sku || editingProduct.name,
                              editingProduct.colors[0]?.name || "Preta",
                              editingProduct.sizes[0] || "M"
                            )}
                          </span>
                        </p>
                      </div>

                      {/* Cores */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] uppercase font-bold text-neutral-300">
                            Cores Disponíveis (Preto é padrão)
                          </label>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            Mockups dinâmicos automáticos
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {OFFICIAL_COLORS.map((col) => {
                            const isChecked = editingProduct.colors.some(
                              (c) => c.name === col.name
                            );
                            return (
                              <button
                                type="button"
                                key={col.name}
                                onClick={() => {
                                  setEditingProduct((prev) => {
                                    if (!prev) return null;
                                    const exists = prev.colors.some(
                                      (c) => c.name === col.name
                                    );
                                    if (exists && prev.colors.length === 1) {
                                      alert(
                                        "A estampa deve ter pelo menos uma cor ativa!"
                                      );
                                      return prev;
                                    }
                                    const next = exists
                                      ? prev.colors.filter(
                                          (c) => c.name !== col.name
                                        )
                                      : [...prev.colors, col];
                                    return { ...prev, colors: next };
                                  });
                                }}
                                className={`flex items-center gap-2 p-2 border text-xs font-bold uppercase transition-all ${
                                  isChecked
                                    ? "border-[#ff66c4] bg-neutral-950 text-white"
                                    : "border-neutral-800 bg-neutral-900 text-neutral-500 hover:border-neutral-700"
                                }`}
                              >
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-neutral-600 flex-shrink-0"
                                  style={{ backgroundColor: col.hex }}
                                />
                                <span className="text-[11px] truncate">
                                  {col.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Configuração opcional de mockup dedicado por cor ativa */}
                        {editingProduct.colors.length > 0 && (
                          <div className="mt-3 space-y-2 pt-2 border-t border-neutral-800">
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                              Mockup Dedicado por Cor (Opcional — fallback automático para /api/mockup):
                            </span>
                            {editingProduct.colors.map((c) => (
                              <div
                                key={c.name}
                                className="flex items-center gap-2 bg-neutral-950 p-2 border border-neutral-800 text-xs"
                              >
                                <span
                                  className="w-3 h-3 rounded-full border border-neutral-600 flex-shrink-0"
                                  style={{ backgroundColor: c.hex }}
                                />
                                <span className="font-bold uppercase text-[11px] w-14">
                                  {c.name}:
                                </span>
                                <input
                                  type="text"
                                  placeholder={`URL do mockup ${c.name} (https://...)`}
                                  value={c.mockupUrl || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditingProduct((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            colors: prev.colors.map((colItem) =>
                                              colItem.name === c.name
                                                ? { ...colItem, mockupUrl: val }
                                                : colItem
                                            ),
                                          }
                                        : null
                                    );
                                  }}
                                  className="flex-1 bg-neutral-900 border border-neutral-700 px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-[#ff66c4]"
                                />
                                <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 px-2 py-1 text-[10px] font-bold uppercase border border-neutral-600 transition-colors">
                                  Upload
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const url = await handleFileUpload(file, "image_url");
                                        if (url) {
                                          setEditingProduct((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  colors: prev.colors.map((colItem) =>
                                                    colItem.name === c.name
                                                      ? { ...colItem, mockupUrl: url }
                                                      : colItem
                                                  ),
                                                }
                                              : null
                                          );
                                        }
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Tamanhos */}
                      <div>
                        <label className="block text-[11px] uppercase font-bold text-neutral-300 mb-1.5">
                          Tamanhos Disponíveis
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {OFFICIAL_SIZES.map((sz) => {
                            const isChecked = editingProduct.sizes.includes(sz);
                            return (
                              <button
                                type="button"
                                key={sz}
                                onClick={() => {
                                  setEditingProduct((prev) => {
                                    if (!prev) return null;
                                    const exists = prev.sizes.includes(sz);
                                    if (exists && prev.sizes.length === 1) {
                                      alert(
                                        "A estampa deve ter pelo menos um tamanho ativo!"
                                      );
                                      return prev;
                                    }
                                    const next = exists
                                      ? prev.sizes.filter((s) => s !== sz)
                                      : [...prev.sizes, sz];
                                    return { ...prev, sizes: next };
                                  });
                                }}
                                className={`px-2.5 py-1 text-xs font-bold uppercase border transition-all ${
                                  isChecked
                                    ? "bg-white text-black border-white"
                                    : "bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-white"
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                          Ordem Vitrine
                        </label>
                        <input
                          type="number"
                          value={editingProduct.display_order}
                          onChange={(e) =>
                            setEditingProduct((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    display_order: Number(e.target.value),
                                  }
                                : null
                            )
                          }
                          className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm font-mono text-white focus:border-[#ff66c4] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                          Subtítulo / Tecido
                        </label>
                        <input
                          type="text"
                          value={editingProduct.subtitle}
                          onChange={(e) =>
                            setEditingProduct((prev) =>
                              prev ? { ...prev, subtitle: e.target.value } : null
                            )
                          }
                          className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs text-neutral-300 focus:border-[#ff66c4] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                        Descrição da Estampa
                      </label>
                      <textarea
                        rows={2}
                        value={editingProduct.description}
                        onChange={(e) =>
                          setEditingProduct((prev) =>
                            prev
                              ? { ...prev, description: e.target.value }
                              : null
                          )
                        }
                        className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs text-neutral-300 focus:border-[#ff66c4] focus:outline-none resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-6 pt-2 flex-wrap">
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={editingProduct.is_active}
                          onChange={(e) =>
                            setEditingProduct((prev) =>
                              prev
                                ? { ...prev, is_active: e.target.checked }
                                : null
                            )
                          }
                          className="w-4 h-4 accent-[#ff66c4]"
                        />
                        <span className="uppercase font-bold text-neutral-200">
                          {editingProduct.is_active ? "Ativo na Loja" : "Pausado"}
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={editingProduct.is_featured}
                          onChange={(e) =>
                            setEditingProduct((prev) =>
                              prev
                                ? { ...prev, is_featured: e.target.checked }
                                : null
                            )
                          }
                          className="w-4 h-4 accent-[#ff66c4]"
                        />
                        <span className="uppercase font-bold text-neutral-200">
                          Destaque Home
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs bg-[#ff66c4]/10 border border-[#ff66c4]/40 px-2 py-1">
                        <input
                          type="checkbox"
                          checked={editingProduct.is_custom_price}
                          onChange={(e) =>
                            setEditingProduct((prev) =>
                              prev
                                ? { ...prev, is_custom_price: e.target.checked }
                                : null
                            )
                          }
                          className="w-4 h-4 accent-[#ff66c4]"
                        />
                        <span className="uppercase font-bold text-[#ff66c4]">
                          🔒 Travar Preço Individual
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Coluna 2: Uploads & Mídia */}
                  <div className="space-y-4">
                    {/* Galeria de Fotos do Produto (Até 6 imagens) */}
                    <div className="border border-neutral-800 p-3 bg-neutral-900/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs uppercase font-bold text-neutral-200">
                          1. Galeria de Fotos do Produto (Até 6 fotos)
                        </label>
                        <span className="text-[10px] font-mono text-[#ff66c4] font-bold">
                          {(editingProduct.gallery || []).length} / 6 fotos
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400">
                        A 1ª foto (marcada como <strong>★ CAPA</strong>) é exibida na vitrine da Home. As demais aparecem no carrossel da página do produto.
                      </p>

                      {/* Controles de Upload e Adição por URL */}
                      {(editingProduct.gallery || []).length < 6 && (
                        <div className="space-y-2">
                          <label className="flex items-center justify-center gap-2 border border-neutral-600 bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-2 text-xs font-bold uppercase cursor-pointer transition-colors">
                            <Upload className="w-4 h-4 text-[#ff66c4]" />
                            <span>
                              {uploadingEditImage
                                ? "Enviando foto(s)..."
                                : "+ Adicionar Foto(s) do Computador"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              disabled={uploadingEditImage}
                              onChange={async (e) => {
                                const files = Array.from(e.target.files || []);
                                for (const f of files) {
                                  await handleEditFileUpload(f, "image_url");
                                }
                                e.target.value = "";
                              }}
                              className="hidden"
                            />
                          </label>

                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="Cole uma URL de foto (https://...)"
                              value={editGalleryUrlInput}
                              onChange={(e) => setEditGalleryUrlInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const clean = editGalleryUrlInput.trim();
                                  if (!clean) return;
                                  setEditingProduct((prev) => {
                                    if (!prev) return null;
                                    const next = [...(prev.gallery || []), clean].slice(0, 6);
                                    return { ...prev, gallery: next, image_url: next[0] || "" };
                                  });
                                  setEditGalleryUrlInput("");
                                }
                              }}
                              className="flex-1 bg-neutral-950 border border-neutral-700 px-2.5 py-1.5 text-xs text-neutral-200 focus:border-[#ff66c4] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const clean = editGalleryUrlInput.trim();
                                if (!clean) return;
                                setEditingProduct((prev) => {
                                  if (!prev) return null;
                                  const next = [...(prev.gallery || []), clean].slice(0, 6);
                                  return { ...prev, gallery: next, image_url: next[0] || "" };
                                });
                                setEditGalleryUrlInput("");
                              }}
                              className="px-3 py-1.5 bg-[#ff66c4] text-black font-oswald text-xs font-black uppercase tracking-wider hover:bg-white transition-colors"
                            >
                              + URL
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Grid de Miniaturas da Galeria */}
                      {(editingProduct.gallery || []).length === 0 ? (
                        <div className="border border-dashed border-neutral-700 bg-neutral-950 p-4 text-center text-neutral-500 text-xs uppercase font-bold">
                          Nenhuma foto na galeria. Adicione acima.
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2.5 pt-1">
                          {(editingProduct.gallery || []).map((imgUrl, idx) => (
                            <div
                              key={`${imgUrl}-${idx}`}
                              className={`relative border-2 bg-neutral-950 overflow-hidden group ${
                                idx === 0 ? "border-[#ff66c4]" : "border-neutral-700"
                              }`}
                            >
                              <div className="w-full h-24 relative">
                                <img
                                  src={imgUrl}
                                  alt={`Foto ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {idx === 0 ? (
                                  <span className="absolute top-1 left-1 bg-[#ff66c4] text-black text-[9px] font-black uppercase px-1.5 py-0.5">
                                    ★ CAPA
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingProduct((prev) => {
                                        if (!prev) return null;
                                        const list = [...(prev.gallery || [])];
                                        const [chosen] = list.splice(idx, 1);
                                        const next = [chosen, ...list];
                                        return { ...prev, gallery: next, image_url: next[0] || "" };
                                      })
                                    }
                                    className="absolute top-1 left-1 bg-black/85 hover:bg-[#ff66c4] text-white hover:text-black text-[9px] font-bold uppercase px-1.5 py-0.5 border border-neutral-600 transition-colors"
                                    title="Definir como foto principal de capa"
                                  >
                                    Definir Capa
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingProduct((prev) => {
                                      if (!prev) return null;
                                      const next = (prev.gallery || []).filter((_, i) => i !== idx);
                                      return { ...prev, gallery: next, image_url: next[0] || "" };
                                    })
                                  }
                                  className="absolute top-1 right-1 bg-black/85 text-white hover:text-red-400 p-1"
                                  title="Remover foto"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Reordenação ← / → */}
                              <div className="flex items-center justify-between bg-black/90 border-t border-neutral-800 px-1.5 py-1 text-[10px] font-mono text-neutral-400">
                                <span>#{idx + 1}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() =>
                                      setEditingProduct((prev) => {
                                        if (!prev) return null;
                                        const list = [...(prev.gallery || [])];
                                        const tmp = list[idx - 1];
                                        list[idx - 1] = list[idx];
                                        list[idx] = tmp;
                                        return { ...prev, gallery: list, image_url: list[0] || "" };
                                      })
                                    }
                                    className="px-1 hover:text-white disabled:opacity-30"
                                    title="Mover para esquerda"
                                  >
                                    ←
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === (editingProduct.gallery || []).length - 1}
                                    onClick={() =>
                                      setEditingProduct((prev) => {
                                        if (!prev) return null;
                                        const list = [...(prev.gallery || [])];
                                        const tmp = list[idx + 1];
                                        list[idx + 1] = list[idx];
                                        list[idx] = tmp;
                                        return { ...prev, gallery: list, image_url: list[0] || "" };
                                      })
                                    }
                                    className="px-1 hover:text-white disabled:opacity-30"
                                    title="Mover para direita"
                                  >
                                    →
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Arte de Impressão Dimona */}
                    <div className="border border-neutral-800 p-3 bg-neutral-900/60 space-y-2">
                      <label className="block text-xs uppercase font-bold text-neutral-200">
                        2. Arquivo da Arte de Impressão (Dimona Print File)
                      </label>
                      <p className="text-[10px] text-neutral-400">
                        PNG transparente em alta resolução (300 DPI) para envio à fábrica Dimona.
                      </p>

                      <div className="flex gap-3 items-center">
                        {editingProduct.artwork_url ? (
                          <div className="w-16 h-16 bg-neutral-950 border border-neutral-700 flex-shrink-0 relative overflow-hidden">
                            <img
                              src={editingProduct.artwork_url}
                              alt="Arte Preview"
                              className="w-full h-full object-contain p-1"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setEditingProduct((prev) =>
                                  prev ? { ...prev, artwork_url: "" } : null
                                )
                              }
                              className="absolute top-1 right-1 bg-black/80 text-white p-0.5 hover:text-red-400"
                              title="Remover arte"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-neutral-950 border border-dashed border-neutral-700 flex flex-col items-center justify-center flex-shrink-0 text-neutral-600">
                            <Upload className="w-4 h-4 mb-1" />
                            <span className="text-[8px] uppercase font-bold">
                              Arte
                            </span>
                          </div>
                        )}

                        <div className="flex-1 space-y-2">
                          <label className="flex items-center justify-center gap-2 border border-neutral-600 bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 text-xs font-bold uppercase cursor-pointer transition-colors">
                            <Upload className="w-3.5 h-3.5 text-[#ff66c4]" />
                            <span>
                              {uploadingEditArtwork
                                ? "Enviando arte..."
                                : "Substituir Arte Dimona"}
                            </span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg"
                              disabled={uploadingEditArtwork}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file)
                                  handleEditFileUpload(file, "artwork_url");
                              }}
                              className="hidden"
                            />
                          </label>

                          <input
                            type="text"
                            placeholder="Ou cole a URL da arte (https://...)"
                            value={editingProduct.artwork_url}
                            onChange={(e) =>
                              setEditingProduct((prev) =>
                                prev
                                  ? { ...prev, artwork_url: e.target.value }
                                  : null
                              )
                            }
                            className="w-full bg-neutral-950 border border-neutral-700 px-2 py-1 text-xs text-neutral-300 focus:border-[#ff66c4] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Integração & Esteira Dimona (De/Para) */}
                    <div className="border border-neutral-800 p-3 bg-neutral-900/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs uppercase font-bold text-neutral-200">
                          3. 🏭 Mapeamento De/Para Dimona
                        </label>
                        <span className="text-[10px] font-mono text-[#ff66c4] bg-[#ff66c4]/10 px-1.5 py-0.5 border border-[#ff66c4]/30">
                          Fábrica Print-on-Demand
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] uppercase font-bold text-neutral-300 mb-1">
                            Blank / Malha Base
                          </label>
                          <select
                            value={editingProduct.blank_type || "classic"}
                            onChange={(e) =>
                              setEditingProduct((prev) =>
                                prev ? { ...prev, blank_type: e.target.value } : null
                              )
                            }
                            className="w-full bg-neutral-950 border border-neutral-700 px-2 py-1.5 text-xs text-white focus:border-[#ff66c4] focus:outline-none"
                          >
                            {Object.values(DIMONA_BLANKS).map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name} (R$ {b.factoryCost.toFixed(2)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] uppercase font-bold text-neutral-300 mb-1">
                            ID Modelo Dimona (Opcional)
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: DIM-4921 (ou vazio p/ auto)"
                            value={editingProduct.dimona_product_id || ""}
                            onChange={(e) =>
                              setEditingProduct((prev) =>
                                prev ? { ...prev, dimona_product_id: e.target.value.toUpperCase() } : null
                              )
                            }
                            className="w-full bg-neutral-950 border border-neutral-700 px-2 py-1.5 text-xs font-mono text-cyan-300 uppercase focus:border-[#ff66c4] focus:outline-none"
                          />
                        </div>

                        {/* Multi-Blank: Seleção de Bases Físicas para esta estampa */}
                        <div className="col-span-2 pt-2 border-t border-neutral-800">
                          <label className="block text-[11px] uppercase font-bold text-neutral-300 mb-1.5">
                            Bases Físicas Disponíveis para esta Estampa (Multi-Blank)
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.values(DIMONA_BLANKS).map((b) => {
                              const isChecked = (editingProduct.available_blanks || []).includes(b.id);
                              const customPrice = editingProduct.blank_prices?.[b.id] ?? b.suggestedPrice;
                              return (
                                <div
                                  key={b.id}
                                  className={`flex items-center justify-between p-2 border ${
                                    isChecked
                                      ? "border-[#ff66c4]/60 bg-neutral-950"
                                      : "border-neutral-800 bg-neutral-950/40 opacity-60"
                                  }`}
                                >
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const current = editingProduct.available_blanks || [];
                                        const next = e.target.checked
                                          ? [...current, b.id]
                                          : current.filter((x) => x !== b.id);
                                        setEditingProduct((prev) =>
                                          prev ? { ...prev, available_blanks: next } : null
                                        );
                                      }}
                                      className="accent-[#ff66c4] w-4 h-4"
                                    />
                                    <div>
                                      <p className="text-xs font-bold text-white uppercase">{b.shortLabel}</p>
                                      <p className="text-[10px] text-neutral-400 font-mono">
                                        Custo: R$ {b.factoryCost.toFixed(2)}
                                      </p>
                                    </div>
                                  </label>

                                  <div className="flex items-center gap-1">
                                    <span className="text-[11px] text-neutral-400 font-mono">R$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={customPrice}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setEditingProduct((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                blank_prices: {
                                                  ...(prev.blank_prices || {}),
                                                  [b.id]: val,
                                                },
                                              }
                                            : null
                                        );
                                      }}
                                      className="w-20 bg-neutral-900 border border-neutral-700 px-1.5 py-0.5 text-xs text-white font-mono text-right focus:border-[#ff66c4] focus:outline-none"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Preview do De/Para em Tempo Real */}
                      {(() => {
                        const resolved = resolveDimonaSku(
                          editingProduct.sku || editingProduct.name,
                          {
                            dimonaProductId: editingProduct.dimona_product_id,
                            blankType: editingProduct.blank_type || "classic",
                            colorName: editingProduct.colors[0]?.name || "Preta",
                            sizeName: editingProduct.sizes[0] || "M",
                          }
                        );
                        return (
                          <div className="p-2.5 bg-black border border-neutral-800 text-[11px] font-mono space-y-1">
                            <div className="flex items-center justify-between text-neutral-400">
                              <span>SKU Loja (Canônico):</span>
                              <span className="text-white font-bold">
                                {editingProduct.sku || "MNY-TSH-..."}-{resolved.colorCode}-{resolved.sizeCode}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[#ff66c4]">
                              <span>➔ SKU Fábrica Dimona:</span>
                              <span className="font-bold underline">
                                {resolved.dimonaSku}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-neutral-400 pt-1 border-t border-neutral-900">
                              <span>Custo Base Fábrica:</span>
                              <span className="text-emerald-400 font-bold">
                                R$ {resolved.factoryCost.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-5 py-2.5 border border-neutral-700 text-neutral-300 hover:text-white uppercase font-bold text-xs tracking-wider"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={
                      savingEdit || uploadingEditImage || uploadingEditArtwork
                    }
                    className="flex items-center gap-2 bg-[#ff66c4] text-black font-oswald text-base font-black uppercase px-6 py-2.5 tracking-wider hover:bg-white transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,102,196,0.4)]"
                  >
                    {savingEdit ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Salvando Alterações...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Salvar Alterações da Estampa</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: PRECIFICAÇÃO DINÂMICA & CUSTOS DIMONA */}
        {activeTab === "pricing" && (
          <div className="space-y-8">
            {/* Header com Ações Principais */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-950 p-6 border-2 border-neutral-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-[#ff66c4] text-black flex items-center justify-center font-black">
                    <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <h2 className="font-oswald text-3xl font-black uppercase tracking-tight text-white">
                    Motor de Precificação Dinâmica & Markup
                  </h2>
                </div>
                <p className="text-xs text-neutral-400 uppercase tracking-wider">
                  Ajuste os custos de produção da Dimona e sua margem de lucro. Quando a Dimona reajustar no portal, você altera aqui e o catálogo inteiro atualiza com 1 clique.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={loadPricing}
                  disabled={loadingPricing}
                  title="Recarregar configurações"
                  className="p-2.5 border border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white hover:border-white transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingPricing ? "animate-spin" : ""}`} />
                </button>

                <button
                  type="button"
                  onClick={handleSavePricing}
                  disabled={savingPricing}
                  className="bg-neutral-800 border border-neutral-700 hover:border-white text-white font-oswald text-sm font-bold uppercase px-4 py-2.5 transition-colors flex items-center gap-2"
                >
                  {savingPricing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Regras</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleApplyPricingBatch}
                  disabled={applyingPricing}
                  className="bg-[#ff66c4] text-black font-oswald text-sm font-black uppercase px-5 py-2.5 hover:bg-white transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(255,102,196,0.3)] disabled:opacity-50"
                >
                  {applyingPricing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      <span>Atualizando Catálogo...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Recalcular Preços no Catálogo</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {pricingFeedback && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500 text-emerald-300 text-sm font-mono flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{pricingFeedback}</span>
              </div>
            )}

            {/* Grid Principal: Custos Dimona e Regra de Markup */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bloco 1: Custos Base da Dimona */}
              <div className="border-2 border-neutral-800 bg-neutral-950 p-6 space-y-5">
                <div className="border-b border-neutral-800 pb-3">
                  <h3 className="font-oswald text-xl font-bold uppercase text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    1. Custos de Produção Dimona (Blanks / Malhas)
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Informe quanto a Dimona debita da sua carteira por cada peça pronta (malha + estampa DTG).
                  </p>
                </div>

                <div className="space-y-4">
                  {Object.entries(pricingSettings?.fabrics || DEFAULT_PRICING_SETTINGS.fabrics).map(([key, fabric]) => (
                    <div
                      key={key}
                      className="p-3.5 bg-neutral-900/60 border border-neutral-800 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-oswald text-base font-bold uppercase text-white block">
                          {fabric.name}
                        </span>
                        <span className="text-[11px] text-neutral-400 block truncate">
                          {fabric.description}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs text-neutral-400">R$</span>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          value={fabric.base_cost}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPricingSettings({
                              ...pricingSettings,
                              fabrics: {
                                ...(pricingSettings?.fabrics || DEFAULT_PRICING_SETTINGS.fabrics),
                                [key]: { ...fabric, base_cost: val },
                              },
                            });
                          }}
                          className="w-24 bg-neutral-950 border border-neutral-700 px-3 py-1.5 font-mono text-base font-bold text-white text-right focus:outline-none focus:border-[#ff66c4]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bloco 2: Regras de Markup & Arredondamento */}
              <div className="border-2 border-neutral-800 bg-neutral-950 p-6 space-y-6">
                <div className="border-b border-neutral-800 pb-3">
                  <h3 className="font-oswald text-xl font-bold uppercase text-white flex items-center gap-2">
                    <Percent className="w-5 h-5 text-[#ff66c4]" />
                    2. Margem de Lucro & Regra de Markup
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Como o preço final ao consumidor é calculado a partir do custo base.
                  </p>
                </div>

                {/* Tipo de Markup */}
                <div className="space-y-2">
                  <label className="block text-xs uppercase font-bold text-neutral-300">
                    Tipo de Cálculo da Margem
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPricingSettings({ ...pricingSettings, markup_type: "percentage" })}
                      className={`p-3 border-2 text-center transition-all cursor-pointer ${
                        pricingSettings.markup_type === "percentage"
                          ? "border-[#ff66c4] bg-[#ff66c4]/10 text-white font-bold"
                          : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600"
                      }`}
                    >
                      <Percent className="w-5 h-5 mx-auto mb-1 text-[#ff66c4]" />
                      <span className="font-oswald text-sm uppercase block">Margem Percentual (%)</span>
                      <span className="text-[10px] text-neutral-400 font-mono">Ex: Custo + 114%</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPricingSettings({ ...pricingSettings, markup_type: "multiplier" })}
                      className={`p-3 border-2 text-center transition-all cursor-pointer ${
                        pricingSettings.markup_type === "multiplier"
                          ? "border-[#ff66c4] bg-[#ff66c4]/10 text-white font-bold"
                          : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600"
                      }`}
                    >
                      <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                      <span className="font-oswald text-sm uppercase block">Multiplicador Direto (x)</span>
                      <span className="text-[10px] text-neutral-400 font-mono">Ex: Custo × 2.14x</span>
                    </button>
                  </div>
                </div>

                {/* Valor do Markup */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                      {pricingSettings.markup_type === "percentage"
                        ? "Margem / Markup (%) *"
                        : "Multiplicador de Custo (x) *"}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={pricingSettings.markup_value}
                      onChange={(e) =>
                        setPricingSettings({
                          ...pricingSettings,
                          markup_value: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 font-mono text-base font-bold text-white focus:outline-none focus:border-[#ff66c4]"
                    />
                    <span className="text-[11px] text-neutral-500 mt-1 block">
                      {pricingSettings.markup_type === "percentage"
                        ? "114% transforma R$ 42 em R$ 89,90"
                        : "2.14x transforma R$ 42 em R$ 89,90"}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                      Taxa Gateway Estimada (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={pricingSettings.tax_gateway_percent}
                      onChange={(e) =>
                        setPricingSettings({
                          ...pricingSettings,
                          tax_gateway_percent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 font-mono text-base font-bold text-white focus:outline-none focus:border-[#ff66c4]"
                    />
                    <span className="text-[11px] text-neutral-500 mt-1 block">
                      Mercado Pago / Taxas financeiras
                    </span>
                  </div>
                </div>

                {/* Arredondamento Comercial */}
                <div className="space-y-2">
                  <label className="block text-xs uppercase font-bold text-neutral-300">
                    Regra de Arredondamento Comercial
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPricingSettings({ ...pricingSettings, rounding_mode: "90_cents" })}
                      className={`p-3 border-2 text-center transition-all cursor-pointer ${
                        pricingSettings.rounding_mode === "90_cents"
                          ? "border-[#ff66c4] bg-[#ff66c4]/10 text-white font-bold"
                          : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600"
                      }`}
                    >
                      <span className="font-oswald text-base uppercase block">,90</span>
                      <span className="text-[10px] text-neutral-400 font-mono">Psicológico (R$ 89,90)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPricingSettings({ ...pricingSettings, rounding_mode: "00_cents" })}
                      className={`p-3 border-2 text-center transition-all cursor-pointer ${
                        pricingSettings.rounding_mode === "00_cents"
                          ? "border-[#ff66c4] bg-[#ff66c4]/10 text-white font-bold"
                          : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600"
                      }`}
                    >
                      <span className="font-oswald text-base uppercase block">,00</span>
                      <span className="text-[10px] text-neutral-400 font-mono">Redondo (R$ 90,00)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPricingSettings({ ...pricingSettings, rounding_mode: "exact" })}
                      className={`p-3 border-2 text-center transition-all cursor-pointer ${
                        pricingSettings.rounding_mode === "exact"
                          ? "border-[#ff66c4] bg-[#ff66c4]/10 text-white font-bold"
                          : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600"
                      }`}
                    >
                      <span className="font-oswald text-base uppercase block">Exato</span>
                      <span className="text-[10px] text-neutral-400 font-mono">Sem arredondar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 3: Simulador de Margem e Preço ao Vivo */}
            <div className="border-2 border-neutral-800 bg-neutral-950 p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="font-oswald text-xl font-bold uppercase text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#ff66c4]" />
                    3. Simulador de Margens & Preço de Venda em Tempo Real
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Veja como os preços e o lucro por peça ficam com as configurações atuais antes de aplicar na vitrine.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Object.entries(pricingSettings?.fabrics || DEFAULT_PRICING_SETTINGS.fabrics).map(([key, fabric]) => {
                  const calculatedPrice = calculateSellingPrice(fabric.base_cost, pricingSettings || DEFAULT_PRICING_SETTINGS);
                  const fin = calculateFinancialSummary(
                    fabric.base_cost,
                    calculatedPrice,
                    pricingSettings?.tax_gateway_percent ?? 4.5
                  );

                  return (
                    <div
                      key={key}
                      className="border border-neutral-800 bg-neutral-900/60 p-5 space-y-4 relative overflow-hidden"
                    >
                      <div className="flex items-baseline justify-between border-b border-neutral-800 pb-3">
                        <span className="font-oswald text-lg font-bold uppercase text-white">
                          {fabric.name}
                        </span>
                        <span className="text-[11px] font-mono text-neutral-400">
                          Custo: R$ {fabric.base_cost.toFixed(2).replace(".", ",")}
                        </span>
                      </div>

                      {/* Preço de Venda em Destaque */}
                      <div className="space-y-1">
                        <span className="text-xs uppercase font-mono text-neutral-400 block">
                          Preço de Venda Sugerido
                        </span>
                        <span className="font-oswald text-4xl font-black text-[#ff66c4] tracking-tight">
                          R$ {calculatedPrice.toFixed(2).replace(".", ",")}
                        </span>
                      </div>

                      {/* Detalhamento de Margem e Lucro */}
                      <div className="space-y-2 pt-2 border-t border-neutral-800 text-xs font-mono">
                        <div className="flex justify-between items-center text-neutral-300">
                          <span>Lucro Bruto por Peça:</span>
                          <strong className="text-emerald-400">
                            + R$ {fin.gross_profit.toFixed(2).replace(".", ",")} ({fin.gross_margin_percent}%)
                          </strong>
                        </div>

                        <div className="flex justify-between items-center text-neutral-400 text-[11px]">
                          <span>Taxa Gateway (~{pricingSettings.tax_gateway_percent}%):</span>
                          <span>− R$ {fin.tax_amount.toFixed(2).replace(".", ",")}</span>
                        </div>

                        <div className="flex justify-between items-center text-white pt-1 border-t border-neutral-800/80 font-bold">
                          <span>Lucro Líquido Estimado:</span>
                          <span className="text-emerald-300">
                            R$ {fin.net_profit.toFixed(2).replace(".", ",")} ({fin.net_margin_percent}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ESTEIRA DIMONA (DE/PARA) */}
        {activeTab === "dimona" && (() => {
          const filteredDimonaProducts = products.filter((p) => {
            const matchesSearch =
              dimonaSearch === "" ||
              p.name.toLowerCase().includes(dimonaSearch.toLowerCase()) ||
              p.slug.toLowerCase().includes(dimonaSearch.toLowerCase()) ||
              (p.sku && p.sku.toLowerCase().includes(dimonaSearch.toLowerCase())) ||
              (p.dimona_product_id && p.dimona_product_id.toLowerCase().includes(dimonaSearch.toLowerCase()));

            const matchesBlank =
              dimonaFilterBlank === "all" ||
              (p.blank_type || "classic").toLowerCase() === dimonaFilterBlank.toLowerCase();

            return matchesSearch && matchesBlank;
          });

          const totalProducts = products.length;
          const withArtwork = products.filter((p) => Boolean(p.artwork_url)).length;
          const withCustomDimonaId = products.filter((p) => Boolean(p.dimona_product_id)).length;
          const avgFactoryCost = products.length > 0
            ? products.reduce((acc, p) => {
                const b = DIMONA_BLANKS[p.blank_type || "classic"] || DIMONA_BLANKS.classic;
                return acc + b.factoryCost;
              }, 0) / products.length
            : 42.0;

          return (
            <div className="space-y-6">
              {/* Header com Contexto & Métricas */}
              <div className="border border-neutral-800 bg-neutral-950 p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#ff66c4] text-black flex items-center justify-center font-black">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="font-oswald text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
                          Esteira de Produção Dimona (De/Para Oficial)
                        </h2>
                        <p className="text-xs text-neutral-400 uppercase tracking-wider font-mono">
                          Anti-Corruption Layer (ACL) · Resolução determinística de SKUs de fábrica
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={loadProducts}
                      className="flex items-center gap-2 border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 text-xs font-bold uppercase transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 text-[#ff66c4]" />
                      <span>Atualizar Catálogo</span>
                    </button>
                  </div>
                </div>

                {/* Métricas da Esteira */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border border-neutral-800 bg-black p-4">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                      Total de Estampas
                    </span>
                    <p className="font-oswald text-3xl font-black text-white mt-1">
                      {totalProducts}
                    </p>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      Catálogo ativo
                    </span>
                  </div>

                  <div className="border border-neutral-800 bg-black p-4">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                      Artes DTG Prontas
                    </span>
                    <p className="font-oswald text-3xl font-black text-emerald-400 mt-1">
                      {withArtwork} / {totalProducts}
                    </p>
                    <span className="text-[11px] text-emerald-500/80 font-mono">
                      {totalProducts > 0 ? Math.round((withArtwork / totalProducts) * 100) : 0}% com arquivo master
                    </span>
                  </div>

                  <div className="border border-neutral-800 bg-black p-4">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                      Modelos com ID Dimona
                    </span>
                    <p className="font-oswald text-3xl font-black text-cyan-400 mt-1">
                      {withCustomDimonaId}
                    </p>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      Mapeamento explícito
                    </span>
                  </div>

                  <div className="border border-neutral-800 bg-black p-4">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                      Custo Médio de Fábrica
                    </span>
                    <p className="font-oswald text-3xl font-black text-[#ff66c4] mt-1">
                      R$ {avgFactoryCost.toFixed(2).replace(".", ",")}
                    </p>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      Por peça produzida
                    </span>
                  </div>
                </div>
              </div>

              {/* Filtros e Busca */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-neutral-950 border border-neutral-800 p-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Filtrar por estampa, SKU Munaya ou ID Dimona..."
                    value={dimonaSearch}
                    onChange={(e) => setDimonaSearch(e.target.value)}
                    className="w-full bg-black border border-neutral-800 pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-600 focus:border-[#ff66c4] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold text-neutral-400 whitespace-nowrap">
                    Blank de Fábrica:
                  </span>
                  <select
                    value={dimonaFilterBlank}
                    onChange={(e) => setDimonaFilterBlank(e.target.value)}
                    className="bg-black border border-neutral-800 px-3 py-2 text-xs text-white focus:border-[#ff66c4] focus:outline-none uppercase font-bold"
                  >
                    <option value="all">TODOS OS BLANKS ({products.length})</option>
                    {Object.values(DIMONA_BLANKS).map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} (R$ {b.factoryCost.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tabela de De/Para */}
              <div className="border border-neutral-800 bg-neutral-950 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-black text-[11px] uppercase tracking-wider text-neutral-400 font-mono">
                      <th className="p-3">Estampa / Produto</th>
                      <th className="p-3">SKU Loja (Canônico)</th>
                      <th className="p-3">Blank Vinculado (Fábrica)</th>
                      <th className="p-3">ID Dimona</th>
                      <th className="p-3">Arte DTG (Designs)</th>
                      <th className="p-3">Resolução Fábrica (SKU & Custo)</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900 text-xs">
                    {filteredDimonaProducts.map((prod) => {
                      const curBlank = DIMONA_BLANKS[prod.blank_type || "classic"] || DIMONA_BLANKS.classic;
                      const sampleColor = prod.colors?.[0]?.name || "Preta";
                      const sampleSize = prod.sizes?.[0] || "M";
                      const resolved = resolveDimonaSku(prod.sku || prod.name, {
                        dimonaProductId: prod.dimona_product_id,
                        blankType: prod.blank_type || "classic",
                        colorName: sampleColor,
                        sizeName: sampleSize,
                      });

                      return (
                        <tr key={prod.id} className="hover:bg-neutral-900/50 transition-colors">
                          {/* Produto e Mockup */}
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-12 bg-neutral-900 border border-neutral-800 flex-shrink-0 overflow-hidden">
                                {prod.image_url ? (
                                  <img
                                    src={prod.image_url}
                                    alt={prod.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-neutral-600">
                                    <ImageIcon className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-white uppercase text-sm block">
                                  {prod.name}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-neutral-500 font-mono">
                                    ID #{prod.id} · {prod.slug}
                                  </span>
                                  <a
                                    href={`/produto/${prod.slug || prod.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-neutral-500 hover:text-[#ff66c4] transition-colors"
                                    title="Ver Produto na Loja"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* SKU Canônico */}
                          <td className="p-3">
                            <span className="font-mono text-[#ff66c4] font-bold text-xs bg-[#ff66c4]/10 border border-[#ff66c4]/30 px-2 py-0.5">
                              {prod.sku || generateBaseSku(prod.name)}
                            </span>
                          </td>

                          {/* Blank / Malha */}
                          <td className="p-3">
                            <div className="relative inline-block w-full max-w-[210px]">
                              <select
                                disabled={updatingBlankId === prod.id}
                                value={prod.blank_type || "classic"}
                                onChange={(e) => handleQuickUpdateBlank(prod.id, e.target.value)}
                                className="w-full bg-black border border-neutral-700 px-2.5 py-1 text-xs text-white focus:border-[#ff66c4] focus:outline-none uppercase font-bold cursor-pointer disabled:opacity-50"
                              >
                                {Object.values(DIMONA_BLANKS).map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.name} (R$ {b.factoryCost.toFixed(2)})
                                  </option>
                                ))}
                              </select>
                              {updatingBlankId === prod.id && (
                                <span className="text-[10px] text-[#ff66c4] font-mono block mt-0.5">
                                  Salvando...
                                </span>
                              )}
                            </div>
                          </td>

                          {/* ID Dimona */}
                          <td className="p-3 font-mono">
                            {prod.dimona_product_id ? (
                              <span className="text-cyan-300 font-bold bg-cyan-950/80 border border-cyan-500/50 px-2 py-0.5">
                                {prod.dimona_product_id}
                              </span>
                            ) : (
                              <span className="text-neutral-500 text-[11px] italic">
                                Automático
                              </span>
                            )}
                          </td>

                          {/* Arte DTG */}
                          <td className="p-3">
                            {prod.artwork_url ? (
                              <a
                                href={prod.artwork_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 px-2 py-0.5 hover:bg-emerald-900 transition-colors font-mono"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Arte OK</span>
                                <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                              </a>
                            ) : (
                              <button
                                onClick={() => handleOpenEdit(prod)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 hover:bg-amber-900 transition-colors font-mono"
                              >
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>+ Enviar Arte</span>
                              </button>
                            )}
                          </td>

                          {/* Resolução de Fábrica */}
                          <td className="p-3 font-mono">
                            <div className="space-y-0.5">
                              <span className="text-white font-bold block text-xs underline decoration-neutral-700">
                                {resolved.dimonaSku}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                                <span>Custo: R$ {curBlank.factoryCost.toFixed(2)}</span>
                                <span>·</span>
                                <span>Venda: R$ {prod.price.toFixed(2)}</span>
                              </div>
                            </div>
                          </td>

                          {/* Ações */}
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleSimulateDimona(prod)}
                                disabled={simulatingDimona}
                                className="flex items-center gap-1 px-3 py-1.5 border border-[#ff66c4] bg-[#ff66c4]/10 hover:bg-[#ff66c4] hover:text-black text-[#ff66c4] uppercase font-bold text-[11px] tracking-wider transition-colors disabled:opacity-50"
                                title="Testar payload exato que vai para a Dimona"
                              >
                                <Play className="w-3 h-3" />
                                <span>Simular</span>
                              </button>

                              <button
                                onClick={() => handleOpenEdit(prod)}
                                className="p-1.5 border border-neutral-700 hover:border-white text-neutral-400 hover:text-white transition-colors"
                                title="Editar Estampa"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Informações da Integração */}
              <div className="border border-neutral-800 bg-neutral-950 p-6 space-y-3">
                <h4 className="font-oswald text-lg font-bold uppercase tracking-tight text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Esteira 100% Autônoma Integrada
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Quando um pedido é aprovado via Mercado Pago no Webhook (<code className="text-[#ff66c4]">/api/webhooks/mercadopago</code>), a Camada Anti-Corrupção (ACL) intercepta cada item, cruza com as regras de De/Para da tabela acima, traduz o SKU do produto para o código oficial da fábrica (<code className="text-emerald-400">DIM-[BLANK]-[COR]-[TAM]</code>), injeta a URL pública da arte de impressão em alta definição e dispara automaticamente a ordem de confecção para a Camisa Dimona via API v2.
                </p>
              </div>
            </div>
          );
        })()}

        {/* TAB 6: EVOLUTION API / WHATSAPP TRANSACIONAL */}
        {activeTab === "whatsapp" && (
          <div className="space-y-6">
            {/* Header Evolution API */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-950 p-6 border-2 border-emerald-600/60">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                    Mensageria Transacional Automatizada
                  </span>
                  {evoStatus.state === "open" ? (
                    <span className="bg-emerald-500 text-black text-[10px] font-black uppercase px-2 py-0.5 tracking-wider">
                      ● CHIP CONECTADO (OPEN)
                    </span>
                  ) : evoStatus.configured ? (
                    <span className="bg-amber-500 text-black text-[10px] font-black uppercase px-2 py-0.5 tracking-wider">
                      ● STATUS: {String(evoStatus.state).toUpperCase()}
                    </span>
                  ) : (
                    <span className="bg-neutral-800 text-neutral-300 text-[10px] font-bold uppercase px-2 py-0.5 tracking-wider">
                      AGUARDANDO CREDENCIAIS
                    </span>
                  )}
                </div>
                <h2 className="font-oswald text-3xl font-black uppercase tracking-tight text-white">
                  Conexão Evolution API (WhatsApp)
                </h2>
                <p className="text-xs text-neutral-400 max-w-2xl">
                  Conecte sua instância da Evolution API (v1 ou v2) para que a loja dispare sozinha, em segundo plano, o código <strong>Pix Copia-e-Cola</strong> no checkout, a confirmação de <strong>Pagamento Aprovado</strong> e o <strong>Código de Rastreamento</strong> da Dimona.
                </p>
              </div>

              <button
                type="button"
                onClick={loadEvolutionConfig}
                disabled={loadingEvo}
                className="flex items-center gap-2 border border-white px-4 py-2.5 text-xs uppercase font-bold hover:bg-white hover:text-black transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingEvo ? "animate-spin" : ""}`} />
                <span>Verificar Status</span>
              </button>
            </div>

            {evoFeedback && (
              <div className="border-2 border-emerald-500 bg-emerald-950/60 text-emerald-200 p-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{evoFeedback}</span>
              </div>
            )}

            {evoError && (
              <div className="border-2 border-red-500 bg-red-950/60 text-red-200 p-4 text-xs font-bold uppercase tracking-wider">
                ⚠️ {evoError}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Coluna Esquerda: Formulário de Credenciais Evolution API */}
              <form
                onSubmit={handleSaveEvolutionConfig}
                className="lg:col-span-7 border-2 border-neutral-800 bg-neutral-950 p-6 space-y-5"
              >
                <h3 className="font-oswald text-xl font-bold uppercase tracking-tight border-b border-neutral-800 pb-3">
                  1. Credenciais da Sua Instância Evolution API
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase font-bold text-neutral-300 mb-1.5 tracking-wider">
                      URL do Servidor Evolution API *
                    </label>
                    <input
                      type="url"
                      required
                      value={evoSettings.baseUrl}
                      onChange={(e) =>
                        setEvoSettings((prev) => ({ ...prev, baseUrl: e.target.value }))
                      }
                      placeholder="https://evolution.seudominio.com.br"
                      className="w-full bg-black border border-neutral-700 px-3.5 py-2.5 text-sm text-white font-mono focus:border-emerald-400 focus:outline-none"
                    />
                    <span className="text-[11px] text-neutral-500 block mt-1">
                      URL base do seu servidor Evolution (sem barra no final).
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase font-bold text-neutral-300 mb-1.5 tracking-wider">
                        Nome da Instância *
                      </label>
                      <input
                        type="text"
                        required
                        value={evoSettings.instanceName}
                        onChange={(e) =>
                          setEvoSettings((prev) => ({
                            ...prev,
                            instanceName: e.target.value,
                          }))
                        }
                        placeholder="munaya"
                        className="w-full bg-black border border-neutral-700 px-3.5 py-2.5 text-sm text-white font-mono focus:border-emerald-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase font-bold text-neutral-300 mb-1.5 tracking-wider">
                        API Key (Global ou da Instância) *
                      </label>
                      <input
                        type="password"
                        required
                        value={evoSettings.apiKey}
                        onChange={(e) =>
                          setEvoSettings((prev) => ({ ...prev, apiKey: e.target.value }))
                        }
                        placeholder="••••••••••••••••••••"
                        className="w-full bg-black border border-neutral-700 px-3.5 py-2.5 text-sm text-white font-mono focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={evoSettings.enabled}
                      onChange={(e) =>
                        setEvoSettings((prev) => ({ ...prev, enabled: e.target.checked }))
                      }
                      className="w-4 h-4 accent-emerald-500"
                    />
                    <span className="text-xs uppercase font-bold text-neutral-200 tracking-wider">
                      Ativar disparos automáticos em segundo plano (Checkout Pix, Pagamento e Rastreio)
                    </span>
                  </label>
                </div>

                <div className="pt-3 border-t border-neutral-800 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={savingEvo}
                    className="bg-emerald-500 text-black px-6 py-3 font-oswald text-base font-black uppercase tracking-wider hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {savingEvo ? "Salvando e Testando..." : "Salvar Credenciais no Supabase"}
                  </button>

                  {evoStatus.configured && evoStatus.state !== "open" && (
                    <button
                      type="button"
                      onClick={handleFetchEvolutionQr}
                      disabled={loadingEvo}
                      className="border border-emerald-500 text-emerald-400 px-4 py-3 font-oswald text-sm font-bold uppercase tracking-wider hover:bg-emerald-500 hover:text-black transition-colors"
                    >
                      Gerar QR Code do Chip
                    </button>
                  )}
                </div>
              </form>

              {/* Coluna Direita: Teste de Disparo & Pareamento QR Code */}
              <div className="lg:col-span-5 space-y-6">
                {/* Bloco de Disparo de Teste */}
                <div className="border-2 border-neutral-800 bg-neutral-950 p-6 space-y-4">
                  <h3 className="font-oswald text-xl font-bold uppercase tracking-tight border-b border-neutral-800 pb-3">
                    2. Testar Disparo Real no Celular
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Após salvar as credenciais da sua Evolution API ao lado, digite seu número de WhatsApp com DDD para receber uma mensagem real disparada pela sua instância:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={evoTestPhone}
                      onChange={(e) => setEvoTestPhone(e.target.value)}
                      placeholder="(51) 99999-9999"
                      className="flex-1 bg-black border border-neutral-700 px-3.5 py-2.5 text-sm text-white font-mono focus:border-emerald-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={testingEvo}
                      onClick={handleSendTestEvolution}
                      className="bg-white text-black px-5 py-2.5 font-oswald text-sm font-black uppercase tracking-wider hover:bg-emerald-400 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {testingEvo ? "Enviando..." : "Enviar Teste"}
                    </button>
                  </div>
                </div>

                {/* Bloco de QR Code (se gerado) */}
                {evoStatus.qrcodeBase64 && evoStatus.state !== "open" && (
                  <div className="border-2 border-emerald-500 bg-neutral-950 p-6 text-center space-y-3">
                    <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                      Escaneie com o WhatsApp da Loja
                    </span>
                    <div className="bg-white p-3 inline-block mx-auto">
                      <img
                        src={evoStatus.qrcodeBase64}
                        alt="QR Code Evolution API"
                        className="w-52 h-52 object-contain"
                      />
                    </div>
                    <p className="text-xs text-neutral-400">
                      Abra o WhatsApp no celular → Aparelhos Conectados → Conectar um Aparelho e aponte para o QR Code acima.
                    </p>
                  </div>
                )}

                {/* Resumo dos 3 Gatilhos Automáticos */}
                <div className="border border-neutral-800 bg-neutral-950 p-5 space-y-2.5 text-xs text-neutral-400">
                  <span className="text-white font-bold uppercase tracking-wider block">
                    Gatilhos Automáticos Ativos na Esteira:
                  </span>
                  <div>
                    <strong className="text-emerald-400">1. Checkout Pix (/api/checkout):</strong>{" "}
                    Envia saudação + itens + código Pix Copia-e-Cola assim que o pedido é gerado.
                  </div>
                  <div>
                    <strong className="text-emerald-400">2. Pagamento Aprovado (/api/webhooks/mercadopago):</strong>{" "}
                    Avisa que o Pix/Cartão foi aprovado e a camiseta entrou em produção na fábrica.
                  </div>
                  <div>
                    <strong className="text-emerald-400">3. Despacho Dimona (/api/webhooks/dimona):</strong>{" "}
                    Envia o código de rastreamento e link direto assim que a encomenda é postada.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: CENTRAL DE TEMPLATES DE E-MAIL (@react-email) */}
        {activeTab === "emails" && (
          <div className="space-y-6">
            {/* Header da Central de E-mails */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-950 p-6 border-2 border-purple-600/60">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-purple-400 font-bold">
                    Componentização & Design System de E-mail
                  </span>
                  <span className="bg-purple-500 text-white text-[10px] font-black uppercase px-2 py-0.5 tracking-wider">
                    ● @REACT-EMAIL V1.0
                  </span>
                </div>
                <h2 className="font-oswald text-3xl font-black uppercase tracking-tight text-white">
                  Templates Transacionais Munaya Rocks
                </h2>
                <p className="text-xs text-neutral-400 max-w-2xl">
                  Templates responsivos com identidade visual rockwear, compatibilidade total com <strong>Dark Mode</strong> e injeção de dados dinâmicos (itens, código Pix Copia-e-Cola e rastreamento da transportadora).
                </p>
              </div>

              <a
                href={`/api/emails/preview?template=${emailPreviewTemplate}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 border border-white px-4 py-2.5 text-xs uppercase font-bold hover:bg-white hover:text-black transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir Preview em Nova Aba</span>
              </a>
            </div>

            {/* Painel de Controle: Seletor de Template, Modo de Visualização e Teste */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Coluna de Controles e Disparo de Teste (5 colunas) */}
              <div className="lg:col-span-5 space-y-6">
                {/* 1. Escolha do Template */}
                <div className="bg-neutral-950 border border-neutral-800 p-5 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block font-oswald text-base">
                    1. Escolha o Template para Visualizar
                  </span>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setEmailPreviewTemplate("created")}
                      className={`w-full text-left p-3 border-2 transition-all cursor-pointer ${
                        emailPreviewTemplate === "created"
                          ? "border-[#ff66c4] bg-[#ff66c4]/15 text-white"
                          : "border-neutral-800 hover:border-neutral-700 bg-black text-neutral-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-oswald text-base font-bold uppercase">
                          Template 1: Pedido Registrado
                        </span>
                        <span className="font-mono text-[10px] bg-black px-1.5 py-0.5 text-[#ff66c4] border border-[#ff66c4]/40">
                          PIX COPIA E COLA
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Disparado no checkout com o resumo dos itens, total e instruções de pagamento imediato.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEmailPreviewTemplate("paid")}
                      className={`w-full text-left p-3 border-2 transition-all cursor-pointer ${
                        emailPreviewTemplate === "paid"
                          ? "border-emerald-500 bg-emerald-950/30 text-white"
                          : "border-neutral-800 hover:border-neutral-700 bg-black text-neutral-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-oswald text-base font-bold uppercase">
                          Template 2: Pagamento Aprovado
                        </span>
                        <span className="font-mono text-[10px] bg-black px-1.5 py-0.5 text-emerald-400 border border-emerald-500/40">
                          ESTEIRA DIMONA
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Disparado na liquidação do pagamento; confirma início da produção têxtil artesanal.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEmailPreviewTemplate("shipped")}
                      className={`w-full text-left p-3 border-2 transition-all cursor-pointer ${
                        emailPreviewTemplate === "shipped"
                          ? "border-sky-400 bg-sky-950/30 text-white"
                          : "border-neutral-800 hover:border-neutral-700 bg-black text-neutral-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-oswald text-base font-bold uppercase">
                          Template 3: Pedido Despachado
                        </span>
                        <span className="font-mono text-[10px] bg-black px-1.5 py-0.5 text-sky-400 border border-sky-400/40">
                          RASTREIO DIRETO
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Disparado quando a fábrica posta o pacote; exibe código e link de rastreamento.
                      </p>
                    </button>
                  </div>
                </div>

                {/* 2. Disparo de E-mail de Teste Real */}
                <form
                  onSubmit={handleSendTestEmail}
                  className="bg-neutral-950 border border-neutral-800 p-5 space-y-4"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block font-oswald text-base">
                    2. Disparar Teste Real para seu E-mail
                  </span>

                  <div>
                    <label className="block text-xs uppercase font-bold text-neutral-300 mb-1.5 tracking-wider">
                      E-mail de Destino *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="seu-email@gmail.com"
                      value={emailTestRecipient}
                      onChange={(e) => setEmailTestRecipient(e.target.value)}
                      className="w-full bg-black border border-neutral-700 px-3.5 py-2.5 text-sm text-white font-mono focus:border-purple-400 focus:outline-none"
                    />
                    <span className="text-[11px] text-neutral-500 block mt-1">
                      O template selecionado acima será renderizado e enviado imediatamente.
                    </span>
                  </div>

                  {emailTestFeedback && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-500 text-emerald-300 text-xs font-mono">
                      {emailTestFeedback}
                    </div>
                  )}

                  {emailTestError && (
                    <div className="p-3 bg-red-950/60 border border-red-500 text-red-300 text-xs font-mono">
                      ⚠️ {emailTestError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sendingTestEmail}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-oswald text-sm font-black uppercase tracking-wider py-3 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {sendingTestEmail ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Enviando Teste...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar E-mail de Teste Agora</span>
                      </>
                    )}
                  </button>
                </form>

                {/* 3. Informações Técnicas & Versionamento */}
                <div className="bg-neutral-950 border border-neutral-800 p-4 space-y-2 text-xs font-mono text-neutral-400">
                  <span className="text-white font-bold uppercase block font-sans">
                    Arquitetura @react-email Munaya:
                  </span>
                  <div>
                    • Arquivos fontes: <code className="text-[#ff66c4]">src/emails/</code>
                  </div>
                  <div>
                    • Renderizador: <code className="text-purple-300">@react-email/render</code>
                  </div>
                  <div>
                    • Provedor de Entrega: <code className="text-emerald-400">Resend API (REST)</code>
                  </div>
                  <div>
                    • Script de Preview: <code className="text-white">npm run email:dev</code>
                  </div>
                </div>
              </div>

              {/* Coluna da Direita: Iframe de Pré-Visualização em Tempo Real (7 colunas) */}
              <div className="lg:col-span-7 bg-neutral-950 border border-neutral-800 p-5 flex flex-col items-center">
                {/* Seletor Desktop vs Mobile */}
                <div className="w-full flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
                  <span className="font-oswald text-sm font-bold uppercase text-neutral-300">
                    Pré-Visualização do E-mail
                  </span>

                  <div className="flex items-center gap-1 bg-black border border-neutral-700 p-0.5">
                    <button
                      type="button"
                      onClick={() => setEmailPreviewMode("desktop")}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase transition-colors ${
                        emailPreviewMode === "desktop"
                          ? "bg-white text-black"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Desktop (600px)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEmailPreviewMode("mobile")}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase transition-colors ${
                        emailPreviewMode === "mobile"
                          ? "bg-white text-black"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Mobile (375px)</span>
                    </button>
                  </div>
                </div>

                {/* Iframe Responsivo */}
                <div
                  className={`w-full transition-all duration-300 ${
                    emailPreviewMode === "mobile" ? "max-w-[395px]" : "max-w-[620px]"
                  }`}
                >
                  <div className="border-2 border-neutral-700 rounded-sm overflow-hidden shadow-2xl bg-black">
                    <div className="bg-neutral-900 px-3 py-2 border-b border-neutral-700 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span>De: Munaya Rocks &lt;onboarding@resend.dev&gt;</span>
                      <span className="text-[#ff66c4] font-bold">Dark Mode</span>
                    </div>
                    <iframe
                      key={`${emailPreviewTemplate}-${emailPreviewMode}`}
                      src={`/api/emails/preview?template=${emailPreviewTemplate}`}
                      title={`Preview E-mail ${emailPreviewTemplate}`}
                      className="w-full h-[720px] bg-[#050505] border-none block"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: TRILHA DE AUDITORIA & COMPLIANCE (RBAC) */}
        {activeTab === "audit" && (
          currentUser && currentUser.role !== "super_admin" ? (
            <div className="border-2 border-amber-500 bg-amber-950/40 p-8 text-center space-y-4 my-6">
              <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
              <h3 className="font-oswald text-2xl font-black uppercase text-amber-300">
                Acesso Restrito: Permissão Super Admin Necessária
              </h3>
              <p className="text-xs text-neutral-300 max-w-lg mx-auto font-mono">
                Seu perfil atual ({currentUser.role.toUpperCase()}) não possui permissão para visualizar a trilha de auditoria e compliance da plataforma.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header da Auditoria */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-950 p-6 border-2 border-amber-500/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                      Segurança & Governança Corporativa
                    </span>
                    <span className="bg-amber-400 text-black text-[10px] font-black uppercase px-2 py-0.5 tracking-wider">
                      ● AUDIT TRAIL IMUTÁVEL
                    </span>
                  </div>
                  <h2 className="font-oswald text-3xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                    <Shield className="w-7 h-7 text-amber-400" />
                    <span>Trilha de Auditoria & Compliance</span>
                  </h2>
                  <p className="text-xs text-neutral-400 max-w-2xl">
                    Registro detalhado e à prova de adulteração de todas as operações sensíveis: alteração de preços, recalculo de markup em lote, despachos para a fábrica Dimona, gerenciamento de cupons e autenticações de operadores.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => loadAuditLogs()}
                    disabled={loadingAudit}
                    className="flex items-center gap-2 px-4 py-2.5 border border-neutral-700 bg-neutral-900 text-white font-oswald text-sm font-bold uppercase tracking-wider hover:border-white transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingAudit ? "animate-spin text-amber-400" : ""}`} />
                    <span>Atualizar Trilha</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(auditLogs, null, 2)], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `munaya_audit_logs_${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 text-black font-oswald text-sm font-black uppercase tracking-wider hover:bg-white transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Exportar JSON</span>
                  </button>
                </div>
              </div>

              {/* Stat Cards da Auditoria */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-neutral-800 bg-neutral-950 p-4">
                  <span className="text-[11px] uppercase font-bold text-neutral-500 tracking-wider">
                    Total de Eventos Auditados
                  </span>
                  <p className="font-oswald text-3xl font-bold mt-1 text-white">
                    {auditLogs.length}
                  </p>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Registros capturados
                  </span>
                </div>

                <div className="border border-neutral-800 bg-neutral-950 p-4">
                  <span className="text-[11px] uppercase font-bold text-neutral-500 tracking-wider">
                    Despachos Dimona
                  </span>
                  <p className="font-oswald text-3xl font-bold mt-1 text-[#ff66c4]">
                    {auditLogs.filter((l) => l.action?.includes("dimona")).length}
                  </p>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Ordens e simulações de fábrica
                  </span>
                </div>

                <div className="border border-neutral-800 bg-neutral-950 p-4">
                  <span className="text-[11px] uppercase font-bold text-neutral-500 tracking-wider">
                    Mutações de Preço / Markup
                  </span>
                  <p className="font-oswald text-3xl font-bold mt-1 text-emerald-400">
                    {
                      auditLogs.filter(
                        (l) =>
                          l.action?.includes("price") ||
                          l.action?.includes("pricing") ||
                          l.action?.includes("markup")
                      ).length
                    }
                  </p>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Ajustes de margem e custos
                  </span>
                </div>

                <div className="border border-neutral-800 bg-neutral-950 p-4">
                  <span className="text-[11px] uppercase font-bold text-neutral-500 tracking-wider">
                    Acessos Administrativos
                  </span>
                  <p className="font-oswald text-3xl font-bold mt-1 text-cyan-300">
                    {auditLogs.filter((l) => l.action?.includes("login")).length}
                  </p>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Logins autenticados
                  </span>
                </div>
              </div>

              {/* Barra de Filtros e Busca */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-900/60 p-4 border border-neutral-800">
                <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") loadAuditLogs(auditFilterAction, auditSearch);
                      }}
                      placeholder="Buscar por e-mail, ID do pedido, produto ou ação..."
                      className="w-full bg-black border border-neutral-700 pl-9 pr-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <select
                    value={auditFilterAction}
                    onChange={(e) => {
                      setAuditFilterAction(e.target.value);
                      loadAuditLogs(e.target.value, auditSearch);
                    }}
                    className="bg-black border border-neutral-700 px-3 py-2 text-xs font-mono text-neutral-300 focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">Todas as Ações</option>
                    <option value="dimona_order_dispatch">Despacho de Pedido (Dimona)</option>
                    <option value="dimona_test_dispatch">Simulação de Esteira (Dimona)</option>
                    <option value="pricing_rules_update">Regras de Preço & Markup</option>
                    <option value="pricing_batch_apply">Aplicação em Lote de Preços</option>
                    <option value="product_price_update">Alteração de Preço de Produto</option>
                    <option value="product_create">Criação de Produto</option>
                    <option value="product_delete">Exclusão de Produto</option>
                    <option value="coupon_upsert">Criação / Edição de Cupom</option>
                    <option value="coupon_delete">Exclusão de Cupom</option>
                    <option value="admin_login">Login de Operador</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => loadAuditLogs(auditFilterAction, auditSearch)}
                    className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs font-bold uppercase transition-colors"
                  >
                    Filtrar
                  </button>
                </div>

                <div className="text-[11px] font-mono text-neutral-400">
                  Exibindo <strong>{auditLogs.length}</strong> eventos
                </div>
              </div>

              {/* Tabela de Logs de Auditoria */}
              <div className="border border-neutral-800 bg-neutral-950 overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-neutral-900 border-b border-neutral-800 text-[10px] uppercase text-neutral-400 tracking-wider">
                    <tr>
                      <th className="p-3.5">Data / Hora</th>
                      <th className="p-3.5">Operador</th>
                      <th className="p-3.5">Ação Executada</th>
                      <th className="p-3.5">Entidade / Alvo</th>
                      <th className="p-3.5">IP de Origem</th>
                      <th className="p-3.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-neutral-500">
                          {loadingAudit ? (
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                              <span>Carregando trilha de auditoria...</span>
                            </div>
                          ) : (
                            "Nenhum evento registrado com os filtros selecionados."
                          )}
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => {
                        const dateFormatted = new Date(log.created_at).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "medium",
                        });

                        // Cor e rótulo da ação
                        let actionLabel = log.action;
                        let actionBadgeClass = "bg-neutral-800 border-neutral-700 text-neutral-300";

                        if (log.action === "dimona_order_dispatch") {
                          actionLabel = "DESPACHO PEDIDO DIMONA";
                          actionBadgeClass = "bg-emerald-950/80 border-emerald-500 text-emerald-300";
                        } else if (log.action === "dimona_test_dispatch") {
                          actionLabel = "SIMULAÇÃO ESTEIRA DIMONA";
                          actionBadgeClass = "bg-pink-950/80 border-[#ff66c4] text-[#ff66c4]";
                        } else if (log.action === "pricing_rules_update") {
                          actionLabel = "REGRAS DE MARKUP";
                          actionBadgeClass = "bg-amber-950/80 border-amber-500 text-amber-300";
                        } else if (log.action === "pricing_batch_apply") {
                          actionLabel = "MARKUP EM LOTE";
                          actionBadgeClass = "bg-purple-950/80 border-purple-500 text-purple-300";
                        } else if (log.action === "product_price_update") {
                          actionLabel = "ALTERAÇÃO DE PREÇO";
                          actionBadgeClass = "bg-yellow-950/80 border-yellow-500 text-yellow-300";
                        } else if (log.action === "product_create") {
                          actionLabel = "NOVA ESTAMPA";
                          actionBadgeClass = "bg-blue-950/80 border-blue-500 text-blue-300";
                        } else if (log.action === "product_delete") {
                          actionLabel = "EXCLUSÃO PRODUTO";
                          actionBadgeClass = "bg-red-950/80 border-red-500 text-red-300";
                        } else if (log.action === "coupon_upsert") {
                          actionLabel = "CUPOM ATUALIZADO";
                          actionBadgeClass = "bg-pink-950/80 border-pink-400 text-pink-300";
                        } else if (log.action === "coupon_delete") {
                          actionLabel = "CUPOM REMOVIDO";
                          actionBadgeClass = "bg-red-950/80 border-red-400 text-red-300";
                        } else if (log.action === "admin_login") {
                          actionLabel = "LOGIN OPERADOR";
                          actionBadgeClass = "bg-cyan-950/80 border-cyan-500 text-cyan-300";
                        }

                        return (
                          <tr key={log.id} className="hover:bg-neutral-900/40 transition-colors">
                            <td className="p-3.5 text-neutral-400 whitespace-nowrap">
                              {dateFormatted}
                            </td>
                            <td className="p-3.5 font-bold text-white whitespace-nowrap">
                              {log.user_email}
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 border ${actionBadgeClass}`}
                              >
                                {actionLabel}
                              </span>
                            </td>
                            <td className="p-3.5 text-neutral-300 max-w-[200px] truncate">
                              <span className="text-neutral-500 uppercase">{log.entity}:</span>{" "}
                              <strong className="text-white">{log.entity_id || "-"}</strong>
                            </td>
                            <td className="p-3.5 text-neutral-400 font-mono text-[11px] whitespace-nowrap">
                              {log.ip_address || "127.0.0.1"}
                            </td>
                            <td className="p-3.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setSelectedAuditLog(log)}
                                className="text-[11px] font-oswald uppercase font-bold text-amber-400 hover:text-white border border-neutral-700 hover:border-amber-400 px-2.5 py-1 transition-colors"
                              >
                                Ver Detalhes
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* MODAL DE DETALHES DE AUDITORIA */}
        {selectedAuditLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-neutral-950 border-2 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.35)] p-6 space-y-4 my-8">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-400 text-black flex items-center justify-center font-black">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-oswald text-xl font-bold uppercase tracking-tight text-white">
                      Registro de Auditoria #{selectedAuditLog.id}
                    </h3>
                    <p className="text-[11px] text-neutral-400 font-mono">
                      {new Date(selectedAuditLog.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAuditLog(null)}
                  className="text-neutral-400 hover:text-white p-2 hover:bg-neutral-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Informações Gerais do Evento */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-neutral-900/60 border border-neutral-800 text-xs font-mono">
                <div>
                  <span className="text-neutral-500 text-[10px] block uppercase">Operador:</span>
                  <strong className="text-white">{selectedAuditLog.user_email}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 text-[10px] block uppercase">Ação:</span>
                  <strong className="text-amber-400">{selectedAuditLog.action}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 text-[10px] block uppercase">IP de Origem:</span>
                  <span className="text-neutral-300">{selectedAuditLog.ip_address || "127.0.0.1"}</span>
                </div>
                <div>
                  <span className="text-neutral-500 text-[10px] block uppercase">Entidade:</span>
                  <strong className="text-white">{selectedAuditLog.entity}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-neutral-500 text-[10px] block uppercase">ID do Alvo:</span>
                  <span className="text-neutral-300 truncate block">{selectedAuditLog.entity_id || "-"}</span>
                </div>
              </div>

              {/* Payload Diff */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">
                    Payload Diff / Dados da Operação:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(selectedAuditLog.payload_diff, null, 2)
                      );
                      setActionMsg("📋 Dados do evento copiados para a área de transferência!");
                      setTimeout(() => setActionMsg(""), 3000);
                    }}
                    className="text-[10px] font-mono uppercase text-amber-400 hover:underline"
                  >
                    Copiar JSON
                  </button>
                </div>
                <pre className="p-4 bg-black border-2 border-neutral-800 text-xs font-mono text-neutral-200 whitespace-pre-wrap break-all max-h-80 overflow-y-auto leading-relaxed">
                  {selectedAuditLog.payload_diff
                    ? JSON.stringify(selectedAuditLog.payload_diff, null, 2)
                    : "// Nenhum payload adicional registrado"}
                </pre>
              </div>

              <div className="flex justify-end pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setSelectedAuditLog(null)}
                  className="px-5 py-2.5 bg-neutral-800 text-white font-oswald text-sm font-bold uppercase tracking-wider hover:bg-neutral-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE RESULTADO DA SIMULAÇÃO DIMONA */}
        {dimonaSimulationResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-neutral-950 border-2 border-[#ff66c4] shadow-[0_0_50px_rgba(255,102,196,0.35)] p-6 space-y-5 my-8">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#ff66c4] text-black flex items-center justify-center font-black">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-oswald text-xl font-bold uppercase tracking-tight text-white">
                      Resultado da Simulação de Esteira Dimona
                    </h3>
                    <p className="text-[11px] text-neutral-400 font-mono">
                      Validação pré-despacho & Payload gerado para a API v2
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDimonaSimulationResult(null)}
                  className="text-neutral-400 hover:text-white p-2 hover:bg-neutral-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status de Validação */}
              <div className="space-y-3">
                {dimonaSimulationResult.validation?.valid ? (
                  <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 p-3 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <strong className="block font-bold">✓ Validação Pré-Despacho Aprovada com Sucesso</strong>
                      <span className="text-[11px] opacity-90">
                        O item possui SKU de fábrica resolvido, arte em alta definição e todos os campos obrigatórios da esteira.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-950/80 border border-amber-500 text-amber-200 p-3 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-amber-400">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Inconsistências Detectadas na Validação:</span>
                    </div>
                    <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                      {dimonaSimulationResult.validation?.errors?.map((err: string, i: number) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Resumo dos Dados Traduzidos */}
                {dimonaSimulationResult.item && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-black border border-neutral-800 text-xs font-mono">
                    <div>
                      <span className="text-neutral-500 text-[10px] block">SKU FÁBRICA RESOLVIDO:</span>
                      <strong className="text-[#ff66c4] text-sm">
                        {dimonaSimulationResult.resolvedSku}
                      </strong>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[10px] block">BLANK DESTE PRODUTO:</span>
                      <strong className="text-white">
                        {dimonaSimulationResult.blank?.name} (R$ {dimonaSimulationResult.blank?.factoryCost.toFixed(2)})
                      </strong>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-neutral-900">
                      <span className="text-neutral-500 text-[10px] block">URL DA ARTE (DESIGNS):</span>
                      <a
                        href={dimonaSimulationResult.item.artwork_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline truncate block"
                      >
                        {dimonaSimulationResult.item.artwork_url}
                      </a>
                    </div>
                  </div>
                )}

                {/* Resposta do Client da Dimona */}
                {dimonaSimulationResult.dimonaResponse && (
                  <div className="p-3 bg-neutral-900/60 border border-neutral-800 space-y-1 text-xs font-mono">
                    <span className="text-neutral-400 text-[10px] block font-bold">
                      RETORNO DA API DIMONA:
                    </span>
                    <div className="text-emerald-300">
                      Status: <strong>{dimonaSimulationResult.dimonaResponse.status}</strong>
                    </div>
                    <div className="text-white">
                      Order ID Retornado: <strong>{dimonaSimulationResult.dimonaResponse.order_id}</strong>
                    </div>
                    <p className="text-neutral-400 text-[11px] pt-1">
                      {dimonaSimulationResult.dimonaResponse.message}
                    </p>
                  </div>
                )}

                {/* JSON Payload Sent */}
                {dimonaSimulationResult.payloadSent && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1 font-mono">
                      JSON Payload Transmitido para a Dimona (POST /order):
                    </span>
                    <pre className="p-3 bg-black border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-x-auto max-h-48">
                      {JSON.stringify(dimonaSimulationResult.payloadSent, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-neutral-800">
                <button
                  onClick={() => setDimonaSimulationResult(null)}
                  className="px-6 py-2.5 bg-[#ff66c4] text-black font-oswald text-base font-black uppercase tracking-wider hover:bg-white transition-colors"
                >
                  Fechar Simulação
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE NOTIFICAÇÃO & PREVIEW WHATSAPP */}
        {whatsappPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 overflow-y-auto">
            <div className="w-full max-w-xl border-2 border-emerald-500 bg-neutral-950 p-6 space-y-5 shadow-[0_0_50px_rgba(16,185,129,0.25)]">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                    Esteira de Notificações WhatsApp · Pedido #{whatsappPreview.orderId}
                  </span>
                  <h3 className="font-oswald text-2xl font-black uppercase text-white mt-1">
                    {whatsappPreview.type === "created"
                      ? "Gatilho 1: Pix Copia e Cola"
                      : whatsappPreview.type === "paid"
                      ? "Gatilho 2: Pagamento Confirmado"
                      : "Gatilho 3: Código de Rastreamento"}
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono mt-1">
                    Destinatário: <strong className="text-white">{whatsappPreview.customerName}</strong> · Telefone Higienizado (DDI 55):{" "}
                    <strong className="text-emerald-400">+{whatsappPreview.phone || "Não informado"}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setWhatsappPreview(null)}
                  className="border border-neutral-700 px-2.5 py-1 text-xs font-bold uppercase text-neutral-400 hover:text-white hover:border-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">
                    Mensagem Formatada Pronta:
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 border border-emerald-700 bg-emerald-950/60 text-emerald-300">
                    {whatsappPreview.simulated
                      ? "Pronto para Envio 1-Clique / API"
                      : "Disparado via API WhatsApp"}
                  </span>
                </div>
                <pre className="p-4 bg-black border-2 border-neutral-800 text-xs font-mono text-neutral-200 whitespace-pre-wrap break-all max-h-72 overflow-y-auto leading-relaxed">
                  {whatsappPreview.text}
                </pre>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(whatsappPreview.text);
                    setActionMsg("📋 Mensagem do WhatsApp copiada para a área de transferência!");
                    setTimeout(() => setActionMsg(""), 3000);
                  }}
                  className="px-4 py-2.5 border border-neutral-700 bg-neutral-900 text-white font-oswald text-sm font-bold uppercase tracking-wider hover:border-white transition-colors"
                >
                  Copiar Texto
                </button>

                <a
                  href={whatsappPreview.wa_me_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-emerald-500 text-black font-oswald text-sm font-black uppercase tracking-wider hover:bg-white transition-colors inline-flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Abrir e Enviar no WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
