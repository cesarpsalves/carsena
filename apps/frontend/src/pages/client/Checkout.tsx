import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  CheckCircle2, 
  CreditCard, 
  ShieldCheck, 
  Copy, 
  ExternalLink,
  Clock
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export const Checkout = () => {
  const { id } = useParams<{ id: string }>();
  const { customer } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [gallery, setGallery] = useState<any>(null);
  const [pixData, setPixData] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchGallery = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .schema('app_carsena')
        .from('galleries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const balance = Number(data.price || 0) - Number(data.amount_paid || 0);
      if (balance <= 0) {
        toast.success("Esta galeria já está totalmente paga!");
        navigate(`/cliente/galeria/${id}`);
        return;
      }
      
      setGallery(data);
    } catch (err: any) {
      toast.error("Erro ao carregar checkout.");
      navigate('/cliente');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const handleCheckout = async () => {
    if (!customer || !gallery) return;
    if (!cpf || !isValidCPF(cpf)) {
      toast.error("Por favor, informe um CPF válido.");
      return;
    }

    try {
      setVerifying(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gallery_id: id,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_document: cpf,
          payment_method: paymentMethod
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (paymentMethod === 'CREDIT_CARD') {
        window.location.href = data.payment.url || data.payment.invoiceUrl;
        return;
      }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#d4af37]">
         <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const baseBalance = Number(gallery?.price || 0) - Number(gallery?.amount_paid || 0);
  const fee = paymentMethod === 'CREDIT_CARD' ? baseBalance * 0.05 : 0;
  const balanceToPay = baseBalance + fee;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Premium Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
           <Link 
            to={`/cliente/galeria/${id}`}
            className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#d4af37] hover:-translate-x-2 transition-transform"
           >
             <ArrowLeft size={16} /> Voltar
           </Link>
           <h1 className="text-xs font-bold tracking-[0.5em] text-white/40 uppercase">Liberação de Experiência</h1>
           <div className="w-10" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
          
          {/* Order Summary */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-12">
             <div className="space-y-4">
               <span className="text-[10px] text-[#d4af37] font-bold uppercase tracking-[0.4em]">Resumo do Pedido</span>
               <h2 className="text-5xl font-light leading-tight">{gallery.title}</h2>
               <div className="w-12 h-px bg-[#d4af37]" />
             </div>

             <div className="bg-white/[0.02] border border-white/5 p-10 rounded-3xl space-y-8">
                <div className="flex justify-between items-end">
                   <p className="text-[10px] text-white/40 uppercase tracking-widest">Valor do Pacote</p>
                   <p className="text-xl font-light">R$ {Number(gallery.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex justify-between items-end border-b border-white/5 pb-8">
                   <p className="text-[10px] text-emerald-500/60 uppercase tracking-widest font-bold">Saldo Já Pago</p>
                   <p className="text-xl text-emerald-500 font-light">- R$ {Number(gallery.amount_paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                {fee > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-end text-[#d4af37]/60"
                  >
                     <p className="text-[10px] uppercase tracking-widest font-bold">Taxa de Cartão (5%)</p>
                     <p className="text-xl font-light">+ R$ {fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </motion.div>
                )}

                <div className="flex justify-between items-end pt-4">
                   <div className="space-y-1">
                      <p className="text-[10px] text-[#d4af37] uppercase tracking-[0.3em] font-black">Restante à Pagar</p>
                      <p className="text-[9px] text-white/20 uppercase tracking-widest">
                        {paymentMethod === 'PIX' ? "Liberação Instantânea" : "Processamento Seguro"}
                      </p>
                   </div>
                   <p className="text-4xl font-serif text-[#d4af37]">R$ {balanceToPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
             </div>

             <div className="flex items-center gap-4 text-white/20">
                <ShieldCheck size={20} className="text-[#d4af37]/40" />
                <p className="text-[10px] uppercase tracking-widest leading-loose">
                  Suas fotos em alta definição serão liberadas <br />
                  <span className="text-white/40 font-bold">automaticamente após a confirmação.</span>
                </p>
             </div>
          </div>

          {/* Payment Method */}
          <div className="lg:col-span-12 xl:col-span-7">
             <AnimatePresence mode="wait">
               {!pixData ? (
                 <motion.div 
                   key="checkout-start"
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 1.05 }}
                   className="bg-white/5 border border-[#d4af37]/20 p-12 lg:p-16 rounded-[3.5rem] space-y-12"
                 >
                    <div className="space-y-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37] pl-2 flex justify-between">
                            <span>CPF do Comprador</span>
                            {cpf.replace(/\D/g, '').length === 11 && (
                              isValidCPF(cpf) 
                                ? <span className="text-emerald-500 lowercase font-medium flex items-center gap-1"><ShieldCheck size={10} /> Válido</span>
                                : <span className="text-rose-500 lowercase font-medium flex items-center gap-1"><AlertCircle size={10} /> Inválido</span>
                            )}
                          </label>
                          <input 
                            required
                            type="text" 
                            value={cpf}
                            onChange={e => setCpf(maskCPF(e.target.value))}
                            className="w-full bg-white/[0.03] border border-white/10 py-5 px-6 rounded-2xl outline-none focus:border-[#d4af37] transition-all text-xl text-center tracking-widest"
                            placeholder="000.000.000-00"
                          />
                       </div>

                       <div className="space-y-4">
                         <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 pl-2">Selecione o Método</label>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button 
                              type="button"
                              onClick={() => setPaymentMethod('PIX')}
                              className={cn(
                                "flex flex-col items-center gap-4 p-8 border-2 transition-all rounded-[2rem]",
                                paymentMethod === 'PIX' ? "border-[#d4af37] bg-[#d4af37]/5" : "border-white/5 bg-white/[0.02] opacity-40 hover:opacity-100"
                              )}
                            >
                              <div className={cn("w-12 h-12 flex items-center justify-center rounded-full border", paymentMethod === 'PIX' ? "border-[#d4af37] text-[#d4af37]" : "border-white/10")}>
                                {paymentMethod === 'PIX' ? <CheckCircle2 size={24} /> : <div className="w-4 h-4 rounded-full bg-white/10" />}
                              </div>
                              <span className="text-xs font-bold uppercase tracking-widest">Pix Instantâneo</span>
                            </button>

                            <button 
                              type="button"
                              onClick={() => setPaymentMethod('CREDIT_CARD')}
                              className={cn(
                                "flex flex-col items-center gap-4 p-8 border-2 transition-all rounded-[2rem]",
                                paymentMethod === 'CREDIT_CARD' ? "border-[#d4af37] bg-[#d4af37]/5" : "border-white/5 bg-white/[0.02] opacity-40 hover:opacity-100"
                              )}
                            >
                              <div className={cn("w-12 h-12 flex items-center justify-center rounded-full border", paymentMethod === 'CREDIT_CARD' ? "border-[#d4af37] text-[#d4af37]" : "border-white/10")}>
                                {paymentMethod === 'CREDIT_CARD' ? <CheckCircle2 size={24} /> : <div className="w-4 h-4 rounded-full bg-white/10" />}
                              </div>
                              <span className="text-xs font-bold uppercase tracking-widest">Cartão de Crédito</span>
                            </button>
                         </div>
                       </div>
                    </div>

                    <button 
                      onClick={handleCheckout}
                      disabled={verifying}
                      className="w-full py-7 bg-[#d4af37] text-black text-[12px] font-black uppercase tracking-[0.6em] rounded-3xl hover:bg-white hover:shadow-[0_0_50px_rgba(212,175,55,0.3)] transition-all disabled:opacity-50"
                    >
                      {verifying ? "Iniciando Protocolo..." : paymentMethod === 'PIX' ? "Gerar PIX de Liberação" : "Pagar com Cartão"}
                    </button>

                    <div className="flex items-center justify-center gap-6 opacity-20">
                       <img src="https://logopng.com.br/logos/pix-106.png" className="h-5" alt="PIX" />
                       <div className="w-px h-4 bg-white" />
                       <CreditCard size={20} />
                    </div>
                 </motion.div>
               ) : (
                 <motion.div 
                   key="pix-data"
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="bg-white/[0.03] border border-emerald-500/20 p-12 lg:p-20 rounded-[3rem] text-center space-y-12 shadow-2xl"
                 >
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3 text-emerald-400">
                           <Clock size={16} className="animate-pulse" />
                           <span className="text-[10px] font-black uppercase tracking-[0.4em]">Aguardando Pagamento</span>
                        </div>
                        <h3 className="text-3xl font-light text-white">Escaneie o QR Code</h3>
                    </div>

                    <div className="bg-white p-6 inline-block rounded-[2rem] shadow-[0_0_50px_rgba(255,255,255,0.1)] relative group">
                       <img 
                         src={pixData.pix_qrcode?.startsWith('data:') ? pixData.pix_qrcode : `data:image/png;base64,${pixData.pix_qrcode}`} 
                         alt="PIX QR Code" 
                         className="w-64 h-64 grayscale-0 transition-all group-hover:scale-105" 
                       />
                       <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-[2rem]" />
                    </div>

                    <div className="space-y-6">
                       <div className="flex flex-col gap-3">
                          <p className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Ou utilize o código Copia e Cola</p>
                          <button 
                            onClick={() => copyToClipboard(pixData.pix_qrcode_text || pixData.url)}
                            className="bg-white/5 border border-white/10 hover:border-[#d4af37]/40 py-4 px-6 rounded-xl flex items-center justify-between group transition-all"
                          >
                            <span className="text-[10px] text-white/40 truncate pr-6 max-w-[200px] font-mono">
                              {(pixData.pix_qrcode_text || pixData.url || '').substring(0, 40)}...
                            </span>
                            <div className="flex items-center gap-2 text-[#d4af37] text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                               {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                               {copied ? "Copiado!" : "Copiar"}
                            </div>
                          </button>
                       </div>

                       <div className="flex flex-col gap-3">
                          <a 
                            href={pixData.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-white/60 hover:text-white transition-colors flex items-center justify-center gap-2 group"
                          >
                             Pagar pelo Navegador <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          </a>
                          <button 
                            onClick={() => window.location.reload()}
                            className="text-[10px] text-[#d4af37] font-bold uppercase tracking-widest underline underline-offset-4 opacity-60 hover:opacity-100 transition-all"
                          >
                            Já realizei o pagamento
                          </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/5">
                       <div className="text-left space-y-2">
                          <p className="text-[8px] text-white/20 uppercase tracking-widest font-black">Status</p>
                          <div className="flex items-center gap-2 text-emerald-400">
                             <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                             <span className="text-[10px] font-bold uppercase tracking-widest">Processando</span>
                          </div>
                       </div>
                       <div className="text-right space-y-2">
                          <p className="text-[8px] text-white/20 uppercase tracking-widest font-black">Método</p>
                          <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest flex items-center justify-end gap-2">
                             PIX <ShieldCheck size={12} className="text-emerald-400/40" />
                          </p>
                       </div>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-white/5 py-20 text-center space-y-8">
        <div className="flex items-center justify-center gap-6 opacity-30">
          <img src="https://logopng.com.br/logos/asaas-6.png" className="h-4 grayscale invert" alt="Asaas" />
          <div className="h-4 w-px bg-white/20" />
          <span className="text-[9px] font-bold tracking-[0.5em] text-white uppercase italic">Carsena Securities</span>
        </div>
        <p className="text-white/10 text-[8px] tracking-[0.4em] uppercase font-medium">Platform Powered by Carsena Studio Logic</p>
      </footer>
    </div>
  );
};
