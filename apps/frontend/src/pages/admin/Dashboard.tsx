import { AdminLayout } from "../../components/layout/AdminLayout";
import { 
  Camera, 
  Ticket, 
  Layout, 
  TrendingUp, 
  Users, 
  Database,
  ArrowUpRight,
  CreditCard,
  Clock,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import api from "../../lib/api";

import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Dashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/stats');
      setStats(response.data);

      const { data: recentOrders } = await supabase
        .schema('app_carsena')
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentActivity(recentOrders || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const firstName = profile?.name ? profile.name.split(' ')[0] : "Fotógrafo";
  const currentDate = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR });

  const statCards = [
    {
      label: "Total Pago (Recebido)",
      value: loading ? "..." : (stats?.billing?.formatted || "R$ 0,00"),
      sub: "Recebido dos clientes",
      icon: <TrendingUp size={20} />,
      color: "text-emerald-400",
    },
    {
      label: "Saldo Pendente",
      value: loading ? "..." : (stats?.pending?.formatted || "R$ 0,00"),
      sub: "A receber ainda",
      icon: <AlertCircle size={20} />,
      color: "text-amber-400",
    },
    {
      label: "Ticket Médio",
      value: loading ? "..." : (stats?.avgTicket?.formatted || "R$ 0,00"),
      sub: "Por galeria paga",
      icon: <CreditCard size={20} />,
      color: "text-luxury-gold",
    },
    {
      label: "Sessões Publicadas",
      value: loading ? "..." : (stats?.sessions?.active?.toString() || "0"),
      sub: `de ${stats?.sessions?.total ?? 0} criadas`,
      icon: <Camera size={20} />,
      color: "text-blue-400",
    },
    {
      label: "Clientes Ativos",
      value: loading ? "..." : (stats?.customers?.total?.toString() || "0"),
      sub: "Total de clientes",
      icon: <Users size={20} />,
      color: "text-purple-400",
    },
    {
      label: "Espaço (R2)",
      value: loading ? "..." : (stats?.storage?.totalSizeGB ? `${stats.storage.totalSizeGB} GB` : "---"),
      sub: loading ? "..." : (stats?.storage ? (stats.storage.estimatedCostBRL > 0 ? `Custo Est.: ${stats.storage.formattedCostBRL}` : `Grátis (até 10GB)`) : "de 10 GB"),
      icon: <Database size={20} />,
      color: "text-luxury-gold",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-12">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-serif text-4xl md:text-6xl text-luxury-cream">
              Olá, <span className="italic opacity-80">{firstName}</span>
            </h1>
            <p className="text-luxury-cream/40 font-sans text-sm tracking-widest uppercase">
              Bem-vindo ao seu Escritório Digital • {currentDate}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <section className="space-y-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-luxury-gold opacity-60">Ações Rápidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Link to="/admin/estudio" className="bg-luxury-gold text-black p-8 flex flex-col justify-between h-48 transition-all duration-500 group shadow-lg">
                <div className="flex justify-between items-start">
                  <div className="p-3 border border-current opacity-20 rounded-full group-hover:opacity-40 transition-opacity">
                    <Camera size={24} />
                  </div>
                  <ArrowUpRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-lg font-serif italic tracking-wide">Nova Sessão</span>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Link to="/admin/eventos" className="bg-white/5 text-luxury-cream p-8 flex flex-col justify-between h-48 transition-all duration-500 group shadow-lg hover:bg-white/10">
                <div className="flex justify-between items-start">
                  <div className="p-3 border border-current opacity-20 rounded-full group-hover:opacity-40 transition-opacity">
                    <Ticket size={24} />
                  </div>
                  <ArrowUpRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-lg font-serif italic tracking-wide">Criar Evento</span>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Link to="/admin/vitrine" className="bg-white/5 text-luxury-cream p-8 flex flex-col justify-between h-48 transition-all duration-500 group shadow-lg hover:bg-white/10">
                <div className="flex justify-between items-start">
                  <div className="p-3 border border-current opacity-20 rounded-full group-hover:opacity-40 transition-opacity">
                    <Layout size={24} />
                  </div>
                  <ArrowUpRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-lg font-serif italic tracking-wide">Ajustar Site</span>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="space-y-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-luxury-gold opacity-60">Visão Geral Financeira</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.08 }}
                className="bg-white/5 border border-white/5 p-8 space-y-6 hover:border-luxury-gold/20 transition-all duration-500 group"
              >
                <div className="flex justify-between items-start">
                  <div className={`p-3 bg-white/5 transition-colors group-hover:bg-luxury-gold group-hover:text-black ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-luxury-cream/40">{stat.label}</p>
                  <p className="text-2xl font-serif text-luxury-cream">
                    {stat.value}
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-luxury-cream/20">{stat.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="space-y-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-luxury-gold opacity-60">Atividade Recente</h3>
          <div className="bg-white/5 border border-white/5 overflow-hidden">
            {recentActivity.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-[10px] uppercase tracking-widest text-luxury-cream/20">Sem vendas ou atividades recentes</p>
              </div>
            ) : recentActivity.map((activity) => (
              <div key={activity.id} className="p-6 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-luxury-cream/5 flex items-center justify-center text-luxury-gold">
                    {activity.status === 'paid'
                      ? <TrendingUp size={20} className="text-emerald-400" />
                      : <Clock size={20} className="text-amber-400" />
                    }
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-luxury-cream uppercase tracking-widest leading-none">
                      {activity.status === 'paid' ? 'Pagamento Confirmado' : 'Pedido Pendente'}
                    </h4>
                    <p className="text-[10px] text-luxury-cream/30 uppercase tracking-widest mt-1">
                      {activity.item_type} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activity.total_amount)}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] text-luxury-cream/20 uppercase tracking-widest font-sans">
                  {format(new Date(activity.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};
