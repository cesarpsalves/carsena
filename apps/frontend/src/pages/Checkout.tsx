import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { cmsService } from '../lib/cms';
import { cn } from '../lib/utils';
import { Tag, CheckCircle2, AlertCircle, Loader2, ShieldCheck, FileText } from 'lucide-react';

// Função de validação de CPF
const isValidCPF = (cpf: string) => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 1; i <= 9; i++) sum += parseInt(cleanCPF.substring(i-1, i)) * (11 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cleanCPF.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(cleanCPF.substring(i-1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cleanCPF.substring(10, 11))) return false;

  return true;
};

// Função de máscara de CPF
const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .substring(0, 14);
};

interface CheckoutItem {
  item_type: 'photo' | 'ticket';
  item_id: string;
  unit_price: number;
  quantity: number;
  name: string;
  thumbnail?: string;
}

function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { items = [], event, tier } = (location.state as { items: CheckoutItem[], event?: any, tier?: any }) || {};
  
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    document: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const subtotal = items.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
  const discountAmount = appliedCoupon ? (appliedCoupon.type === 'percentage' ? (subtotal * appliedCoupon.value / 100) : appliedCoupon.value) : 0;
  const total = Math.max(0, subtotal - discountAmount);

  // Adjusted total based on payment method (5% markup for Credit Card)
  const finalTotal = paymentMethod === 'CREDIT_CARD' ? Number((total * 1.05).toFixed(2)) : total;

  useEffect(() => {
    const effectiveItems = items.length > 0 ? items : (event && tier ? [{
      item_type: 'ticket',
      item_id: tier.id,
      unit_price: tier.price,
      quantity: 1,
      name: `Ingresso: ${event.title} - ${tier.name}`
    }] : []);

    if (effectiveItems.length === 0) {
      navigate('/');
    }
  }, [items, event, tier, navigate]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);
    try {
      const response = await api.get(`/payments/coupons/${couponCode}`);
      setAppliedCoupon(response.data);
    } catch (error) {
      alert('Cupom inválido ou expirado');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveItems = items.length > 0 ? items : (event && tier ? [{
      item_type: 'ticket',
      item_id: tier.id,
      unit_price: tier.price,
      quantity: 1,
      name: `Ingresso: ${event.title} - ${tier.name}`
    }] : []);

    if (effectiveItems.length === 0) return;

    const cleanDocument = customer.document.replace(/\D/g, '');
    if (cleanDocument.length === 11 && !isValidCPF(cleanDocument)) {
      alert('CPF inválido. Por favor, verifique os dados.');
      return;
    }
    
    setLoading(true);

    try {
      const discountFactor = total / subtotal;

      const response = await api.post('/payments/checkout', {
        customer_name: customer.name,
        customer_email: customer.email,
        customer_document: cleanDocument,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code,
        items: effectiveItems.map(item => ({
          item_type: item.item_type,
          item_id: item.item_id,
          unit_price: Number((item.unit_price * discountFactor).toFixed(2)),
          quantity: item.quantity
        }))
      });

      const { payment } = response.data;

      if (paymentMethod === 'CREDIT_CARD') {
        window.location.href = payment.url;
        return;
      }

      navigate('/success', { 
        state: { 
          orderId: response.data.orderId, 
          pixData: payment.pix_qrcode ? {
            encodedImage: payment.pix_qrcode,
            payload: payment.pix_qrcode_text
          } : null,
          paymentUrl: payment.url
        } 
      });
    } catch (error: any) {
      console.error('Erro no checkout:', error);
      alert('Falha ao processar checkout: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const effectiveItems = items.length > 0 ? items : (event && tier ? [{
    item_type: 'ticket',
    item_id: tier.id,
    unit_price: tier.price,
    quantity: 1,
    name: `Ingresso: ${event.title} - ${tier.name}`
  }] : []);

  return (
    <div className="checkout-page pb-20" style={{ paddingTop: '120px', minHeight: '100vh', background: '#fafafa' }}>
      <main className="container-premium px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-12 items-start">
          <section className="bg-white border border-black/5 p-8 md:p-12 shadow-sm rounded-sm">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-serif text-3xl italic text-luxury-black">Checkout Premium</h2>
              <div className="h-[1px] flex-1 bg-black/5" />
            </div>
            
            <form onSubmit={handleCheckout} className="space-y-10">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-black/60 pl-2">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    value={customer.name}
                    onChange={e => setCustomer({ ...customer, name: e.target.value })}
                    className="w-full bg-luxury-cream/30 border border-luxury-black/10 py-4 px-4 outline-none focus:border-luxury-gold transition-colors text-luxury-black"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-black/60 pl-2">E-mail para Entrega</label>
                  <input 
                    required
                    type="email" 
                    value={customer.email}
                    onChange={e => setCustomer({ ...customer, email: e.target.value })}
                    className="w-full bg-luxury-cream/30 border border-luxury-black/10 py-4 px-4 outline-none focus:border-luxury-gold transition-colors text-luxury-black"
                    placeholder="onde_recebera@fotos_e_ingressos.com"
                  />
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider italic mt-2 pl-2">Seus itens digitais serão enviados para este endereço.</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-black/60 pl-2 flex justify-between">
                    <span>CPF</span>
                    {customer.document.replace(/\D/g, '').length === 11 && (
                      isValidCPF(customer.document) 
                        ? <span className="text-emerald-500 lowercase font-medium flex items-center gap-1"><ShieldCheck size={10} /> Válido</span>
                        : <span className="text-rose-500 lowercase font-medium flex items-center gap-1"><AlertCircle size={10} /> Inválido</span>
                    )}
                  </label>
                  <input 
                    required
                    type="text" 
                    value={customer.document}
                    onChange={e => setCustomer({ ...customer, document: maskCPF(e.target.value) })}
                    className={cn(
                      "w-full bg-luxury-cream/30 border py-4 px-4 outline-none transition-colors text-luxury-black",
                      customer.document.replace(/\D/g, '').length === 11 && !isValidCPF(customer.document)
                        ? "border-rose-200 bg-rose-50/20"
                        : "border-luxury-black/10 focus:border-luxury-gold"
                    )}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-black/5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-black/60 mb-6 block">Método de Pagamento</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={cn(
                      "flex flex-col items-center gap-3 p-6 border transition-all rounded-sm",
                      paymentMethod === 'PIX' ? "border-luxury-gold bg-luxury-gold/[0.02]" : "border-black/5 hover:border-black/20"
                    )}
                  >
                    <div className={cn("w-10 h-10 flex items-center justify-center rounded-full border", paymentMethod === 'PIX' ? "border-luxury-gold text-luxury-gold" : "border-black/10 text-gray-300")}>
                      {paymentMethod === 'PIX' ? <CheckCircle2 size={20} /> : <div className="w-5 h-5 rounded-full bg-gray-100" />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Pix Instantâneo</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('CREDIT_CARD')}
                    className={cn(
                      "flex flex-col items-center gap-3 p-6 border transition-all rounded-sm",
                      paymentMethod === 'CREDIT_CARD' ? "border-luxury-gold bg-luxury-gold/[0.02]" : "border-black/5 hover:border-black/20"
                    )}
                  >
                    <div className={cn("w-10 h-10 flex items-center justify-center rounded-full border", paymentMethod === 'CREDIT_CARD' ? "border-luxury-gold text-luxury-gold" : "border-black/10 text-gray-300")}>
                      {paymentMethod === 'CREDIT_CARD' ? <CheckCircle2 size={20} /> : <div className="w-5 h-5 rounded-full bg-gray-100" />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Cartão de Crédito</span>
                  </button>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-6 bg-luxury-black text-white text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-luxury-gold hover:text-black transition-all shadow-xl disabled:opacity-50"
              >
                {loading ? 'Processando...' : `Finalizar e Pagar R$ ${finalTotal.toFixed(2)}`}
              </button>
            </form>
          </section>

          <aside className="space-y-6 sticky top-[120px]">
            <section className="bg-white border border-black/5 p-8 shadow-sm rounded-sm">
              <h3 className="text-serif text-xl italic mb-6">Resumo</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {effectiveItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs border-b border-black/[0.03] pb-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-luxury-black">{item.quantity}x {item.name}</span>
                      <span className="text-gray-400 text-[10px]">Unidade: R$ {item.unit_price.toFixed(2)}</span>
                    </div>
                    <span className="font-serif">R$ {(item.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-6">
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="CUPOM"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 bg-black/[0.02] border border-black/5 px-4 py-3 text-[10px] tracking-widest outline-none focus:border-luxury-gold transition-colors"
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponCode}
                      className="px-6 bg-luxury-black text-white text-[9px] font-bold uppercase tracking-widest hover:bg-luxury-gold hover:text-black transition-all disabled:opacity-50"
                    >
                      {validatingCoupon ? '...' : 'Aplicar'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-50/50 border border-emerald-100 p-4 flex items-center justify-between rounded-sm">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <div>
                        <span className="block text-[10px] font-bold text-emerald-700 tracking-widest">{appliedCoupon.code}</span>
                        <span className="text-[9px] text-emerald-600/70 uppercase">Desconto Aplicado</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setAppliedCoupon(null)}
                      className="text-[9px] font-bold uppercase text-rose-400 hover:text-rose-600 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-black/5">
                  <div className="flex justify-between text-xs text-gray-400 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-xs text-emerald-600 uppercase tracking-widest">
                      <span>Desconto</span>
                      <span>- R$ {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-4 border-y border-black/5 items-baseline">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-black">Total Final</span>
                      {paymentMethod === 'CREDIT_CARD' && (
                        <span className="text-[8px] text-gray-400 uppercase tracking-widest mt-1 italic">+ 5% taxa cartão</span>
                      )}
                    </div>
                    <span className="font-serif text-3xl text-luxury-gold">R$ {finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </section>
            
            <p className="text-[9px] text-center text-gray-400 uppercase leading-relaxed tracking-widest px-8">
              Ambiente Seguro Carsena <br/> Pagamentos via Asaas
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default Checkout;
