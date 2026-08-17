import Link from "next/link";

const products = [
  { id: 1, name: "Chaos Theory", price: "$40", image: "https://picsum.photos/800/1200?random=1", span: "col-span-1 md:col-span-2 row-span-2" },
  { id: 2, name: "Nevermind", price: "$35", image: "https://picsum.photos/800/1200?random=2", span: "col-span-1 row-span-1" },
  { id: 3, name: "Distortion", price: "$45", image: "https://picsum.photos/800/1200?random=3", span: "col-span-1 row-span-1" },
  { id: 4, name: "Riot", price: "$30", image: "https://picsum.photos/800/1200?random=4", span: "col-span-1 md:col-span-2 row-span-1" },
  { id: 5, name: "Anarchy", price: "$40", image: "https://picsum.photos/800/1200?random=5", span: "col-span-1 row-span-1" },
];

export default function Category() {
  return (
    <div className="w-full min-h-screen p-4 md:p-8">
      <header className="mb-12 mt-4 md:mt-0">
        <h1 className="font-oswald text-6xl md:text-8xl font-black uppercase tracking-tighter">Coleção <br/> Inverno 26</h1>
        <p className="mt-4 text-xl font-bold uppercase opacity-60">Para vestir nas ruas, não em casa.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[400px] gap-4 md:gap-8">
        {products.map((product) => (
          <Link 
            href={`/produto/${product.id}`} 
            key={product.id}
            className={`group relative overflow-hidden bg-foreground ${product.span}`}
          >
            {/* Visceral Photo */}
            <div className="absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-[1.03]">
              <img 
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover object-center grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
            
            {/* Grainy Dramatic Filter on Hover */}
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-multiply"></div>

            {/* Giant Typography Reveal */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-8 group-hover:translate-y-0">
              <h2 className="font-oswald text-5xl md:text-7xl font-black uppercase tracking-tighter text-center leading-none">
                {product.name}
              </h2>
              <span className="mt-2 font-oswald text-3xl font-bold">{product.price}</span>
              
              {/* Torn ADD button */}
              <div className="mt-8 bg-white text-black px-8 py-3 font-black uppercase text-xl transform -skew-x-12 hover:scale-110 hover:bg-red-600 hover:text-white transition-all cursor-pointer">
                Ver Detalhes
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
