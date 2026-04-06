const photos = [
  { id: 1, src: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2669&auto=format&fit=crop", title: "Casamentos", category: "Eventos", size: "col-span-12 md:col-span-8 h-[600px]" },
  { id: 2, src: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2670&auto=format&fit=crop", title: "Editorial Moda", category: "Fashion", size: "col-span-12 md:col-span-4 h-[600px]" },
  { id: 3, src: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2670&auto=format&fit=crop", title: "Momentos Íntimos", category: "Portrait", size: "col-span-12 md:col-span-4 h-[500px]" },
  { id: 4, src: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2670&auto=format&fit=crop", title: "Cerimônia Ar Livre", category: "Nature", size: "col-span-12 md:col-span-8 h-[500px]" },
];

interface PortfolioProps {
  title?: string;
  subtitle?: string;
}

export const Portfolio = ({ title, subtitle }: PortfolioProps) => {
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
            {subtitle || "Nossa curadoria de momentos capturados com sensibilidade e técnica para criar memórias atemporais."}
          </p>
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {photos.map((photo) => (
            <div 
              key={photo.id} 
              className={`${photo.size} relative group overflow-hidden bg-luxury-black/5 flex items-center justify-center`}
            >
              <img 
                src={photo.src} 
                alt={photo.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-8 flex flex-col justify-end">
                <span className="text-luxury-gold text-[10px] uppercase tracking-widest mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{photo.category}</span>
                <h3 className="text-luxury-cream font-serif text-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">{photo.title}</h3>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 flex justify-center">
          <button className="text-[11px] font-bold uppercase tracking-[0.2em] border-b-2 border-luxury-black pb-2 hover:text-luxury-gold hover:border-luxury-gold transition-all duration-300">
            Ver Todos os Trabalhos
          </button>
        </div>
      </div>
    </section>
  );
};
