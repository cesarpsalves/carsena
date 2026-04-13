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

  const [displayPhotos, setDisplayPhotos] = useState<PortfolioPhoto[]>([]);

  useEffect(() => {
    let cancelled = false;

    portfolioService.getImages().then((images) => {
      if (cancelled) return;

      let allPhotos: PortfolioPhoto[] = [];
      if (images.length > 0) {
        allPhotos = images.map(toPhoto);
      } else {
        allPhotos = DEFAULT_PHOTOS.map((p) => ({ ...p, orientation: 'landscape' })) as PortfolioPhoto[];
      }

      setPhotos(allPhotos);

      // Strategy: 1 image per category, then fill up to 6
      const categories = Array.from(new Set(allPhotos.map((p: PortfolioPhoto) => p.category).filter(Boolean))) as string[];
      const selected: PortfolioPhoto[] = [];
      const usedIds = new Set<string>();

      // First pass: Pick one from each category randomly
      categories.forEach((cat: string) => {
        const catPhotos = allPhotos.filter((p: PortfolioPhoto) => p.category === cat);
        if (catPhotos.length > 0) {
          const randomPhoto = catPhotos[Math.floor(Math.random() * catPhotos.length)];
          selected.push(randomPhoto);
          usedIds.add(randomPhoto.id);
        }
      });

      // Second pass: If we have less than 6 (or whatever desired), fill with others randomly
      const remaining = allPhotos.filter((p: PortfolioPhoto) => !usedIds.has(p.id));
      const shuffledRemaining = [...remaining].sort(() => 0.5 - Math.random());

      // We want to show a decent amount, let's say up to 6 or the number of categories if > 6
      const targetCount = Math.max(6, categories.length);
      const finalSelection = [...selected, ...shuffledRemaining].slice(0, targetCount);

      // Final shuffle to not have all "first of category" at the top
      setDisplayPhotos(finalSelection.sort(() => 0.5 - Math.random()));

      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

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
        <div className="flex flex-col md:flex-row justify-between items-start mb-16 gap-8">
          <div className="space-y-4">
            <p className="text-luxury-gold font-bold text-[10px] uppercase tracking-[0.4em]">Trabalhos Selecionados</p>
            <h2 className="text-editorial text-5xl md:text-7xl font-playfair transition-all">
              {title || <>Portfólio <br />Editorial</>}
            </h2>
          </div>
          <p className="max-w-xs text-sm text-luxury-black/60 font-sans leading-relaxed md:pt-12">
            {subtitle || 'Nossa curadoria de momentos capturados com sensibilidade e técnica para criar memórias atemporais.'}
          </p>
        </div>

        {loading ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-full aspect-[4/5] bg-luxury-black/5 animate-pulse rounded-sm"
              />
            ))}
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {displayPhotos.map((photo, index) => (
              <Link
                key={photo.id}
                to="/portfolio"
                state={{ category: photo.category }}
                className="relative group overflow-hidden bg-luxury-black/5 flex items-center justify-center break-inside-avoid rounded-sm shadow-sm hover:shadow-xl transition-all duration-500"
              >
                <img
                  src={photo.src}
                  alt={photo.title || `Trabalho ${index + 1}`}
                  loading={index < 2 ? 'eager' : 'lazy'}
                  className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-105"
                />

                {/* Visible Category Label (Always visible or semi-permanent) */}
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-luxury-black/40 backdrop-blur-md px-3 py-1.5 border border-white/10 rounded-full shadow-lg transition-all duration-500 group-hover:bg-luxury-gold/20 group-hover:border-luxury-gold/30">
                    <span className="text-luxury-cream text-[8px] uppercase tracking-[0.3em] font-bold">
                      {photo.category}
                    </span>
                  </div>
                </div>

                {/* Minimalist Overlay - Detailed info on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/95 via-luxury-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out p-8 flex flex-col justify-end">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                    <span className="block text-luxury-gold text-[10px] uppercase tracking-[0.4em] mb-3">
                      Descobrir Galeria
                    </span>
                    {photo.title && (
                      <h3 className="text-luxury-cream font-playfair text-2xl italic">
                        {photo.title}
                      </h3>
                    )}
                  </div>
                  <div className="w-10 h-[1px] bg-luxury-gold/50 mt-4 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                </div>

                {/* Corner detail */}
                <div className="absolute bottom-4 right-4 w-6 h-6 border border-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 backdrop-blur-sm">
                  <div className="w-0.5 h-0.5 bg-luxury-gold rounded-full" />
                </div>
              </Link>
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
