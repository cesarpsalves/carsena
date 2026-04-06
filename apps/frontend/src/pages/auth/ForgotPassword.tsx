import { type FC, useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { AuthInput } from "../../components/auth/AuthInput";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const ForgotPassword: FC = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Usando o endpoint de backend customizado para disparar o e-mail premium
      // O backend /api/auth/forgot-password gera o link via Supabase e envia via Resend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) throw new Error("Falha ao enviar e-mail");

      setSent(true);
    } catch (error) {
      console.error("Forgot password error:", error);
      alert("Ocorreu um erro ao processar sua solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="E-mail Enviado" subtitle="Verifique sua caixa de entrada para continuar.">
        <div className="space-y-8 text-center animate-fade-in">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-luxury-gold/10 rounded-full flex items-center justify-center text-luxury-gold animate-pulse-slow">
              <CheckCircle2 size={40} />
            </div>
          </div>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
            Enviamos instruções de recuperação para o seu endereço de e-mail cadastrado.
          </p>
          <div className="pt-4">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-luxury-gold hover:text-white transition-colors text-[10px] font-bold uppercase tracking-[0.2em]"
            >
              Voltar ao Login
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Recuperação" 
      subtitle="Informe seu e-mail para receber as instruções de Redefinição."
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <AuthInput
          label="E-mail de Cadastro"
          type="email"
          placeholder="exemplo@email.com"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full bg-luxury-gold text-luxury-black py-5 text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-3",
            loading && "opacity-80 pointer-events-none"
          )}
        >
          {loading ? "Enviando..." : "Enviar Instruções"}
        </button>

        <div className="text-center">
          <Link 
            to="/login" 
            className="text-[10px] text-white/40 hover:text-white transition-colors font-bold uppercase tracking-[0.2em]"
          >
            Lembrou a senha? Voltar ao Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
