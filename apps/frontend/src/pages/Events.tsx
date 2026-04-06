import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await api.get('/events').catch(() => ({ data: [] }));
        setEvents(response.data || []);
      } catch (error) {
        console.error('Erro ao carregar eventos:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);


  if (loading) return <div className="section container" style={{ paddingTop: '120px', opacity: 0.5 }}>Preparando a agenda...</div>;

  return (
    <div className="events-content">
      <section className="section" style={{ paddingTop: '120px' }}>
        <div className="container">
          <header style={{ marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
            <h1 className="display-large" style={{ marginBottom: 'var(--space-sm)' }}>Próximos Eventos</h1>
            <p className="body-large" style={{ maxWidth: '750px', margin: '0 auto', opacity: 0.7 }}>
              Workshops, sessões presenciais e experiências fotográficas exclusivas. 
              Garantimos registros que transcendem o tempo.
            </p>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 'var(--space-lg)' }}>
            {events.length > 0 ? (
              events.map((event) => {
                const activeTier = event.ticket_tiers?.find((t: any) => t.active) || event.ticket_tiers?.[0];
                const price = activeTier?.price || 0;
                const date = event.date ? new Date(event.date) : new Date();

                return (
                  <div key={event.id} className="glass-card" style={{ padding: 'var(--space-lg)', background: 'white', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', border: '1px solid var(--glass-border)', transition: 'var(--transition-smooth)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="event-date" style={{ background: 'var(--color-text)', color: 'white', padding: '0.8rem 1rem', textAlign: 'center', borderRadius: '4px' }}>
                        <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{date.getDate()}</span>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8 }}>{date.toLocaleString('pt-BR', { month: 'short' })}</span>
                      </div>
                      {price > 0 && (
                        <span style={{ padding: '0.4rem 0.8rem', background: 'var(--color-bg)', color: 'var(--color-accent)', fontSize: '0.7rem', fontWeight: 700, borderRadius: '20px', textTransform: 'uppercase' }}>
                          R$ {price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="title-large" style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{event.title}</h3>
                      <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', opacity: 0.6, marginBottom: 'var(--space-sm)' }}>
                        📍 {event.location || 'Local a definir'}
                      </p>
                      <p style={{ fontSize: '0.95rem', lineHeight: 1.6, opacity: 0.8 }}>{event.description}</p>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: 'var(--space-md)' }}>
                      <button 
                        onClick={() => navigate('/checkout', { 
                          state: { 
                            event,
                            tier: activeTier
                          } 
                        })} 
                        className="btn btn-primary" 
                        style={{ width: '100%' }}
                        disabled={!activeTier}
                      >
                        {activeTier ? 'Reservar Ingresso' : 'Esgotado'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-2xl)', background: 'var(--color-bg)', borderRadius: 'var(--space-xs)' }}>
                <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>📅</span>
                <h3 className="title-large">Agenda em preparação</h3>
                <p style={{ opacity: 0.6 }}>Estamos organizando novas experiências e workshops. Volte em breve.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Events;
