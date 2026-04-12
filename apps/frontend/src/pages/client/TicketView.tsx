import { ClientLayout } from "../../components/layout/ClientLayout";
import { ArrowLeft, Share2, Smartphone } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ticketService } from "../../lib/tickets";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketCard } from "../../components/TicketCard";
import type { TicketData } from "../../components/TicketCard";

export const TicketView = () => {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadTicketData = async () => {
      try {
        setLoading(true);
        const ticketData = await ticketService.getTicket(id);
        setTicket(ticketData);
      } catch (err: any) {
        console.error("Error loading ticket:", err);
        toast.error("Erro ao carregar ingresso: " + (err.message || "Tente novamente mais tarde."));
      } finally {
        setLoading(false);
      }
    };

    loadTicketData();
  }, [id]);

  if (loading) {
    return (
      <ClientLayout>
        <div className="section-padding pt-12">
          <div className="container-premium max-w-md space-y-8">
            <Skeleton className="h-[600px] w-full bg-white/5 rounded-2xl" />
          </div>
        </div>
      </ClientLayout>
    );
  }

  if (!ticket) {
    return (
      <ClientLayout>
        <div className="section-padding pt-12 text-center">
          <p className="text-luxury-cream/60">Ingresso não encontrado.</p>
        </div>
      </ClientLayout>
    );
  }

  // Map database object to TicketData interface
  const ticketData: TicketData = {
    id: ticket.id,
    customer_name: ticket.clients?.name || ticket.customers?.name || "Participante",
    customer_email: ticket.clients?.email || ticket.customers?.email || "",
    event_title: ticket.events?.title || "Evento",
    event_date: ticket.events?.date || new Date().toISOString(),
    event_location: ticket.events?.location || "Local não informado",
    tier_name: ticket.ticket_tiers?.name || "Ingresso",
    ticket_code: ticket.qr_code || ticket.id,
    tier_price: ticket.ticket_tiers?.price
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Ingresso: ${ticketData.event_title}`,
        text: `Confira meu ingresso para o evento ${ticketData.event_title}!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link do ingresso copiado!");
    }
  };

  return (
    <ClientLayout>
      <div className="section-padding pt-12 pb-32">
        <div className="container-premium px-6 lg:px-12">
          {/* Back Button */}
          <Link 
            to="/cliente" 
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-gold hover:-translate-x-2 transition-transform w-fit mb-12"
          >
            <ArrowLeft size={14} />
            Voltar para Meus Pedidos
          </Link>

          <div className="max-w-md mx-auto space-y-8">
            {/* The Premium Ticket Card Component */}
            <TicketCard ticket={ticketData} />

            {/* Premium Wallet Instructions Guide */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm"
            >
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
                <Smartphone size={18} className="text-luxury-gold" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white">Como salvar na sua carteira</h3>
              </div>
              
              <div className="p-6 space-y-8">
                {/* Android / Google Wallet */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img src="https://img.icons8.com/color/480/google-wallet.png" className="w-5 h-5" alt="Google Wallet" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold">Android / Google Wallet</span>
                  </div>
                  <ol className="space-y-3">
                    {[
                      "Tire um print (screenshot) deste ingresso.",
                      "Abra o app da Carteira do Google.",
                      "Toque em 'Adicionar à Carteira' (+).",
                      "Selecione 'Todo o restante'.",
                      "Escolha o print que você acabou de tirar."
                    ].map((step, i) => (
                      <li key={i} className="flex gap-4 text-[10px] text-white/50 leading-relaxed font-light">
                        <span className="text-luxury-gold font-mono font-bold">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="h-px bg-white/5 w-full" />

                {/* iOS / Apple Wallet */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Smartphone size={20} className="text-white/40" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">iPhone / Apple Wallet</span>
                  </div>
                  <p className="text-[10px] text-white/40 leading-relaxed font-light">
                    Tire um print deste ingresso e adicione aos seus <span className="text-white/60 font-medium">Favoritos</span> ou <span className="text-white/60 font-medium">Álbum de Fotos</span> para acesso rápido na portaria do evento.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* General Actions */}
            <div className="pt-4">
              <button 
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-3 border border-white/10 text-white font-bold text-[10px] uppercase tracking-[0.2em] py-5 px-8 transition-all hover:bg-white/5 rounded-xl group"
              >
                <Share2 size={16} className="text-luxury-gold" />
                Compartilhar este ingresso
              </button>
            </div>

            <div className="text-center">
              <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed">
                Este é um ingresso digital nominal e intransferível.<br />
                Apresente o QR Code no dia do evento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
};
