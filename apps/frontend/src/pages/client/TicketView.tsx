import { ClientLayout } from "../../components/layout/ClientLayout";
import { ArrowLeft, Share2, Smartphone } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
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

            {/* Additional Actions */}
            <div className="flex flex-col gap-4">
              <button 
                onClick={async () => {
                  try {
                    const url = await ticketService.getGoogleWalletUrl(ticketData.id);
                    if (url.startsWith('#')) {
                      toast.error("Google Wallet não configurado no servidor.");
                    } else {
                      window.location.href = url;
                    }
                  } catch (err) {
                    toast.error("Erro ao gerar link do Google Wallet.");
                  }
                }}
                className="flex items-center justify-center gap-3 bg-black text-white font-bold text-[10px] uppercase tracking-[0.2em] py-5 px-8 transition-all hover:bg-white/10 border border-white/20 rounded-xl"
              >
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Wallet_Icon_2022.svg/512px-Google_Wallet_Icon_2022.svg.png" 
                  alt="Google Wallet" 
                  className="w-5 h-5"
                />
                Adicionar ao Google Wallet
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => toast.info("Integração Apple Wallet em breve!")}
                  className="flex items-center justify-center gap-3 bg-white text-black font-bold text-[10px] uppercase tracking-[0.2em] py-5 px-8 transition-all hover:bg-luxury-gold"
                >
                  <Smartphone size={16} />
                  Apple Wallet
                </button>
                <button 
                  onClick={handleShare}
                  className="flex items-center justify-center gap-3 border border-white/20 text-white font-bold text-[10px] uppercase tracking-[0.2em] py-5 px-8 transition-all hover:bg-white/10"
                >
                  <Share2 size={16} />
                  Compartilhar
                </button>
              </div>
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
