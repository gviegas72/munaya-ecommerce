export default function ProductDetail() {
  const productImages = [
    "https://picsum.photos/800/1200?random=1",
    "https://picsum.photos/800/1200?random=6",
    "https://picsum.photos/800/1200?random=7"
  ];

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen">
      {/* Left Column - Scrolling Images */}
      <div className="w-full md:w-[65%] flex flex-col border-r border-foreground">
        {productImages.map((src, idx) => (
          <div key={idx} className="relative w-full h-[70vh] md:h-[100vh] border-b border-foreground">
            <img 
              src={src}
              alt={`Detalhe do produto ${idx + 1}`}
              className="w-full h-full object-cover object-center grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>
        ))}
      </div>

      {/* Right Column - Sticky Details */}
      <div className="w-full md:w-[35%] relative">
        <div className="sticky top-0 h-screen flex flex-col justify-between bg-background p-8">
          
          <div className="flex flex-col">
            <h1 className="font-oswald text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mt-12 md:mt-0">
              Chaos <br/> Theory
            </h1>
            <p className="mt-4 font-oswald text-4xl font-bold opacity-80">$40</p>
            
            <div className="mt-12">
              <p className="font-sans font-bold uppercase tracking-widest text-sm mb-4">Escolha o tamanho</p>
              <div className="flex gap-4">
                {["P", "M", "G", "GG"].map((size) => (
                  <button 
                    key={size}
                    className="w-16 h-16 border-2 border-foreground font-oswald text-2xl font-black flex items-center justify-center hover:bg-foreground hover:text-background transition-colors focus:bg-foreground focus:text-background focus:ring-4 ring-foreground/20"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-12 text-lg opacity-70">
              Camiseta 100% algodão estonado. Feita para sobreviver a qualquer mosh pit. Corte reto, gola pesada.
            </p>
          </div>

          <button className="w-full bg-foreground text-background font-oswald text-4xl uppercase font-black py-8 animate-pulse hover:animate-none hover:scale-[1.02] transition-transform">
            Add to Pit
          </button>
        </div>
      </div>
    </div>
  );
}
