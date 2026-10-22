import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Informe um e-mail válido." },
        { status: 400 }
      );
    }

    const host =
      process.env.NEXT_PUBLIC_SITE_URL || "https://munayarocks.vercel.app";

    // 1. Gera o token seguro de recuperação via chave administrativa do Supabase
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: cleanEmail,
        options: {
          redirectTo: `${host}/redefinir-senha`,
        },
      });

    if (linkError || !linkData?.properties) {
      console.warn("Aviso ao gerar link de recuperação:", linkError?.message);
      // Retorna sucesso por segurança contra enumeração de contas
      return NextResponse.json({
        success: true,
        message: "Se o e-mail estiver cadastrado, as instruções foram enviadas.",
      });
    }

    const hashedToken = linkData.properties.hashed_token;
    // Link direto apontando para /redefinir-senha com token_hash (zero dependência de localhost)
    const directResetUrl = hashedToken
      ? `${host}/redefinir-senha?token_hash=${encodeURIComponent(hashedToken)}&type=recovery`
      : linkData.properties.action_link.replace(
          /redirect_to=http[^&]+/,
          `redirect_to=${encodeURIComponent(`${host}/redefinir-senha`)}`
        );

    // 2. Envia o e-mail via Resend API (entrega instantânea sem rate-limit do Supabase)
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail =
      process.env.EMAIL_FROM || "Munaya Rocks <onboarding@resend.dev>";

    if (resendApiKey) {
      const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [cleanEmail],
        subject: "Recuperação de Senha | Munaya Rocks",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Recuperação de Senha | Munaya Rocks</title>
          </head>
          <body style="margin:0;padding:0;background-color:#000000;color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#000000;padding:40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:540px;background-color:#0a0a0a;border:2px solid #ffffff;padding:40px;">
                    <tr>
                      <td align="center" style="padding-bottom:24px;border-bottom:1px solid #262626;">
                        <h1 style="margin:0;font-size:28px;font-weight:900;letter-spacing:-1px;text-transform:uppercase;color:#ff66c4;">
                          MUNAYA ROCKS
                        </h1>
                        <p style="margin:6px 0 0 0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#a3a3a3;">
                          Área do Cliente · Recuperação de Acesso
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:32px 0;">
                        <h2 style="margin:0 0 16px 0;font-size:22px;font-weight:700;text-transform:uppercase;color:#ffffff;">
                          Redefina sua senha
                        </h2>
                        <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#d4d4d4;">
                          Recebemos uma solicitação para redefinir a senha da sua conta cadastrada com <strong style="color:#ffffff;">${cleanEmail}</strong>.
                        </p>
                        <p style="margin:0 0 32px 0;font-size:15px;line-height:1.6;color:#d4d4d4;">
                          Clique no botão abaixo para abrir a página da Munaya Rocks e cadastrar sua nova senha:
                        </p>
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center">
                              <a href="${directResetUrl}" target="_blank" style="display:inline-block;background-color:#ff66c4;color:#000000;font-size:16px;font-weight:900;text-transform:uppercase;letter-spacing:1px;padding:16px 36px;text-decoration:none;border-radius:0;">
                                REDEFINIR MINHA SENHA
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:28px 0 0 0;font-size:12px;line-height:1.5;color:#737373;word-break:break-all;">
                          Ou copie e cole este link no navegador:<br>
                          <a href="${directResetUrl}" style="color:#ff66c4;text-decoration:underline;">${directResetUrl}</a>
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="border-top:1px solid #262626;padding-top:20px;text-align:center;">
                        <p style="margin:0;font-size:11px;color:#525252;text-transform:uppercase;letter-spacing:1px;">
                          Munaya Rocks · Vista a Revolução
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    });

      const resendData = await resendResponse.json();
      console.log("📨 E-mail de recuperação enviado via Resend:", resendData);
    }

    return NextResponse.json({
      success: true,
      message: "Se o e-mail estiver cadastrado, as instruções foram enviadas.",
    });
  } catch (err: any) {
    console.error("Erro na rota de recuperação de senha:", err);
    return NextResponse.json(
      { success: false, error: "Erro interno ao processar a solicitação." },
      { status: 500 }
    );
  }
}
