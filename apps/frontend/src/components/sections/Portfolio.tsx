import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { portfolioService, getPortfolioPublicUrl } from '@/lib/portfolio';
import type { PortfolioImage } from '@/lib/portfolio';

// Default photos used as fallback when no custom portfolio is configured.
// These will appear automatically if the photographer hasn't set up their portfolio yet.
const DEFAULT_PHOTOS = [
  {
    id: 'default-1',
    src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2669&auto=format&fit=crop',
    title: 'Casamentos',
    category: 'Eventos',
  },
  {
    id: 'default-2',
    src: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2670&auto=format&fit=crop',
    title: 'Editorial Moda',
    category: 'Fashion',
  },
  {
    id: 'default-3',
    src: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2670&auto=format&fit=crop',
    title: 'Momentos Íntimos',
    category: 'Portrait',
  },
  {
    id: 'default-4',
    src: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2670&auto=format&fit=crop',
    title: 'Cerimônia Ar Livre',
    category: 'Nature',
  },
];

interface PortfolioPhoto {
  id: string;
  src: string;
  title: string;
  category: string;
  orientation: 'portrait' | 'landscape';
}

/**
 * Maps a portfolio image (from DB) or a default photo into a unified PortfolioPhoto shape.
 */
function toPhoto(img: PortfolioImage | typeof DEFAULT_PHOTOS[number]): PortfolioPhoto {
  if ('storage_path' in img) {
    const portfolioImg = img as PortfolioImage;
    return {
      id: portfolioImg.id,
      src: getPortfolioPublicUrl(portfolioImg.storage_path),
      title: portfolioImg.title || '',
      category: portfolioImg.category || '',
      orientation: portfolioImg.orientation || 'landscape',
    };
  }
  // Default photos are always landscape for simplicity
  return { ...img, orientation: 'landscape' } as PortfolioPhoto;
}

interface PortfolioProps {
  title?: string;
  subtitle?: string;
}

export const Portfolio = ({ title, subtitle }: PortfolioProps) => {
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');

  useEffect(() => {
    let cancelled = false;

    portfolioService.getImages().then((images) => {
      if (cancelled) return;
      if (images.length > 0) {
        setPhotos(images.map(toPhoto));
      } else {
        setPhotos(DEFAULT_PHOTOS.map(p => ({ ...p, orientation: 'landscape' })) as PortfolioPhoto[]);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  const categories = ['Todos', ...Array.from(new Set(photos.map(p => p.category).filter(Boolean)))];
  
  const filteredPhotos = activeCategory === 'Todos' 
    ? photos 
    : photos.filter(p => p.category === activeCategory);

  // Limit photos per category
  const displayPhotos = filteredPhotos.slice(0, 6);

  /**
   * Layout Logic:
   * Portrait images take col-span-12 md:col-span-4 and taller height.
   * Landscape images take col-span-12 md:col-span-8 or 4 depending on position.
   */
  const getPhotoClass = (photo: PortfolioPhoto, index: number): string => {
    if (photo.orientation === 'portrait') {
      return 'col-span-12 md:col-span-4 h-[500px] md:h-[700px]';
    }
    
    // Default landscape grid patterns
    const landscapePattern = [
      'col-span-12 md:col-span-8 h-[400px] md:h-[600px]',
      'col-span-12 md:col-span-4 h-[400px] md:h-[600px]',
      'col-span-12 md:col-span-4 h-[400px] md:h-[500px]',
      'col-span-12 md:col-span-8 h-[400px] md:h-[500px]'
    ];
    
    return landscapePattern[index % landscapePattern.length];
  };

  return (
    <section id="portfolio" className="section-padding bg-luxury-cream">
      <div className="container-premium lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="space-y-4">
            <p className="text-luxury-gold font-bold text-[10px] uppercase tracking-[0.4em]">Trabalhos Selecionados</p>
            <h2 className="text-editorial text-5xl md:text-7xl font-playfair transition-all">
              {title || <>Portfólio <br />Editorial</>}
            </h2>
          </div>
          <p className="max-w-xs text-sm text-luxury-black/60 font-sans leading-relaxed">
            {subtitle || 'Nossa curadoria de momentos capturados com sensibilidade e técnica para criar memórias atemporais.'}
          </p>
        </div>

        {/* Categories Bar */}
        {!loading && categories.length > 1 && (
          <div className="flex flex-wrap gap-8 mb-12 border-b border-luxury-black/5 pb-6">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`text-[10px] font-bold uppercase tracking-widest transition-all relative pb-2 ${
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
          <div className="grid grid-cols-12 gap-4 md:gap-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="col-span-12 md:col-span-6 h-[400px] bg-luxury-black/5 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-12 auto-rows-auto gap-4 md:gap-6">
            {displayPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className={`${getPhotoClass(photo, index)} relative group overflow-hidden bg-luxury-black/5 flex items-center justify-center`}
              >
                <img
                  src={photo.src}
                  alt={photo.title || `Trabalho ${index + 1}`}
                  loading={index < 2 ? 'eager' : 'lazy'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-8 flex flex-col justify-end">
                  {photo.category && (
                    <span className="text-luxury-gold text-[10px] uppercase tracking-widest mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      {photo.category}
                    </span>
                  )}
                  {photo.title && (
                    <h3 className="text-luxury-cream font-serif text-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                      {photo.title}
                    </h3>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 flex justify-center">
          <Link 
            to="/portfolio"
            className="text-[11px] font-bold uppercase tracking-[0.2em] border-b-2 border-luxury-black pb-2 hover:text-luxury-gold hover:border-luxury-gold transition-all duration-300"
          >
            Ver Todos os Trabalhos
          </Link>
        </div>
      </div>
    </section>
  );
};
