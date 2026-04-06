import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

function Galleries() {
  const [galleries, setGalleries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGalleries() {
      try {
        const response = await api.get('/cms/landing').catch(() => ({ data: { portfolio: [] } }));
        setGalleries(response.data?.portfolio || []);
      } catch (error) {
        console.error('Erro ao carregar galerias:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchGalleries();
  }, []);

  if (loading) return <div className="section container" style={{ paddingTop: '120px', opacity: 0.5 }}>Explorando acervo...</div>;

  return (
    <div className="galleries-content">
      <section className="section" style={{ paddingTop: '120px' }}>
        <div className="container">
          <header style={{ marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
            <h1 className="display-large" style={{ marginBottom: 'var(--space-sm)' }}>Galerias Públicas</h1>
            <p className="body-large" style={{ maxWidth: '700px', margin: '0 auto', opacity: 0.7 }}>
              Explore nossos trabalhos mais recentes em alta resolução. 
              Cada galeria é uma jornada visual única.
            </p>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 'var(--space-lg)' }}>
            {galleries.map((gallery) => (
              <Link key={gallery.id} to={`/galleries/${gallery.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="gallery-card" style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--space-xs)' }}>
                  <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                    <img 
                      src={gallery.cover_image_url || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80'} 
                      alt={gallery.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'var(--transition-smooth)' }}
                      className="hover-zoom"
                    />
                  </div>
                  <div style={{ padding: 'var(--space-md)', background: 'var(--color-bg)' }}>
                    <h3 className="title-large" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{gallery.title}</h3>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>{gallery.description || 'Clique para explorar esta história visual'}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {galleries.length === 0 && (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', opacity: 0.5 }}>
              <h3 className="title-large">Nossas histórias estão sendo preparadas.</h3>
              <p>Volte em breve para conferir novas capturas.</p>
            </div>
          )}
        </div>
      </section>

      <style>{`
        .gallery-card:hover .hover-zoom { transform: scale(1.05); }
        .gallery-card:hover { box-shadow: 0 30px 60px rgba(0,0,0,0.1); }
        @media (max-width: 450px) {
           .galleries-content { padding-top: 20px; }
        }
      `}</style>
    </div>
  );
}

export default Galleries;
