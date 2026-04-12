import { useState, useEffect, type ReactNode, type FC } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Camera, Share2, Mail } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { cmsService } from "@/lib/cms";
import type { LandingSettings } from "@/lib/cms";

interface PublicLayoutProps {
  children: ReactNode;
}

export const PublicLayout: FC<PublicLayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [enabledSections, setEnabledSections] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    async function loadData() {
      try {
        // Set dynamic document title for better SEO context
        if (pathname === '/') {
          document.title = "Carsena | Fotografia Editorial e de Luxo";
        } else if (pathname.includes('portfolio')) {
          document.title = "Portfólio | Carsena Photo";
        } else if (pathname.includes('login')) {
          document.title = "Acesso Cliente | Carsena";
        }

        const [sections, settingsData] = await Promise.all([
          cmsService.getSections(),
          cmsService.getSettings()
        ]);
        
        const enabledMap = sections.reduce((acc: Record<string, boolean>, section: any) => ({
          ...acc,
          [section.section_key]: section.enabled
        }), {} as Record<string, boolean>);
        
        setEnabledSections(enabledMap);
        setSettings(settingsData);
      } catch (error) {
        console.error("Error loading layout data:", error);
      }
    }
    loadData();
  }, []);

  // Prevent background scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = "https://carsena.com.br";
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link de acesso copiado!", {
        description: "Agora você pode compartilhar com seus amigos."
      });
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast.error("Não foi possível copiar o link.");
    });
  };

  const navItems = [
    { name: "Início", path: "/", key: "hero" },
    { name: "Portfólio", path: "/#portfolio", key: "portfolio" },
    { name: "Eventos", path: "/#bilheteria", key: "events" },
    { name: "Serviços", path: "/#servicos", key: "services" },
    { name: "Contato", path: "/#contato", key: "contact" },
    { name: "Acesso Cliente", path: "/login", isLogin: true },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (item.isLogin) return true;
    if (item.path === "/") return true; // Home sempre visível
    return enabledSections[item.key as string] === true; // Só mostra se estiver explicitamente habilitado no CMS
  });

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-accent selection:text-foreground">
      {/* Header */}
      <header className="glass fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="container-premium flex h-20 items-center justify-between px-6 lg:px-12">
          <Link 
            to="/" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="font-serif text-2xl font-bold tracking-[0.2em] uppercase"
          >
            Carsena
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            {visibleNavItems.filter(i => !i.isLogin).map((item) => (
              <a
                key={item.name}
                href={item.path}
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors hover:text-accent",
                  pathname === item.path ? "text-accent" : "text-foreground/60"
                )}
              >
                {item.name}
              </a>
            ))}
            <Link 
              to="/login"
              className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 border border-border hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <Camera size={14} className="group-hover:text-accent transition-colors" />
              Entrar
            </Link>
            <a 
              href="#contato" 
              className="bg-primary text-primary-foreground px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-accent transition-all hover:-translate-y-0.5 shadow-sm"
            >
              Agendar
            </a>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden flex items-center justify-center w-12 h-12 text-foreground -mr-3"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {/* Mobile Nav - Moved outside to avoid inheritance from header glass effect */}
      <div 
        className={cn(
          "fixed inset-0 z-[100] bg-black transition-opacity duration-300 md:hidden",
          isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
      >
        {/* Mobile Menu Header - Ensures close button is always reachable */}
        <div className="flex h-20 items-center justify-between px-6">
          <Link 
            to="/" 
            onClick={() => setIsMenuOpen(false)}
            className="font-serif text-2xl font-bold tracking-[0.2em] uppercase text-white"
          >
            Carsena
          </Link>
          <button 
            className="flex items-center justify-center w-12 h-12 text-white -mr-3"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={28} />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-80px)] px-6 overscroll-contain overflow-y-auto">
          <div className="flex flex-col items-center justify-center min-h-full gap-8 py-10">
            {visibleNavItems.map((item) => (
              <a
                key={item.name}
                href={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "font-serif text-3xl tracking-tight transition-all duration-300 text-white/90 text-center",
                  item.isLogin ? "text-luxury-gold border-b border-luxury-gold/20 pb-2 flex items-center gap-4" : "hover:text-luxury-gold"
                )}
              >
                {item.isLogin && <Camera size={24} />}
                {item.name}
              </a>
            ))}
            <a 
              href="#contato"
              onClick={() => setIsMenuOpen(false)}
              className="mt-4 bg-luxury-gold text-luxury-black w-full max-w-[280px] py-6 text-center text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl hover:scale-105 transition-transform"
            >
              Solicitar Orçamento
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-20 px-6 mt-auto border-t border-white/5">
        <div className="container-premium grid grid-cols-1 md:grid-cols-12 gap-12 lg:px-12">
          <div className="md:col-span-4 flex flex-col gap-6">
            <h2 className="font-serif text-3xl tracking-tight">Carsena Photo</h2>
            <p className="text-primary-foreground/60 text-sm max-w-xs italic leading-relaxed">
              {settings?.footer_text || "Capturando a essência de momentos únicos com um olhar editorial e sensível. Premium photography for timeless memories."}
            </p>
          </div>
          
          <div className="md:col-span-4 flex flex-col gap-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Navegação</h3>
            <ul className="flex flex-col gap-3">
              {visibleNavItems.map(item => (
                <li key={item.name}>
                  <a href={item.path} className="text-xs text-primary-foreground/60 hover:text-accent transition-colors">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
 
          <div className="md:col-span-4 flex flex-col gap-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Siga-nos</h3>
            <div className="flex gap-6">
              <a 
                href={`https://www.instagram.com/${settings?.instagram_username?.replace('@', '') || 'carsena_fotografo'}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-accent transition-all hover:scale-110"
              >
                <Camera size={22} />
              </a>
              <button 
                onClick={handleShare}
                className="hover:text-accent transition-all hover:scale-110 cursor-pointer"
                title="Compartilhar site"
              >
                <Share2 size={22} />
              </button>
              <a 
                href={`mailto:${settings?.contact_email || 'contato@carsena.com.br'}`} 
                className="hover:text-accent transition-all hover:scale-110"
              >
                <Mail size={22} />
              </a>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-primary-foreground/40 font-bold uppercase tracking-widest">Localização</p>
              <p className="text-[10px] text-primary-foreground/60">{settings?.whatsapp_number && 'Recife, Pernambuco - Brasil'}</p>
            </div>
            <p className="text-[10px] text-primary-foreground/20 mt-auto pt-8">
              © {new Date().getFullYear()} Carsena Photo. Premium Photography System.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
