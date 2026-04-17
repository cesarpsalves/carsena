import { useState, useEffect } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { 
  Users, 
  MousePointerClick,
  MonitorSmartphone,
  Eye
} from "lucide-react";
import { motion } from "framer-motion";
import { analyticsService } from "@/lib/analytics";
import { getPortfolioPublicUrl } from "@/lib/portfolio";

interface PageView {
  id: string;
  path: string;
  referrer: string | null;
  user_agent: string | null;
  created_at: string;
}

interface PortfolioClick {
  id: string;
  image_id: string | null;
  category: string;
  created_at: string;
  portfolio_images?: { storage_path: string } | null;
}

export const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [portfolioClicks, setPortfolioClicks] = useState<PortfolioClick[]>([]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const [views, clicks] = await Promise.all([
        analyticsService.getPageViewsMetrics(),
        analyticsService.getPortfolioClickMetrics()
      ]);
      setPageViews(views as PageView[]);
      setPortfolioClicks(clicks as PortfolioClick[]);
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalViews = pageViews.length;
  const totalClicks = portfolioClicks.length;

  const referrersCount = pageViews.reduce((acc, view) => {
    const ref = view.referrer ? new URL(view.referrer).hostname : "Acesso Direto";
    acc[ref] = (acc[ref] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topReferrers = Object.entries(referrersCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const categoryImageClicks = portfolioClicks.reduce((acc, click) => {
    const cat = click.category || "Sem Categoria";
    if (!acc[cat]) acc[cat] = { total: 0, images: {} };
    acc[cat].total += 1;
    
    // We expect portfolio_images to be an object or array if joining succeeded. 
    // In Supabase, 1:1 join returns an object or null
    const pathInfo = click.portfolio_images;
    if (click.image_id && pathInfo && !Array.isArray(pathInfo) && pathInfo.storage_path) {
      const imgPath = pathInfo.storage_path;
      acc[cat].images[imgPath] = (acc[cat].images[imgPath] || 0) + 1;
    }
    
    return acc;
  }, {} as Record<string, { total: number, images: Record<string, number> }>);

  const topCategories = Object.entries(categoryImageClicks)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)
    .map(([category, data]) => {
      const topImages = Object.entries(data.images)
         .sort((a, b) => b[1] - a[1])
         .slice(0, 3)
         .map(([path]) => getPortfolioPublicUrl(path)); // top 3 clicked photos
      return { category, count: data.total, topImages };
    });

  return (
    <AdminLayout>
      <div className="space-y-12 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
          <div className="space-y-2">
            <h1 className="text-serif text-4xl text-luxury-cream">Analytics <span className="italic opacity-80">& Insights</span></h1>
            <p className="text-luxury-cream/40 font-sans text-[10px] tracking-widest uppercase">
              Monitore o acesso à sua página e o interesse no portfólio
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-12 h-[1px] bg-luxury-gold animate-pulse" />
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white/5 border border-white/5 p-8 space-y-6 hover:border-luxury-gold/20 transition-all duration-300"
              >
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-white/5 text-emerald-400">
                    <Users size={20} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-luxury-cream/40">Visualizações da Landing Page</p>
                  <p className="text-4xl font-serif text-luxury-cream">{totalViews}</p>
                  <p className="text-[9px] uppercase tracking-widest text-luxury-cream/20">Acessos registrados</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white/5 border border-white/5 p-8 space-y-6 hover:border-luxury-gold/20 transition-all duration-300"
              >
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-white/5 text-luxury-gold">
                    <MousePointerClick size={20} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-luxury-cream/40">Interações no Portfólio</p>
                  <p className="text-4xl font-serif text-luxury-cream">{totalClicks}</p>
                  <p className="text-[9px] uppercase tracking-widest text-luxury-cream/20">Fotos Clicadas</p>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Ranking Portfolio Categories */}
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                <h3 className="text-serif text-2xl text-luxury-cream italic flex items-center gap-3">
                  <Eye size={20} className="text-luxury-gold" />
                  Categorias Mais Procuradas
                </h3>
                <p className="text-xs text-luxury-cream/40 max-w-sm">Veja quais categorias do seu portfólio chamam mais atenção e atraem os cliques dos vistantes.</p>
                
                <div className="bg-black/40 border border-white/5 p-8 space-y-4">
                  {topCategories.length > 0 ? (
                    topCategories.map(({category, count, topImages}, idx) => (
                      <div key={category} className="border-b border-white/5 last:border-0 pb-6 last:pb-0">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-luxury-gold font-bold">
                              {idx + 1}º
                            </div>
                            <span className="text-sm font-bold text-luxury-cream uppercase tracking-widest">{category}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-serif italic text-luxury-cream">{count}</span>
                            <span className="text-[9px] text-luxury-cream/40 uppercase tracking-widest block">Cliques</span>
                          </div>
                        </div>
                        
                        {/* Top clicked photos under this category */}
                        {topImages.length > 0 && (
                          <div className="flex gap-3 mt-3 overflow-x-auto custom-scrollbar pb-2 pl-12">
                            {topImages.map((imgUrl, i) => (
                              <div key={i} className="relative group shrink-0">
                                <div className="w-16 h-16 rounded-md overflow-hidden border border-white/10 group-hover:border-luxury-gold/50 transition-colors">
                                  <img 
                                    src={imgUrl} 
                                    alt={`Top ${i+1} clicada`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-luxury-black border border-white/10 rounded-full flex items-center justify-center text-[8px] text-luxury-gold font-bold shadow-md">
                                  {i + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-[10px] text-white/40 uppercase tracking-widest">
                      Nenhum clique registrado ainda.
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Top Referrers */}
              <motion.div 
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                className="space-y-6"
              >
                <h3 className="text-serif text-2xl text-luxury-cream italic flex items-center gap-3">
                  <MonitorSmartphone size={20} className="text-emerald-400" />
                  Origem do Público
                </h3>
                <p className="text-xs text-luxury-cream/40 max-w-sm">Descubra de onde os visitantes estão encontrando seu site (Instagram, indicações diretas, Google, etc).</p>
                
                <div className="bg-black/40 border border-white/5 p-8 space-y-4">
                  {topReferrers.length > 0 ? (
                    topReferrers.map(([referrer, count], idx) => (
                      <div key={referrer} className="flex items-center justify-between border-b border-white/5 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-emerald-400 font-bold">
                            {idx + 1}º
                          </div>
                          <span className="text-sm font-bold text-luxury-cream uppercase tracking-widest">{referrer}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-serif italic text-luxury-cream">{count}</span>
                          <span className="text-[9px] text-luxury-cream/40 uppercase tracking-widest block">Acessos</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-[10px] text-white/40 uppercase tracking-widest">
                      Sem dados de origem registrados ainda.
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};
