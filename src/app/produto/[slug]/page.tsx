import { getProductByIdOrSlug } from "@/lib/supabase";
import { ProductActionSection } from "@/components/ProductActionSection";
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

  // Lista de imagens com suporte a fotos adicionais ou fallback da foto principal
  const productImages =
    product.images && Array.isArray(product.images) && product.images.length > 0
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

      {/* Grid Principal da PDP */}
      <div className="flex flex-col md:flex-row w-full flex-1">
        {/* Left Column - Scrolling Images */}
        <div className="w-full md:w-[65%] flex flex-col border-b md:border-b-0 md:border-r border-foreground">
          {productImages.map((src, idx) => (
            <div
              key={idx}
              className="relative w-full h-[55vh] md:h-[100vh] border-b border-foreground bg-black/40 overflow-hidden"
            >
              <img
                src={src}
                alt={`${product.name} - Detalhe ${idx + 1}`}
                className="w-full h-full object-cover object-center transition-all duration-700 hover:scale-105"
              />
            </div>
          ))}
        </div>

        {/* Right Column - Product details & action */}
        <div className="w-full md:w-[35%] relative">
          <div className="relative md:sticky md:top-0 md:h-[calc(100vh-45px)] flex flex-col justify-between bg-background p-6 md:p-8 md:overflow-y-auto">
            <ProductActionSection product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
