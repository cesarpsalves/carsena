import { useLocation, Link } from 'react-router-dom';
import { useState } from 'react';

function Success() {
  const location = useLocation();
  const { pixData, paymentUrl, orderId } = (location.state as { pixData?: any, paymentUrl?: string, orderId?: string }) || {};
  const [copied, setCopied] = useState(false);

  const handleCopyPix = () => {
    if (pixData?.payload) {
      navigator.clipboard.writeText(pixData.payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="success-page" style={{ paddingTop: '120px', minHeight: '100vh', background: 'var(--color-bg)' }}>
      <main className="container" style={{ maxWidth: '600px' }}>
        <div className="glass-card text-center" style={{ padding: 'var(--space-xl)', borderRadius: '24px', background: 'white' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>✨</div>
          <h1 className="title-large" style={{ color: 'var(--color-text)', marginBottom: 'var(--space-sm)' }}>
            Pedido Recebido!
          </h1>
          <p className="body-medium" style={{ opacity: 0.7, marginBottom: 'var(--space-xl)' }}>
            Obrigado! Seu pedido <strong>#{orderId?.slice(-6).toUpperCase()}</strong> foi registrado. 
            Assim que o pagamento for confirmado, seu acesso será liberado automaticamente.
          </p>

          {pixData && (
            <div style={{ background: '#f8f9fa', padding: 'var(--space-lg)', borderRadius: '16px', marginBottom: 'var(--space-lg)' }}>
              <h3 style={{ marginBottom: 'var(--space-md)', fontWeight: 700 }}>Pague com Pix</h3>
              <div style={{ background: 'white', padding: '1rem', display: 'inline-block', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <img 
                  src={`data:image/png;base64,${pixData.encodedImage}`} 
                  alt="Pix QR Code" 
                  style={{ width: '200px', height: '200px' }} 
                />
              </div>
              
              <div style={{ marginTop: 'var(--space-md)' }}>
                <p className="body-small" style={{ marginBottom: '0.5rem', opacity: 0.6 }}>Pix Copia e Cola:</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    readOnly 
                    value={pixData.payload} 
                    style={{ flex: 1, padding: '0.8rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.8rem', background: 'white' }}
                  />
                  <button 
                    onClick={handleCopyPix}
                    className="btn btn-primary"
                    style={{ padding: '0 1.5rem', whiteSpace: 'nowrap' }}
                  >
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {paymentUrl && (
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <a 
                href={paymentUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-outline"
                style={{ width: '100%', padding: '1rem', display: 'block' }}
              >
                Ver Fatura Completa (Cartão/Boleto)
              </a>
            </div>
          )}

          <div style={{ borderTop: '1px solid #eee', paddingTop: 'var(--space-lg)' }}>
            <p className="body-small" style={{ marginBottom: 'var(--space-md)', fontStyle: 'italic' }}>
              Enviamos os detalhes do pedido para seu e-mail.
            </p>
            <Link to="/" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
              Voltar para a Galeria
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Success;
