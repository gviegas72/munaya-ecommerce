import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      {/* Video Background */}
      <div className="absolute inset-0 z-0 bg-black">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover opacity-60"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
      </div>
      
      {/* Noise overlay for grunge effect */}
      <div className="absolute inset-0 z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      <div className="relative z-20 w-full h-full flex flex-col justify-end p-8 md:p-12">
        {/* Call to action */}
        <div className="self-end flex flex-col items-end">
          <p className="font-sans text-xl md:text-2xl uppercase font-bold tracking-widest mb-6 mix-blend-difference">
            Vista a Revolução.
          </p>
          <Link 
            href="/categoria"
            className="group relative inline-flex items-center gap-4 bg-white text-black px-8 py-6 font-oswald text-4xl md:text-5xl uppercase font-black tracking-tighter hover:bg-black hover:text-white border-[3px] border-transparent hover:border-white transition-all duration-75 overflow-hidden"
          >
            <span className="relative z-10 group-hover:skew-x-[-10deg] transition-transform">
              Compre o Barulho
            </span>
            <ArrowRight className="w-10 h-10 relative z-10 group-hover:translate-x-2 transition-transform" strokeWidth={3} />
            
            {/* Glitch pseudo element simulation */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white mix-blend-difference transition-opacity duration-75 pointer-events-none"></div>
          </Link>
        </div>
      </div>
    </div>
  );
}
