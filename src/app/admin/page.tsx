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
  badge: string;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
}

const INITIAL_NEW_PRODUCT: NewProductForm = {
  name: "",
  slug: "",
  sku: "MUNAYA-NOVA",
  colors: OFFICIAL_COLORS, // Preta, Branca e Cinza
  sizes: Array.from(OFFICIAL_SIZES), // PP, P, M, G, GG, XGG
  subtitle: "100% Algodão Premium Silk Screen",
  description: "",
  price: "89.90",
  compare_at_price: "119.00",
  image_url: "",
  artwork_url: "",
  badge: "Bonzo Series",
  is_active: true,
  is_featured: false,
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
  const [activeTab, setActiveTab] = useState<"orders" | "catalog" | "coupons" | "pricing">("orders");

  // Estados de Pedidos
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [actionMsg, setActionMsg] = useState("");
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
      loadCoupons();
      loadPricing();
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



  const loadPricing = async () => {
    setLoadingPricing(true);
    try {
      const savedPin = localStorage.getItem("munaya_admin_token") || "munaya2026";
      const res = await fetch("/api/pricing", {
        headers: { "x-admin-pin": savedPin },
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setPricingSettings(data.settings);
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
      const savedPin = localStorage.getItem("munaya_admin_token") || "munaya2026";
      const res = await fetch("/api/coupons", {
        headers: { "x-admin-pin": savedPin },
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

  const handleFileUpload = async (
    file: File,
    field: "image_url" | "artwork_url"
  ) => {
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
        setNewProduct((prev) => ({ ...prev, [field]: data.url }));
        setActionMsg(`Upload concluído com sucesso!`);
        setTimeout(() => setActionMsg(""), 3000);
      } else {
        alert("Erro no upload da imagem: " + (data.error || "Tente novamente"));
      }
    } catch (e: any) {
      alert("Falha de rede no upload: " + (e?.message || String(e)));
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
      image_url: prod.image_url || "",
      artwork_url: prod.artwork_url || prod.image_url || "",
      badge: prod.badge || "",
      is_active: prod.is_active !== undefined ? prod.is_active : true,
      is_featured: prod.is_featured !== undefined ? prod.is_featured : false,
      display_order: prod.display_order || 10,
    });
    setEditError("");
    setEditSuccess("");
  };

  const handleEditFileUpload = async (
    file: File,
    field: "image_url" | "artwork_url"
  ) => {
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
        setEditingProduct((prev) =>
          prev ? { ...prev, [field]: data.url } : null
        );
        setActionMsg(`Upload de nova imagem concluído!`);
        setTimeout(() => setActionMsg(""), 3000);
      } else {
        alert("Erro no upload da imagem: " + (data.error || "Tente novamente"));
      }
    } catch (e: any) {
      alert("Falha de rede no upload: " + (e?.message || String(e)));
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
        image_url: editingProduct.image_url,
        artwork_url: editingProduct.artwork_url,
        badge: editingProduct.badge || null,
        is_active: editingProduct.is_active,
        is_featured: editingProduct.is_featured,
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
                  image_url: editingProduct.image_url,
                  artwork_url: editingProduct.artwork_url,
                  badge: editingProduct.badge || undefined,
                  is_active: editingProduct.is_active,
                  is_featured: editingProduct.is_featured,
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
                            </div>

                            <h3 className="font-oswald text-xl font-bold uppercase truncate mt-1">
                              {prod.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-[#ff66c4] font-mono font-bold tracking-wider">
                                {prod.sku || generateBaseSku(prod.name)}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-400 truncate font-mono">
                              slug: {prod.slug}
                            </p>
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

                        {/* Botões: Editar Completo, Salvar Rápido e Excluir */}
                        <div className="flex items-center gap-2 pt-1">
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
                        <label className="block text-[11px] uppercase font-bold text-neutral-300 mb-1.5">
                          Cores Disponíveis (Preto é padrão)
                        </label>
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
                    {/* Mockup da Camiseta */}
                    <div className="border border-neutral-800 p-3 bg-neutral-900/60 space-y-2">
                      <label className="block text-xs uppercase font-bold text-neutral-200">
                        1. Mockup da Camiseta (Foto da Vitrine) *
                      </label>

                      <div className="flex gap-3 items-center">
                        {newProduct.image_url ? (
                          <div className="w-20 h-24 bg-neutral-950 border border-neutral-700 flex-shrink-0 relative overflow-hidden group">
                            <img
                              src={newProduct.image_url}
                              alt="Mockup Preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setNewProduct((prev) => ({
                                  ...prev,
                                  image_url: "",
                                }))
                              }
                              className="absolute top-1 right-1 bg-black/80 text-white p-1 hover:text-red-400"
                              title="Remover imagem"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-20 h-24 bg-neutral-950 border border-dashed border-neutral-700 flex flex-col items-center justify-center flex-shrink-0 text-neutral-600">
                            <ImageIcon className="w-6 h-6 mb-1" />
                            <span className="text-[9px] uppercase font-bold">
                              Sem Foto
                            </span>
                          </div>
                        )}

                        <div className="flex-1 space-y-2">
                          <label className="flex items-center justify-center gap-2 border border-neutral-600 bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-2 text-xs font-bold uppercase cursor-pointer transition-colors">
                            <Upload className="w-4 h-4 text-[#ff66c4]" />
                            <span>
                              {uploadingImage
                                ? "Enviando arquivo..."
                                : "Escolher do Computador"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingImage}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, "image_url");
                              }}
                              className="hidden"
                            />
                          </label>

                          <input
                            type="text"
                            placeholder="Ou cole a URL da foto (https://...)"
                            value={newProduct.image_url}
                            onChange={(e) =>
                              setNewProduct((prev) => ({
                                ...prev,
                                image_url: e.target.value,
                              }))
                            }
                            className="w-full bg-neutral-950 border border-neutral-700 px-2 py-1.5 text-xs text-neutral-300 focus:border-[#ff66c4] focus:outline-none"
                          />
                        </div>
                      </div>
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-oswald text-2xl font-bold uppercase tracking-tight text-white">
                        Editar Estampa #{editingProduct.id}
                      </h3>
                      <span className="font-mono text-xs text-[#ff66c4] bg-[#ff66c4]/10 border border-[#ff66c4]/30 px-2 py-0.5">
                        {editingProduct.slug}
                      </span>
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
                        <label className="block text-[11px] uppercase font-bold text-neutral-300 mb-1.5">
                          Cores Disponíveis (Preto é padrão)
                        </label>
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

                    <div className="flex items-center gap-6 pt-2">
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
                    </div>
                  </div>

                  {/* Coluna 2: Uploads & Mídia */}
                  <div className="space-y-4">
                    {/* Mockup da Camiseta */}
                    <div className="border border-neutral-800 p-3 bg-neutral-900/60 space-y-2">
                      <label className="block text-xs uppercase font-bold text-neutral-200">
                        1. Mockup da Camiseta (Foto da Vitrine)
                      </label>

                      <div className="flex gap-3 items-center">
                        {editingProduct.image_url ? (
                          <div className="w-20 h-24 bg-neutral-950 border border-neutral-700 flex-shrink-0 relative overflow-hidden group">
                            <img
                              src={editingProduct.image_url}
                              alt="Mockup Preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setEditingProduct((prev) =>
                                  prev ? { ...prev, image_url: "" } : null
                                )
                              }
                              className="absolute top-1 right-1 bg-black/80 text-white p-1 hover:text-red-400"
                              title="Remover foto"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-20 h-24 bg-neutral-950 border border-dashed border-neutral-700 flex flex-col items-center justify-center flex-shrink-0 text-neutral-600">
                            <ImageIcon className="w-6 h-6 mb-1" />
                            <span className="text-[9px] uppercase font-bold">
                              Sem Foto
                            </span>
                          </div>
                        )}

                        <div className="flex-1 space-y-2">
                          <label className="flex items-center justify-center gap-2 border border-neutral-600 bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-2 text-xs font-bold uppercase cursor-pointer transition-colors">
                            <Upload className="w-4 h-4 text-[#ff66c4]" />
                            <span>
                              {uploadingEditImage
                                ? "Enviando arquivo..."
                                : "Substituir Foto do Computador"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingEditImage}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file)
                                  handleEditFileUpload(file, "image_url");
                              }}
                              className="hidden"
                            />
                          </label>

                          <input
                            type="text"
                            placeholder="Ou cole a URL da foto (https://...)"
                            value={editingProduct.image_url}
                            onChange={(e) =>
                              setEditingProduct((prev) =>
                                prev ? { ...prev, image_url: e.target.value } : null
                              )
                            }
                            className="w-full bg-neutral-950 border border-neutral-700 px-2 py-1.5 text-xs text-neutral-300 focus:border-[#ff66c4] focus:outline-none"
                          />
                        </div>
                      </div>
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
                  {Object.entries(pricingSettings.fabrics).map(([key, fabric]) => (
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
                                ...pricingSettings.fabrics,
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
                {Object.entries(pricingSettings.fabrics).map(([key, fabric]) => {
                  const calculatedPrice = calculateSellingPrice(fabric.base_cost, pricingSettings);
                  const fin = calculateFinancialSummary(
                    fabric.base_cost,
                    calculatedPrice,
                    pricingSettings.tax_gateway_percent
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

      </div>
    </div>
  );
}
