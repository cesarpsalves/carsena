import { type FC, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  Camera, 
  Ticket,
  Maximize, 
  Layout, 
  Wallet, 
  Cloud, 
  Settings, 
  LogOut,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: <Home size={24} />, label: "Escritório", path: "/admin", description: "Visão Geral" },
  { icon: <Camera size={24} />, label: "Estúdio", path: "/admin/estudio", description: "Fotos & Clientes" },
  { icon: <Ticket size={24} />, label: "Bilheteria", path: "/admin/bilheteria", description: "Ingressos & Eventos" },
  { icon: <Maximize size={24} />, label: "Portaria", path: "/admin/validar", description: "Validar Ingresso" },
  { icon: <Layout size={24} />, label: "Vitrine", path: "/admin/vitrine", description: "Editar Meu Site" },
  { icon: <Wallet size={24} />, label: "Caixa", path: "/admin/caixa", description: "Financeiro" },
  { icon: <Settings size={24} />, label: "Ajustes", path: "/admin/ajustes", description: "Configurações" },
];

const StorageUsage = () => {
  const [stats, setStats] = useState<any>(null);
  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  useEffect(() => {
    fetch(`${apiBaseUrl}/storage/stats`)
      .then(res => res.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats) return null;

  const percentage = Math.min((stats.totalSizeGB / stats.limitGB) * 100, 100);

  return (
    <div className="px-6 py-8 space-y-3">
      <div className="flex justify-between items-end">
        <p className="text-[10px] font-bold uppercase tracking-widest text-luxury-cream/40">Armazenamento</p>
        <p className="text-[10px] font-medium text-luxury-gold">{stats.totalSizeGB}GB / {stats.limitGB}GB</p>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className="h-full bg-luxury-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]"
        />
      </div>
      <p className="text-[8px] uppercase tracking-widest text-luxury-cream/20 font-medium">Uso atual da sua conta premium</p>
    </div>
  );
};

import { useAuth } from "../../contexts/AuthContext";

export const AdminSidebar: FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  const handleLogout = async () => {
    onClose();
    await signOut();
    navigate("/login");
  };

  return (
    <>
      {/* Sidebar / Overlay Container */}
      <aside 
        className={cn(
          "fixed inset-0 z-[100] bg-black transition-all duration-500 lg:relative lg:inset-auto lg:z-10 lg:w-[280px] lg:bg-luxury-black lg:border-r lg:border-luxury-cream/5 lg:opacity-100 lg:visible lg:translate-x-0 h-screen flex flex-col",
          isOpen ? "opacity-100 visible translate-x-0" : "opacity-0 invisible -translate-x-full lg:translate-x-0"
        )}
      >
        {/* Branding & Close (Mobile Header inside Overlay) */}
        <div className="h-20 border-b border-luxury-cream/5 flex items-center justify-between px-6 lg:px-8">
          <Link 
            to="/admin" 
            onClick={() => onClose()}
            className="font-serif text-xl font-bold tracking-[0.2em] uppercase text-white"
          >
            Carsena <span className="text-[10px] text-luxury-gold block -mt-1 tracking-[0.4em] font-sans">Admin</span>
          </Link>
          <button 
            onClick={onClose}
            className="lg:hidden flex items-center justify-center w-12 h-12 text-white -mr-3"
          >
            <X size={28} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          {/* Mobile Overlay Menu Items */}
          <nav className="lg:hidden flex flex-col items-center justify-center min-h-full py-10 gap-8 px-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={cn(
                  "font-serif text-3xl tracking-tight transition-all duration-300 text-white/90 text-center flex flex-col items-center gap-2",
                  location.pathname === item.path ? "text-luxury-gold scale-110" : "hover:text-luxury-gold"
                )}
              >
                <span className="opacity-20">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            
            <div className="w-full max-w-[200px] h-px bg-white/10 my-4" />

            <button 
              onClick={handleLogout}
              className="flex flex-col items-center gap-2 text-red-500/60 font-serif text-2xl italic tracking-wide"
            >
              <LogOut size={24} className="opacity-40" />
              Sair do Painel
            </button>
          </nav>

          {/* Desktop Sidebar Items (Professional View) */}
          <nav className="hidden lg:block py-8 px-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "group flex items-center gap-4 px-6 py-4 transition-all duration-300 relative",
                    isActive 
                      ? "bg-luxury-gold text-luxury-black" 
                      : "text-luxury-cream/40 hover:text-luxury-cream hover:bg-white/5"
                  )}
                >
                  <div className={cn(
                    "transition-transform group-hover:scale-110",
                    isActive ? "text-luxury-black" : "text-luxury-gold/50"
                  )}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em]">
                      {item.label}
                    </p>
                    <p className={cn(
                      "text-[8px] uppercase tracking-widest mt-0.5 font-sans opacity-60",
                      isActive ? "text-luxury-black/60" : "text-luxury-cream/30"
                    )}>
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-white/5 opacity-50">
               <StorageUsage />
            </div>
          </nav>
        </div>

        {/* Desktop Footer */}
        <div className="hidden lg:block p-8 border-t border-luxury-cream/5">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 text-red-500/60 hover:text-red-500 transition-colors w-fit group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Sair do Painel</span>
          </button>
        </div>
      </aside>
    </>
  );
};
