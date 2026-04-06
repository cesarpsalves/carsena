import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface HeroProps {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
}

export const Hero = ({ title, subtitle, imageUrl, primaryCtaLabel, secondaryCtaLabel }: HeroProps) => {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[100dvh] w-full overflow-hidden flex items-center bg-zinc-950"
    >
      {/* Background Layer with real Parallax */}
      <div className="absolute inset-0 bg-luxury-black/60 z-10" />
      <motion.div 
        style={{ y: yBg, scale }}
        className="absolute inset-0 h-full w-full"
      >
        <img 
          src={imageUrl || "https://images.unsplash.com/photo-1492691523567-61707d2e5ef4?auto=format&fit=crop&q=80&w=2600"} 
          alt="Premium Photography Heritage"
          className="h-full w-full object-cover grayscale-[30%] opacity-70 transition-opacity duration-1000"
          onLoad={(e) => (e.currentTarget.style.opacity = "0.7")}
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&q=80&w=2600";
          }}
        />
      </motion.div>
      
      {/* Content */}
      <motion.div 
        style={{ opacity }}
        className="relative z-20 container-premium h-full flex flex-col justify-center items-start px-6 lg:px-12 pt-12 md:pt-20"
      >
        <div className="max-w-5xl space-y-8 md:space-y-12">
          <div className="space-y-2">
            <p className="text-luxury-gold font-bold text-[10px] uppercase tracking-[0.4em] animate-fade-in inline-block">
              Premium Photography Experience
            </p>
          </div>
          
          <h1 className="text-editorial text-luxury-cream text-4xl sm:text-6xl md:text-8xl lg:text-[10rem] leading-[0.9] animate-slide-up select-none">
            {title ? (
              <>
                {title.split(' ').slice(0, Math.ceil(title.split(' ').length / 2)).join(' ')} <br className="hidden md:block" />
                <span className="md:ml-32 italic text-luxury-gold/80 block md:inline mt-4 md:mt-0">
                  {title.split(' ').slice(Math.ceil(title.split(' ').length / 2)).join(' ')}
                </span>
              </>
            ) : (
              <>
                Capturando a <br className="hidden md:block" />
                <span className="md:ml-32 italic text-luxury-gold/80 block md:inline mt-4 md:mt-0">Essência</span> de <br className="md:hidden" /> Cada Momento
              </>
            )}
          </h1>
          
          {subtitle && (
            <p className="text-luxury-cream/60 font-sans text-sm md:text-lg max-w-xl animate-fade-in-delayed">
              {subtitle}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-5 md:gap-8 mt-12 animate-fade-in-delayed w-full sm:w-auto">
            <a 
              href="#portfolio" 
              className="group bg-luxury-gold text-luxury-black font-bold text-[11px] uppercase tracking-[0.2em] px-12 py-6 hover:bg-luxury-cream transition-all duration-500 shadow-2xl flex items-center justify-center gap-3"
            >
              {primaryCtaLabel || "Explorar Portfólio"}
              <div className="w-1.5 h-1.5 bg-luxury-black rounded-full transition-transform group-hover:scale-150" />
            </a>
            <a 
              href="#contato" 
              className="border border-luxury-cream/20 text-luxury-cream font-bold text-[11px] uppercase tracking-[0.2em] px-12 py-6 hover:bg-luxury-cream/10 transition-all duration-500 flex items-center justify-center"
            >
              {secondaryCtaLabel || "Falar Conosco"}
            </a>
          </div>
        </div>
      </motion.div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-5 opacity-40">
        <div className="w-[1px] h-24 bg-gradient-to-b from-luxury-cream to-transparent" />
        <span className="text-[10px] text-luxury-cream uppercase tracking-[0.5em] font-sans [writing-mode:vertical-lr]">Scroll</span>
      </div>
    </section>
  );
};
