import React from 'react';

const About: React.FC = () => {
  return (
    <div className="about-content">
      <section className="section" style={{ paddingTop: '120px' }}>
        <div className="container editorial-grid">
          <div style={{ gridColumn: 'span 5' }}>
            <img 
              src="/images/portfolio-1.jpg" 
              alt="Fotógrafo em ação" 
              style={{ width: '100%', height: 'auto', borderRadius: 'var(--space-xs)', boxShadow: '0 40px 100px rgba(0,0,0,0.1)' }}
            />
          </div>
          <div style={{ gridColumn: 'span 7', paddingLeft: 'var(--space-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 className="display-large" style={{ marginBottom: 'var(--space-md)' }}>A Arte de Observar</h1>
            <p className="body-large" style={{ marginBottom: 'var(--space-md)', fontWeight: 300, lineHeight: 1.8 }}>
              Sou apaixonado por capturar a essência guardada em momentos genuínos. 
              Com mais de uma década de experiência transformando emoção em eternidade gráfica.
            </p>
            <p style={{ fontSize: '1rem', lineHeight: '1.8', opacity: 0.7, marginBottom: 'var(--space-lg)' }}>
              Minha abordagem é documental e estética, focando na beleza dos detalhes 
              muitas vezes ignorados. Cada clique é uma tentativa de congelar não apenas a imagem, 
              mas o sentimento de quem vive aquele instante. Especializado em alta gastronomia 
              e eventos de luxo, busco a perfeição na simplicidade.
            </p>
            <div style={{ borderLeft: '2px solid var(--color-accent)', paddingLeft: 'var(--space-md)' }}>
              <p style={{ fontStyle: 'italic', fontSize: '1.2rem', opacity: 0.9 }}>
                "A fotografia é a única linguagem que pode ser entendida em qualquer lugar do mundo."
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--color-bg)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
            <h2 className="display-medium" style={{ marginBottom: 'var(--space-sm)' }}>Reconhecimentos</h2>
            <p style={{ opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Prêmios e Exposições</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-lg)', textAlign: 'center' }}>
            {[
              { year: '2023', award: 'Melhor Fotógrafo de Gastronomia - Brasil' },
              { year: '2022', award: 'Exposição "Luz Silenciosa" - Art Point' },
              { year: '2021', award: 'Destaque Editorial - Fine Arts Mag' }
            ].map((item, idx) => (
              <div key={idx} style={{ padding: 'var(--space-md)', border: '1px solid var(--glass-border)', background: 'white' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 700, marginBottom: '0.5rem' }}>{item.year}</p>
                <h3 className="title-large" style={{ fontSize: '1.2rem' }}>{item.award}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
