import { type FC, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { AuthInput } from "../../components/auth/AuthInput";
import { Camera, ShieldCheck, ArrowRight, Mail as MailIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { sendAccessCodeEmail } from "@/lib/resend";
import { toast } from "sonner";

type AuthMode = "client" | "admin";

export const Login: FC = () => {
  const navigate = useNavigate();
  const { loginAsCustomer } = useAuth();
  const [mode, setMode] = useState<AuthMode>("client");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"login" | "request-code">("login");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const code = formData.get("access-code") as string;
    const adminEmail = formData.get("email") as string;
    const adminPassword = formData.get("password") as string;

    try {
      if (mode === "client") {
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
          // Login como cliente da galeria se existir
          if (gallery.customers) {
            loginAsCustomer(gallery.customers);
          }
          
          toast.info(`Galeria "${gallery.title || 'Exclusiva'}" acessada.`);
          navigate(`/cliente/galeria/${gallery.id}`);
          return;
        }

        // 3. Nenhum dos dois funcionou
        toast.error("Código de acesso inválido ou expirado.");
        return;
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
    } catch (err) {
      toast.error("Ocorreu um erro ao realizar o login.");
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
        .eq('email', email)
        .single();

      if (error || !data) {
        toast.error("E-mail não cadastrado em nosso sistema.");
        return;
      }

      if (!data.access_code) {
        toast.error("Poxa, parece que você ainda não tem um código. Fale conosco.");
        return;
      }

      // Envia e-mail via Resend
      const sent = await sendAccessCodeEmail(email, data.name, data.access_code);
      
      if (sent) {
        toast.success("Código enviado com sucesso para seu e-mail!");
        setView("login");
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
      title={mode === "client" ? "Suas Memórias" : "Dashboard"} 
      subtitle={mode === "client" ? "Acesse sua galeria exclusiva e álbuns particulares." : "Ambiente profissional para gestão de eventos e galerias."}
    >
      <div className="space-y-8">
        {/* Back to Site removed as it's already in AuthLayout */}


        {/* Role Selector */}
        <div className="flex bg-white/5 p-1 rounded-none border border-white/10">
          <button
            onClick={() => setMode("client")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all",
              mode === "client" ? "bg-luxury-gold text-luxury-black" : "text-white/40 hover:text-white"
            )}
          >
            <Camera size={14} />
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
              <>
                {/* Client Area - Access Code Flow */}
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <AuthInput
                    label="Código de acesso"
                    type="text"
                    name="access-code"
                    placeholder="Ex: JULIA2026"
                    id="access-code"
                    required
                    className="text-center tracking-[0.2em] font-bold uppercase placeholder:tracking-normal placeholder:font-normal placeholder:text-[10px]"
                  />

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
                        Localizando Galeria...
                      </span>
                    ) : (
                      <>
                        Acessar minha Galeria
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>

                  <div className="space-y-4 text-center">
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">
                      Ou acesse diretamente pelo link enviado
                    </p>
                    <button 
                      type="button"
                      onClick={() => setView("request-code")}
                      className="text-[10px] text-luxury-gold hover:text-white transition-colors font-bold uppercase tracking-[0.1em] underline underline-offset-4"
                    >
                      Receber acesso por e-mail
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Request Code Form */}
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2 text-center mb-4">
                    <p className="text-[11px] text-white/60 font-light leading-relaxed">
                      Informe o e-mail cadastrado no momento da reserva para recuperarmos seu código.
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
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 border-2 border-luxury-black/30 border-t-luxury-black rounded-full animate-spin" />
                          Enviando...
                        </span>
                      ) : (
                        <>
                          Enviar Código <MailIcon size={14} />
                        </>
                      )}
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
              </>
            )
          ) : (
            <>
              {/* Admin / Gestão - Traditional Flow */}
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <AuthInput
                    label="E-mail"
                    type="email"
                    name="email"
                    placeholder="exemplo@email.com"
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
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-luxury-black/30 border-t-luxury-black rounded-full animate-spin" />
                      Validando...
                    </span>
                  ) : (
                    <>
                      Entrar no Sistema
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>

        {/* Support Link */}
        <div className="pt-4 border-t border-white/5 text-center">
          <p className="text-[11px] text-white/30 font-light tracking-wide">
            Não tem seu acesso? 
            <a href="mailto:carsena2007@gmail.com" className="ml-2 text-luxury-gold hover:text-white transition-colors font-medium">
              Fale conosco
            </a>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
