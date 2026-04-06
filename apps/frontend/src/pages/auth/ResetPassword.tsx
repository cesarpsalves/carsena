import { type FC, useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { AuthInput } from "../../components/auth/AuthInput";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export const ResetPassword: FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) throw error;
      setSuccess(true);
    } catch (error: any) {
      console.error("Reset password error:", error);
      alert(error.message || "Erro ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Senha Alterada" subtitle="Sua nova senha foi salva com sucesso.">
        <div className="space-y-8 text-center animate-fade-in">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-luxury-gold text-luxury-black rounded-full flex items-center justify-center">
              <CheckCircle2 size={40} />
            </div>
          </div>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
            Sua conta está protegida. Agora você pode acessar sua área exclusiva.
          </p>
          <div className="pt-4">
            <Link 
              to="/login" 
              className="bg-luxury-gold text-luxury-black px-12 py-5 text-[10px] font-bold uppercase tracking-[0.4em] inline-block shadow-2xl hover:scale-105 transition-transform"
            >
              Acessar Agora
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Nova Senha" 
      subtitle="Defina uma senha forte para proteger seu acesso."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthInput
          label="Nova Senha"
          type="password"
          placeholder="••••••••"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <AuthInput
          label="Confirmar Senha"
          type="password"
          placeholder="••••••••"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full bg-luxury-gold text-luxury-black py-5 text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-100 transition-all",
            loading && "opacity-80 pointer-events-none"
          )}
        >
          {loading ? "Processando..." : "Alterar Senha"}
        </button>

        <div className="text-center">
          <Link 
            to="/login" 
            className="text-[10px] text-white/40 hover:text-white transition-colors font-bold uppercase tracking-[0.2em]"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
