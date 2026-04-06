interface PhilosophyProps {
  title?: string;
  subtitle?: string;
}

export const Philosophy = ({ title, subtitle }: PhilosophyProps) => {
  return (
    <section className="section-padding bg-luxury-cream text-center relative overflow-hidden">
      <div className="container-premium max-w-4xl lg:px-12 relative z-10">
        <div className="w-16 h-1 lg:w-24 bg-luxury-gold mx-auto mb-12" />
        <h2 className="text-editorial text-4xl md:text-6xl mb-8">
          {title || "Cada quadro conta uma história silenciada pelo tempo."}
        </h2>
        <p className="font-sans text-lg text-luxury-black/60 leading-relaxed max-w-2xl mx-auto">
          {subtitle || "Combinamos a precisão técnica da fotografia moderna com a alma da arte clássica. Nosso compromisso é com a verdade do momento, entregando resultados que transcendem o efêmero."}
        </p>
      </div>
      
      {/* Decorative Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-[20vw] opacity-[0.02] whitespace-nowrap pointer-events-none select-none uppercase">
        CARSENA
      </div>
    </section>
  );
};
