import { getStoreProductById } from "@/lib/nuvemshop";
import { ProductActionSection } from "@/components/ProductActionSection";
import { notFound } from "next/navigation";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetail({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getStoreProductById(id);

  if (!product) {
    notFound();
  }

  const productImages =
    product.images?.length > 0 ? product.images : [product.image];

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen">
      {/* Left Column - Scrolling Images */}
      <div className="w-full md:w-[65%] flex flex-col border-r border-foreground">
        {productImages.map((src, idx) => (
          <div
            key={idx}
            className="relative w-full h-[70vh] md:h-[100vh] border-b border-foreground bg-black/40 overflow-hidden"
          >
            <img
              src={src}
              alt={`${product.name} - Detalhe ${idx + 1}`}
              className="w-full h-full object-cover object-center grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>
        ))}
      </div>

      {/* Right Column - Sticky Details */}
      <div className="w-full md:w-[35%] relative">
        <div className="sticky top-0 h-screen flex flex-col justify-between bg-background p-6 md:p-8 overflow-y-auto">
          <ProductActionSection product={product} />
        </div>
      </div>
    </div>
  );
}
