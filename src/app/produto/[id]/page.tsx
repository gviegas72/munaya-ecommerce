import { getProductByIdOrSlug } from "@/lib/supabase";
import { ProductActionSection } from "@/components/ProductActionSection";
import { notFound } from "next/navigation";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetail({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductByIdOrSlug(id);

  if (!product) {
    notFound();
  }

  // Lista de imagens com suporte a fotos adicionais ou fallback da foto principal
  const productImages =
    product.images && Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image_url];

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen">
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
        <div className="relative md:sticky md:top-0 md:h-screen flex flex-col justify-between bg-background p-6 md:p-8 md:overflow-y-auto">
          <ProductActionSection product={product} />
        </div>
      </div>
    </div>
  );
}
