import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  CreditCard, 
  ShieldCheck, 
  Copy, 
  Clock,
  User,
  Mail,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const EventCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const event = location.state?.event;
  const tier = location.state?.tier;

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");
  
  const [pixData, setPixData] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!event || !tier) {
      toast.error("Ingresso não encontrado ou expirado.");
      navigate('/');
    }
  }, [event, tier, navigate]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerEmail || !customerDocument) {
      toast.error("Preencha todos os campos para continuar.");
      return;
    }

    try {
      setVerifying(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_document: customerDocument,
          payment_method: 'PIX',
          items: [
            {
              item_id: tier.id,
              item_type: 'ticket',
              unit_price: tier.price,
              quantity: 1,
              name: `Ingresso: ${tier.name}`
            }
          ]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setPixData(data.payment);
      toast.success("Pagamento PIX gerado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao gerar pagamento: " + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("PIX Copia e Cola copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!event || !tier) return null;

  return (
    <div className="min-h-screen bg-luxury-cream text-luxury-black">
      {/* Header */}
      <header className="border-b border-luxury-black/5 bg-white/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
           <Link 
            to="/"
            className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-luxury-gold hover:-translate-x-2 transition-transform"
           >
             <ArrowLeft size={16} /> Cancelar Ingresso
           </Link>
           <h1 className="text-xs font-bold tracking-[0.5em] text-luxury-black/40 uppercase">Garantir Ingresso</h1>
           <div className="w-10" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
          
          {/* Resumo */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-12">
             <div className="space-y-4">
               <span className="text-[10px] text-luxury-gold font-bold uppercase tracking-[0.4em]">Resumo</span>
               <h2 className="text-4xl lg:text-5xl font-light leading-tight">{event.title}</h2>
               <div className="w-12 h-px bg-luxury-gold" />
             </div>

             <div className="bg-white border border-luxury-black/5 p-10 shadow-sm space-y-8">
                <div className="flex justify-between items-end border-b border-luxury-black/5 pb-8">
                   <p className="text-[10px] text-luxury-black/40 uppercase tracking-widest">{tier.name}</p>
                   <p className="text-xl font-light">1x</p>
                </div>
                <div className="flex justify-between items-end pt-4">
                   <div className="space-y-1">
                      <p className="text-[10px] text-luxury-gold uppercase tracking-[0.3em] font-black">Total a Pagar</p>
                      <p className="text-[9px] text-luxury-black/40 uppercase tracking-widest">Via PIX</p>
                   </div>
                   <p className="text-4xl font-serif text-luxury-gold">R$ {Number(tier.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
             </div>

             <div className="flex items-center gap-4 text-luxury-black/60">
                <ShieldCheck size={20} className="text-luxury-gold/60" />
                <p className="text-[10px] uppercase tracking-widest leading-loose">
                  Seu ingresso será liberado e enviado por e-mail <br />
                  <span className="text-luxury-black font-bold">automaticamente após a confirmação do pagamento.</span>
                </p>
             </div>
          </div>

          {/* Pagamento */}
          <div className="lg:col-span-12 xl:col-span-7">
             <AnimatePresence mode="wait">
               {!pixData ? (
                 <motion.div 
                   key="checkout-start"
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 1.05 }}
                   className="bg-white border border-luxury-black/5 p-8 lg:p-16 shadow-lg space-y-10"
                 >
                    <div className="space-y-4 text-center">
                       <h3 className="text-3xl font-light text-editorial">Seus Dados</h3>
                       <p className="text-luxury-black/40 text-sm max-w-sm mx-auto">Preencha os dados abaixo para receber o seu ingresso no email com segurança.</p>
                    </div>

                    <form onSubmit={handleCheckout} className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-black/60 pl-2">Nome Completo</label>
                          <div className="relative mt-2">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-black/20" size={20} />
                            <input 
                              required
                              type="text" 
                              value={customerName}
                              onChange={e => setCustomerName(e.target.value)}
                              className="w-full bg-luxury-cream/30 border border-luxury-black/10 py-4 pl-12 pr-4 outline-none focus:border-luxury-gold transition-colors text-luxury-black"
                              placeholder="Seu nome"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-black/60 pl-2">E-mail</label>
                          <div className="relative mt-2">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-black/20" size={20} />
                            <input 
                              required
                              type="email" 
                              value={customerEmail}
                              onChange={e => setCustomerEmail(e.target.value)}
                              className="w-full bg-luxury-cream/30 border border-luxury-black/10 py-4 pl-12 pr-4 outline-none focus:border-luxury-gold transition-colors text-luxury-black"
                              placeholder="seu@email.com"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-black/60 pl-2">CPF ou CNPJ</label>
                          <div className="relative mt-2">
                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-black/20" size={20} />
                            <input 
                              required
                              type="text" 
                              value={customerDocument}
                              onChange={e => setCustomerDocument(e.target.value.replace(/\D/g, ''))}
                              maxLength={14}
                              className="w-full bg-luxury-cream/30 border border-luxury-black/10 py-4 pl-12 pr-4 outline-none focus:border-luxury-gold transition-colors text-luxury-black"
                              placeholder="000.000.000-00"
                            />
                          </div>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={verifying}
                        className="w-full py-6 mt-4 bg-luxury-black text-white text-[11px] font-black uppercase tracking-[0.5em] hover:bg-luxury-gold hover:text-black hover:scale-[1.02] transition-all disabled:opacity-50"
                      >
                        {verifying ? "Gerando Protocolo PIX..." : "Gerar PIX de Pagamento"}
                      </button>
                    </form>

                    <div className="flex items-center justify-center gap-4 pt-10 border-t border-luxury-black/5">
                       <img src="https://logopng.com.br/logos/pix-106.png" className="h-6 grayscale opacity-40" alt="PIX" />
                    </div>
                 </motion.div>
               ) : (
                 <motion.div 
                   key="pix-data"
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="bg-white border border-emerald-500/20 p-8 lg:p-16 shadow-2xl text-center space-y-12"
                 >
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3 text-emerald-600">
                           <Clock size={16} className="animate-pulse" />
                           <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Aguardando Pagamento</span>
                        </div>
                        <h3 className="text-3xl font-light text-editorial">Escaneie o QR Code</h3>
                        <p className="text-luxury-black/40 text-sm max-w-sm mx-auto">
                          Faça o pagamento via PIX para garantir seu ingresso. 
                          Seu ingresso será enviado no e-mail <strong>{customerEmail}</strong>.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl inline-block shadow-2xl border border-luxury-black/5">
                       <img 
                         src={`data:image/png;base64,${pixData.pix_qrcode}`} 
                         alt="QR Code PIX"
                         className="w-48 h-48 lg:w-64 lg:h-64"
                       />
                    </div>

                    <div className="space-y-4 pt-8 border-t border-luxury-black/5">
                        <p className="text-[10px] text-luxury-black/40 uppercase tracking-widest">Ou utilize o Pix Copia e Cola:</p>
                        <button 
                          onClick={() => copyToClipboard(pixData.pix_qrcode_text)}
                          className="group relative w-full overflow-hidden rounded-2xl bg-luxury-cream/50 p-6 transition-all hover:bg-luxury-gold/10"
                        >
                           <div className="flex items-center justify-between text-luxury-black">
                              <span className="font-mono text-xs opacity-60 truncate max-w-[200px] lg:max-w-[300px]">
                                {pixData.pix_qrcode_text}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-luxury-gold">
                                <Copy size={14} className="group-hover:scale-110 transition-transform" />
                                <span>{copied ? "Copiado!" : "Copiar"}</span>
                              </div>
                           </div>
                        </button>
                    </div>

                 </motion.div>
               )}
             </AnimatePresence>
          </div>

        </div>
      </main>
    </div>
  );
};
