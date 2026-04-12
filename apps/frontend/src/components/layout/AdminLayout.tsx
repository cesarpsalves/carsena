import { type ReactNode, type FC, useState, useEffect } from "react";
import { Menu, Bell, User, LogOut, Settings, ShieldCheck, ChevronDown, ExternalLink, ArrowUpRight, CreditCard } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "../../lib/supabase";
// date-fns removed as it's currently unused here

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout: FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const { data } = await supabase
        .schema('app_carsena')
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (id: string) => {
    // Optimistic local update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    
    try {
      const { error } = await supabase
        .schema('app_carsena')
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      
      if (error) {
        // Rollback on error if necessary, though simpler to just re-fetch
        fetchNotifications();
        throw error;
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!profile?.auth_id) return;
    
    // Optimistic local update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    try {
      const { error } = await supabase
        .schema('app_carsena')
        .from('notifications')
        .update({ read: true })
        .eq('user_id', profile.auth_id)
        .eq('read', false);
      
      if (error) {
        fetchNotifications();
        throw error;
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  useEffect(() => {
    if (!profile?.auth_id) return;
    
    fetchNotifications();
    
    // Real-time subscription for new notifications
    const channel = supabase
      .channel(`notifications:${profile.auth_id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'app_carsena', 
        table: 'notifications',
        filter: `user_id=eq.${profile.auth_id}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.auth_id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

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
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileMenuOpen(false);
                }}
                className={cn(
                  "relative group p-2.5 rounded-full transition-all duration-500",
                  isNotificationsOpen 
                    ? "bg-luxury-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]" 
                    : "text-luxury-cream/40 hover:text-luxury-gold hover:bg-white/5"
                )}
              >
                <Bell size={22} strokeWidth={isNotificationsOpen ? 2 : 1.5} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-luxury-black shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setIsNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(10px)" }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      className="absolute right-[-80px] sm:right-0 mt-6 w-screen sm:w-[400px] max-w-[calc(100vw-2rem)] bg-luxury-black/90 backdrop-blur-2xl border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.9)] z-50 overflow-hidden"
                    >
                      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Central de Alertas</span>
                           {unreadCount > 0 && (
                             <span className="px-2 py-0.5 bg-luxury-gold text-black text-[8px] font-black rounded-full uppercase tracking-tighter">
                               {unreadCount} novos
                             </span>
                           )}
                        </div>
                        {unreadCount > 0 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              markAllAsRead();
                            }}
                            className="text-[9px] font-bold text-luxury-gold/60 uppercase tracking-widest hover:text-white transition-colors"
                          >
                            Limpar Tudo
                          </button>
                        )}
                      </div>

                      <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              onClick={() => {
                                if (!notif.read) markAsRead(notif.id);
                                if (notif.link) navigate(notif.link);
                                setIsNotificationsOpen(false);
                              }}
                              className={cn(
                                "relative p-6 border-b border-white/5 hover:bg-white/[0.05] transition-all cursor-pointer group flex gap-5",
                                !notif.read ? "bg-white/[0.03]" : "opacity-40 grayscale-[0.5]"
                              )}
                            >
                              {!notif.read && (
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-luxury-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                              )}
                              
                              <div className={cn(
                                "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-500",
                                notif.type === 'order' 
                                  ? "bg-green-500/10 border-green-500/20 text-green-500 group-hover:bg-green-500/20" 
                                  : "bg-luxury-gold/10 border-luxury-gold/20 text-luxury-gold group-hover:bg-luxury-gold/20"
                              )}>
                                {notif.type === 'order' ? <CreditCard size={20} /> : <Bell size={20} />}
                              </div>

                              <div className="flex-1 space-y-1.5 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <p className="text-[11px] font-bold uppercase tracking-widest text-white leading-tight truncate">
                                    {notif.title}
                                  </p>
                                  <span className="text-[8px] text-white/20 uppercase font-medium whitespace-nowrap">
                                    {new Date(notif.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-[10px] text-luxury-cream/40 leading-relaxed font-light">
                                  {notif.message}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-24 px-12 text-center space-y-4">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/10">
                              <Bell size={32} strokeWidth={1} />
                            </div>
                            <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] italic font-medium">
                              Sua caixa de entrada está limpa
                            </p>
                          </div>
                        )}
                      </div>

                      {notifications.length > 0 && (
                        <div 
                          onClick={() => {
                            navigate('/admin/caixa');
                            setIsNotificationsOpen(false);
                          }}
                          className="p-5 bg-white/[0.03] text-center border-t border-white/5 cursor-pointer hover:bg-luxury-gold hover:text-black transition-all group"
                        >
                          <span className="text-[9px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2">
                            Ver Histórico de Vendas
                            <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          </span>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            {/* User Info & Avatar Container */}
            <div className="flex items-center gap-3 sm:gap-6 md:pl-8 md:border-l md:border-luxury-cream/10 relative">
              <div 
                className="text-right hidden sm:block cursor-pointer group"
                onClick={() => {
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                  setIsNotificationsOpen(false);
                }}
              >
                <div className="flex items-center justify-end gap-2">
                  <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-white leading-tight group-hover:text-luxury-gold transition-colors">
                    {loading ? "Carregando..." : profile?.name || "Usuário"}
                  </p>
                  <ChevronDown size={12} className={cn("text-white/20 transition-transform duration-300", isProfileMenuOpen && "rotate-180")} />
                </div>
                <p className="text-[10px] text-luxury-gold/50 uppercase tracking-[0.3em] mt-1 font-sans font-medium italic">
                  {profile?.user_type === 'photographer' ? "Fotógrafo Admin" : "Administrador"}
                </p>
              </div>
              
              <div className="relative group">
                <button 
                  onClick={() => {
                    setIsProfileMenuOpen(!isProfileMenuOpen);
                    setIsNotificationsOpen(false);
                  }}
                  className="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-luxury-gold group-hover:border-luxury-gold/40 group-hover:bg-white/[0.05] transition-all duration-500 cursor-pointer overflow-hidden relative z-10"
                >
                  {profile?.profile_image_url ? (
                    <img src={profile.profile_image_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} strokeWidth={1.5} />
                  )}
                </button>
                {/* Subtle border ring for premium feel */}
                <div className={cn(
                  "absolute inset-[-4px] rounded-full border border-luxury-gold/10 scale-90 opacity-0 transition-all duration-700",
                  (isProfileMenuOpen || !loading) && "group-hover:scale-100 group-hover:opacity-100"
                )} />
              </div>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {isProfileMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsProfileMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-[70px] w-[260px] bg-luxury-black border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.9)] z-50 overflow-hidden"
                    >
                      <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-luxury-gold">Logado como</p>
                          <span className="text-[8px] px-2 py-0.5 border border-luxury-gold/30 text-luxury-gold uppercase tracking-widest font-bold rounded-full">Pro Member</span>
                        </div>
                        <p className="text-[12px] font-bold text-white truncate">{profile?.email || ''}</p>
                      </div>

                      <div className="p-2">
                        <a 
                          href="/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-gold hover:bg-luxury-gold/10 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <ExternalLink size={16} />
                            Ver Meu Site
                          </div>
                          <ArrowUpRight size={14} className="opacity-40 group-hover:opacity-100" />
                        </a>

                        <div className="h-px bg-white/5 my-2 mx-4" />

                        <button 
                          onClick={() => {
                            navigate('/admin/ajustes');
                            setIsProfileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 hover:text-luxury-gold hover:bg-white/[0.03] transition-all group border-b border-white/5"
                        >
                          <Settings size={18} className="text-white/20 group-hover:text-luxury-gold transition-colors" />
                          Ajustes de Conta
                        </button>
                        
                        <div className="mt-2">
                          <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-red-400 hover:text-red-500 hover:bg-red-500/5 transition-all group"
                          >
                            <LogOut size={16} />
                            Sair do Sistema
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
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
