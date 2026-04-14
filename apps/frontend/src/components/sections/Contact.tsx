import { useState } from "react";
import { Send, Phone, Mail, CheckCircle2, Loader2 } from "lucide-react";

interface ContactProps {
  title?: string;
  subtitle?: string;
  data?: {
    email: string;
    phone: string;
    address: string;
  };
}

export const Contact = ({ title, subtitle, data }: ContactProps) => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    // Gerar o link do WhatsApp com os dados do formulário
    const whatsappMessage = `Olá Alexandre! Gostaria de saber mais sobre seu trabalho. Vi seu portfólio no site e fiquei interessado(a).\n\nMeu nome é *${formData.name}*.\n\n*Minha mensagem:* ${formData.message}`;
    const whatsappUrl = `https://wa.me/5581988657659?text=${encodeURIComponent(whatsappMessage)}`;

    // Abre o WhatsApp em uma nova aba
    window.open(whatsappUrl, '_blank');

    try {
      // Tenta enviar o e-mail em segundo plano
      const response = await fetch(`${import.meta.env.VITE_API_URL}/emails/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // Mesmo que o e-mail falhe, já abrimos o WhatsApp, então mostramos sucesso
      setStatus('success');
      setTimeout(() => setStatus('idle'), 10000);
    } catch (error) {
      console.error('Erro ao enviar e-mail de backup:', error);
      // Se falhar o e-mail, ainda mostramos sucesso pois o WhatsApp já foi aberto
      setStatus('success');
      setTimeout(() => setStatus('idle'), 10000);
    }
  };

  return (
    <section id="contato" className="section-padding bg-luxury-cream overflow-hidden">
      <div className="container-premium lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          <div className="space-y-8 md:space-y-12">
            <div className="space-y-4 md:space-y-6">
              <p className="text-luxury-gold font-bold text-[9px] md:text-[10px] uppercase tracking-[0.4em]">Contato</p>
              <h2 className="text-editorial text-4xl sm:text-5xl md:text-7xl">
                {title || <>Reserve sua <br className="hidden sm:block" />Experiência</>}
              </h2>
              <p className="text-luxury-black/60 font-sans leading-relaxed max-w-sm text-sm md:text-base">
                {subtitle || "Estamos prontos para ouvir sua história e transformá-la em arte visual. Entre em contato para agendar uma reunião pessoal."}
              </p>
            </div>

            <div className="space-y-6 md:space-y-8">
              <div className="flex items-center gap-4 md:gap-6 group">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-luxury-black flex items-center justify-center text-luxury-gold group-hover:bg-luxury-gold group-hover:text-luxury-black transition-all duration-300">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold/60">Telefone</p>
                  <p className="font-serif text-base md:text-lg">{data?.phone || "+55 (11) 99999-9999"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 md:gap-6 group">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-luxury-black flex items-center justify-center text-luxury-gold group-hover:bg-luxury-gold group-hover:text-luxury-black transition-all duration-300">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold/60">E-mail</p>
                  <p className="font-serif text-base md:text-lg">{data?.email || "contato@carsena.com.br"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-8 lg:mt-0">
            <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 shadow-2xl space-y-6 md:space-y-8 relative z-10 w-full">
              {status === 'success' ? (
                <div className="py-8 md:py-12 text-center space-y-6 animate-in fade-in zoom-in duration-700">
                  <div className="flex justify-center text-luxury-gold relative">
                    <div className="absolute inset-0 bg-luxury-gold/20 blur-2xl rounded-full scale-150 animate-pulse" />
                    <CheckCircle2 size={80} className="relative z-10" />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <h3 className="text-editorial text-3xl md:text-4xl text-luxury-black">Atendimento Iniciado!</h3>
                    <p className="text-luxury-black/70 font-sans text-sm md:text-base px-4">
                      Seu WhatsApp deve ter aberto automaticamente. Caso não tenha aberto, clique no botão abaixo para falar agora:
                    </p>
                  </div>
                  
                  <div className="bg-luxury-black/5 p-6 rounded-2xl border border-luxury-gold/20 space-y-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-luxury-gold">Atendimento Prioritário</p>
                    <p className="text-xs text-luxury-black/60">Para uma resposta imediata e agendamento rápido, clique no botão abaixo:</p>
                    
                    <a 
                      href={`https://wa.me/5581988657659?text=${encodeURIComponent(`Olá Alexandre! Gostaria de saber mais sobre seu trabalho. Vi seu portfólio no site e fiquei interessado(a).\n\nMeu nome é *${formData.name}*.\n\n*Minha mensagem:* ${formData.message}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-luxury-black text-luxury-gold font-bold text-[11px] uppercase tracking-[0.3em] py-5 rounded-lg hover:bg-luxury-gold hover:text-luxury-black transition-all duration-500 flex items-center justify-center gap-3 shadow-xl group"
                    >
                      <span>Concluir via WhatsApp</span>
                      <Phone size={16} className="group-hover:rotate-12 transition-transform" />
                    </a>
                  </div>

                  <button 
                    onClick={() => {
                        setStatus('idle');
                        setFormData({ name: '', email: '', message: '' });
                    }}
                    className="text-[9px] uppercase tracking-widest text-luxury-black/40 hover:text-luxury-gold transition-colors"
                  >
                    Voltar ao formulário
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-luxury-black/40">Seu Nome</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border-b border-luxury-black/10 py-3 focus:border-luxury-gold outline-none transition-colors font-serif text-lg md:text-xl" 
                      placeholder="Como deseja ser chamado(a)?" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-luxury-black/40">Sua Mensagem</label>
                    <textarea 
                      required
                      rows={3} 
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      className="w-full border-b border-luxury-black/10 py-3 focus:border-luxury-gold outline-none transition-colors font-serif text-lg md:text-xl resize-none" 
                      placeholder="Conte um pouco sobre seu evento ou projeto..." 
                    />
                  </div>
                  
                  <button 
                    disabled={status === 'loading'}
                    type="submit" 
                    className="w-full bg-luxury-black text-luxury-gold font-bold text-[10px] md:text-[11px] uppercase tracking-[0.3em] py-5 md:py-6 hover:bg-luxury-gold hover:text-luxury-black disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-4 shadow-xl group"
                  >
                    {status === 'loading' ? (
                      <>Processando... <Loader2 className="animate-spin" size={16} /></>
                    ) : (
                      <>Iniciar Atendimento VIP <Phone size={16} className="group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </button>
                  {status === 'error' && (
                    <p className="text-red-500 text-[10px] text-center uppercase tracking-widest">Ocorreu um erro ao conectar. Tente novamente.</p>
                  )}
                </>
              )}
            </form>
            
            <div className="absolute -bottom-8 -right-8 md:-bottom-16 md:-right-16 w-32 h-32 md:w-64 md:h-64 border-[20px] md:border-[40px] border-luxury-gold opacity-10 -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};
