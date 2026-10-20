import Link from "next/link";
import { getStoreProducts } from "@/lib/nuvemshop";

export default async function Category() {
  const products = await getStoreProducts();

  return (
    <div className="w-full min-h-screen p-4 md:p-8">
      <header className="mb-8 md:mb-12 mt-2 md:mt-0">
        <h1 className="font-oswald text-5xl md:text-8xl font-black uppercase tracking-tighter">
          Coleção <br /> Inverno 26
        </h1>
        <p className="mt-3 md:mt-4 text-base md:text-xl font-bold uppercase opacity-60">
          Para vestir nas ruas, não em casa.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[340px] md:auto-rows-[400px] gap-4 md:gap-8">
        {products.map((product) => (
          <Link
            href={`/produto/${product.id}`}
            key={product.id}
            className={`group relative overflow-hidden bg-foreground rounded-none border border-foreground/30 ${
              product.span || "col-span-1 row-span-1"
            }`}
          >
            {/* Foto do Produto */}
            <div className="absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-[1.03]">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-all duration-700"
              />
            </div>

            {/* Grainy Filter on Hover */}
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-multiply"></div>

            {/* =========================================
                Overlay Mobile (SEMPRE visível no celular)
               ========================================= */}
            <div className="md:hidden absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 flex flex-col justify-end text-white z-20">
              <h2 className="font-oswald text-3xl font-black uppercase tracking-tight leading-tight">
                {product.name}
              </h2>
              <div className="flex items-center justify-between mt-2">
                <span className="font-oswald text-2xl font-bold text-[#ff66c4]">
                  {product.price}
                </span>
                <span className="bg-white text-black px-4 py-1.5 font-oswald text-sm font-black uppercase transform -skew-x-12">
                  Ver Peça
                </span>
              </div>
            </div>

            {/* =========================================
                Reveal Desktop (no Hover do mouse)
               ========================================= */}
            <div className="hidden md:flex absolute inset-0 flex-col items-center justify-center p-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-8 group-hover:translate-y-0 z-20">
              <h2 className="font-oswald text-5xl md:text-7xl font-black uppercase tracking-tighter text-center leading-none">
                {product.name}
              </h2>
              <span className="mt-2 font-oswald text-3xl font-bold">
                {product.price}
              </span>

              {/* Botão Ver Detalhes */}
              <div className="mt-8 bg-white text-black px-8 py-3 font-black uppercase text-xl transform -skew-x-12 hover:scale-110 hover:bg-[#ff66c4] hover:text-black transition-all cursor-pointer">
                Ver Detalhes
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
