import { type FC, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { AuthInput } from "../../components/auth/AuthInput";
import { ShieldCheck, ArrowRight, Mail as MailIcon, Key, User, RefreshCw } from "lucide-react";
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
  const [view, setView] = useState<"login" | "request-code" | "signup">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

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
          if (!code) {
            toast.error("Por favor, digite seu código de acesso.");
            return;
          }

          const normalizedCode = code.toUpperCase().trim();

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
        // Login Admin
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: dbError } = await supabase
          .schema('app_carsena')
          .from('photographers')
          .insert({
            auth_id: authData.user.id,
            name,
            email,
            user_type: 'admin'
          });

        if (dbError) console.error("Erro ao criar perfil DB:", dbError);

        toast.success("Conta de gestor criada com sucesso!");
        setView("login");
      }
    } catch (err: any) {
      toast.error("Erro ao criar conta: " + err.message);
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
        <div className="flex bg-white/5 p-1 rounded-none border border-white/10">
          <button
            onClick={() => { setMode("client"); setView("login"); }}
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

        {mode === "client" ? (
          view === "login" ? (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                <AuthInput label="E-mail" type="email" name="client-email" placeholder="seu@email.com" id="client-email" required />
              ) : (
                <AuthInput label="Código de acesso" type="text" name="access-code" placeholder="Ex: JULIA2026" id="access-code" required 
                  className="text-center tracking-[0.2em] font-bold uppercase placeholder:tracking-normal placeholder:font-normal placeholder:text-[10px]" />
              )}

              <button type="submit" disabled={loading}
                className={cn(
                  "w-full bg-luxury-gold text-luxury-black py-6 text-[11px] font-bold uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-3",
                  loading && "opacity-80 pointer-events-none"
                )}
              >
                {loading ? <RefreshCw className="animate-spin" size={14} /> : <>Acessar meu Portal <ArrowRight size={14} /></>}
              </button>

              {clientAccessMode === "code" && (
                <div className="text-center pt-4">
                  <button type="button" onClick={() => setView("request-code")}
                    className="text-[10px] text-white/30 hover:text-luxury-gold transition-colors font-medium uppercase tracking-[0.1em] underline underline-offset-4"
                  >
                    Esqueci ou não tenho um código
                  </button>
                </div>
              )}
            </form>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AuthInput label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" id="request-email" required />
              <div className="flex flex-col gap-4">
                <button type="button" onClick={handleRequestCode} disabled={loading || !email}
                  className={cn(
                    "w-full bg-luxury-gold text-luxury-black py-5 text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-3",
                    (loading || !email) && "opacity-80 pointer-events-none"
                  )}
                >
                  {loading ? "Enviando..." : "Enviar Código"}
                </button>
                <button type="button" onClick={() => setView("login")}
                  className="text-[10px] text-white/40 hover:text-white transition-colors font-medium tracking-wide uppercase"
                >
                  Voltar para o Login
                </button>
              </div>
            </div>
          )
        ) : (
          view === "login" ? (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AuthInput label="E-mail" type="email" name="email" placeholder="seu@contato.com" id="email" required autoComplete="email" />
              <AuthInput label="Senha" type="password" name="password" placeholder="••••••••" id="password" required autoComplete="current-password" />
              <button type="submit" disabled={loading}
                className={cn(
                  "w-full bg-luxury-gold text-luxury-black py-5 text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-3",
                  loading && "opacity-80 pointer-events-none"
                )}
              >
                {loading ? <RefreshCw className="animate-spin" size={14} /> : "Entrar no Painel"}
              </button>
              <div className="text-center pt-2">
                <button type="button" onClick={() => setView('signup')}
                  className="text-[10px] text-luxury-gold/60 hover:text-luxury-gold transition-colors font-bold uppercase tracking-widest"
                >
                  Novo por aqui? Criar meu Estúdio
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AuthInput label="Nome do Gestor / Empresa" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Carsena Fotografia" id="signup-name" required />
              <AuthInput label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@contato.com" id="signup-email" required />
              <AuthInput label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" id="signup-password" required />
              <button type="submit" disabled={loading}
                className={cn(
                  "w-full bg-luxury-gold text-luxury-black py-5 text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-3",
                  loading && "opacity-80 pointer-events-none"
                )}
              >
                {loading ? <RefreshCw className="animate-spin" size={14} /> : "Criar meu Estúdio Profissional"}
              </button>
              <div className="text-center">
                <button type="button" onClick={() => setView('login')} className="text-[10px] text-white/30 hover:text-white transition-colors uppercase tracking-widest">
                  Voltar para o Login
                </button>
              </div>
            </form>
          )
        )}

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
