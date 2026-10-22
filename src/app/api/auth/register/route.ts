import { NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Informe um endereço de e-mail válido." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "A senha deve conter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    // Cria o usuário com auto-confirmação ativada (dispensa confirmação por e-mail com link quebrado)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
    });

    if (createError) {
      // Se já existe, tenta informar amigavelmente
      if (createError.message?.toLowerCase().includes("already registered") || createError.message?.toLowerCase().includes("already exists")) {
        return NextResponse.json(
          { success: false, error: "Este e-mail já possui cadastro. Faça login ou solicite recuperação de senha." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: createError.message || "Erro ao registrar usuário." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conta criada e confirmada com sucesso!",
      user: {
        id: newUser.user?.id,
        email: newUser.user?.email,
      },
    });
  } catch (err: any) {
    console.error("Erro no registro de conta:", err);
    return NextResponse.json(
      { success: false, error: "Erro interno ao processar o cadastro." },
      { status: 500 }
    );
  }
}
