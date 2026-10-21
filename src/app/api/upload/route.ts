import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminAuth(req)) {
      return NextResponse.json(
        { success: false, error: "Acesso administrativo obrigatório para upload." },
        { status: 401 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    let fileBuffer: Buffer | null = null;
    let fileName = "";
    let mimeType = "image/png";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, error: "Nenhum arquivo enviado no campo 'file'." },
          { status: 400 }
        );
      }
      fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      mimeType = file.type || "image/png";
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      // JSON com base64
      const body = await req.json();
      if (!body.base64) {
        return NextResponse.json(
          { success: false, error: "Dados base64 ausentes." },
          { status: 400 }
        );
      }
      const rawBase64 = String(body.base64).replace(/^data:image\/\w+;base64,/, "");
      fileBuffer = Buffer.from(rawBase64, "base64");
      const ext = (body.filename || "upload.png").split(".").pop() || "png";
      fileName = `${Date.now()}-${(body.filename || "estampa.png").replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      mimeType = body.mimeType || (ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png");
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json(
        { success: false, error: "Arquivo vazio ou inválido." },
        { status: 400 }
      );
    }

    // Upload direto para o bucket 'products' no Supabase
    const { data, error } = await supabaseAdmin.storage
      .from("products")
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error("Erro no upload para o Supabase Storage:", error);
      return NextResponse.json(
        { success: false, error: error.message || "Erro ao salvar arquivo no Supabase Storage." },
        { status: 500 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/products/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      size: fileBuffer.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Erro no endpoint de upload:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
