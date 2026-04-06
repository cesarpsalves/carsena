import { useState, useEffect, type ReactNode, type FC } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, User, Menu, X, Home, Camera, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientLayoutProps {
  children: ReactNode;
}

export const ClientLayout: FC<ClientLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const handleLogout = () => {
    setIsMenuOpen(false);
    navigate("/login");
  };

  const navItems = [
    { name: "Início", path: "/cliente", icon: <Home size={24} /> },
    { name: "Minhas Experiências", path: "/cliente", icon: <Camera size={24} /> },
    { name: "Meus Ingressos", path: "/cliente", icon: <Ticket size={24} /> },
  ];

  return (
    <div className="min-h-screen bg-luxury-black text-luxury-cream selection:bg-luxury-gold selection:text-luxury-black font-sans">
      {/* Client Header */}
      <header className="border-b border-luxury-cream/5 bg-luxury-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container-premium flex h-20 items-center justify-between px-6 lg:px-12">
          <Link 
            to="/cliente" 
            onClick={() => setIsMenuOpen(false)}
            className="font-serif text-xl font-bold tracking-[0.2em] uppercase"
          >
            Carsena <span className="text-[10px] text-luxury-gold block -mt-1 tracking-[0.4em] font-sans">Experiences</span>
          </Link>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6">
              <button className="text-luxury-cream/60 hover:text-luxury-gold transition-colors">
                <User size={20} />
              </button>
              <button 
                onClick={handleLogout}
                className="text-luxury-cream/60 hover:text-red-400 transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
              >
                <LogOut size={16} />
                <span>Sair</span>
              </button>
            </div>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden flex items-center justify-center w-12 h-12 text-luxury-cream -mr-3"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay (Standardized with Landing Page) */}
      <div 
        className={cn(
          "fixed inset-0 z-[100] bg-black transition-all duration-500 md:hidden",
          isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
      >
        <div className="flex h-20 items-center justify-between px-6">
          <Link 
            to="/cliente" 
            onClick={() => setIsMenuOpen(false)}
            className="font-serif text-xl font-bold tracking-[0.2em] uppercase text-white"
          >
            Carsena <span className="text-[10px] text-luxury-gold block -mt-1 tracking-[0.4em] font-sans">Experiences</span>
          </Link>
          <button 
            className="flex items-center justify-center w-12 h-12 text-white -mr-3"
            onClick={() => setIsMenuOpen(false)}
          >
            <X size={28} />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-80px)] px-6 overflow-y-auto">
          <div className="flex flex-col items-center justify-center min-h-full gap-10 py-10">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "font-serif text-3xl tracking-tight transition-all duration-300 text-white/90 text-center flex flex-col items-center gap-2",
                  pathname === item.path ? "text-luxury-gold" : "hover:text-luxury-gold"
                )}
              >
                <span className="opacity-20">{item.icon}</span>
                {item.name}
              </Link>
            ))}
            
            <div className="w-full max-w-[280px] h-px bg-white/10 my-4" />

            <button 
              onClick={handleLogout}
              className="flex flex-col items-center gap-2 text-red-500/60 font-serif text-2xl italic tracking-wide"
            >
              <LogOut size={24} className="opacity-40" />
              Sair da conta
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-10">
        {children}
      </main>
    </div>
  );
};
