import { type FC, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { AuthInput } from "../../components/auth/AuthInput";
import { Camera, ShieldCheck, ArrowRight, Mail as MailIcon, Key, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { sendAccessCodeEmail } from "@/lib/resend";
import { toast } from "sonner";

type AuthMode = "client" | "admin";
type ClientAccessMode = "email" | "code";

export const Login: FC = () => {
  const navigate = useNavigate();
  const { loginAsCustomer } = useAuth();
  const [mode, setMode] = useState<AuthMode>("client");
  const [clientAccessMode, setClientAccessMode] = useState<ClientAccessMode>("email");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"login" | "request-code">("login");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const code = formData.get("access-code") as string;
    const clientEmail = formData.get("client-email") as string;
    const adminEmail = formData.get("email") as string;
    const adminPassword = formData.get("password") as string;

    try {
      if (mode === "client") {
        if (clientAccessMode === "email") {
          if (!clientEmail) {
            toast.error("Por favor, digite seu e-mail.");
            return;
          }

          // Busca cliente pelo e-mail (Login Unificado para Tickets e Galerias)
          const { data: customer, error } = await supabase
            .schema('app_carsena')
            .from('customers')
            .select('*')
            .eq('email', clientEmail.trim().toLowerCase())
            .maybeSingle();

          if (error) throw error;

          if (customer) {
            loginAsCustomer(customer);
            toast.success(`Bem-vindo, ${customer.name.split(' ')[0]}!`);
            navigate('/cliente');
            return;
          }

          toast.error("E-mail não encontrado. Verifique se é o mesmo e-mail da sua reserva ou compra.");
          return;
        } else {
          // Acesso via Código (Legacy/Quick access)
          if (!code) {
            toast.error("Por favor, digite seu código de acesso.");
            return;
          }

          const normalizedCode = code.toUpperCase().trim();

          // 1. Busca cliente pelo código de acesso
          const { data: customer } = await supabase
            .schema('app_carsena')
            .from('customers')
            .select('*')
            .eq('access_code', normalizedCode)
            .maybeSingle();

          if (customer) {
            loginAsCustomer(customer);
            toast.success(`Olá ${customer.name.split(' ')[0]}, seu portal está pronto.`);
            navigate('/cliente');
            return;
          }

          // 2. Busca galeria com acesso direto pelo código
          const { data: gallery } = await supabase
            .schema('app_carsena')
            .from('galleries')
            .select('*, customers(*)')
            .eq('access_code', normalizedCode)
            .maybeSingle();

          if (gallery) {
            if (gallery.customers) {
              loginAsCustomer(gallery.customers);
            }
            toast.info(`Galeria "${gallery.title || 'Exclusiva'}" acessada.`);
            navigate(`/cliente/galeria/${gallery.id}`);
            return;
          }

          toast.error("Código de acesso inválido ou expirado.");
        }
      } else {
        // Login Admin Real via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword,
        });

        if (authError) {
          toast.error(authError.message === "Invalid login credentials" 
            ? "E-mail ou senha inválidos." 
            : authError.message
          );
          return;
        }

        if (authData.user) {
          toast.success("Acesso administrativo autorizado!");
          navigate("/admin");
        }
      }
    } catch (err: any) {
      toast.error("Ocorreu um erro ao realizar o login: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .schema('app_carsena')
        .from('customers')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (error || !data) {
        toast.error("E-mail não cadastrado em nosso sistema.");
        return;
      }

      if (!data.access_code) {
        toast.error("Poxa, parece que você ainda não tem um código. Fale conosco.");
        return;
      }

      const sent = await sendAccessCodeEmail(email, data.name, data.access_code);
      
      if (sent) {
        toast.success("Código enviado com sucesso para seu e-mail!");
        setView("login");
        setClientAccessMode("code");
      } else {
        toast.error("Erro ao enviar o e-mail. Tente novamente mais tarde.");
      }
    } catch (err) {
      toast.error("Erro na comunicação com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={mode === "client" ? "Seu Portal" : "Gestão Carsena"} 
      subtitle={mode === "client" ? "Acesse todas as suas fotos, ingressos e memórias em um só lugar." : "Ambiente profissional para gestão da plataforma."}
    >
      <div className="space-y-8">
        {/* Role Selector */}
        <div className="flex bg-white/5 p-1 rounded-none border border-white/10">
          <button
            onClick={() => {
              setMode("client");
              setView("login");
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all",
              mode === "client" ? "bg-luxury-gold text-luxury-black" : "text-white/40 hover:text-white"
            )}
          >
            <User size={14} />
            Área do Cliente
          </button>
          <button
            onClick={() => setMode("admin")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all",
              mode === "admin" ? "bg-luxury-gold text-luxury-black" : "text-white/40 hover:text-white"
            )}
          >
            <ShieldCheck size={14} />
            Gestão / Admin
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === "client" ? (
            view === "login" ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Mode Selector within Client Area */}
                <div className="flex items-center justify-center gap-6 mb-8 border-b border-white/5 pb-6">
                  <button
                    type="button"
                    onClick={() => setClientAccessMode("email")}
                    className={cn(
                      "text-[9px] uppercase tracking-widest font-bold transition-all flex items-center gap-2",
                      clientAccessMode === "email" ? "text-luxury-gold" : "text-white/30 hover:text-white"
                    )}
                  >
                    <MailIcon size={12} />
                    Entrar com E-mail
                  </button>
                  <div className="w-1 h-1 bg-white/10 rounded-full" />
                  <button
                    type="button"
                    onClick={() => setClientAccessMode("code")}
                    className={cn(
                      "text-[9px] uppercase tracking-widest font-bold transition-all flex items-center gap-2",
                      clientAccessMode === "code" ? "text-luxury-gold" : "text-white/30 hover:text-white"
                    )}
                  >
                    <Key size={12} />
                    Possuo um Código
                  </button>
                </div>

                {clientAccessMode === "email" ? (
                  <AuthInput
                    label="E-mail"
                    type="email"
                    name="client-email"
                    placeholder="seu@email.com"
                    id="client-email"
                    required
                  />
                ) : (
                  <AuthInput
                    label="Código de acesso"
                    type="text"
                    name="access-code"
                    placeholder="Ex: JULIA2026"
                    id="access-code"
                    required
                    className="text-center tracking-[0.2em] font-bold uppercase placeholder:tracking-normal placeholder:font-normal placeholder:text-[10px]"
                  />
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "w-full bg-luxury-gold text-luxury-black py-6 text-[11px] font-bold uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-3",
                    loading && "opacity-80 pointer-events-none"
                  )}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-luxury-black/30 border-t-luxury-black rounded-full animate-spin" />
                      Sincronizando...
                    </span>
                  ) : (
                    <>
                      Acessar meu Portal
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

                {clientAccessMode === "code" && (
                  <div className="text-center pt-4">
                    <button 
                      type="button"
                      onClick={() => setView("request-code")}
                      className="text-[10px] text-white/30 hover:text-luxury-gold transition-colors font-medium uppercase tracking-[0.1em] underline underline-offset-4"
                    >
                      Esqueci ou não tenho um código
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2 text-center mb-4">
                  <p className="text-[11px] text-white/60 font-light leading-relaxed">
                    Recupere seu código de acesso usando o e-mail cadastrado.
                  </p>
                </div>
                
                <AuthInput
                  label="E-mail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  id="request-email"
                  required
                />

                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={handleRequestCode}
                    disabled={loading || !email}
                    className={cn(
                      "w-full bg-luxury-gold text-luxury-black py-5 text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-3",
                      (loading || !email) && "opacity-80 pointer-events-none"
                    )}
                  >
                    {loading ? "Enviando..." : "Enviar Código"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="text-[10px] text-white/40 hover:text-white transition-colors font-medium tracking-wide uppercase"
                  >
                    Voltar para o Login
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AuthInput
                label="E-mail"
                type="email"
                name="email"
                placeholder="gestor@carsena.com.br"
                id="email"
                required
                autoComplete="email"
              />
              
              <div className="space-y-1">
                <AuthInput
                  label="Senha"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  id="password"
                  required
                  autoComplete="current-password"
                />
                <div className="flex justify-end">
                  <Link 
                    to="/forgot-password" 
                    className="text-[10px] text-white/40 hover:text-luxury-gold transition-colors font-medium tracking-wide"
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full bg-luxury-gold text-luxury-black py-5 text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-3",
                  loading && "opacity-80 pointer-events-none"
                )}
              >
                {loading ? "Autenticando..." : "Entrar no Painel"}
              </button>
            </div>
          )}
        </form>

        {/* Support Link */}
        <div className="pt-4 border-t border-white/5 text-center">
          <p className="text-[11px] text-white/30 font-light tracking-wide leading-relaxed">
            Dificuldades no acesso? <br/>
            <a href="mailto:carsena2007@gmail.com" className="text-luxury-gold hover:text-white transition-colors font-medium">
              carsena2007@gmail.com
            </a>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
