import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Camera, Calendar, MapPin, User, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

export interface TicketData {
  id: string; // The database ID for fetching metadata
  customer_name: string;
  customer_email: string;
  event_title: string;
  event_date: string;
  event_location: string;
  tier_name: string;
  ticket_code: string; // The UUID or unique string used for scanning
  purchased_at?: string;
  tier_price?: number;
}

interface TicketCardProps {
  ticket: TicketData;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [loadingWallet, setLoadingWallet] = useState(false);

  useEffect(() => {
    // Generate the visually beautiful QR Code to fit inside the pass
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(ticket.ticket_code, {
          width: 300,
          margin: 1,
          color: {
            dark: '#0D0D0D', // Fundo preto escuro original
            light: '#FFFFFF' // Fundo branco pra não falhar leitura
          }
        });
        setQrCodeDataUrl(url);
      } catch (err) {
        console.error('Error generating QR', err);
      }
    };

    generateQR();
  }, [ticket.ticket_code]);

  const handleAddToWallet = async () => {
    const toastId = "google-wallet-toast";
    const { toast } = await import('sonner');
    const { ticketService } = await import('../lib/tickets');

    try {
      setLoadingWallet(true);
      toast.loading("Sincronizando com Google Wallet...", { id: toastId });
      
      const walletUrl = await ticketService.getGoogleWalletUrl(ticket.id);
      
      if (walletUrl.startsWith('#google-wallet-not-configured')) {
        toast.error("Configuração pendente: As chaves do Google Wallet não foram configuradas no servidor.", { 
          id: toastId,
          duration: 5000 
        });
        return;
      }

      toast.success("Abrindo Google Wallet...", { id: toastId });
      // Abrir em nova aba para salvar o passe
      window.open(walletUrl, '_blank');
      
    } catch (err) {
      console.error("Wallet Error:", err);
      toast.error("Erro ao sincronizar com Google Wallet. Tente novamente.", { id: toastId });
    } finally {
      setLoadingWallet(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full mx-auto"
    >
      <div className="relative group overflow-hidden bg-[#1A1A1A] rounded-2xl shadow-2xl border border-white/10 flex flex-col">
        {/* Decorative Golden Top Line */}
        <div className="h-2 w-full bg-gradient-to-r from-luxury-gold/40 via-luxury-gold to-luxury-gold/40" />

        {/* Header - Brand */}
        <div className="p-8 pb-4 text-center border-b border-dashed border-white/10 relative">
          <div className="flex justify-center items-center gap-2 text-luxury-gold mb-2">
            <Camera size={20} />
            <span className="font-serif italic text-2xl tracking-widest">Carsena</span>
          </div>
          <p className="text-[9px] uppercase tracking-[0.4em] text-white/40 font-bold">VIP Boarding Pass</p>
          
          {/* Semicircles for design */}
          <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-[#0D0D0D] rounded-full border-t border-r border-white/10 rotate-45"></div>
          <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#0D0D0D] rounded-full border-t border-l border-white/10 -rotate-45"></div>
        </div>

        {/* Content - Body */}
        <div className="p-8 pt-6 space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-serif text-white uppercase tracking-wider mb-2">{ticket.event_title}</h2>
            <div className="inline-block bg-white/5 border border-white/10 px-4 py-1 rounded-full">
              <span className="text-[10px] text-luxury-gold uppercase tracking-[0.3em] font-bold">{ticket.tier_name}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-4">
            <div className="space-y-1 block">
              <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-white/40"><User size={12} /> Titular</span>
              <p className="text-sm font-medium text-white truncate">{ticket.customer_name}</p>
            </div>
            
            <div className="space-y-1 block">
               <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-white/40"><Hash size={12} /> Referência</span>
               <p className="text-xs font-mono text-white/80">{(ticket.ticket_code || '').substring(0, 8)}</p>
            </div>

            <div className="space-y-1 block">
              <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-white/40"><Calendar size={12} /> Data</span>
              <p className="text-sm font-medium text-white">
                {new Date(ticket.event_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            
            <div className="space-y-1 block">
              <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-white/40"><MapPin size={12} /> Local</span>
              <p className="text-sm font-medium text-white truncate" title={ticket.event_location}>{ticket.event_location}</p>
            </div>
          </div>
        </div>

        {/* Fixed QR Code Area */}
        <div className="bg-white/5 border-t border-white/10 p-8 flex flex-col items-center justify-center relative">
            <div className="bg-white p-3 rounded-xl shadow-[0_0_30px_rgba(212,175,55,0.15)] transform group-hover:scale-105 transition-transform duration-500">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="Ticket QR Code" className="w-48 h-48 rounded-lg" />
              ) : (
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center animate-pulse rounded-lg">
                   <p className="text-xs text-gray-400">Gerando QR...</p>
                </div>
              )}
            </div>
            
            <p className="text-[8px] uppercase tracking-[0.4em] text-white/30 mt-6 max-w-[200px] text-center">
              Apresente este código na tela do seu dispositivo na portaria.
            </p>

            {/* Google Wallet Button Functional */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loadingWallet}
              onClick={handleAddToWallet}
              className={`mt-8 flex items-center gap-3 bg-black border border-white/10 px-6 py-3 rounded-full hover:bg-white/5 transition-all group/wallet ${loadingWallet ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Wallet_Icon_2022.svg" 
                alt="Google Wallet" 
                className={`w-5 h-5 group-hover/wallet:scale-110 transition-transform ${loadingWallet ? 'animate-pulse' : ''}`}
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                {loadingWallet ? 'Sincronizando...' : 'Add to Google Wallet'}
              </span>
            </motion.button>
        </div>

      </div>
    </motion.div>
  );
};
