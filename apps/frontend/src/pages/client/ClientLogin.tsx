import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Sparkles, Camera } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";

export const ClientLogin = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginAsCustomer } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .schema('app_carsena')
        .from('customers')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (error || !data) {
        toast.error("Nenhuma reserva ou galeria encontrada para este e-mail.");
        return;
      }

      loginAsCustomer(data);
      toast.success(`Bem-vindo de volta, ${data.name.split(' ')[0]}!`);
      navigate("/cliente");
    } catch (err) {
      toast.error("Ocorreu um erro ao acessar o portal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-black text-white selection:bg-luxury-gold selection:text-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-luxury-gold/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-luxury-gold/5 rounded-full blur-[150px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center text-center space-y-12 bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-12 lg:p-16 shadow-2xl">
          
          <Link to="/" className="group flex flex-col items-center gap-4">
             <div className="w-16 h-16 bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:border-luxury-gold/50 group-hover:rotate-12">
                <Camera size={24} className="text-luxury-gold" />
             </div>
             <div className="space-y-1">
                <h1 className="text-xs font-black tracking-[0.5em] text-white/40 uppercase">Acesso à Experiência</h1>
                <h2 className="text-3xl font-editorial text-luxury-gold italic">Carsena</h2>
             </div>
          </Link>

          <div className="space-y-4 max-w-xs">
            <h3 className="text-xl font-editorial leading-tight">Suas memórias esperam por você.</h3>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] leading-relaxed">
              Digite o e-mail utilizado na reserva ou compra para acessar seus ingressos e galerias.
            </p>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-6">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-luxury-gold transition-colors" size={18} />
              <input 
                required
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-white/5 border border-white/10 py-5 pl-12 pr-4 outline-none focus:border-luxury-gold/50 transition-all text-sm font-light text-white tracking-wide placeholder:text-white/10"
              />
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="group w-full py-5 bg-white text-black font-black text-[10px] tracking-[0.4em] uppercase flex items-center justify-center gap-4 hover:bg-luxury-gold transition-all disabled:opacity-50 disabled:cursor-wait"
            >
              {loading ? "Sincronizando..." : (
                <>
                  Entrar no Portal
                  <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>

          <Link 
            to="/" 
            className="text-[9px] font-bold uppercase tracking-widest text-white/20 hover:text-white transition-colors"
          >
            Voltar para o Início
          </Link>
        </div>

        {/* Floating elements */}
        <div className="absolute -top-6 -right-6 w-12 h-12 border border-white/5 bg-white/[0.01] backdrop-blur-xl flex items-center justify-center animate-bounce duration-[3000ms]">
            <Sparkles size={16} className="text-luxury-gold/30" />
        </div>
      </motion.div>

      <footer className="mt-20 text-center relative z-10">
          <p className="text-[9px] font-medium tracking-[0.4em] text-white/10 uppercase">Carsena Photography Art • 2024</p>
      </footer>
    </div>
  );
};
