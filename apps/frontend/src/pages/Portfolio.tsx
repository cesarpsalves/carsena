import React, { useState, useEffect } from 'react';
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
    <div className="portfolio-content bg-luxury-cream min-h-screen">
      <section className="section-padding pt-32 pb-20">
        <div className="container-premium lg:px-12">
          <header className="mb-20">
            <p className="text-luxury-gold font-bold text-[10px] uppercase tracking-[0.4em] mb-4">Galeria Completa</p>
            <h1 className="text-editorial text-6xl md:text-8xl font-playfair mb-6">Portfólio</h1>
            <p className="text-luxury-black/60 max-w-xl text-lg leading-relaxed">
              Uma curadoria dos momentos mais significativos que tive o privilégio de capturar. 
              Especializado em casamentos, editoriais e eventos de alto padrão.
            </p>
          </header>

          {/* Categories Bar */}
          {!loading && categories.length > 1 && (
            <div className="flex flex-wrap gap-8 mb-16 border-b border-luxury-black/5 pb-6">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`text-[11px] font-bold uppercase tracking-widest transition-all relative pb-2 ${
                    activeCategory === category 
                      ? 'text-luxury-black' 
                      : 'text-luxury-black/30 hover:text-luxury-black'
                  }`}
                >
                  {category}
                  {activeCategory === category && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-luxury-gold" />
                  )}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-12 gap-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="col-span-12 md:col-span-4 h-[400px] bg-luxury-black/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-12 auto-rows-auto gap-4 md:gap-6">
              {filteredPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className={`${getPhotoClass(photo, index)} relative group overflow-hidden bg-luxury-black/5`}
                >
                  <img
                    src={photo.src}
                    alt={photo.title || `Trabalho ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-8 flex flex-col justify-end">
                    {photo.category && (
                      <span className="text-luxury-gold text-[10px] uppercase tracking-widest mb-2">
                        {photo.category}
                      </span>
                    )}
                    {photo.title && (
                      <h3 className="text-luxury-cream font-serif text-2xl">
                        {photo.title}
                      </h3>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-luxury-black text-luxury-cream text-center">
        <div className="container-premium">
          <h2 className="text-4xl md:text-5xl font-playfair mb-8">Gostou do que viu?</h2>
          <p className="text-luxury-cream/60 max-w-lg mx-auto mb-12">Vamos conversar sobre o seu próximo projeto ou evento.</p>
          <a href="/#contato" className="inline-block bg-luxury-gold text-luxury-black px-10 py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:scale-105 transition-transform">
            Solicitar Orçamento
          </a>
        </div>
      </section>
    </div>
  );
}

export default Portfolio;
