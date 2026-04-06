import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className="contact-content">
      <section className="section" style={{ paddingTop: '120px' }}>
        <div className="container editorial-grid">
          <div style={{ gridColumn: 'span 6' }}>
            <h1 className="display-large" style={{ marginBottom: 'var(--space-md)' }}>Diga Olá</h1>
            <p className="body-large" style={{ marginBottom: 'var(--space-xl)', opacity: 0.8, maxWidth: '500px' }}>
              Estamos ansiosos por conhecer sua história e transformá-la em registros inesquecíveis.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div>
                <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>E-mail</h4>
                <p className="body-large">contato@carsena.com.br</p>
              </div>
              <div>
                <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>WhatsApp</h4>
                <p className="body-large">+55 (11) 99999-9999</p>
              </div>
              <div>
                <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>Social</h4>
                <p className="body-large">@carsena.fotografia</p>
              </div>
            </div>
          </div>

          <div style={{ gridColumn: 'span 6' }}>
            <form className="glass-card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', background: 'white' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Nome Completo</label>
                <input type="text" placeholder="Seu nome" style={{ padding: '1rem', border: '1px solid var(--glass-border)', background: 'transparent', width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Tipo de Evento</label>
                <select style={{ padding: '1rem', border: '1px solid var(--glass-border)', background: 'transparent', width: '100%', cursor: 'pointer' }}>
                  <option>Casamento</option>
                  <option>Editorial Moda</option>
                  <option>Ensaio Privado</option>
                  <option>Evento Corporativo de Luxo</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 <label style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Mensagem</label>
                 <textarea rows={5} style={{ padding: '1rem', border: '1px solid var(--glass-border)', background: 'transparent', width: '100%', resize: 'none' }} placeholder="Conte um pouco mais sobre o seu projeto..."></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-sm)' }}>Enviar Mensagem</button>
            </form>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--color-bg)', textAlign: 'center' }}>
        <div className="container">
          <h2 className="title-large" style={{ opacity: 0.3, letterSpacing: '0.5em', textTransform: 'uppercase' }}>Carsena Engine</h2>
        </div>
      </section>
    </div>
  );
}

export default Contact;
