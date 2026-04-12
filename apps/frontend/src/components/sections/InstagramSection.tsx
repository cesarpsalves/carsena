import { Instagram as InstagramIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface InstagramSectionProps {
  username?: string;
  title?: string;
  subtitle?: string;
  images?: string[];
  orientations?: ('portrait' | 'landscape')[];
}

export const InstagramSection = ({ 
  username = "carsena_fotografo", 
  title, 
  subtitle, 
  images = [],
  orientations = ['portrait', 'landscape', 'portrait']
}: InstagramSectionProps) => {
  const instagramUrl = `https://www.instagram.com/${username.replace('@', '')}/`;
  
  // High-quality defaults if no images are provided
  const displayImages = [
    images[0] || "/assets/instagram/pernambuco_1.png",
    images[1] || "/assets/instagram/pernambuco_2.png",
    images[2] || "/assets/instagram/pernambuco_3.png"
  ];

  return (
    <section id="instagram" className="section-padding bg-luxury-cream overflow-hidden">
      <div className="container-premium lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Content */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-8 z-10 order-2 xl:order-1 flex flex-col justify-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-[1px] bg-luxury-gold" />
                <p className="text-luxury-gold font-bold text-[9px] md:text-[10px] uppercase tracking-[0.4em]">Life on Instagram</p>
              </div>
              <h2 className="text-editorial text-5xl md:text-7xl text-luxury-black">
                {title || <>O Olhar no <br />Cotidiano</>}
              </h2>
            </div>
            
            <p className="text-luxury-black/60 font-sans leading-relaxed max-w-sm text-sm md:text-base italic">
              {subtitle || "No Instagram, compartilho não apenas os resultados finais, mas o processo, as conexões e a poesia do dia a dia por trás das lentes."}
            </p>

            <div className="pt-4">
              <a 
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-6 group"
              >
                <div className="w-16 h-16 bg-luxury-black flex items-center justify-center text-luxury-gold rounded-full border border-luxury-black hover:bg-transparent hover:text-luxury-black transition-all duration-500">
                  <InstagramIcon size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-black">Seguir Perfil</p>
                  <p className="text-serif text-lg text-luxury-gold group-hover:underline underline-offset-4">@{username.replace('@', '')}</p>
                </div>
              </a>
            </div>
          </div>

          {/* Visual Content - Overlapping Images */}
          <div className="lg:col-span-12 xl:col-span-7 relative flex justify-center items-center h-[500px] md:h-[700px] order-1 xl:order-2">
            {/* Background Shape */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-luxury-gold/10 rounded-full scale-75 animate-pulse" />
            
            {/* Image 1 - Large centered */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className={cn(
                "absolute z-20 bg-luxury-black shadow-2xl overflow-hidden transition-all duration-700",
                orientations[0] === 'portrait' ? "w-3/5 aspect-[4/5]" : "w-4/5 aspect-[16/10] scale-90"
              )}
            >
              <img 
                src={displayImages[0]}
                alt="Destaque do Instagram - Fotografia Editorial Carsena" 
                className="w-full h-full object-cover opacity-95 hover:scale-110 transition-transform duration-1000"
              />
            </motion.div>

            {/* Image 2 - Offset left */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "absolute z-10 bg-white shadow-xl -left-4 md:left-0 top-1/4 overflow-hidden border-[8px] border-white transition-all duration-700",
                orientations[1] === 'portrait' ? "w-1/3 aspect-[3/4]" : "w-2/5 aspect-square"
              )}
            >
              <img 
                src={displayImages[1]}
                alt="Processo Criativo Carsena Photo" 
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Image 3 - Offset right/bottom */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={cn(
                "absolute z-30 bg-luxury-gold shadow-xl right-0 md:right-4 bottom-10 overflow-hidden border-[1px] border-luxury-gold/20 transition-all duration-700",
                orientations[2] === 'landscape' ? "w-1/2 aspect-[4/3]" : "w-2/5 aspect-[3/4]"
              )}
            >
              <img 
                src={displayImages[2]}
                alt="Editorial Photography Archive" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};
