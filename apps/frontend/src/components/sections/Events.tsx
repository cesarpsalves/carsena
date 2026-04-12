import { useState, useEffect } from 'react';
import { Calendar, MapPin, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { eventService } from '../../lib/events';
import type { Event } from '../../lib/events';
import { getStoragePublicUrl } from '../../lib/storage';

interface EventsProps {
  title?: string;
  subtitle?: string;
}

export const Events = ({ title, subtitle }: EventsProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await eventService.getEvents();
        setEvents(data);
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const handleBuyTicket = (event: Event) => {
    // Pega o lote ativo (ou o primeiro com preço > 0)
    const activeTier = event.ticket_tiers?.find(t => t.active && t.stock_sold < t.stock_total) || event.ticket_tiers?.[0];
    
    if (!activeTier) return;

    navigate('/checkout', {
      state: {
        event,
        tier: activeTier
      }
    });
  };

  if (loading) {
    return (
      <section id="bilheteria" className="section-padding bg-luxury-cream text-luxury-black flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-luxury-gold" size={40} />
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section id="bilheteria" className="section-padding bg-luxury-cream text-luxury-black">
        <div className="container-premium text-center">
          <p className="text-luxury-black/40 italic">Novos Ingressos e Experiências em breve.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="bilheteria" className="section-padding bg-luxury-cream text-luxury-black">
      <div className="container-premium lg:px-12">
        <div className="max-w-4xl mb-20 space-y-6">
          <p className="text-luxury-gold font-bold text-[10px] uppercase tracking-[0.4em]">Bilheteria Oficial</p>
          <h2 className="text-editorial text-5xl md:text-7xl">
            {title || <>Participe do <br />Inesperado</>}
          </h2>
          <p className="text-luxury-black/60 text-lg leading-relaxed font-sans max-w-xl italic">
            "{subtitle || "A arte não é apenas para ser vista, é para ser vivida."}"
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {events.map((event) => {
            const activeTier = event.ticket_tiers?.find(t => t.active) || event.ticket_tiers?.[0];
            const isSoldOut = !activeTier || activeTier.stock_sold >= activeTier.stock_total;

            // Renderiza imagem do R2 se existir, senao placeholder
            const thumbUrl = event.thumbnail_url ? getStoragePublicUrl(event.thumbnail_url) : "/assets/placeholder-event.png";

            return (
              <div key={event.id} className="group flex flex-col bg-white border border-luxury-black/5 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden shadow-sm w-full mx-auto max-w-sm">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img 
                    src={thumbUrl} 
                    alt={event.title}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-luxury-black/20 group-hover:bg-transparent transition-colors duration-500" />
                  
                  {isSoldOut ? (
                    <div className="absolute top-6 left-6 bg-black text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest">
                      Esgotado
                    </div>
                  ) : (
                    <div className="absolute top-6 left-6 bg-luxury-gold text-luxury-black text-[10px] font-bold px-3 py-1 uppercase tracking-widest">
                      Inscrições Abertas
                    </div>
                  )}
                </div>

                <div className="p-8 flex flex-col flex-1 space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-[10px] font-semibold text-luxury-gold uppercase tracking-[0.2em]">
                        <Calendar size={12} />
                        {new Date(event.date || "").toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-semibold text-luxury-black/40 uppercase tracking-[0.2em]">
                        <MapPin size={12} />
                        {event.location}
                      </div>
                    </div>
                    <h3 className="text-editorial text-3xl group-hover:text-luxury-gold transition-colors duration-300 leading-tight">
                      {event.title}
                    </h3>
                    <p className="text-sm text-luxury-black/60 font-sans leading-relaxed line-clamp-3">
                      {event.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-auto">
                    <button 
                      onClick={() => handleBuyTicket(event)}
                      disabled={isSoldOut}
                      className={`w-full flex items-center justify-between group/btn border border-luxury-black/10 px-6 py-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-300 ${isSoldOut ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:bg-luxury-black hover:text-white'}`}
                    >
                      {isSoldOut ? 'Ingressos Esgotados' : `Garantir Ingresso — R$ ${activeTier?.price || '0,00'}`}
                      <ChevronRight size={16} className="transform group-hover/btn:translate-x-2 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
