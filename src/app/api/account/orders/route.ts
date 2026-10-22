import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !user.email) {
      return NextResponse.json(
        { success: false, error: "Não autenticado." },
        { status: 401 }
      );
    }

    const cleanEmail = user.email.trim().toLowerCase();

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .ilike("customer_email", cleanEmail)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Erro ao consultar pedidos do cliente:", ordersError);
    }

    const orderList = orders || [];
    const latestOrder = orderList[0] || null;
    const meta = user.user_metadata || {};

    const profile = {
      nome: meta.nome || meta.full_name || latestOrder?.customer_name || "",
      email: user.email,
      cpf: meta.cpf || latestOrder?.customer_cpf || "",
      fone: meta.fone || latestOrder?.customer_phone || "",
      cep: meta.cep || latestOrder?.zipcode || "",
      rua: meta.rua || latestOrder?.street || "",
      num: meta.num || latestOrder?.number || "",
      compl: meta.compl || latestOrder?.complement || "",
      bairro: meta.bairro || latestOrder?.neighborhood || "",
      cidade: meta.cidade || latestOrder?.city || "",
      uf: meta.uf || latestOrder?.state || "",
    };

    return NextResponse.json({
      success: true,
      orders: orderList,
      profile,
    });
  } catch (err: any) {
    console.error("Erro em GET /api/account/orders:", err);
    return NextResponse.json(
      { success: false, error: "Erro ao carregar dados da conta." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Não autenticado." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      nome = "",
      cpf = "",
      fone = "",
      cep = "",
      rua = "",
      num = "",
      compl = "",
      bairro = "",
      cidade = "",
      uf = "",
    } = body;

    const updatedMeta = {
      ...(user.user_metadata || {}),
      full_name: String(nome).trim(),
      nome: String(nome).trim(),
      cpf: String(cpf).trim(),
      fone: String(fone).trim(),
      cep: String(cep).trim(),
      rua: String(rua).trim(),
      num: String(num).trim(),
      compl: String(compl).trim(),
      bairro: String(bairro).trim(),
      cidade: String(cidade).trim(),
      uf: String(uf).trim().toUpperCase(),
    };

    const { error: updateErr } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: updatedMeta,
      });

    if (updateErr) {
      return NextResponse.json(
        { success: false, error: updateErr.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        ...updatedMeta,
        email: user.email,
      },
    });
  } catch (err: any) {
    console.error("Erro em PUT /api/account/orders:", err);
    return NextResponse.json(
      { success: false, error: "Erro ao salvar dados cadastrais." },
      { status: 500 }
    );
  }
}
