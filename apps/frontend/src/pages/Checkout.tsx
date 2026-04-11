import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { cmsService } from '../lib/cms';
import { cn } from '../lib/utils';
import { Tag, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

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
    .replace(/(-\d{2})\d+?$/, '$1');
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
  
  // Recebe itens via state (ex: do carrinho ou seleção de galeria)
  const { items = [], event, tier } = (location.state as { items: CheckoutItem[], event?: any, tier?: any }) || {};
  
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    document: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [loading, setLoading] = useState(false);

  // Estados de Cupom
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Calcula total (incluindo suporte a ticket legado do state se items estiver vazio)
  const effectiveItems: CheckoutItem[] = items.length > 0 ? items : (event && tier ? [{
    item_type: 'ticket',
    item_id: tier.id,
    unit_price: tier.price,
    quantity: 1,
    name: `${event.title} - ${tier.name}`
  }] : []);

  const subtotal = effectiveItems.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
  
  // Cálculo de desconto
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discountAmount = (subtotal * appliedCoupon.value) / 100;
    } else {
      discountAmount = appliedCoupon.value;
    }
  }
  
  const total = Math.max(0, subtotal - discountAmount);

  // Adjusted total based on payment method (5% markup for Credit Card)
  const finalTotal = paymentMethod === 'CREDIT_CARD' ? Number((total * 1.05).toFixed(2)) : total;

  useEffect(() => {
    if (effectiveItems.length === 0) {
      navigate('/');
    }
  }, [effectiveItems, navigate]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsApplying(true);
    setCouponError('');
    try {
      const coupon = await cmsService.validateCoupon(couponCode);
      if (coupon) {
        setAppliedCoupon(coupon);
        setCouponCode(''); // Limpa input ao aplicar
      } else {
        setCouponError('Cupom inválido ou expirado');
      }
    } catch (err) {
      setCouponError('Ocorreu um erro ao validar o cupom');
    } finally {
      setIsApplying(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (effectiveItems.length === 0) return;

    const cleanDocument = customer.document.replace(/\D/g, '');
    if (cleanDocument.length === 11 && !isValidCPF(cleanDocument)) {
      alert('CPF inválido. Por favor, verifique os dados.');
      return;
    }
    
    setLoading(true);

    try {
      // Ajustamos o unit_price proporcionalmente com base no desconto total se houver cupom aplicado
      // Para o Asaas, o ideal é que a soma dos itens bata com o 'value' enviado.
      const discountFactor = total / subtotal;

        items: effectiveItems.map(item => ({
          item_type: item.item_type,
          item_id: item.item_id,
          unit_price: Number((item.unit_price * discountFactor).toFixed(2)),
          quantity: item.quantity
        }))
      });

      const { payment } = response.data;

      if (paymentMethod === 'CREDIT_CARD') {
        // Redireciona para o checkout do Asaas
        window.location.href = payment.url;
        return;
      }

      // Redireciona para sucesso com dados do Asaas (PIX)
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold">Nome Completo</label>
                  <input 
                    type="text" required value={customer.name}
                    onChange={e => setCustomer({...customer, name: e.target.value})}
                    className="w-full bg-black/[0.02] border border-black/10 px-4 py-4 text-sm font-serif focus:border-luxury-gold outline-none transition-colors"
                    placeholder="Como no documento"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold flex justify-between">
                    <span>CPF</span>
                    {customer.document.replace(/\D/g, '').length === 11 && (
                      isValidCPF(customer.document) 
                        ? <span className="text-green-500 flex items-center gap-1"><ShieldCheck size={10} /> Válido</span>
                        : <span className="text-red-500 flex items-center gap-1"><AlertCircle size={10} /> Inválido</span>
                    )}
                  </label>
                  <input 
                    type="text" required value={customer.document}
                    onChange={e => setCustomer({...customer, document: maskCPF(e.target.value)})}
                    className={cn(
                      "w-full bg-black/[0.02] border border-black/10 px-4 py-4 text-sm focus:border-luxury-gold outline-none transition-colors",
                      customer.document.replace(/\D/g, '').length === 11 && !isValidCPF(customer.document) && "border-red-200 bg-red-50/30"
                    )}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold">E-mail para Entrega</label>
                <input 
                  type="email" required value={customer.email}
                  onChange={e => setCustomer({...customer, email: e.target.value})}
                  className="w-full bg-black/[0.02] border border-black/10 px-4 py-4 text-sm focus:border-luxury-gold outline-none transition-colors"
                  placeholder="seu@contato.com"
                />
                <p className="text-[9px] text-gray-400 uppercase tracking-wider italic">Seus itens digitais serão enviados para este endereço.</p>
              </div>

              <div className="pt-6">
                <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold mb-6 block">Método de Pagamento</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={cn(
                      "flex flex-col items-center gap-3 p-6 border transition-all",
                      paymentMethod === 'PIX' ? "border-luxury-gold bg-luxury-gold/[0.02]" : "border-black/5 hover:border-black/20"
                    )}
                  >
                    <div className={cn("w-10 h-10 flex items-center justify-center rounded-full border", paymentMethod === 'PIX' ? "border-luxury-gold text-luxury-gold" : "border-black/10 text-gray-300")}>
                      <Loader2 size={20} className={paymentMethod === 'PIX' ? "animate-none" : "opacity-0"} />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-tighter">Pix Instantâneo</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('CREDIT_CARD')}
                    className={cn(
                      "flex flex-col items-center gap-3 p-6 border transition-all",
                      paymentMethod === 'CREDIT_CARD' ? "border-luxury-gold bg-luxury-gold/[0.02]" : "border-black/5 hover:border-black/20"
                    )}
                  >
                    <div className={cn("w-10 h-10 flex items-center justify-center rounded-full border", paymentMethod === 'CREDIT_CARD' ? "border-luxury-gold text-luxury-gold" : "border-black/10 text-gray-300")}>
                      <Loader2 size={20} className={paymentMethod === 'CREDIT_CARD' ? "animate-none" : "opacity-0"} />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-tighter">Cartão de Crédito</span>
                  </button>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-6 bg-luxury-black text-white text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-luxury-gold hover:text-black transition-all shadow-xl disabled:opacity-50"
              >
                {loading ? 'Processando Solicitação...' : `Finalizar e Pagar R$ ${finalTotal.toFixed(2)}`}
              </button>
            </form>
          </section>

          <aside className="space-y-6 sticky top-[120px]">
            <section className="bg-white border border-black/5 p-8 shadow-sm">
              <h3 className="text-serif text-xl italic mb-6">Resumo</h3>
              <div className="space-y-4">
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

              {/* Coupon Section */}
              <div className="mt-8 pt-8 border-t border-black/5 space-y-4">
                {!appliedCoupon ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                        <input 
                          type="text" 
                          placeholder="CÓDIGO" 
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="w-full bg-black/[0.02] border border-black/10 pl-10 pr-4 py-3 text-[10px] outline-none focus:border-luxury-gold uppercase tracking-widest"
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={handleApplyCoupon}
                        disabled={isApplying || !couponCode}
                        className="px-4 py-3 bg-luxury-black text-white text-[9px] font-bold uppercase tracking-widest hover:bg-luxury-gold hover:text-black transition-all disabled:opacity-30"
                      >
                        {isApplying ? <Loader2 size={12} className="animate-spin" /> : 'Aplicar'}
                      </button>
                    </div>
                    {couponError && (
                      <div className="flex items-center gap-2 text-red-500 text-[9px] font-medium uppercase tracking-tight">
                        <AlertCircle size={12} />
                        {couponError}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-green-500" />
                      <div>
                        <span className="block text-[10px] font-bold text-green-700 tracking-widest">{appliedCoupon.code}</span>
                        <span className="text-[9px] text-green-600/70 uppercase">Desconto Aplicado</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setAppliedCoupon(null)}
                      className="text-[9px] font-bold uppercase text-red-400 hover:text-red-600 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 space-y-3">
                <div className="flex justify-between text-xs text-gray-400 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-xs text-green-600 uppercase tracking-widest">
                    <span>Desconto</span>
                    <span>- R$ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                </div>
                <div className="flex justify-between py-4 border-y border-black/5 items-baseline">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-black">Total Final</span>
                    {paymentMethod === 'CREDIT_CARD' && (
                      <span className="text-[8px] text-gray-400 uppercase tracking-widest mt-1">+ 5% taxa de processamento cartão</span>
                    )}
                  </div>
                  <span className="font-serif text-3xl text-luxury-gold">R$ {finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </section>
            
            <p className="text-[9px] text-center text-gray-400 uppercase leading-relaxed tracking-widest">
              Ambiente Seguro Carsena <br/> Pagamentos processados via Asaas
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}



export default Checkout;
