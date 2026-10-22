import { getProductByIdOrSlug } from "@/lib/supabase";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductByIdOrSlug(slug);

  if (!product) {
    return {
      title: "Produto Não Encontrado | Munaya Rocks",
      description: "O produto procurado não está disponível no catálogo Munaya Rocks.",
    };
  }

  const title = `${product.name} | Munaya Rocks`;
  const description =
    product.description ||
    `Compre ${product.name} na Munaya Rocks. 100% Algodão Premium Silk Screen. Vista a revolução.`;
  const canonicalUrl = `https://munayarocks.vercel.app/produto/${product.slug || product.id}`;
  const images = product.image_url ? [product.image_url] : [];

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images,
      type: "website",
      siteName: "Munaya Rocks",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function ProductDetail({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductByIdOrSlug(slug);

  if (!product) {
    notFound();
  }

  // Lista de imagens com suporte a galeria de até 6 fotos ou fallback da foto principal
  const productImages =
    product.gallery && Array.isArray(product.gallery) && product.gallery.length > 0
      ? product.gallery
      : product.images && Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image_url];

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Breadcrumb de Navegação */}
      <nav
        aria-label="Breadcrumb"
        className="px-4 md:px-8 py-3 bg-neutral-950/80 border-b border-foreground/20 text-xs font-mono uppercase tracking-wider flex items-center gap-2 text-foreground/70"
      >
        <Link href="/" className="hover:text-[#ff66c4] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-foreground/40" />
        <Link href="/categoria" className="hover:text-[#ff66c4] transition-colors">
          Coleção Oficial
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-foreground/40" />
        <span className="text-[#ff66c4] font-bold truncate max-w-[200px] md:max-w-none">
          {product.name}
        </span>
      </nav>

      {/* Grid Principal da PDP com troca dinâmica de mockups conectada */}
      <ProductDetailClient product={product} initialImages={productImages} />
    </div>
  );
}
