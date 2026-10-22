"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

export interface CartItem {
  id: string; // SKU completo ex: "MNY-TSH-DIMEBAG-PRETA-M"
  productId: string | number;
  name: string;
  price: number;
  formattedPrice: string;
  size: string;
  color?: string;
  sku?: string;
  image: string;
  quantity: number;
  checkoutUrl?: string;
}

export interface CartItemInput {
  productId: string | number;
  name: string;
  price: number | string;
  size: string;
  color?: string;
  sku?: string;
  image: string;
  quantity?: number;
  checkoutUrl?: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItemInput) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalPrice: number;
  formattedTotalPrice: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "munaya_cart_items_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Carregar itens do localStorage na montagem (evita mismatch de SSR)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.warn("Falha ao recuperar carrinho do localStorage:", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Salvar itens no localStorage sempre que houver alteração após hidratação
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Falha ao salvar carrinho no localStorage:", e);
    }
  }, [items, isHydrated]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  const addItem = useCallback((input: CartItemInput) => {
    const rawPrice =
      typeof input.price === "number"
        ? input.price
        : parseFloat(String(input.price).replace(/[^0-9.,]/g, "").replace(",", ".")) || 89.9;

    const formattedPrice =
      typeof input.price === "string" && input.price.includes("R$")
        ? input.price
        : `R$ ${rawPrice.toFixed(2).replace(".", ",")}`;

    const id =
      input.sku ||
      `${input.productId}-${input.color || "Preta"}-${input.size}`;
    const qty = input.quantity && input.quantity > 0 ? input.quantity : 1;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === id);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qty,
        };
        return updated;
      }

      const newItem: CartItem = {
        id,
        productId: input.productId,
        name: input.name,
        price: rawPrice,
        formattedPrice,
        size: input.size,
        color: input.color || "Preta",
        sku: input.sku,
        image: input.image,
        quantity: qty,
        checkoutUrl: input.checkoutUrl,
      };

      return [...prevItems, newItem];
    });

    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalCount = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  const totalPrice = useMemo(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [items]);

  const formattedTotalPrice = useMemo(() => {
    return `R$ ${totalPrice.toFixed(0)}`;
  }, [totalPrice]);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        totalPrice,
        formattedTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser utilizado dentro de um <CartProvider>");
  }
  return context;
}
