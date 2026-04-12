import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { portfolioService, getPortfolioPublicUrl } from '@/lib/portfolio';
import type { PortfolioImage } from '@/lib/portfolio';

interface PortfolioPhoto {
  id: string;
  src: string;
  title: string;
  category: string;
  orientation: 'portrait' | 'landscape';
}

function toPhoto(img: PortfolioImage): PortfolioPhoto {
  return {
    id: img.id,
    src: getPortfolioPublicUrl(img.storage_path),
    title: img.title || '',
    category: img.category || '',
    orientation: img.orientation || 'landscape',
  };
}

const Portfolio: React.FC = () => {
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');

  useEffect(() => {
    portfolioService.getImages().then((images) => {
      setPhotos(images.map(toPhoto));
      setLoading(false);
    });
  }, []);

  const categories = ['Todos', ...Array.from(new Set(photos.map(p => p.category).filter(Boolean)))];
  
  const filteredPhotos = activeCategory === 'Todos' 
    ? photos 
    : photos.filter(p => p.category === activeCategory);

  const getPhotoClass = (photo: PortfolioPhoto, index: number): string => {
    if (photo.orientation === 'portrait') {
      return 'col-span-12 md:col-span-4 h-[500px] md:h-[700px]';
    }
    const landscapePattern = [
      'col-span-12 md:col-span-8 h-[400px] md:h-[600px]',
      'col-span-12 md:col-span-4 h-[400px] md:h-[600px]',
      'col-span-12 md:col-span-4 h-[400px] md:h-[500px]',
      'col-span-12 md:col-span-8 h-[400px] md:h-[500px]'
    ];
    return landscapePattern[index % landscapePattern.length];
  };

  return (
    <div className="portfolio-content bg-luxury-black min-h-screen text-luxury-cream">
      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-luxury-gold/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="container-premium lg:px-12 relative z-10">
          <header className="mb-20 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-luxury-gold font-bold text-[10px] uppercase tracking-[0.6em] mb-6">Archive & Selection</p>
              <h1 className="text-editorial text-7xl md:text-[10rem] font-playfair mb-10 leading-none">
                Portfolio
              </h1>
              <div className="w-24 h-[1px] bg-luxury-gold mb-12" />
              <p className="text-luxury-cream/60 text-lg md:text-xl leading-relaxed italic font-serif">
                "A fotografia é a interrupção da vida, capturando a eternidade em um milésimo de segundo."
              </p>
            </motion.div>
          </header>

          {/* Categories Bar */}
          {!loading && categories.length > 1 && (
            <div className="flex flex-wrap gap-10 mb-16 border-b border-luxury-cream/10 pb-8">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-all relative pb-2 ${
                    activeCategory === category 
                      ? 'text-luxury-gold' 
                      : 'text-luxury-cream/30 hover:text-luxury-cream'
                  }`}
                >
                  {category}
                  {activeCategory === category && (
                    <motion.div 
                      layoutId="activeCategory"
                      className="absolute bottom-0 left-0 w-full h-[1px] bg-luxury-gold" 
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-12 gap-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="col-span-12 md:col-span-4 h-[500px] bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-12 auto-rows-auto gap-6 md:gap-8">
              {filteredPhotos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className={`${getPhotoClass(photo, index)} relative group overflow-hidden bg-white/5`}
                >
                  <img
                    src={photo.src}
                    alt={photo.title || `Trabalho ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-10 flex flex-col justify-end">
                    {photo.category && (
                      <span className="text-luxury-gold text-[10px] uppercase tracking-[0.4em] mb-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        {photo.category}
                      </span>
                    )}
                    {photo.title && (
                      <h3 className="text-luxury-cream font-playfair text-3xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                        {photo.title}
                      </h3>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Integrated Contact Section */}
      <section className="py-40 bg-luxury-black relative overflow-hidden">
        <div className="container-premium text-center relative z-10">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-editorial text-5xl md:text-7xl mb-10">Vamos criar algo atemporal?</h2>
            <p className="text-luxury-cream/40 mb-16 italic font-serif">Disponível para casamentos e projetos editoriais em todo o mundo.</p>
            <Link 
              to="/#contato" 
              className="inline-block border border-luxury-gold text-luxury-gold px-16 py-6 text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-luxury-gold hover:text-luxury-black transition-all duration-500"
            >
              Iniciar Conversa
            </Link>
          </div>
        </div>
        {/* Decorative Watermark */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 font-serif text-[15vw] opacity-[0.03] whitespace-nowrap pointer-events-none select-none uppercase tracking-[0.2em]">
          Estúdio Carsena
        </div>
      </section>
    </div>
  );
}

export default Portfolio;
