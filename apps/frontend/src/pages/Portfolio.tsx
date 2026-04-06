import React from 'react';

const Portfolio: React.FC = () => {
  return (
    <div className="portfolio-content">
      <section className="section" style={{ paddingTop: '120px' }}>
        <div className="container">
          <header style={{ marginBottom: 'var(--space-xl)' }}>
            <h1 className="display-large" style={{ marginBottom: 'var(--space-sm)' }}>Portfólio</h1>
            <p className="body-large" style={{ maxWidth: '600px', opacity: 0.7 }}>
              Uma curadoria dos momentos mais significativos que tive o privilégio de capturar. 
              Especializado em casamentos, editoriais e eventos de alto padrão.
            </p>
          </header>

          <div className="editorial-grid" style={{ gap: 'var(--space-lg)' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ gridColumn: i === 1 ? 'span 7' : i === 2 ? 'span 5' : 'span 12', overflow: 'hidden' }} className="hover-container">
                <img 
                  src={`/images/portfolio-${i}.jpg`} 
                  alt={`Trabalho ${i}`} 
                  style={{ width: '100%', aspectRatio: i === 3 ? '21/9' : '4/5', objectFit: 'cover', transition: 'var(--transition-smooth)', borderRadius: 'var(--space-xs)' }}
                  className="hover-zoom"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--color-text)', color: 'white', textAlign: 'center' }}>
        <div className="container">
          <h2 className="display-medium" style={{ marginBottom: 'var(--space-md)' }}>Gostou do que viu?</h2>
          <p className="body-large" style={{ marginBottom: 'var(--space-lg)', opacity: 0.7 }}>Vamos conversar sobre o seu próximo projeto ou evento.</p>
          <a href="/contact" className="btn btn-primary" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>Solicitar Orçamento</a>
        </div>
      </section>

      <style>{`
        .hover-zoom:hover { transform: scale(1.03); }
        @media (max-width: 768px) {
          .editorial-grid div { grid-column: span 12 !important; }
        }
      `}</style>
    </div>
  );
}

export default Portfolio;
