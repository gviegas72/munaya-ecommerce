import { NextRequest, NextResponse } from "next/server";
import {
  getCatalogProducts,
  getAllProductsAdmin,
  updateProductAdmin,
  createProductAdmin,
  deleteProductAdmin,
} from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { generateBaseSku } from "@/lib/variants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("admin") === "true";

    if (isAdmin && !verifyAdminAuth(req)) {
      return NextResponse.json(
        { success: false, error: "Acesso administrativo não autorizado." },
        { status: 401 }
      );
    }

    const products = isAdmin
      ? await getAllProductsAdmin()
      : await getCatalogProducts();

    return NextResponse.json({
      success: true,
      source: products.length > 0 ? "supabase" : "fallback",
      products,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminAuth(req)) {
      return NextResponse.json(
        {
          success: false,
          error: "Acesso administrativo obrigatório para criar estampas.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { success: false, error: "O nome da estampa/produto é obrigatório." },
        { status: 400 }
      );
    }

    // Gerar slug único e limpo
    let slug = String(body.slug || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!slug) {
      slug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    // Se o slug for muito curto ou genérico, adiciona sufixo aleatório
    if (!slug) {
      slug = "camiseta-" + Date.now().toString(36);
    }

    const cleanPrice = Number(String(body.price ?? 89.9).replace(",", "."));
    if (isNaN(cleanPrice) || cleanPrice < 0) {
      return NextResponse.json(
        { success: false, error: "Preço numérico inválido." },
        { status: 400 }
      );
    }

    let compareAtPrice: number | null = null;
    if (body.compare_at_price) {
      const cleanCompare = Number(
        String(body.compare_at_price).replace(",", ".")
      );
      if (!isNaN(cleanCompare) && cleanCompare > 0) {
        compareAtPrice = cleanCompare;
      }
    }

    const rawGallery: string[] = Array.isArray(body.gallery)
      ? body.gallery
          .map((u: any) => String(u || "").trim())
          .filter(Boolean)
          .slice(0, 6)
      : [];

    const imageUrl =
      rawGallery[0] ||
      String(body.image_url || "").trim() ||
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80";
    const artworkUrl = String(body.artwork_url || "").trim() || imageUrl;
    const gallery = rawGallery.length > 0 ? rawGallery : [imageUrl];

    const newProdPayload = {
      name,
      slug,
      sku: body.sku ? String(body.sku).trim().toUpperCase() : generateBaseSku(name),
      colors: Array.isArray(body.colors) && body.colors.length > 0 ? body.colors : undefined,
      sizes: Array.isArray(body.sizes) && body.sizes.length > 0 ? body.sizes : undefined,
      subtitle: body.subtitle ? String(body.subtitle).trim() : "100% Algodão Premium Silk Screen",
      description: body.description ? String(body.description).trim() : "",
      price: cleanPrice,
      compare_at_price: compareAtPrice || (cleanPrice > 89 ? cleanPrice + 30 : 119.0),
      image_url: imageUrl,
      artwork_url: artworkUrl,
      gallery,
      badge: body.badge ? String(body.badge).trim() : undefined,
      is_custom_price: body.is_custom_price !== undefined ? Boolean(body.is_custom_price) : false,
      dimona_product_id: body.dimona_product_id ? String(body.dimona_product_id).trim().toUpperCase() : undefined,
      blank_type: body.blank_type ? String(body.blank_type).trim().toLowerCase() : "classic",
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      is_featured: body.is_featured !== undefined ? Boolean(body.is_featured) : false,
      display_order: parseInt(String(body.display_order ?? 10), 10) || 10,
    };

    const res = await createProductAdmin(newProdPayload);
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: res.data,
      message: "Estampa cadastrada com sucesso!",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!verifyAdminAuth(req)) {
      return NextResponse.json(
        {
          success: false,
          error: "Acesso administrativo obrigatório para remover produtos.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    let id = idParam ? parseInt(idParam, 10) : null;

    if (!id) {
      try {
        const body = await req.json();
        id = parseInt(String(body.id), 10);
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID do produto é obrigatório para exclusão." },
        { status: 400 }
      );
    }

    const res = await deleteProductAdmin(id);
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Produto removido com sucesso.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!verifyAdminAuth(req)) {
      return NextResponse.json(
        {
          success: false,
          error: "Acesso administrativo obrigatório para alteração de catálogo.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID do produto é obrigatório." },
        { status: 400 }
      );
    }

    if (updates.price !== undefined) {
      const cleanPrice = Number(String(updates.price).replace(",", "."));
      if (isNaN(cleanPrice) || cleanPrice < 0) {
        return NextResponse.json(
          { success: false, error: "Preço numérico inválido." },
          { status: 400 }
        );
      }
      updates.price = cleanPrice;
    }

    if (updates.compare_at_price !== undefined) {
      if (updates.compare_at_price === "" || updates.compare_at_price === null) {
        updates.compare_at_price = null;
      } else {
        const cleanCompare = Number(
          String(updates.compare_at_price).replace(",", ".")
        );
        updates.compare_at_price =
          isNaN(cleanCompare) || cleanCompare <= 0 ? null : cleanCompare;
      }
    }

    if (updates.sku !== undefined) {
      updates.sku = String(updates.sku).trim().toUpperCase();
    }

    if (updates.slug !== undefined) {
      updates.slug = String(updates.slug)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    if (updates.badge !== undefined) {
      updates.badge = updates.badge ? String(updates.badge).trim() : null;
    }

    if (updates.display_order !== undefined) {
      const cleanOrder = parseInt(String(updates.display_order), 10);
      if (!isNaN(cleanOrder)) {
        updates.display_order = cleanOrder;
      }
    }

    if (updates.dimona_product_id !== undefined) {
      updates.dimona_product_id = updates.dimona_product_id ? String(updates.dimona_product_id).trim().toUpperCase() : "";
    }

    if (updates.blank_type !== undefined) {
      updates.blank_type = updates.blank_type ? String(updates.blank_type).trim().toLowerCase() : "classic";
    }

    if (Array.isArray(updates.gallery)) {
      updates.gallery = updates.gallery
        .map((u: any) => String(u || "").trim())
        .filter(Boolean)
        .slice(0, 6);
      if (updates.gallery.length > 0) {
        updates.image_url = updates.gallery[0];
      }
    }

    const res = await updateProductAdmin(Number(id), updates);
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: res.data,
      message: "Produto atualizado com sucesso.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
