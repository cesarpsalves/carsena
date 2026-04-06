import { type ReactNode, type FC, useState } from "react";
import { Link } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { Menu, Bell, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout: FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile, loading } = useAuth();

  return (
    <div className="min-h-screen bg-luxury-black text-luxury-cream flex font-sans selection:bg-luxury-gold selection:text-luxury-black overflow-x-hidden">
      {/* Sidebar (Desktop) / Overlay (Mobile) */}
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 border-b border-luxury-cream/5 flex items-center justify-between px-6 lg:px-12 bg-luxury-black/80 backdrop-blur-md shrink-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-luxury-cream/60 hover:text-luxury-gold transition-colors -ml-2"
          >
            <Menu size={28} />
          </button>

          <div className="hidden lg:block">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-luxury-gold opacity-60">
              Escritório Digital
            </h2>
          </div>

          {/* Mobile Branding (Show only on mobile header) */}
          <Link 
            to="/admin"
            className="lg:hidden font-serif text-lg font-bold tracking-[0.2em] uppercase"
          >
            Carsena <span className="text-[8px] text-luxury-gold inline-block ml-1 tracking-[0.2em] font-sans">Admin</span>
          </Link>

          <div className="flex items-center gap-4 md:gap-8 mr-[-8px]">
            {/* Notification Bell */}
            <button className="relative group p-2 text-luxury-cream/40 hover:text-luxury-gold transition-all duration-300">
              <Bell size={24} strokeWidth={1.5} />
              <span className="absolute top-[10px] right-[10px] w-[8px] h-[8px] bg-luxury-gold rounded-full border-[1.5px] border-luxury-black shadow-[0_0_10px_rgba(212,175,55,0.4)]" />
            </button>
            
            {/* User Info & Avatar Container */}
            <div className="flex items-center gap-6 md:pl-8 md:border-l md:border-luxury-cream/10">
              <div className="text-right hidden sm:block">
                <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-white leading-tight">
                  {loading ? "Carregando..." : profile?.name || "Usuário"}
                </p>
                <p className="text-[10px] text-luxury-gold/50 uppercase tracking-[0.3em] mt-1 font-sans font-medium italic">
                  {profile?.user_type === 'photographer' ? "Fotógrafo Admin" : "Administrador"}
                </p>
              </div>
              
              <div className="relative group">
                <div className="w-[52px] h-[52px] rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-luxury-gold group-hover:border-luxury-gold/40 group-hover:bg-white/[0.05] transition-all duration-500 cursor-pointer overflow-hidden">
                  {profile?.profile_image_url ? (
                    <img src={profile.profile_image_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} strokeWidth={1.5} />
                  )}
                </div>
                {/* Subtle border ring for premium feel */}
                <div className="absolute inset-[-4px] rounded-full border border-luxury-gold/5 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-700" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-12 relative">
          {children}
        </main>
      </div>
    </div>
  );
};
