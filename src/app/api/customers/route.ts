import { NextRequest, NextResponse } from "next/server";
import { getDatabaseOrdersAdmin, supabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export interface CustomerAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
}

export interface CustomerOrderSummary {
  id: string | number;
  created_at: string;
  total_amount: number;
  shipping_amount: number;
  payment_method: string;
  payment_status: string;
  dimona_status?: string;
  tracking_code?: string;
  tracking_url?: string;
  items_count: number;
  items: any[];
}

export interface AggregatedCustomer {
  id: string; // e-mail normalizado ou ID
  name: string;
  email: string;
  cpf: string;
  phone: string;
  has_account: boolean;
  total_orders: number;
  paid_orders_count: number;
  total_spent: number;
  first_order_at: string;
  last_order_at: string;
  addresses: CustomerAddress[];
  orders: CustomerOrderSummary[];
}

/**
 * GET /api/customers
 * Lista todos os clientes com dados agregados de compras, LTV e endereços.
 * Proteção rigorosa de AppSec / LGPD com autenticação administrativa.
 */
export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminAuth(req)) {
      return NextResponse.json(
        {
          success: false,
          error: "Acesso não autorizado. Autenticação administrativa obrigatória.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const searchQuery = String(searchParams.get("q") || "").trim().toLowerCase();

    // 1. Carrega todos os pedidos do Supabase
    const orders = await getDatabaseOrdersAdmin();

    // 2. Tenta listar usuários autenticados para saber quem tem conta cadastrada
    const authUsersMap = new Set<string>();
    try {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (authData && authData.users) {
        authData.users.forEach((u) => {
          if (u.email) authUsersMap.add(u.email.toLowerCase().trim());
        });
      }
    } catch (authErr) {
      console.warn("⚠️ [CUSTOMERS] Falha ao listar auth users:", authErr);
    }

    // 3. Agregação por E-mail (Chave Primária de Identificação do Cliente)
    const customerMap = new Map<string, AggregatedCustomer>();

    orders.forEach((ord: any) => {
      const rawEmail = ord.customer_email || ord.customer?.email || "";
      const email = String(rawEmail).trim().toLowerCase();
      if (!email) return;

      const rawName = ord.customer_name || ord.customer?.name || "Cliente Munaya";
      const rawCpf = ord.customer_cpf || ord.customer?.cpf || "";
      const rawPhone = ord.customer_phone || ord.customer?.phone || "";

      let customer = customerMap.get(email);
      if (!customer) {
        customer = {
          id: email,
          name: rawName,
          email: email,
          cpf: rawCpf,
          phone: rawPhone,
          has_account: authUsersMap.has(email),
          total_orders: 0,
          paid_orders_count: 0,
          total_spent: 0,
          first_order_at: ord.created_at || new Date().toISOString(),
          last_order_at: ord.created_at || new Date().toISOString(),
          addresses: [],
          orders: [],
        };
        customerMap.set(email, customer);
      }

      // Atualiza nome/cpf/telefone se o registro atual tiver dados mais completos
      if ((!customer.name || customer.name === "Cliente" || customer.name === "Cliente Munaya") && rawName) {
        customer.name = rawName;
      }
      if (!customer.cpf && rawCpf) customer.cpf = rawCpf;
      if (!customer.phone && rawPhone) customer.phone = rawPhone;

      // Métricas de pedidos
      customer.total_orders += 1;
      const orderTotal = Number(ord.total_amount || 0);
      const isPaid = ["pago", "aprovado", "approved", "completed"].includes(
        String(ord.payment_status || "").toLowerCase()
      );

      if (isPaid) {
        customer.paid_orders_count += 1;
        customer.total_spent += orderTotal;
      } else if (customer.total_orders === 1 && customer.total_spent === 0) {
        // Fallback: se nenhum estiver expressamente marcado como pago ainda, computa o valor do pedido
        customer.total_spent += orderTotal;
      }

      // Linha do tempo de datas
      if (ord.created_at && ord.created_at > customer.last_order_at) {
        customer.last_order_at = ord.created_at;
      }
      if (ord.created_at && ord.created_at < customer.first_order_at) {
        customer.first_order_at = ord.created_at;
      }

      // Endereços únicos
      const addrStreet = ord.street || ord.address?.street;
      if (addrStreet) {
        const addrZip = String(ord.zipcode || ord.address?.zipcode || "").replace(/\D/g, "");
        const alreadyExists = customer.addresses.some(
          (a) => a.street === addrStreet && a.number === String(ord.number || "")
        );
        if (!alreadyExists) {
          customer.addresses.push({
            street: addrStreet,
            number: String(ord.number || ord.address?.number || "S/N"),
            complement: ord.complement || ord.address?.complement || "",
            neighborhood: ord.neighborhood || ord.address?.neighborhood || "",
            city: ord.city || ord.address?.city || "",
            state: ord.state || ord.address?.state || "",
            zipcode: addrZip,
          });
        }
      }

      // Resumo do pedido para o modal de histórico
      const itemsList = Array.isArray(ord.items) ? ord.items : [];
      customer.orders.push({
        id: ord.id,
        created_at: ord.created_at || new Date().toISOString(),
        total_amount: orderTotal,
        shipping_amount: Number(ord.shipping_amount || 0),
        payment_method: ord.payment_method || "pix",
        payment_status: ord.payment_status || "aguardando_pagamento",
        dimona_status: ord.dimona_status || "pendente",
        tracking_code: ord.tracking_code || undefined,
        tracking_url: ord.tracking_url || undefined,
        items_count: itemsList.reduce((acc: number, it: any) => acc + (Number(it.quantity || it.qty) || 1), 0),
        items: itemsList,
      });
    });

    // Também adiciona usuários cadastrados que ainda não realizaram compras
    authUsersMap.forEach((userEmail) => {
      if (!customerMap.has(userEmail)) {
        customerMap.set(userEmail, {
          id: userEmail,
          name: userEmail.split("@")[0].toUpperCase(),
          email: userEmail,
          cpf: "",
          phone: "",
          has_account: true,
          total_orders: 0,
          paid_orders_count: 0,
          total_spent: 0,
          first_order_at: "",
          last_order_at: "",
          addresses: [],
          orders: [],
        });
      }
    });

    // Ordena os pedidos de cada cliente do mais recente para o mais antigo
    let customerList = Array.from(customerMap.values()).map((c) => {
      c.orders.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return c;
    });

    // Ordenação padrão da listagem: clientes com maior LTV e pedidos mais recentes primeiro
    customerList.sort((a, b) => {
      if (b.total_spent !== a.total_spent) {
        return b.total_spent - a.total_spent;
      }
      return new Date(b.last_order_at || 0).getTime() - new Date(a.last_order_at || 0).getTime();
    });

    // Filtro de busca em tempo real
    if (searchQuery) {
      customerList = customerList.filter((c) => {
        const cleanCpf = c.cpf.replace(/\D/g, "");
        const cleanPhone = c.phone.replace(/\D/g, "");
        return (
          c.name.toLowerCase().includes(searchQuery) ||
          c.email.toLowerCase().includes(searchQuery) ||
          cleanCpf.includes(searchQuery) ||
          cleanPhone.includes(searchQuery) ||
          c.addresses.some((a) => a.city.toLowerCase().includes(searchQuery) || a.state.toLowerCase().includes(searchQuery))
        );
      });
    }

    return NextResponse.json({
      success: true,
      total_count: customerList.length,
      customers: customerList,
    });
  } catch (err: any) {
    console.error("Erro ao listar clientes no admin:", err);
    return NextResponse.json(
      { success: false, error: "Erro interno ao processar clientes." },
      { status: 500 }
    );
  }
}
