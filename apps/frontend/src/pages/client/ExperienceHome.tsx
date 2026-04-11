import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Ticket, 
  ChevronRight, 
  LogOut, 
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { getStoragePublicUrl } from '../../lib/storage';

type Experience = {
  id: string;
  title: string;
  type: 'Galeria' | 'Ingresso' | 'Conteúdo';
  typeIcon: React.ReactNode;
  status: string;
  image: string;
  date: string;
  path: string;
  isPending?: boolean;
  price?: number;
};

export const ExperienceHome = () => {
  const { customer, signOut } = useAuth();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!customer) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Galleries
        const { data: galleries, error: gError } = await supabase
          .schema('app_carsena')
          .from('galleries')
          .select(`
            *,
            photos ( id, thumbnail_path, storage_path, is_processed )
          `)
          .eq('customer_id', customer.id);

        if (gError) throw gError;

        const formattedGalleries: Experience[] = (galleries || []).map(g => {
          const isPaid = Number(g.amount_paid || 0) >= Number(g.price || 0);
          const isPending = Number(g.price || 0) > 0 && !isPaid;
          
          let statusLabel = 'PRONTO';
          if (g.status === 'draft') statusLabel = 'EM PREPARAÇÃO';
          else if (isPending) statusLabel = 'AGUARDANDO PAGAMENTO';

          // Pick the first processed photo as thumbnail if thumbnail_url is not explicitly set
          const firstPhoto = (g.photos || []).find((p: any) => p.is_processed !== false);
          const galleryImage = g.thumbnail_url || (firstPhoto ? getStoragePublicUrl(firstPhoto.thumbnail_path || firstPhoto.storage_path) : "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1000&auto=format&fit=crop");

          return {
            id: g.id,
            title: g.title,
            type: 'Galeria',
            typeIcon: <Camera size={14} />,
            status: statusLabel.toLowerCase(),
            image: galleryImage,
            date: new Date(g.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
            path: `/cliente/galeria/${g.id}`,
            isPending: isPending,
            price: g.price,
            remaining: Number(g.price || 0) - Number(g.amount_paid || 0)
          };
        });

        // 2. Fetch Tickets/Orders
        const { data: tickets, error: tError } = await supabase
          .schema('app_carsena')
          .from('orders')
          .select('*, item_id')
          .eq('customer_id', customer.id)
          .eq('item_type', 'ticket');

        if (tError) throw tError;

        let formattedTickets: Experience[] = [];
        if (tickets && tickets.length > 0) {
          const tierIds = tickets.map(t => t.item_id).filter(Boolean);
          const { data: tiers } = await supabase
            .schema('app_carsena')
            .from('ticket_tiers')
            .select('*, events(*)')
            .in('id', tierIds);

          const tiersMap = new Map((tiers || []).map(t => [t.id, t]));

          // 3. (Optional) Fetch events directly for those that linked to event_id instead of tier_id
          const eventIds = [
            ...Array.from(tiersMap.values()).map(t => (t as any).events?.id || (t as any).event_id),
            ...tickets.filter(t => !tiersMap.has(t.item_id)).map(t => t.item_id)
          ].filter(Boolean);

          const { data: events } = await supabase
            .schema('app_carsena')
            .from('events')
            .select('*')
            .in('id', eventIds);

          const eventsMap = new Map((events || []).map(e => [e.id, e]));

          formattedTickets = tickets.map((t: any) => {
            const tier = tiersMap.get(t.item_id);
            const event = tier?.events || eventsMap.get(t.item_id);

            return {
              id: t.id,
              title: event?.title || "Ticket",
              type: 'Ingresso',
              typeIcon: <Ticket size={14} />,
              status: t.status === 'paid' ? 'disponível' : 'aguardando',
              image: tier?.events?.thumbnail_url || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1000&auto=format&fit=crop",
              date: tier?.events?.date ? new Date(tier.events.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : "Pendente",
              path: `/cliente/ingresso/${t.id}`
            };
          });
        }

        setExperiences([...formattedGalleries, ...formattedTickets]);
      } catch (err) {
        console.error("Error fetching experiences:", err);
        toast.error("Erro ao carregar suas experiências.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customer, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#d4af37]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header Premium */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#d4af37] rounded-lg flex items-center justify-center font-bold text-black text-xl shadow-lg shadow-[#d4af37]/20">C</div>
            <div>
              <h1 className="text-sm font-bold tracking-widest text-[#d4af37]">CARSENA</h1>
              <p className="text-[10px] text-white/40 tracking-[0.2em] font-medium">EXPERIENCES</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-medium text-white/80">{customer?.name}</span>
              <span className="text-[10px] text-[#d4af37] uppercase tracking-wider font-bold">Membro Premium</span>
            </div>
            <button 
              onClick={() => signOut()}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-xs font-medium transition-all flex items-center gap-2 border border-white/10 hover:border-white/20 active:scale-95"
            >
              <LogOut size={14} />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#d4af37] animate-pulse">
              <Clock size={14} />
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase">Escritório Digital Ativo</p>
            </div>
            <h2 className="text-5xl font-light tracking-tight">Suas <span className="italic font-normal text-[#d4af37]">Memórias</span></h2>
            <p className="text-white/40 text-base max-w-md leading-relaxed">Acesse suas sessões exclusivas, escolha suas fotos favoritas e celebre seus momentos mais especiais.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center">
              <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Total Itens</span>
              <span className="text-xl font-bold">{experiences.length}</span>
            </div>
            <div className="px-6 py-3 bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-2xl flex flex-col items-center">
              <span className="text-[10px] text-[#d4af37] uppercase tracking-widest mb-1">Pendentes</span>
              <span className="text-xl font-bold text-[#d4af37]">{experiences.filter(e => e.isPending).length}</span>
            </div>
          </div>
        </div>

        {experiences.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-24 text-center backdrop-blur-sm"
          >
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
              <Camera className="text-white/20" size={40} />
            </div>
            <h3 className="text-2xl font-light mb-3">Nenhuma galeria liberada</h3>
            <p className="text-white/40 max-w-sm mx-auto text-sm leading-relaxed">Fique tranquilo(a)! Assim que o seu fotógrafo finalizar o tratamento das imagens, elas aparecerão aqui automaticamente.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {experiences.map((exp, idx) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="group relative"
              >
                <Link to={exp.path} className="block">
                  <div className="aspect-[3/4] rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 relative transition-all duration-500 group-hover:border-[#d4af37]/40 group-hover:shadow-2xl group-hover:shadow-[#d4af37]/10">
                    <img 
                      src={exp.image} 
                      alt={exp.title}
                      className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ${exp.status === 'aguardando pagamento' || exp.status === 'em preparação' ? 'grayscale opacity-50 contrast-125' : ''}`}
                    />
                    
                    {/* Status Badge */}
                    <div className="absolute top-6 left-6 z-10">
                      <div className={`px-4 py-2 rounded-xl text-[9px] font-bold tracking-[0.15em] uppercase backdrop-blur-xl border flex items-center gap-2 ${
                        exp.status === 'disponível' || exp.status === 'pronto'
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : exp.status === 'em preparação'
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                          : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                      }`}>
                        {exp.status === 'disponível' || exp.status === 'pronto' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                        {exp.status}
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-10">
                      <div className="flex items-center gap-3 text-[#d4af37] mb-3">
                        <div className="p-2 bg-[#d4af37]/10 rounded-lg backdrop-blur-md">
                          {exp.typeIcon}
                        </div>
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{exp.type}</span>
                      </div>
                      <h3 className="text-3xl font-light mb-6 transition-all duration-300 group-hover:translate-x-2 group-hover:text-[#d4af37]">{exp.title}</h3>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em]">{exp.date}</span>
                        <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-[#d4af37] group-hover:border-[#d4af37] transition-all duration-300">
                          <ChevronRight className="text-white group-hover:text-black" size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Ação de Pagamento */}
                {exp.isPending && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <Link 
                      to={`/cliente/checkout/${exp.id}`}
                      className="w-full py-5 bg-[#d4af37] hover:bg-white text-black font-bold text-xs tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-[#d4af37]/20 flex items-center justify-center gap-3 active:scale-95 group-hover:shadow-[#d4af37]/30"
                    >
                      <CreditCard size={18} />
                      LIBERAR AGORA (R$ {Number((exp as any).remaining || exp.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </Link>
                    <div className="flex items-center justify-center gap-2 mt-4 text-white/30 text-[10px] tracking-widest uppercase">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                      Liberação Instantânea via PIX
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-white/5 py-16 text-center">
        <div className="flex items-center justify-center gap-4 mb-6 opacity-20">
          <div className="h-px w-12 bg-white" />
          <span className="text-xs font-bold tracking-[0.5em]">CARSENA</span>
          <div className="h-px w-12 bg-white" />
        </div>
        <p className="text-white/10 text-[9px] tracking-[0.3em] font-medium uppercase">
          Technology for Unforgettable Moments
        </p>
      </footer>
    </div>
  );
};

