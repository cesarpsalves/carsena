import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Ticket, 
  ChevronRight, 
  LogOut, 
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  Sparkles,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { getStoragePublicUrl } from '../../lib/storage';
import { cn } from '@/lib/utils';

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
  remaining?: number;
};

export const ExperienceHome = () => {
  const { customer, signOut } = useAuth();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'galeria' | 'ingresso'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (!customer) {
      navigate('/cliente/login');
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
          else if (isPending) statusLabel = 'PAGAMENTO PENDENTE';

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
        const { data: orders, error: oError } = await supabase
          .schema('app_carsena')
          .from('orders')
          .select('*, item_id')
          .eq('customer_id', customer.id)
          .eq('item_type', 'ticket');

        if (oError) throw oError;

        let formattedTickets: Experience[] = [];
        if (orders && orders.length > 0) {
          const tierIds = orders.map(o => o.item_id).filter(Boolean);
          
          // Fetch Tiers and Events
          const [{ data: tiers }, { data: directEvents }] = await Promise.all([
            supabase.schema('app_carsena').from('ticket_tiers').select('*, events(*)').in('id', tierIds),
            supabase.schema('app_carsena').from('events').select('*').in('id', tierIds)
          ]);

          const tiersMap = new Map((tiers || []).map(t => [t.id, t]));
          const eventsMap = new Map((directEvents || []).map(e => [e.id, e]));

          formattedTickets = orders.map((o: any) => {
            const tier = tiersMap.get(o.item_id);
            const event = tier?.events || eventsMap.get(o.item_id);

            return {
              id: o.id,
              title: event?.title || "Evento Carsena",
              type: 'Ingresso',
              typeIcon: <Ticket size={14} />,
              status: o.status === 'paid' ? 'confirmado' : 'pendente',
              image: event?.thumbnail_url || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1000&auto=format&fit=crop",
              date: event?.date ? new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : "Agendado",
              path: `/cliente/ingresso/${o.id}`,
              isPending: o.status !== 'paid',
              price: o.total_amount
            };
          });
        }

        setExperiences([...formattedGalleries, ...formattedTickets]);
      } catch (err) {
        console.error("Error fetching experiences:", err);
        toast.error("Erro ao carregar seu portal.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customer, navigate]);

  const filteredExperiences = experiences.filter(exp => 
    filter === 'all' ? true : exp.type.toLowerCase() === filter
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-black flex flex-col items-center justify-center gap-6">
        <div className="relative">
            <div className="w-16 h-16 border-2 border-luxury-gold/20 rounded-full animate-[spin_3s_linear_infinite]" />
            <div className="absolute inset-0 w-16 h-16 border-t-2 border-luxury-gold rounded-full animate-spin" />
        </div>
        <p className="text-[10px] font-bold tracking-[0.4em] text-luxury-gold uppercase animate-pulse">Sintonizando Experiência</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-black text-white font-sans selection:bg-luxury-gold selection:text-black">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-luxury-gold/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-luxury-gold/5 rounded-full blur-[120px]" />
      </div>

      {/* Header Premium Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between pointer-events-auto">
          <Link to="/" className="flex items-center gap-4 group">
             <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:border-luxury-gold/50 group-hover:bg-luxury-gold/5">
                <span className="text-xl font-serif text-luxury-gold">C</span>
             </div>
             <div className="flex flex-col">
                <span className="text-xs font-black tracking-[0.3em] group-hover:text-luxury-gold transition-colors">CARSENA</span>
                <span className="text-[8px] text-white/40 tracking-[0.2em] font-medium uppercase">Fotografia Autoral</span>
             </div>
          </Link>

          <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-4 px-6 py-2 bg-white/5 border border-white/5 rounded-full">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">Servidor Online</span>
            </div>
            
            <button 
              onClick={() => signOut()}
              className="group flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-luxury-gold transition-all"
            >
              <span className="opacity-40 group-hover:opacity-100">Sair da Conta</span>
              <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-luxury-gold group-hover:text-black transition-all">
                <LogOut size={14} />
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="relative pt-40 pb-32 px-6 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="flex flex-col mb-20">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex items-center gap-4 text-luxury-gold mb-6"
            >
                <div className="h-[1px] w-8 bg-luxury-gold" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Área do Cliente</span>
            </motion.div>
            
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                <div className="space-y-4">
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-6xl md:text-8xl font-editorial tracking-tight leading-none"
                    >
                        Olá, <span className="text-luxury-gold italic">{customer?.name?.split(' ')[0]}</span>
                    </motion.h1>
                    <p className="text-white/40 text-lg max-w-xl font-light leading-relaxed italic">
                        "Cada fotografia é um fragmento de tempo que não volta, mas que aqui, permanece eterno."
                    </p>
                </div>

                {/* Filters */}
                <div className="flex bg-white/5 p-1.5 border border-white/5 self-start">
                    {[
                        { id: 'all', label: 'TUDO', icon: <LayoutGrid size={12} /> },
                        { id: 'galeria', label: 'GALERIAS', icon: <Camera size={12} /> },
                        { id: 'ingresso', label: 'INGRESSOS', icon: <Ticket size={12} /> },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setFilter(item.id as any)}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 text-[9px] font-black tracking-[0.2em] transition-all",
                                filter === item.id 
                                    ? "bg-luxury-gold text-black shadow-lg" 
                                    : "text-white/40 hover:text-white"
                            )}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Content Grid */}
        <AnimatePresence mode="wait">
            {filteredExperiences.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="w-full py-40 border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-6 bg-white/[0.01]"
                >
                    <div className="w-20 h-20 bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                        <Sparkles size={32} strokeWidth={1} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-editorial uppercase tracking-widest text-white/60">O Horizont está vindo</h3>
                        <p className="text-xs text-white/20 uppercase tracking-[0.2em]">Sua galeria ou ingresso aparecerá aqui em breve.</p>
                    </div>
                </motion.div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12"
                >
                    {filteredExperiences.map((exp, idx) => (
                        <motion.div
                            key={exp.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group"
                        >
                            <Link to={exp.path} className="block relative aspect-[4/5] overflow-hidden mb-8 bg-white/5 transition-all group-hover:shadow-[0_45px_100px_-20px_rgba(0,0,0,0.8),0_0_50px_-10px_rgba(197,165,114,0.15)] group-hover:-translate-y-2">
                                <img 
                                    src={exp.image} 
                                    alt={exp.title}
                                    className={cn(
                                        "w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110 opacity-80 group-hover:opacity-100",
                                        exp.isPending && "blur-sm"
                                    )}
                                />
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                                
                                {/* Label & Type */}
                                <div className="absolute top-0 right-0 p-8 transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                                    <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 flex items-center gap-2">
                                        <span className="text-[8px] font-black tracking-widest text-luxury-gold uppercase">{exp.type}</span>
                                    </div>
                                </div>

                                {/* Status Overlay for Pending */}
                                {exp.isPending && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                        <div className="px-6 py-3 border border-luxury-gold/30 bg-black/80 flex flex-col items-center gap-2">
                                            <AlertCircle size={20} className="text-luxury-gold" />
                                            <span className="text-[10px] font-black tracking-[0.2em] text-luxury-gold uppercase">Acesso Bloqueado</span>
                                        </div>
                                    </div>
                                )}

                                {/* Card Footer Info */}
                                <div className="absolute bottom-0 left-0 right-0 p-10 transform transition-transform duration-500 group-hover:-translate-y-2">
                                    <h3 className="text-4xl font-editorial mb-4 group-hover:text-luxury-gold transition-colors">{exp.title}</h3>
                                    <div className="flex items-center gap-6 text-[9px] font-bold uppercase tracking-widest text-white/40">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays size={12} className="text-luxury-gold" />
                                            {exp.date}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", exp.isPending ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                                            {exp.status}
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            {/* Action Button */}
                            {exp.isPending ? (
                                <Link 
                                    to={exp.type === 'Galeria' ? `/cliente/checkout/galeria/${exp.id}` : `/cliente/checkout/ticket/${exp.id}`}
                                    className="w-full py-5 bg-white text-black font-black text-[9px] tracking-[0.4em] uppercase flex items-center justify-center gap-4 hover:bg-luxury-gold transition-all group-hover:shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
                                >
                                    <CreditCard size={14} />
                                    Liberar Experiência (R$ {exp.remaining || exp.price})
                                </Link>
                            ) : (
                                <Link 
                                    to={exp.path}
                                    className="w-full py-5 border border-white/10 text-white font-black text-[9px] tracking-[0.4em] uppercase flex items-center justify-center gap-4 hover:bg-white hover:text-black transition-all group-hover:border-luxury-gold group-hover:bg-luxury-gold/5"
                                >
                                    Abrir Conteúdo
                                    <ChevronRight size={14} />
                                </Link>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
      </main>

      {/* Footer minimal */}
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-[9px] font-medium tracking-[0.3em] text-white/10 uppercase mb-4">Carsena Fotografia • Exclusive Experiences</p>
            <div className="w-12 h-[1px] bg-white/5 mx-auto" />
        </div>
      </footer>
    </div>
  );
};


