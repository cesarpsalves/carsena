import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';

function GalleryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gallery, setGallery] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const [galleryRes, photosRes] = await Promise.all([
          api.get(`/galleries/${id}`),
          api.get(`/galleries/${id}/photos`)
        ]);
        
        setGallery(galleryRes.data);
        setPhotos(photosRes.data || []);
      } catch (error) {
        console.error('Erro ao carregar galeria:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, [id]);

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId) 
        : [...prev, photoId]
    );
  };

  const handleCheckout = () => {
    const selectedItems = photos
      .filter(p => selectedPhotos.includes(p.id))
      .map(p => ({
        item_type: 'photo' as const,
        item_id: p.id,
        unit_price: gallery?.photo_price || 10.0,
        quantity: 1,
        name: `Foto ${p.filename || p.id.slice(0, 8)}`,
        thumbnail: p.url
      }));

    navigate('/checkout', { state: { items: selectedItems } });
  };

  if (loading) return <div className="section container" style={{ paddingTop: '120px', opacity: 0.5 }}>Preparando negativos...</div>;

  const photoPrice = gallery?.photo_price || 10.0;
  const total = selectedPhotos.length * photoPrice;

  return (
    <div className="gallery-detail-content" style={{ position: 'relative' }}>
      <section className="section" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
        <div className="container">
          <header style={{ marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
            <h1 className="display-large" style={{ marginBottom: 'var(--space-sm)' }}>{gallery?.title}</h1>
            <p className="body-large" style={{ maxWidth: '700px', margin: '0 auto', opacity: 0.7 }}>{gallery?.description}</p>
            <div style={{ marginTop: 'var(--space-md)', color: 'var(--color-accent)', fontWeight: 700 }}>
              R$ {photoPrice.toFixed(2)} por foto
            </div>
          </header>

          <div style={{ columns: '3 300px', columnGap: '1rem' }}>
            {photos.length > 0 ? (
              photos.map((photo) => {
                const isSelected = selectedPhotos.includes(photo.id);
                return (
                  <div 
                    key={photo.id} 
                    className={`photo-item hover-container ${isSelected ? 'selected' : ''}`} 
                    style={{ 
                      breakInside: 'avoid', 
                      marginBottom: '1rem', 
                      position: 'relative', 
                      overflow: 'hidden', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: isSelected ? '3px solid var(--color-primary)' : '3px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => togglePhotoSelection(photo.id)}
                  >
                    <img 
                      src={photo.url} 
                      alt={photo.filename} 
                      loading="lazy" 
                      style={{ width: '100%', display: 'block', opacity: isSelected ? 0.7 : 1, transition: 'var(--transition-smooth)' }} 
                      className="hover-zoom"
                    />
                    
                    <div className="photo-badge" style={{ position: 'absolute', top: '10px', right: '10px', opacity: isSelected ? 1 : 0 }}>
                      <CheckCircle2 color="var(--color-primary)" fill="white" />
                    </div>

                    <div className="photo-overlay" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', opacity: isSelected ? 1 : 0, transition: 'var(--transition-fast)', display: 'flex', justifyContent: 'center' }}>
                      <span style={{ color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>
                        {isSelected ? 'Selecionada' : 'Adicionar'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', opacity: 0.5, gridColumn: '1 / -1' }}>
                <p>Nenhuma foto encontrada nesta galeria ainda.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sticky Selection Bar */}
      {selectedPhotos.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 40px)',
          maxWidth: '800px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '1.2rem 2rem',
          borderRadius: '100px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1000,
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--color-primary)', color: 'white', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
              {selectedPhotos.length}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>Selecionadas</p>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>R$ {total.toFixed(2)}</p>
            </div>
          </div>
          <button 
            onClick={handleCheckout}
            className="btn btn-primary" 
            style={{ padding: '0.8rem 2.5rem', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ShoppingCart size={18} /> Finalizar Compra
          </button>
        </div>
      )}

      <style>{`
        .photo-item:hover .hover-zoom { transform: scale(1.05); }
        .photo-item:not(.selected):hover .photo-overlay { opacity: 1; }
      `}</style>
    </div>
  );
}

export default GalleryDetail;
