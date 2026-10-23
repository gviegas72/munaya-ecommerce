import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { recordAuditLog } from "@/lib/audit";
import {
  getEvolutionSettings,
  saveEvolutionSettings,
  checkEvolutionConnection,
  sendEvolutionTextMessage,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json(
      { error: "Acesso administrativo obrigatório." },
      { status: 401 }
    );
  }

  try {
    const settings = await getEvolutionSettings(true);
    const status = await checkEvolutionConnection(false);

    return NextResponse.json({
      success: true,
      settings,
      status,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erro ao consultar Evolution API." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = verifyAdminAuth(req, ["super_admin"]);
  if (!session) {
    return NextResponse.json(
      { error: "Acesso restrito: Apenas usuários com permissão Super Admin podem alterar as credenciais de API do WhatsApp." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const saveRes = await saveEvolutionSettings({
      baseUrl: body.baseUrl,
      instanceName: body.instanceName,
      apiKey: body.apiKey,
      enabled: body.enabled !== undefined ? Boolean(body.enabled) : true,
    });

    if (!saveRes.success) {
      return NextResponse.json(
        { success: false, error: saveRes.error },
        { status: 400 }
      );
    }

    await recordAuditLog(req, {
      user_id: session.id,
      user_email: session.email,
      action: "whatsapp_config_update",
      entity: "settings",
      entity_id: "evolution_api",
      payload_diff: {
        baseUrl: body.baseUrl,
        instanceName: body.instanceName,
        enabled: body.enabled,
      },
    });

    const status = await checkEvolutionConnection(false);

    return NextResponse.json({
      success: true,
      settings: saveRes.settings,
      status,
      message: "Credenciais da Evolution API salvas no Supabase com sucesso!",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erro ao salvar credenciais da Evolution API." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json(
      { error: "Acesso administrativo obrigatório." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { action, phone, customMessage } = body;

    if (action === "qrcode") {
      const status = await checkEvolutionConnection(true);
      return NextResponse.json({
        success: true,
        status,
      });
    }

    if (action === "test") {
      if (!phone) {
        return NextResponse.json(
          { success: false, error: "Informe o número de WhatsApp com DDD para o teste." },
          { status: 400 }
        );
      }

      const text =
        customMessage ||
        [
          `🤘 *TESTE DE CONEXÃO EVOLUTION API — MUNAYA ROCKS*`,
          ``,
          `Seu gateway de WhatsApp está conectado e pronto para disparar automaticamente:`,
          `• *Gatilho 1:* Pedido Criado + Código Pix Copia e Cola`,
          `• *Gatilho 2:* Pagamento Confirmado + Entrada na Esteira`,
          `• *Gatilho 3:* Pedido Despachado + Link de Rastreio`,
          ``,
          `Vista a Revolução! ⚡🎸`,
        ].join("\n");

      const sendRes = await sendEvolutionTextMessage(phone, text);

      return NextResponse.json({
        success: sendRes.success && !sendRes.simulated,
        result: sendRes,
        error: sendRes.error,
      });
    }

    return NextResponse.json(
      { error: "Ação inválida. Use 'qrcode' ou 'test'." },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erro na operação da Evolution API." },
      { status: 500 }
    );
  }
}
