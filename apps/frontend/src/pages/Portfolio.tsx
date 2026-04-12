import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { portfolioService, getPortfolioPublicUrl } from '@/lib/portfolio';
import type { PortfolioImage } from '@/lib/portfolio';
import { ChevronUp } from 'lucide-react';

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
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    portfolioService.getImages().then((images) => {
      setPhotos(images.map(toPhoto));
      setLoading(false);
    });
  }, []);

  const categories = ['Todos', ...Array.from(new Set(photos.map(p => p.category).filter(Boolean)))];
  
  const getCategoryCount = (category: string) => {
    if (category === 'Todos') return photos.length;
    return photos.filter(p => p.category === category).length;
  };
  
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
      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-luxury-gold/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="container-premium lg:px-12 relative z-10">
          <header className="mb-20 max-w-4xl px-6 md:px-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-luxury-gold font-bold text-[10px] uppercase tracking-[0.6em] mb-6">Archive & Selection</p>
              <h1 className="text-editorial text-6xl md:text-[10rem] font-playfair mb-10 leading-none">
                Portfolio
              </h1>
              <div className="w-24 h-[1px] bg-luxury-gold mb-12" />
              <p className="text-luxury-cream/60 text-lg md:text-xl leading-relaxed italic font-serif">
                "A fotografia é a interrupção da vida, capturando a eternidade em um milésimo de segundo."
              </p>
            </motion.div>
          </header>

          {/* Sticky Categories Bar */}
          {!loading && categories.length > 1 && (
            <div className="sticky top-20 z-40 bg-luxury-black/90 backdrop-blur-xl border-b border-white/5 -mx-6 px-6 md:-mx-12 md:px-12 mb-12">
              <div className="container-premium overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-10 md:gap-12 py-6 min-w-max">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => {
                        setActiveCategory(category);
                        const gridElement = document.getElementById('portfolio-grid');
                        if (gridElement) {
                          const top = gridElement.getBoundingClientRect().top + window.scrollY - 160;
                          window.scrollTo({ top, behavior: 'smooth' });
                        }
                      }}
                      className={`group text-[10px] font-bold uppercase tracking-[0.3em] transition-all relative pb-2 flex items-center gap-2 ${
                        activeCategory === category 
                          ? 'text-luxury-gold' 
                          : 'text-luxury-cream/30 hover:text-luxury-cream'
                      }`}
                    >
                      <span className="relative z-10">{category}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full border transition-colors ${
                        activeCategory === category 
                          ? 'border-luxury-gold text-luxury-gold' 
                          : 'border-white/10 text-white/20'
                      }`}>
                        {getCategoryCount(category)}
                      </span>
                      {activeCategory === category && (
                        <motion.div 
                          layoutId="activeCategory"
                          className="absolute bottom-0 left-0 w-full h-[1px] bg-luxury-gold" 
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Photos Grid */}
          <div id="portfolio-grid" className="px-6 md:px-0">
            {loading ? (
              <div className="grid grid-cols-12 gap-6 md:gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="col-span-12 md:col-span-4 h-[500px] bg-white/5 animate-pulse relative overflow-hidden rounded-sm">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-12 auto-rows-auto gap-6 md:gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredPhotos.length > 0 ? (
                    filteredPhotos.map((photo, index) => (
                      <motion.div
                        key={photo.id}
                        layout
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                        transition={{ duration: 0.6 }}
                        className={`${getPhotoClass(photo, index)} relative group overflow-hidden bg-luxury-black rounded-sm`}
                      >
                        <img
                          src={photo.src}
                          alt={photo.title || `Trabalho ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 md:opacity-90 group-hover:opacity-100"
                          loading="lazy"
                        />
                        
                        {/* Overlay - Hidden on mobile, shown on desktop hover or simplified on mobile */}
                        <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/90 via-luxury-black/20 to-transparent opacity-0 md:group-hover:opacity-100 transition-all duration-700 ease-out p-6 md:p-10 flex flex-col justify-end">
                          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            {photo.category && (
                              <span className="block text-luxury-gold text-[10px] uppercase tracking-[0.4em] mb-4">
                                {photo.category}
                              </span>
                            )}
                            {photo.title && (
                              <h3 className="text-luxury-cream font-playfair text-2xl md:text-3xl italic">
                                {photo.title}
                              </h3>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-12 py-40 text-center">
                      <p className="text-luxury-cream/20 font-serif text-2xl italic">Nenhuma obra encontrada nesta categoria.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Integrated Contact Section */}
      <section className="py-20 md:py-40 bg-luxury-black relative overflow-hidden border-t border-white/5">
        <div className="container-premium text-center relative z-10 px-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-editorial text-4xl md:text-7xl mb-10">Vamos criar algo atemporal?</h2>
            <p className="text-luxury-cream/40 mb-12 md:mb-16 italic font-serif">Disponível para casamentos e projetos editoriais em todo o mundo.</p>
            <Link 
              to="/#contato" 
              className="inline-block border border-luxury-gold text-luxury-gold px-12 md:px-16 py-5 md:py-6 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-luxury-gold hover:text-luxury-black transition-all duration-500"
            >
              Iniciar Conversa
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 font-serif text-[15vw] opacity-[0.02] whitespace-nowrap pointer-events-none select-none uppercase tracking-[0.2em]">
          Estúdio Carsena
        </div>
      </section>

      {/* Back to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-luxury-gold text-luxury-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95"
          >
            <ChevronUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Portfolio;
