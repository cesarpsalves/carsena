import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

function Dashboard() {
  const [stats, setStats] = useState<any>({
    totalOrders: 0,
    totalSales: 0,
    activeGalleries: 0,
    upcomingEvents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [cmsData, , eventsData] = await Promise.all([
          api.get('/cms/landing').catch(() => ({ data: { settings: {}, portfolio: [] } })),
          api.get('/galleries/list').catch(() => ({ data: [] })), 
          api.get('/events').catch(() => ({ data: [] }))
        ]);

        setStats({
          totalOrders: 12, 
          totalSales: 5420.00,
          activeGalleries: cmsData.data?.portfolio?.length || 0,
          upcomingEvents: eventsData.data?.length || 0
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div style={{ padding: 'var(--space-lg)', opacity: 0.5 }}>Carregando dados...</div>;

  return (
    <div className="dashboard-content">
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <div className="stat-card" style={{ padding: 'var(--space-md)', background: 'var(--color-bg)', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '0.8rem', opacity: 0.5, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Vendas Totais</h3>
          <p className="title-large" style={{ color: 'var(--color-accent)' }}>R$ {stats.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="stat-card" style={{ padding: 'var(--space-md)', background: 'var(--color-bg)', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '0.8rem', opacity: 0.5, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pedidos</h3>
          <p className="title-large">{stats.totalOrders}</p>
        </div>
        <div className="stat-card" style={{ padding: 'var(--space-md)', background: 'var(--color-bg)', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '0.8rem', opacity: 0.5, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Galerias Ativas</h3>
          <p className="title-large">{stats.activeGalleries}</p>
        </div>
        <div className="stat-card" style={{ padding: 'var(--space-md)', background: 'var(--color-bg)', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '0.8rem', opacity: 0.5, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Eventos</h3>
          <p className="title-large">{stats.upcomingEvents}</p>
        </div>
      </section>

      <section>
        <h2 className="title-large" style={{ marginBottom: 'var(--space-md)' }}>Ações Rápidas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
          <Link to="/admin/galleries" className="action-link" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ padding: 'var(--space-lg)', border: '1px solid var(--glass-border)', background: 'white', transition: 'var(--transition-fast)' }} className="hover-card">
              <span style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}>📸</span>
              <h3 className="title-large" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Gerenciar Galerias</h3>
              <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Envie fotos novas e organize o portfólio de clientes.</p>
            </div>
          </Link>

          <Link to="/admin/events" className="action-link" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ padding: 'var(--space-lg)', border: '1px solid var(--glass-border)', background: 'white', transition: 'var(--transition-fast)' }} className="hover-card">
              <span style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}>🎟️</span>
              <h3 className="title-large" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Criar Evento</h3>
              <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Configure ingressos e venda online de forma segura.</p>
            </div>
          </Link>

          <Link to="/admin/settings" className="action-link" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ padding: 'var(--space-lg)', border: '1px solid var(--glass-border)', background: 'white', transition: 'var(--transition-fast)' }} className="hover-card">
              <span style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}>🎨</span>
              <h3 className="title-large" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Customizar Vitrine</h3>
              <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Mude as cores, fontes e banners da sua landing page.</p>
            </div>
          </Link>
        </div>
      </section>

      <style>{`
        .hover-card:hover {
          border-color: var(--color-accent) !important;
          background: #fafafa !important;
          transform: translateY(-4px);
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
