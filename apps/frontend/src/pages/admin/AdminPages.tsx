import { type ReactNode, type FC, useState, useEffect } from "react";
import { AdminLayout } from '../../components/layout/AdminLayout';
import { 
  Search, 
  Plus, 
  Calendar, 
  Camera, 
  Globe, 
  X,
  User,
  Ticket,
  CreditCard,
  Cloud,
  Save,
  Clock,
  Trash2,
  TrendingUp,
  Copy,
  Image as ImageIcon,
  Heart,
  Settings,
  MapPin,
  Maximize,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";
import { eventService } from "@/lib/events";
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getStoragePublicUrl, uploadDirect } from '@/lib/storage';
import { UploadZone } from '../../components/admin/UploadZone';
import { AdminGalleryMedia } from '../../components/admin/AdminGalleryMedia';

import { formatCurrency } from "@/utils/format";

// --- Shared UI Components ---

const PageHeader: React.FC<{ title: string; subtitle: string; action?: string; onAction?: () => void }> = ({ title, subtitle, action, onAction }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-10 mb-10">
    <div className="space-y-1">
      <h1 className="text-serif text-4xl text-luxury-cream">{title}</h1>
      <p className="text-luxury-cream/40 font-sans text-[10px] tracking-widest uppercase">{subtitle}</p>
    </div>
    {action && (
      <button 
        onClick={onAction}
        className="flex items-center gap-2 px-8 py-4 bg-luxury-gold text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl"
      >
        <Plus size={16} />
        {action}
      </button>
    )}
  </div>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-luxury-black border border-luxury-cream/10 p-8 md:p-12 shadow-2xl overflow-y-auto max-h-[90vh]"
        >
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-serif text-3xl text-luxury-cream">{title}</h2>
            <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

interface FormInputProps {
  label: string;
  placeholder: string;
  icon?: ReactNode;
  type?: string;
  value?: string;
  onChange?: (val: string) => void;
  required?: boolean;
  disabled?: boolean;
}

const FormInput: FC<FormInputProps> = ({ 
  label, 
  placeholder, 
  icon, 
  type = "text", 
  value, 
  onChange,
  required,
  disabled
}) => (
  <div className="space-y-2">
    <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-cream/40 font-bold">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-gold/50">{icon}</div>}
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={cn(
          "w-full bg-white/5 border border-white/5 py-4 text-xs text-luxury-cream outline-none focus:border-luxury-gold/50 transition-colors uppercase tracking-widest",
          icon ? "pl-12 pr-4" : "px-4",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
    </div>
  </div>
);

// --- Pages ---

export const AdminGalleries = () => {
  const [activeTab, setActiveTab ] = useState<'sessions' | 'customers' | 'admins'>('sessions');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('manual');
  const [savingPayment, setSavingPayment] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
  
  // Data State
  const [galleries, setGalleries] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State - Admin
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    user_type: 'photographer'
  });

  // Form State - Gallery
  const [newGallery, setNewGallery] = useState({
    title: '',
    customer_id: '',
    date: new Date().toISOString().split('T')[0],
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    event_type: 'Wedding',
    storage_path: '',
    price: 0,
    amount_paid: 0,
    status: 'draft'
  });

  // Form State - Settings (Watermark)
  const [editGallery, setEditGallery] = useState<any>(null);

  // Form State - Customer
  const [newClient, setNewClient] = useState<any>({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gRes, clRes, favRes, admRes] = await Promise.all([
        supabase.schema('app_carsena').from('galleries').select(`
          *,
          customers ( name ),
          photos ( id, thumbnail_path, storage_path, is_processed, is_highlight, is_courtesy )
        `).order('created_at', { ascending: false }),
        supabase.schema('app_carsena').from('customers').select('*').order('name'),
        supabase.schema('app_carsena').from('photo_selections').select('photo_id').eq('is_favorite', true),
        supabase.schema('app_carsena').from('photographers').select('*').order('name')
      ]);

      if (gRes.error) throw gRes.error;
      if (clRes.error) throw clRes.error;
      if (admRes.error) throw admRes.error;

      const favoritesSet = new Set((favRes.data || []).map(f => f.photo_id));

      const enrichedGalleries = gRes.data?.map(g => {
        const galleryPhotos = g.photos || [];
        const favCount = galleryPhotos.filter((p: any) => favoritesSet.has(p.id)).length;
        
        return {
          ...g,
          client_name: g.customers?.name || 'Cliente Desconhecido',
          favorite_count: favCount
        };
      }) || [];

      setGalleries(enrichedGalleries);
      setCustomers(clRes.data || []);
      setAdmins(admRes.data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar dados do estúdio: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const adminToSave = editingAdmin || newAdmin;
    try {
      if (adminToSave.id) {
        const { error } = await supabase
          .schema('app_carsena')
          .from('photographers')
          .update({
            name: adminToSave.name,
            email: adminToSave.email,
            user_type: adminToSave.user_type
          })
          .eq('id', adminToSave.id);

        if (error) throw error;
        toast.success("Administrador atualizado!");
      } else {
        const { error } = await supabase
          .schema('app_carsena')
          .from('photographers')
          .insert([adminToSave]);

        if (error) throw error;
        toast.success("Administrador cadastrado com sucesso!");
      }
      setIsAdminModalOpen(false);
      setEditingAdmin(null);
      setNewAdmin({ name: '', email: '', user_type: 'photographer' });
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao salvar admin: " + error.message);
    }
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    if (!confirm(`Excluir o administrador "${name}"?`)) return;
    try {
      const { error } = await supabase.schema('app_carsena').from('photographers').delete().eq('id', id);
      if (error) throw error;
      toast.success("Administrador removido.");
      fetchData();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const handleClearGallery = async () => {
    if (!selectedGallery) return;
    if (!confirm("Tem certeza? Esta ação removerá os registros das fotos vinculadas no banco (os arquivos no R2 devem ser removidos via aba Nuvem).")) return;
    
    try {
      const { error } = await supabase
        .schema('app_carsena')
        .from('photos')
        .delete()
        .eq('gallery_id', selectedGallery.id);
        
      if (error) throw error;
      
      toast.success("Mídias removidas da galeria!");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao limpar galeria: " + error.message);
    }
  };

  const handleCreateGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .schema('app_carsena')
        .from('galleries')
        .insert([{
          ...newGallery,
          date: new Date(newGallery.date).toISOString(),
          access_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          expires_at: newGallery.expires_at ? new Date(newGallery.expires_at).toISOString() : null
        }]);

      if (error) throw error;

      toast.success("Galeria criada com sucesso!");
      
      // Notificar cliente se estiver publicada
      if (newGallery.status === 'published') {
        const { data: createdGallery } = await supabase
          .schema('app_carsena')
          .from('galleries')
          .select('id')
          .eq('title', newGallery.title)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (createdGallery) {
          fetch(`${import.meta.env.VITE_API_URL}/emails/publish-gallery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ galleryId: createdGallery.id })
          }).catch(err => console.error("Erro ao notificar cliente:", err));
        }
      }

      fetchData();
      setIsModalOpen(false);
      setNewGallery({ 
        title: '', customer_id: '', 
        date: new Date().toISOString().split('T')[0], 
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        event_type: 'Wedding', storage_path: '', price: 0, amount_paid: 0, status: 'draft' 
      });
    } catch (error: any) {
      toast.error("Erro ao criar galeria: " + error.message);
    }
  };

  const handleUpdateGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGallery) return;

    try {
      const { error } = await supabase
        .schema('app_carsena')
        .from('galleries')
        .update({
          title: editGallery.title,
          description: editGallery.description,
          date: new Date(editGallery.date).toISOString(),
          event_type: editGallery.event_type,
          price: editGallery.price !== undefined ? parseFloat(editGallery.price) : 0,
          amount_paid: editGallery.amount_paid !== undefined ? parseFloat(editGallery.amount_paid) : 0,
          watermark_enabled: editGallery.watermark_enabled,
          watermark_type: editGallery.watermark_type,
          watermark_text: editGallery.watermark_text,
          watermark_position: editGallery.watermark_position,
          watermark_opacity: parseFloat(editGallery.watermark_opacity),
          watermark_scale: parseFloat(editGallery.watermark_scale),
          status: editGallery.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editGallery.id);

      if (error) throw error;

      toast.success("Configurações salvas!");
      
      // Notificar se mudou para publicado agora
      const wasPublished = galleries.find(g => g.id === editGallery.id)?.status === 'published';
      if (editGallery.status === 'published' && !wasPublished) {
        fetch(`${import.meta.env.VITE_API_URL}/emails/publish-gallery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ galleryId: editGallery.id })
        }).then(() => toast.success("Cliente notificado por e-mail!"))
          .catch(err => console.error("Erro ao notificar cliente:", err));
      }

      fetchData();
      setIsSettingsModalOpen(false);
    } catch (error: any) {
      toast.error("Erro ao atualizar galeria: " + error.message);
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (!confirm("⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL.\n\nA galeria e seus links de acesso serão excluídos IMEDIATAMENTE do banco de dados.\n\nNota: Os arquivos originais na 'Nuvem' NÃO serão apagados por segurança. Para liberar espaço, você deve apagá-los manualmente na aba 'Nuvem'.")) return;
    
    try {
      const { error } = await supabase
        .schema('app_carsena')
        .from('galleries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Galeria excluída com sucesso!");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao excluir galeria: " + error.message);
    }
  };

  const handleCopyInvite = (gallery: any) => {
    const url = `${window.location.origin}/v/${gallery.access_code}`;
    const text = `Olá! Sua galeria já está pronta. 📸 ✨\n\nAcesse: ${url}\nSenha/Código: ${gallery.access_code}`;
    navigator.clipboard.writeText(text);
    toast.success("Convite copiado para o WhatsApp!");
  };

  const handleRegisterPayment = async () => {
    if (!selectedGallery || !paymentAmount || Number(paymentAmount) <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    setSavingPayment(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/payments/galleries/${selectedGallery.id}/register-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: Number(paymentAmount), method: paymentMethod })
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast.success(`Pagamento de ${formatCurrency(Number(paymentAmount))} registrado!`);
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao registrar pagamento: " + err.message);
    } finally {
      setSavingPayment(false);
    }
  };

  const filteredGalleries = galleries.filter(g => 
    g.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group galleries by customer for organized display
  const galleriesByCustomer = customers.reduce((acc, customer) => {
    const customerGalleries = filteredGalleries.filter(g => g.customer_id === customer.id);
    // Só adiciona se houver galerias para este cliente
    if (customerGalleries.length > 0) {
      acc.push({ customer, galleries: customerGalleries });
    }
    return acc;
  }, [] as { customer: any; galleries: any[] }[]);

  // Also include galleries with no matching customer
  const uncategorizedGalleries = filteredGalleries.filter(g => !customers.find(c => c.id === g.customer_id));

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!confirm(`Excluir o cliente "${name}"? Esta ação é irreversível e pode afetar galerias vinculadas.`)) return;
    try {
      const { error } = await supabase.schema('app_carsena').from('customers').delete().eq('id', id);
      if (error) throw error;
      toast.success(`Cliente "${name}" excluído.`);
      setCustomers(customers.filter(c => c.id !== id));
    } catch (err: any) {
      toast.error('Erro ao excluir cliente: ' + err.message);
    }
  };

  const renderGalleryCard = (gallery: any, i: number) => {
    const favoritesCount = gallery.favorite_count || 0;
    const galleryPhotos = gallery.photos || [];
    const previewPhotos = galleryPhotos.slice(0, 4);
    const totalPhotos = galleryPhotos.length;
    const hasPhotos = totalPhotos > 0;

    return (
      <motion.div 
        key={gallery.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        className="bg-[#1A1A1A] border border-white/10 overflow-hidden group hover:border-luxury-gold transition-all cursor-pointer shadow-2xl flex flex-col"
      >
        {/* Visual Preview Area - NO GRAYSCALE, High Visibility */}
        <div 
          onClick={() => { setSelectedGallery(gallery); setIsEditModalOpen(true); }}
          className="aspect-square bg-black relative overflow-hidden"
        >
          {hasPhotos ? (
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5">
              {previewPhotos.map((p: any) => (
                <div key={p.id} className="relative overflow-hidden">
                  <img 
                    src={getStoragePublicUrl(p.thumbnail_path || p.storage_path)} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt="preview"
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                </div>
              ))}
              {/* Fill remaining slots if < 4 photos */}
              {Array.from({ length: Math.max(0, 4 - previewPhotos.length) }).map((_, idx) => (
                <div key={`empty-${idx}`} className="bg-white/[0.02]" />
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white/[0.02] border-b border-white/5 gap-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <ImageIcon size={32} className="text-luxury-gold/30" />
              </div>
              <span className="text-[12px] uppercase tracking-[0.3em] font-bold text-white/40">Nenhuma foto</span>
            </div>
          )}

          {/* Status Ribbons - BIG & CLEAR */}
          <div className="absolute top-4 left-0 flex flex-col items-start gap-2 z-10">
            <div className={cn(
              "px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl",
              gallery.status === 'published' ? "bg-luxury-gold text-black" : "bg-white/20 text-white"
            )}>
              {gallery.status === 'published' ? '✨ PUBLICADA' : '📝 RASCUNHO'}
            </div>
            
            {gallery.price === 0 ? (
               <div className="bg-blue-600 text-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                 🎁 CORTESIA
               </div>
            ) : gallery.amount_paid >= gallery.price ? (
               <div className="bg-emerald-600 text-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                 ✅ PAGO
               </div>
            ) : (
               <div className="bg-red-600 text-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                 💰 PENDENTE
               </div>
            )}
          </div>

          {/* Favorites Badge */}
          {favoritesCount > 0 && (
            <div className="absolute top-4 right-4 bg-white text-luxury-black px-3 py-2 rounded-full flex items-center gap-2 shadow-2xl animate-pulse z-10 border-2 border-luxury-gold">
              <Heart size={14} fill="#C5A572" className="text-luxury-gold" />
              <span className="text-[12px] font-black">{favoritesCount}</span>
            </div>
          )}

          {/* Gallery Access Overlay on Hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
             <button 
               onClick={(e) => { e.stopPropagation(); setSelectedGallery(gallery); setIsEditModalOpen(true); }}
               className="bg-luxury-gold text-black px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300"
             >
               GERENCIAR FOTOS
             </button>
          </div>
        </div>

        {/* Info Area - Clean & High Contrast */}
        <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-start gap-4">
              <h3 className="text-serif text-2xl leading-none tracking-tight text-white group-hover:text-luxury-gold transition-colors truncate">
                {gallery.title}
              </h3>
              <span className="text-[10px] font-mono text-white/40 pt-1">
                {gallery.date ? new Date(gallery.date).toLocaleDateString('pt-BR') : '--/--/--'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-luxury-gold/20 flex items-center justify-center">
                <User size={10} className="text-luxury-gold" />
              </div>
              <p className="text-[11px] text-white/60 uppercase tracking-widest font-bold">
                {gallery.client_name}
              </p>
            </div>
          </div>

          {/* Large Action Buttons Row */}
          <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
             <button 
               onClick={(e) => { e.stopPropagation(); handleCopyInvite(gallery); }}
               className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-[9px] font-bold uppercase tracking-widest transition-all border border-white/5"
             >
               <Copy size={14} /> Convite
             </button>
             <button 
               onClick={(e) => { e.stopPropagation(); setEditGallery(gallery); setIsSettingsModalOpen(true); }}
               className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-[9px] font-bold uppercase tracking-widest transition-all border border-white/5"
             >
               <Settings size={14} /> Ajustes
             </button>
          </div>

          {/* Money & Delete row */}
          <div className="flex items-center justify-between text-[10px] pt-1">
            <div className="flex flex-col">
              {gallery.price > 0 && gallery.amount_paid < gallery.price && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedGallery(gallery); setIsPaymentModalOpen(true); }}
                  className="text-emerald-500 font-black tracking-widest hover:text-emerald-400 transition-colors uppercase flex items-center gap-1"
                >
                  <Plus size={12} strokeWidth={3} /> Receber Saldo
                </button>
              )}
            </div>
            
            <button 
               onClick={(e) => { e.stopPropagation(); handleDeleteGallery(gallery.id); }}
               className="text-red-500/30 hover:text-red-500 transition-all p-2"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Meu Estúdio" 
        subtitle="Gestão de clientes, sessões e entregas de fotos" 
        action={activeTab === 'sessions' ? "Nova Sessão" : activeTab === 'customers' ? "Novo Cliente" : "Novo Admin"} 
        onAction={() => {
           if (activeTab === 'sessions') {
              setIsModalOpen(true);
           } else if (activeTab === 'customers') {
              setNewClient({ name: '', email: '', phone: '' });
              setIsCustomerModalOpen(true);
           } else {
              setNewAdmin({ name: '', email: '', user_type: 'photographer' });
              setIsAdminModalOpen(true);
           }
        }}
      />
      
      <div className="space-y-8">
        {/* Tab Selection & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-6">
          <div className="flex gap-8">
            <button 
              onClick={() => setActiveTab('sessions')}
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.4em] pb-4 transition-all relative",
                activeTab === 'sessions' ? "text-luxury-gold" : "text-luxury-cream/30 hover:text-luxury-cream"
              )}
            >
              Sessões
              {activeTab === 'sessions' && <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 right-0 h-px bg-luxury-gold" />}
            </button>
            <button 
              onClick={() => setActiveTab('customers')}
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.4em] pb-4 transition-all relative",
                activeTab === 'customers' ? "text-luxury-gold" : "text-luxury-cream/30 hover:text-luxury-cream"
              )}
            >
              Clientes
              {activeTab === 'customers' && <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 right-0 h-px bg-luxury-gold" />}
            </button>
            <button 
              onClick={() => setActiveTab('admins')}
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.4em] pb-4 transition-all relative",
                activeTab === 'admins' ? "text-luxury-gold" : "text-luxury-cream/30 hover:text-luxury-cream"
              )}
            >
              Equipe
              {activeTab === 'admins' && <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 right-0 h-px bg-luxury-gold" />}
            </button>
          </div>

          <div className="flex-1 max-w-md w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar..." 
              className="w-full bg-white/5 border border-white/5 px-12 py-4 text-xs text-luxury-cream outline-none focus:border-luxury-gold/50 transition-colors uppercase tracking-widest"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="aspect-square bg-white/5 animate-pulse" />)}
          </div>
        ) : activeTab === 'sessions' ? (
          <div className="space-y-10">
            {/* Ungrouped (no customer match) */}
            {uncategorizedGalleries.length > 0 && (
              <div className="space-y-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-luxury-cream/20 border-b border-white/5 pb-2">Sem cliente vinculado</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {uncategorizedGalleries.map((gallery, i) => renderGalleryCard(gallery, i))}
                </div>
              </div>
            )}

{/* Per-client groups */}
            {galleriesByCustomer.map(({ customer, galleries: clientGalleries }: { customer: any; galleries: any[] }) => (
              <div key={customer.id} className="space-y-4">
                <div className="flex items-center gap-4 border-b border-white/5 pb-3">
                  <div className="w-8 h-8 bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center">
                    <span className="text-luxury-gold text-xs font-bold">{customer.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-luxury-cream">{customer.name}</p>
                    <p className="text-[8px] text-luxury-cream/30 uppercase tracking-widest">{clientGalleries.length} sess{clientGalleries.length === 1 ? 'ão' : 'ões'}</p>
                  </div>
                </div>
                {clientGalleries.length === 0 ? (
                  <p className="text-[9px] text-luxury-cream/20 uppercase tracking-widest pl-12">Nenhuma sessão para este cliente</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clientGalleries.map((gallery: any, i: number) => renderGalleryCard(gallery, i))}
                  </div>
                )}
              </div>
            ))}

            {galleriesByCustomer.length === 0 && uncategorizedGalleries.length === 0 && (
              <div className="py-20 text-center border border-dashed border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-luxury-cream/20">Nenhuma galeria encontrada</p>
              </div>
            )}
          </div>

        ) : activeTab === 'customers' ? (
          /* Customers Table View */
          <div className="bg-white/5 border border-white/5 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/2">
                  <th className="p-6 text-[9px] font-bold uppercase tracking-widest text-luxury-cream/30">Nome</th>
                  <th className="p-6 text-[9px] font-bold uppercase tracking-widest text-luxury-cream/30">Sessões</th>
                  <th className="p-6 text-[9px] font-bold uppercase tracking-widest text-luxury-cream/30 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="p-6">
                      <p className="text-xs uppercase tracking-widest font-bold">{customer.name}</p>
                      <p className="text-[9px] text-luxury-cream/40 uppercase tracking-widest mt-1">{customer.email} • {customer.phone || 'Sem Telefone'}</p>
                      <p className="text-[8px] text-luxury-gold/60 uppercase tracking-widest mt-0.5">Cód: {customer.access_code}</p>
                    </td>
                    <td className="p-6">
                      <span className="text-[10px] text-luxury-cream/50 font-bold">
                        {galleries.filter(g => g.customer_id === customer.id).length}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-end items-center gap-4">
                        <button 
                           className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold hover:text-white transition-colors"
                           onClick={(e) => {
                              e.stopPropagation();
                              setNewClient(customer);
                              setIsCustomerModalOpen(true);
                           }}
                        >
                           Editar
                        </button>
                        <button 
                           className="text-[9px] font-bold uppercase tracking-widest text-red-500/40 hover:text-red-400 transition-colors"
                           onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomer(customer.id, customer.name);
                           }}
                        >
                           Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Admins/Team Table View */
          <div className="bg-white/5 border border-white/5 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/2">
                  <th className="p-6 text-[9px] font-bold uppercase tracking-widest text-luxury-cream/30">Membro</th>
                  <th className="p-6 text-[9px] font-bold uppercase tracking-widest text-luxury-cream/30">Nível</th>
                  <th className="p-6 text-[9px] font-bold uppercase tracking-widest text-luxury-cream/30 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="p-6">
                      <p className="text-xs uppercase tracking-widest font-bold">{p.name}</p>
                      <p className="text-[9px] text-luxury-cream/40 uppercase tracking-widest mt-1">{p.email}</p>
                    </td>
                    <td className="p-6">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold/60">
                        {p.user_type === 'admin' ? 'Proprietário' : 'Fotógrafo'}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-end items-center gap-4">
                        <button 
                           className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold hover:text-white transition-colors"
                           onClick={(e) => {
                              e.stopPropagation();
                              setEditingAdmin(p);
                              setIsAdminModalOpen(true);
                           }}
                        >
                           Editar
                        </button>
                        <button 
                           className="text-[9px] font-bold uppercase tracking-widest text-red-500/40 hover:text-red-400 transition-colors"
                           onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAdmin(p.id, p.name);
                           }}
                        >
                           Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Session (Gallery) Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Sessão">
        <form className="space-y-6" onSubmit={handleCreateGallery}>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-cream/40 font-bold">Cliente</label>
            <select 
              required
              value={newGallery.customer_id}
              onChange={(e) => setNewGallery({ ...newGallery, customer_id: e.target.value })}
              className="w-full bg-white/5 border border-white/5 py-4 px-4 text-xs text-luxury-cream outline-none focus:border-luxury-gold/50 transition-colors uppercase tracking-widest"
            >
              <option value="" className="bg-luxury-black">Selecionar Cliente...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id} className="bg-luxury-black">{c.name}</option>
              ))}
            </select>
            {customers.length === 0 && (
              <p className="text-[8px] text-luxury-gold/60 uppercase tracking-widest mt-1">Nenhum cliente cadastrado. Crie um primeiro.</p>
            )}
          </div>

          <FormInput 
            label="Título da Galeria" 
            placeholder="Ex: Casamento Civil" 
            icon={<Camera size={16} />} 
            value={newGallery.title}
            onChange={(val) => setNewGallery({ ...newGallery, title: val })}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormInput 
              label="Data da Sessão" 
              type="date"
              placeholder="AAAA-MM-DD" 
              icon={<Calendar size={16} />} 
              value={newGallery.date}
              onChange={(val) => setNewGallery({ ...newGallery, date: val })}
            />
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-cream/40 font-bold">Tipo</label>
              <select 
                value={newGallery.event_type}
                onChange={(e) => setNewGallery({ ...newGallery, event_type: e.target.value })}
                className="w-full bg-white/5 border border-white/5 py-4 px-4 text-xs text-luxury-cream outline-none focus:border-luxury-gold/50 transition-colors uppercase tracking-widest"
              >
                <option value="Wedding" className="bg-luxury-black">Wedding</option>
                <option value="Portrait" className="bg-luxury-black">Portrait</option>
                <option value="Event" className="bg-luxury-black">Event</option>
              </select>
            </div>
          </div>

          <FormInput 
            label="Expira em" 
            type="date"
            placeholder="AAAA-MM-DD" 
            icon={<Clock size={16} />} 
            value={newGallery.expires_at}
            onChange={(val) => setNewGallery({ ...newGallery, expires_at: val })}
          />

          <FormInput 
            label="Caminho Cloud (R2)" 
            placeholder="Ex: 2026/juliana-marcio" 
            icon={<Globe size={16} />} 
            value={newGallery.storage_path}
            onChange={(val) => setNewGallery({ ...newGallery, storage_path: val })}
          />

          {/* Gallery Type Selector */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-cream/40 font-bold">Tipo de Cobrança</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'courtesy', label: 'Cortésia', desc: 'Gratuito', color: 'border-white/20 hover:border-white/40' },
                { key: 'unpaid', label: 'Não Pago', desc: 'Pendente', color: 'border-red-500/30 hover:border-red-400/60' },
                { key: 'partial', label: 'Sinal + Saldo', desc: 'Parcial', color: 'border-yellow-500/30 hover:border-yellow-400/60' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setGalleryType(t.key as any);
                    if (t.key === 'courtesy') {
                      setNewGallery(g => ({ ...g, price: 0, amount_paid: 0 }));
                    } else if (t.key === 'unpaid') {
                      setNewGallery(g => ({ ...g, amount_paid: 0 }));
                    }
                  }}
                  className={cn(
                    'p-3 border text-center transition-all',
                    galleryType === t.key
                      ? 'border-luxury-gold bg-luxury-gold/10 text-luxury-gold'
                      : `${t.color} text-white/40`
                  )}
                >
                  <p className="text-[9px] font-bold uppercase tracking-wider">{t.label}</p>
                  <p className="text-[8px] opacity-60 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Price fields — hidden for courtesy */}
          {galleryType !== 'courtesy' && (
            <div className="grid grid-cols-2 gap-4">
              <FormInput 
                label="Valor do Pacote (Total)" 
                type="number"
                placeholder="0.00" 
                icon={<CreditCard size={16} />} 
                value={newGallery.price?.toString() || "0"}
                onChange={(val) => setNewGallery({ ...newGallery, price: parseFloat(val) || 0 })}
              />
              {galleryType === 'partial' && (
                <FormInput 
                  label="Sinal já Pago" 
                  type="number"
                  placeholder="0.00" 
                  icon={<CreditCard size={16} />} 
                  value={newGallery.amount_paid?.toString() || "0"}
                  onChange={(val) => setNewGallery({ ...newGallery, amount_paid: parseFloat(val) || 0 })}
                />
              )}
            </div>
          )}
          
          <div className="pt-6">
            <button className="w-full bg-luxury-gold text-black py-5 text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-white transition-all shadow-xl">
              Criar Galeria & Notificar Cliente
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Payment Registration Modal */}
      <Modal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        title="Registrar Pagamento"
      >
        <div className="space-y-8">
          {selectedGallery && (
            <div className="bg-white/5 border border-white/5 p-6 space-y-2">
              <p className="text-[9px] uppercase tracking-widest text-luxury-cream/30">Galeria</p>
              <p className="text-lg font-serif text-luxury-cream">{selectedGallery.title}</p>
              <div className="flex gap-6 text-[10px] text-luxury-cream/50 uppercase tracking-widest mt-2">
                <span>Total: {formatCurrency(Number(selectedGallery.price))}</span>
                <span>Pago: {formatCurrency(Number(selectedGallery.amount_paid))}</span>
                <span className="text-luxury-gold font-bold">
                  Restante: {formatCurrency(Number(selectedGallery.price) - Number(selectedGallery.amount_paid))}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-cream/40 font-bold">Valor Recebido (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Ex: 500.00"
              className="w-full bg-white/5 border border-white/5 py-4 px-4 text-xs text-luxury-cream outline-none focus:border-luxury-gold/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-cream/40 font-bold">Método</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-white/5 border border-white/5 py-4 px-4 text-xs text-luxury-cream outline-none focus:border-luxury-gold/50 transition-colors uppercase tracking-widest"
            >
              <option value="manual" className="bg-luxury-black">Dinheiro / Presencial</option>
              <option value="pix_manual" className="bg-luxury-black">PIX (recebido pelo celular)</option>
              <option value="transfer" className="bg-luxury-black">Transferência Bancária</option>
              <option value="card" className="bg-luxury-black">Cartão (Maquininha)</option>
            </select>
          </div>

          <button
            onClick={handleRegisterPayment}
            disabled={savingPayment}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 text-[11px] font-bold uppercase tracking-[0.4em] transition-all shadow-xl disabled:opacity-50"
          >
            {savingPayment ? 'Registrando...' : 'Confirmar Pagamento'}
          </button>
        </div>
      </Modal>

      {/* New/Edit Customer Modal */}
      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title={newClient?.id ? "Editar Cliente" : "Novo Cliente"}>
        <form className="space-y-6" onSubmit={handleSaveClient}>
          <FormInput 
            label="Nome Completo" 
            placeholder="Ex: Julia Menezes" 
            icon={<User size={16} />} 
            value={newClient.name}
            onChange={(val) => setNewClient({ ...newClient, name: val })}
          />
          <FormInput 
            label="E-mail" 
            type="email"
            placeholder="julia@exemplo.com" 
            icon={<Globe size={16} />} 
            value={newClient.email}
            onChange={(val) => setNewClient({ ...newClient, email: val })}
          />
          <FormInput 
            label="WhatsApp / Telefone" 
            placeholder="+(55) 11 ..." 
            icon={<Search size={16} />} 
            value={newClient.phone}
            onChange={(val) => setNewClient({ ...newClient, phone: val })}
          />
          
          <div className="pt-6">
            <button className="w-full bg-luxury-gold text-black py-5 text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-white transition-all shadow-xl">
              Salvar Cadastro
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Gallery / Upload Photos Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title={`Gerenciar: ${selectedGallery?.title}`}
      >
        <div className="space-y-8">
          <div className="bg-luxury-gold/5 border border-luxury-gold/10 p-6 rounded-xl">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold mb-2">Upload de Fotos</h4>
            <p className="text-xs text-white/60 mb-6">As fotos serão carregadas diretamente para o Cloudflare R2 e vinculadas a esta sessão.</p>
            
            {selectedGallery && (
              <UploadZone 
                galleryId={selectedGallery.id} 
                onUploadComplete={() => fetchData()} 
              />
            )}
          </div>

          <div className="border-t border-white/5 pt-8">
            {selectedGallery && (
              <AdminGalleryMedia 
                galleryId={selectedGallery.id}
                coverImageUrl={selectedGallery.cover_url}
                onUpdate={() => fetchData()}
              />
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Configurações Rápidas</h4>
            <div className="flex gap-4">
              <button 
                type="button"
                className="flex-1 bg-white/5 border border-white/10 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all text-red-500/80 hover:text-red-500"
                onClick={handleClearGallery}
              >
                Limpar Galeria
              </button>
              <button 
                className="flex-1 bg-luxury-gold text-black py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all"
                onClick={() => setIsEditModalOpen(false)}
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Gallery Settings Modal (Watermark, etc) */}
      <Modal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        title="Configurações da Galeria"
      >
        {editGallery && (
          <form className="space-y-6" onSubmit={handleUpdateGallery}>
            <FormInput 
              label="Título da Galeria" 
              placeholder="Título" 
              value={editGallery.title}
              onChange={(val) => setEditGallery({ ...editGallery, title: val })}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput 
                label="Data da Sessão" 
                type="date"
                placeholder="AAAA-MM-DD" 
                icon={<Calendar size={16} />} 
                value={editGallery.date?.split('T')[0] || ""}
                onChange={(val) => setEditGallery({ ...editGallery, date: val })}
              />
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-cream/40 font-bold">Tipo</label>
                <select 
                  value={editGallery.event_type}
                  onChange={(e) => setEditGallery({ ...editGallery, event_type: e.target.value })}
                  className="w-full bg-white/5 border border-white/5 py-4 px-4 text-xs text-luxury-cream outline-none focus:border-luxury-gold/50 transition-colors uppercase tracking-widest"
                >
                  <option value="Wedding" className="bg-luxury-black">Wedding</option>
                  <option value="Portrait" className="bg-luxury-black">Portrait</option>
                  <option value="Event" className="bg-luxury-black">Event</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <FormInput 
                 label="Valor Pacote (Total)" 
                 type="number"
                 placeholder="0.00" 
                 icon={<CreditCard size={16} />} 
                 value={editGallery.price?.toString() || "0"}
                 onChange={(val) => setEditGallery({ ...editGallery, price: parseFloat(val) || 0 })}
               />
               <FormInput 
                 label="Sinal Pago (Adiantado)" 
                 type="number"
                 placeholder="0.00" 
                 icon={<CreditCard size={16} />} 
                 value={editGallery.amount_paid?.toString() || "0"}
                 onChange={(val) => setEditGallery({ ...editGallery, amount_paid: parseFloat(val) || 0 })}
               />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-cream/40 font-bold">Status</label>
                <select 
                  value={editGallery.status}
                  onChange={(e) => setEditGallery({ ...editGallery, status: e.target.value })}
                  className="w-full bg-white/5 border border-white/5 py-4 px-4 text-xs text-luxury-cream outline-none focus:border-luxury-gold/50 transition-colors uppercase tracking-widest"
                >
                  <option value="draft" className="bg-luxury-black">Rascunho</option>
                  <option value="published" className="bg-luxury-black">Publicada</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold">Marca d'Água</h4>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mt-1">Habilitar proteção visual</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditGallery({ ...editGallery, watermark_enabled: !editGallery.watermark_enabled })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
                    editGallery.watermark_enabled ? "bg-luxury-gold" : "bg-white/10"
                  )}
                >
                  <motion.div 
                    animate={{ x: editGallery.watermark_enabled ? 24 : 0 }}
                    className="w-4 h-4 bg-white rounded-full shadow-lg"
                  />
                </button>
              </div>

              {editGallery.watermark_enabled && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-cream/40 font-bold">Tipo</label>
                      <select 
                        value={editGallery.watermark_type}
                        onChange={(e) => setEditGallery({ ...editGallery, watermark_type: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 py-4 px-4 text-xs text-luxury-cream outline-none focus:border-luxury-gold/50 transition-colors uppercase tracking-widest"
                      >
                        <option value="text" className="bg-luxury-black">Texto</option>
                        <option value="image" className="bg-luxury-black">Lógica (Imagem)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-cream/40 font-bold">Posição</label>
                      <select 
                        value={editGallery.watermark_position}
                        onChange={(e) => setEditGallery({ ...editGallery, watermark_position: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 py-4 px-4 text-xs text-luxury-cream outline-none focus:border-luxury-gold/50 transition-colors uppercase tracking-widest"
                      >
                        <option value="center" className="bg-luxury-black">Centro</option>
                        <option value="top-left" className="bg-luxury-black">Topo Esquerda</option>
                        <option value="top-right" className="bg-luxury-black">Topo Direita</option>
                        <option value="bottom-left" className="bg-luxury-black">Base Esquerda</option>
                        <option value="bottom-right" className="bg-luxury-black">Base Direita</option>
                      </select>
                    </div>
                  </div>

                  {editGallery.watermark_type === 'text' && (
                    <FormInput 
                      label="Texto da Marca" 
                      placeholder="Ex: @fotografo" 
                      value={editGallery.watermark_text}
                      onChange={(val) => setEditGallery({ ...editGallery, watermark_text: val })}
                    />
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-cream/40 font-bold">Opacidade ({Math.round((editGallery.watermark_opacity || 0.5) * 100)}%)</label>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1" 
                      step="0.1"
                      value={editGallery.watermark_opacity || 0.5}
                      onChange={(e) => setEditGallery({ ...editGallery, watermark_opacity: parseFloat(e.target.value) })}
                      className="w-full accent-luxury-gold"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-cream/40 font-bold">Escala ({Math.round((editGallery.watermark_scale || 0.2) * 100)}%)</label>
                    </div>
                    <input 
                      type="range" 
                      min="0.05" 
                      max="0.5" 
                      step="0.05"
                      value={editGallery.watermark_scale || 0.2}
                      onChange={(e) => setEditGallery({ ...editGallery, watermark_scale: parseFloat(e.target.value) })}
                      className="w-full accent-luxury-gold"
                    />
                  </div>
                </motion.div>
              )}
            </div>
            
            <div className="pt-6">
              <button 
                type="submit"
                className="w-full bg-luxury-gold text-black py-5 text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-white transition-all shadow-xl flex items-center justify-center gap-3"
              >
                <Save size={16} />
                Salvar Configurações
              </button>
            </div>
          </form>
        )}
      </Modal>
 
       {/* Admin/Team Member Modal */}
       <Modal 
         isOpen={isAdminModalOpen} 
         onClose={() => { setIsAdminModalOpen(false); setEditingAdmin(null); }} 
         title={editingAdmin ? "Editar Administrador" : "Novo Administrador"}
       >
         <form className="space-y-6" onSubmit={handleSaveAdmin}>
           <FormInput 
             label="Nome Completo" 
             placeholder="Ex: João Silva" 
             icon={<User size={16} />} 
             value={editingAdmin ? editingAdmin.name : newAdmin.name}
             onChange={(val) => editingAdmin 
               ? setEditingAdmin({ ...editingAdmin, name: val })
               : setNewAdmin({ ...newAdmin, name: val })
             }
           />
           
           <FormInput 
             label="Email" 
             type="email"
             placeholder="email@carsena.com" 
             icon={<Globe size={16} />} 
             value={editingAdmin ? editingAdmin.email : newAdmin.email}
             onChange={(val) => editingAdmin
               ? setEditingAdmin({ ...editingAdmin, email: val })
               : setNewAdmin({ ...newAdmin, email: val })
             }
             disabled={!!editingAdmin}
           />
 
           <div className="space-y-2">
             <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-cream/40 font-bold">Nível de Acesso</label>
             <select 
               value={editingAdmin ? editingAdmin.user_type : newAdmin.user_type}
               onChange={(e) => editingAdmin
                 ? setEditingAdmin({ ...editingAdmin, user_type: e.target.value as any })
                 : setNewAdmin({ ...newAdmin, user_type: e.target.value as any })
               }
               className="w-full bg-white/5 border border-white/5 py-4 px-4 text-xs text-luxury-cream outline-none focus:border-luxury-gold/50 transition-colors uppercase tracking-widest"
             >
               <option value="photographer" className="bg-luxury-black">Fotógrafo</option>
               <option value="admin" className="bg-luxury-black">Proprietário (Admin)</option>
             </select>
           </div>
 
           <div className="pt-6">
             <button 
               type="submit"
               className="w-full bg-luxury-gold text-black py-5 text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-white transition-all shadow-xl flex items-center justify-center gap-3"
             >
               <Save size={16} />
               {editingAdmin ? "Salvar Alterações" : "Criar Administrador"}
             </button>
           </div>
         </form>
       </Modal>
    </AdminLayout>
  );
};

export const AdminTickets = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isCourtesyModalOpen, setIsCourtesyModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [courtesyData, setCourtesyData] = useState({ name: '', email: '' });
  const [batches, setBatches] = useState<any[]>([]);
  const [newBatch, setNewBatch] = useState({
    name: '',
    price: 0,
    stock_total: 100,
    active: true
  });
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState<{ title: string; location: string; date: string; description: string; file: File | null }>({
    title: '',
    location: '',
    date: '',
    description: '',
    file: null
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await eventService.getAllEventsAdmin();
      setEvents(data);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast.error("Erro ao carregar agenda.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      await eventService.toggleStatus(id, currentStatus);
      toast.success(currentStatus === 'open' ? "Vendas pausadas com sucesso!" : "Evento publicado com sucesso!");
      fetchEvents();
    } catch (error) {
      toast.error("Erro ao alterar status.");
    }
  };

  const fetchBatches = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .schema('app_carsena')
        .from('ticket_tiers')
        .select('*')
        .eq('event_id', eventId)
        .order('price', { ascending: true });

      if (error) throw error;
      setBatches(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar lotes: " + error.message);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let thumbnail_url = null;

      if (newEvent.file) {
        toast.info("Enviando capa do evento pro R2...");
        // Faz o upload direto pra pasta "events" do R2
        thumbnail_url = await uploadDirect(newEvent.file, "events");
      }

      const { file, ...eventData } = newEvent;

      const { error } = await supabase
        .schema('app_carsena')
        .from('events')
        .insert([{
          ...eventData,
          thumbnail_url, // Salva o caminho do R2
          price: 0,
          status: 'open'
        }]);

      if (error) throw error;
      
      toast.success("Evento criado com sucesso!");
      setIsModalOpen(false);
      setNewEvent({ title: '', location: '', date: '', description: '', file: null });
      fetchEvents();
    } catch (error: any) {
      toast.error("Erro ao criar evento: " + error.message);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este evento e todos os ingressos relacionados?")) return;
    
    try {
      const { error } = await supabase
        .schema('app_carsena')
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Evento removido!");
      setEvents(events.filter(e => e.id !== id));
    } catch (error: any) {
      toast.error("Erro ao excluir evento: " + error.message);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      const { error } = await supabase
        .schema('app_carsena')
        .from('ticket_tiers')
        .insert([{
          event_id: selectedEvent.id,
          name: newBatch.name,
          price: newBatch.price,
          stock_total: newBatch.stock_total,
          stock_sold: 0,
          active: true
        }]);

      if (error) throw error;

      toast.success("Lote adicionado!");
      setNewBatch({ name: '', price: 0, stock_total: 100, active: true });
      fetchBatches(selectedEvent.id);
      fetchEvents();
    } catch (error: any) {
      toast.error("Erro ao criar lote: " + error.message);
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (!confirm("Excluir este lote?")) return;
    try {
      const { error } = await supabase
        .schema('app_carsena')
        .from('ticket_tiers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBatches(batches.filter(b => b.id !== id));
      fetchEvents();
    } catch (error: any) {
      toast.error("Erro ao remover lote: " + error.message);
    }
  };

  const handleCreateCourtesyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch || !selectedEvent) {
      toast.error("Lote ou Evento não selecionado.");
      return;
    }

    try {
      // 1. Verificar/Criar Cliente
      let customerId = null;
      if (courtesyData.email) {
        const { data: existingCustomer } = await supabase
          .schema('app_carsena')
          .from('customers')
          .select('id')
          .eq('email', courtesyData.email)
          .maybeSingle();
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else if (courtesyData.name) {
          const { data: newCustomer, error: createError } = await supabase
            .schema('app_carsena')
            .from('customers')
            .insert([{
              name: courtesyData.name,
              email: courtesyData.email,
              phone: ''
            }])
            .select()
            .single();
          
          if (createError) throw createError;
          customerId = newCustomer.id;
        }
      }

      // 2. Criar a Order (Invisível pro cliente, mas visível pro Financeiro)
      // Isso integra a Bilheteria com a tela de Caixa
      const { data: orderData, error: orderError } = await supabase
        .schema('app_carsena')
        .from('orders')
        .insert([{
          customer_id: customerId,
          total_amount: 0, // Cortesia é valor zero
          status: 'paid',
          item_type: 'ticket',
          item_id: selectedEvent.id,
          payment_method: 'courtesy'
        }])
        .select()
        .single();
      
      if (orderError) throw orderError;

      // 3. Inserir the ticket
      const { error: ticketError } = await supabase
        .schema('app_carsena')
        .from('tickets')
        .insert([{
          event_id: selectedEvent.id,
          tier_id: selectedBatch.id,
          customer_name: courtesyData.name,
          customer_email: courtesyData.email,
          status: 'active',
          payment_status: 'paid',
          order_id: orderData.id, // Referência opcional pro pedido
          qr_code: `CORTESIA-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
        }]);

      if (ticketError) throw ticketError;

      // 4. Incrementar o estoque vendido do lote
      const { error: updateError } = await supabase
        .schema('app_carsena')
        .from('ticket_tiers')
        .update({ stock_sold: (selectedBatch.stock_sold || 0) + 1 })
        .eq('id', selectedBatch.id);

      if (updateError) throw updateError;

      toast.success("Ingresso de Cortesia & Lancamento no Caixa gerados com sucesso!");
      setIsCourtesyModalOpen(false);
      setCourtesyData({ name: '', email: '' });
      
      // Recarregar dados
      fetchBatches(selectedEvent.id);
      fetchEvents();
    } catch (error: any) {
      toast.error("Erro ao gerar cortesia integrada: " + error.message);
    }
  };

  const calculateEventStats = (event: any) => {
    const tiers = event.ticket_tiers || [];
    const tickets = event.tickets || [];

    const sold = tiers.reduce((acc: number, t: any) => acc + (t.stock_sold || 0), 0);
    const total = tiers.reduce((acc: number, t: any) => acc + (t.stock_total || 0), 0);
    const revenue = tiers.reduce((acc: number, t: any) => acc + ((t.stock_sold || 0) * (t.price || 0)), 0);
    const checkins = tickets.filter((t: any) => t.checked_in_at !== null && !t.is_revoked).length;

    return { sold, total, revenue, checkins };
  };


  const renderEventCard = (event: any, i: number) => {
    const { sold, total, revenue, checkins } = calculateEventStats(event);
    const percentSold = total > 0 ? (sold / total) * 100 : 0;

    return (
      <motion.div 
        key={event.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        className="group relative bg-white/[0.02] border border-white/5 hover:border-luxury-gold/30 transition-all overflow-hidden flex flex-col"
      >
        {/* Badge de Status/Publicação */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <span className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest",
            event.status === 'open' ? "bg-green-500/10 text-green-500" : "bg-white/10 text-white/40"
          )}>
            <div className={cn("w-1 h-1 rounded-full", event.status === 'open' ? "bg-green-500 animate-pulse" : "bg-white/40")} />
            {event.status === 'open' ? "Vendas Abertas" : "Pausado / Rascunho"}
          </span>
        </div>

        <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
            onClick={() => handleToggleStatus(event.id, event.status)}
            className="p-2 bg-black/60 backdrop-blur-md border border-white/10 text-white hover:text-luxury-gold transition-colors rounded-lg"
            title={event.status === 'open' ? "Pausar Vendas" : "Publicar na Vitrine"}
          >
            {event.status === 'open' ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        <div className="aspect-[21/9] bg-black relative overflow-hidden">
          {event.thumbnail_url ? (
            <img 
              src={getStoragePublicUrl(event.thumbnail_url)} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60"
              alt="cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
              <Ticket size={40} className="text-luxury-gold/20" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] to-transparent" />
          
          <div className="absolute bottom-4 left-6 right-6">
            <h3 className="text-serif text-2xl text-white group-hover:text-luxury-gold transition-colors truncate">
              {event.title}
            </h3>
            <div className="flex items-center gap-4 text-[10px] text-white/40 uppercase tracking-widest mt-1">
              <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(event.date).toLocaleDateString('pt-BR')}</span>
              <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/60">
              <span>Ocupação</span>
              <span>{sold} / {total} Ingressos</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percentSold}%` }}
                className="h-full bg-luxury-gold shadow-[0_0_10px_rgba(197,165,114,0.5)]"
              />
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-4 flex justify-between items-center rounded-sm">
            <div>
              <p className="text-[8px] uppercase tracking-widest text-white/40 mb-1">Receita Atual</p>
              <p className="text-xl font-serif text-emerald-500">{formatCurrency(revenue || 0)}</p>
            </div>
            <div className="text-right">
               <p className="text-[8px] uppercase tracking-widest text-white/40 mb-1">Check-ins</p>
               <p className={cn(
                 "text-xl font-serif",
                 checkins > 0 ? "text-luxury-gold" : "text-white/20"
               )}>{checkins}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button 
               onClick={() => { setSelectedEvent(event); setIsBatchModalOpen(true); fetchBatches(event.id); }}
               className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-[0.2em] transition-all border border-white/10"
             >
               <Settings size={14} className="text-luxury-gold" /> Configurar Lotes
             </button>
             <button 
               onClick={() => navigate('/admin/scanner')}
               className="flex items-center justify-center gap-2 py-4 bg-luxury-gold text-black text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-lg"
             >
               <Maximize size={14} /> Abrir Portaria
             </button>
          </div>

          <div className="flex items-center justify-between pt-2">
             <button 
               className="text-[9px] font-bold uppercase tracking-widest text-white/20 hover:text-luxury-gold transition-colors flex items-center gap-2"
               onClick={() => toast.info("Link da vitrine copiado!")}
             >
               <ExternalLink size={12} /> Ver Vitrine de Vendas
             </button>
             
             <button 
               onClick={() => handleDeleteEvent(event.id)}
               className="text-red-500/20 hover:text-red-500 transition-colors p-2"
             >
               <Trash2 size={14} />
             </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Bilheteria & Ingressos" 
        subtitle="Controle total sobre vendas e acesso aos seus eventos" 
        action="Lançar Evento" 
        onAction={() => setIsModalOpen(true)}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-luxury-gold animate-spin opacity-20" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 border border-white/5 bg-white/[0.01]">
          <Ticket size={48} className="text-luxury-gold/20 mx-auto mb-6" />
          <h3 className="text-serif text-2xl text-white/60 mb-2">Sua Bilheteria está vazia</h3>
          <p className="text-[10px] uppercase tracking-widest text-white/20">Crie seu primeiro evento para começar a vender ingressos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {events.map((event, i) => renderEventCard(event, i))}
        </div>
      )}

      {/* Modal: Novo Evento */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Novo Evento de Bilheteria"
      >
        <form onSubmit={handleCreateEvent} className="space-y-6">
          <FormInput 
            label="Título do Evento" 
            placeholder="Ex: Workshop Photography 2024" 
            value={newEvent.title}
            onChange={(val) => setNewEvent({ ...newEvent, title: val })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput 
              label="Local"
              placeholder="Ex: São Paulo, SP" 
              value={newEvent.location}
              onChange={(val) => setNewEvent({ ...newEvent, location: val })}
              required
            />
            <FormInput 
              label="Data do Evento"
              type="date"
              placeholder="DD/MM/AAAA" 
              icon={<Calendar size={16} />} 
              value={newEvent.date}
              onChange={(val) => setNewEvent({ ...newEvent, date: val })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-cream/40 font-bold">
              Capa da Vitrine (Opcional)
            </label>
            <input 
              type="file"
              accept="image/*"
              onChange={(e) => setNewEvent({ ...newEvent, file: e.target.files?.[0] || null })}
              className="w-full bg-white/5 border border-white/5 py-3 px-4 text-xs text-white outline-none focus:border-luxury-gold/50 transition-colors file:mr-4 file:py-2 file:px-4 file:bg-luxury-gold file:text-black file:border-0 file:font-bold file:uppercase file:tracking-widest file:text-[10px] file:cursor-pointer hover:file:bg-white"
            />
          </div>


          <button 
            type="submit" 
            className="w-full bg-luxury-gold text-black py-5 text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-white transition-all shadow-xl"
          >
            Confirmar Lançamento
          </button>
        </form>
      </Modal>

      {/* Modal: Gestão de Lotes (Batches) */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title={`Lotes: ${selectedEvent?.title}`}
      >
        <div className="space-y-8">
          <form onSubmit={handleCreateBatch} className="bg-white/5 p-6 space-y-4 border border-white/5">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-luxury-gold mb-4">Novo Lote (Ingresso)</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormInput 
                label="Nome do Lote" 
                placeholder="Ex: 1º Lote Promo" 
                value={newBatch.name}
                onChange={(val) => setNewBatch({ ...newBatch, name: val })}
                required
              />
              <FormInput 
                label="Preço (R$)" 
                type="number"
                placeholder="0.00"
                value={newBatch.price.toString()}
                onChange={(val) => setNewBatch({ ...newBatch, price: parseFloat(val) })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput 
                label="Estoque Inicial" 
                type="number"
                placeholder="100"
                value={newBatch.stock_total.toString()}
                onChange={(val) => setNewBatch({ ...newBatch, stock_total: parseInt(val) })}
                required
              />
              <div className="flex items-end pb-1">
                <button 
                  type="submit"
                  className="w-full bg-white text-black py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-luxury-gold transition-all"
                >
                  Adicionar Lote
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Lotes Cadastrados</h4>
            {batches.map((batch) => (
              <div key={batch.id} className="flex items-center justify-between p-4 border border-white/5 bg-white/[0.02]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white">{batch.name}</p>
                  <p className="text-[10px] text-luxury-gold font-mono">{formatCurrency(batch.price || 0)} | Vendidos: {batch.stock_sold}/{batch.stock_total}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setSelectedBatch(batch); setIsCourtesyModalOpen(true); }}
                    className="p-2 text-luxury-gold hover:bg-luxury-gold/10 transition-all rounded-sm flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest"
                    title="Gerar Cortesia"
                  >
                    <Plus size={14} /> Cortesia
                  </button>
                  <button 
                    onClick={() => handleDeleteBatch(batch.id)}
                    className="p-2 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {batches.length === 0 && (
              <div className="py-12 text-center border border-dashed border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-luxury-cream/20">Nenhum lote criado para este evento</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal: Gerar Cortesia */}
      <Modal
        isOpen={isCourtesyModalOpen}
        onClose={() => setIsCourtesyModalOpen(false)}
        title="Gerar Ingresso Cortesia"
      >
        <div className="space-y-6">
          <div className="bg-luxury-gold/5 border border-luxury-gold/20 p-4 rounded-sm">
            <p className="text-[10px] text-luxury-gold font-bold uppercase tracking-widest mb-1">Evento & Lote Selecionado</p>
            <p className="text-sm text-white/80 font-serif lowercase italic">{selectedEvent?.title} — {selectedBatch?.name}</p>
          </div>

          <form onSubmit={handleCreateCourtesyTicket} className="space-y-4">
            <FormInput 
              label="Nome do Convidado" 
              placeholder="Ex: João Silva" 
              value={courtesyData.name}
              onChange={(val) => setCourtesyData({ ...courtesyData, name: val })}
              required
            />
            <FormInput 
              label="E-mail de Envio (Opcional)" 
              type="email"
              placeholder="Ex: joao@email.com" 
              value={courtesyData.email}
              onChange={(val) => setCourtesyData({ ...courtesyData, email: val })}
            />
            
            <button 
              type="submit"
              className="w-full bg-luxury-gold text-black py-5 text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-white transition-all shadow-xl mt-4"
            >
              Confirmar e Gerar Cortesia
            </button>
          </form>
        </div>
      </Modal>

    </AdminLayout>
  );
};

export const AdminFinance = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleMarkAsPaid = async (order: any) => {
    try {
      const isGalleryBalance = order.is_gallery || order.item_type === 'gallery_balance';
      const endpoint = isGalleryBalance 
        ? `/api/payments/galleries/${order.id.replace('gallery-', '')}/register-payment`
        : `/api/payments/orders/${order.id}/mark-as-paid`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: order.total_amount,
          method: 'manual'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar pagamento');
      }
      
      toast.success("Pagamento registrado com sucesso!");
      fetchFinanceData();
    } catch (error: any) {
      toast.error("Erro ao registrar pagamento: " + error.message);
    }
  };

  const fetchFinanceData = async () => {
    try {
      // 1. Fetch Orders
      const { data: ordersData, error: ordersError } = await supabase
        .schema('app_carsena')
        .from('orders')
        .select(`
          *,
          customers ( name )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // 2. Fetch Galleries with Balance
      const { data: galleriesData, error: galleriesError } = await supabase
        .schema('app_carsena')
        .from('galleries')
        .select('*, customers(name)')
        .gt('price', 0);

      if (galleriesError) throw galleriesError;

      // Map galleries to "pseudo-orders" for the finance view if they have a balance
      const galleryBalances = (galleriesData || []).map(g => ({
        id: `gallery-${g.id}`,
        created_at: g.created_at,
        total_amount: Number(g.price) - Number(g.amount_paid || 0),
        status: 'pending',
        item_type: 'gallery_balance',
        is_gallery: true,
        gallery_title: g.title,
        customer_id: g.customer_id,
        customer_name: (g as any).customers?.name || 'Cliente da Galeria'
      })).filter(b => b.total_amount > 0);

      setOrders([...(ordersData || []), ...galleryBalances].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error: any) {
      toast.error("Erro ao carregar dados financeiros: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const totals = orders.reduce((acc, order) => {
    if (order.status === 'paid') {
      acc.revenue += Number(order.total_amount);
      acc.paidCount++;
    } else if (order.status === 'pending') {
      acc.pending += Number(order.total_amount);
    }
    return acc;
  }, { revenue: 0, pending: 0, paidCount: 0 });

  const averageTicket = totals.paidCount > 0 ? totals.revenue / totals.paidCount : 0;

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    return o.status === filter;
  });

  return (
    <AdminLayout>
      <PageHeader title="Fluxo de Caixa" subtitle="Gestão financeira, recebimentos e faturamento" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white/5 border border-white/5 p-8 flex items-center justify-between group hover:border-luxury-gold/20 transition-all">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-luxury-gold/10 flex items-center justify-center text-luxury-gold group-hover:bg-luxury-gold group-hover:text-black transition-all">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-luxury-cream/30 mb-1">Total Disponível (Pago)</p>
              <h3 className="text-2xl font-serif text-luxury-gold">{formatCurrency(totals.revenue)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/5 p-8 flex items-center justify-between group">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white/5 flex items-center justify-center text-luxury-cream/20 font-bold">P</div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-luxury-cream/30 mb-1">A Receber (Pendente)</p>
              <h3 className="text-2xl font-serif text-luxury-cream/60">{formatCurrency(totals.pending)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/5 p-8 flex items-center justify-between group hover:border-luxury-gold/20 transition-all">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-luxury-gold/5 flex items-center justify-center text-luxury-gold/40 transition-all">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-luxury-cream/30 mb-1">Ticket Médio</p>
              <h3 className="text-2xl font-serif text-white/80">{formatCurrency(averageTicket)}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 bg-white/2 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Últimas Movimentações</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => setFilter('all')}
                className={cn("text-[8px] font-bold uppercase tracking-widest transition-colors", filter === 'all' ? "text-luxury-gold" : "text-white/20 hover:text-white/40")}
              >
                Todos
              </button>
              <button 
                onClick={() => setFilter('paid')}
                className={cn("text-[8px] font-bold uppercase tracking-widest transition-colors", filter === 'paid' ? "text-green-500" : "text-white/20 hover:text-white/40")}
              >
                Pagos
              </button>
              <button 
                onClick={() => setFilter('pending')}
                className={cn("text-[8px] font-bold uppercase tracking-widest transition-colors", filter === 'pending' ? "text-yellow-500" : "text-white/20 hover:text-white/40")}
              >
                Pendentes
              </button>
            </div>
          </div>
          <button onClick={() => fetchFinanceData()} className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold hover:text-white transition-colors">Atualizar</button>
        </div>
        
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/2">
              <th className="p-6 text-[9px] font-bold uppercase tracking-widest text-luxury-cream/30">Data</th>
              <th className="p-6 text-[9px] font-bold uppercase tracking-widest text-luxury-cream/30">Referência</th>
              <th className="p-6 text-[9px] font-bold uppercase tracking-widest text-luxury-cream/30">Cliente</th>
              <th className="p-6 text-[9px] font-bold uppercase tracking-widest text-luxury-cream/30">Valor</th>
              <th className="p-6 text-[9px] font-bold uppercase tracking-widest text-luxury-cream/30 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3].map(i => (
                <tr key={i} className="border-b border-white/5 animate-pulse">
                  <td colSpan={5} className="p-6 h-12 bg-white/2" />
                </tr>
              ))
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-[10px] uppercase tracking-widest text-luxury-cream/20">Nenhuma transação encontrada</td>
              </tr>
            ) : filteredOrders.map((order) => (
              <tr key={order.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                <td className="p-6 text-[10px] uppercase tracking-widest text-luxury-cream/60">
                  {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </td>
                <td className="p-6 text-[10px] font-bold uppercase tracking-widest">
                  {order.is_gallery ? `Saldo: ${order.gallery_title}` : (order.item_type === 'ticket' ? 'Ingresso Evento' : 'Galeria de Fotos')}
                </td>
                <td className="p-6 text-[10px] uppercase tracking-widest text-luxury-cream/40">
                  {order.is_gallery ? 'Aguardando Cliente' : (order.customers?.name || 'Cliente Geral')}
                </td>
                <td className="p-6 text-[10px] font-bold tracking-widest text-luxury-gold">
                  {formatCurrency(Number(order.total_amount))}
                </td>
                <td className="p-6 text-right">
                  <div className="flex items-center justify-end gap-4">
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-widest",
                      order.status === 'paid' ? "text-green-500" : "text-yellow-500"
                    )}>
                      {order.status === 'paid' ? 'Pago' : 'Pendente'}
                    </span>
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => handleMarkAsPaid(order)}
                        className="px-3 py-1 bg-white/5 border border-white/10 text-[8px] font-bold uppercase tracking-widest hover:bg-luxury-gold hover:text-black transition-all"
                      >
                        Confirmar Recebimento
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

import { getPhotographers, createPhotographer, deletePhotographer } from "@/lib/api";

const AdminTeam = () => {
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const data = await getPhotographers();
      setPhotographers(data);
    } catch (error: any) {
      toast.error("Erro ao carregar administradores: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPhotographer(newAdmin);
      toast.success("Administrador criado com sucesso!");
      setIsModalOpen(false);
      setNewAdmin({ name: '', email: '', password: '' });
      fetchAdmins();
    } catch (error: any) {
      toast.error("Erro ao criar administrador: " + error.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Remover acesso de ${name}?`)) {
      try {
        await deletePhotographer(id);
        toast.success("Acesso removido.");
        fetchAdmins();
      } catch (error: any) {
        toast.error("Erro ao remover acesso: " + error.message);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-luxury-gold">Equipe Carsena</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="text-[9px] font-bold text-luxury-gold uppercase tracking-widest border border-luxury-gold/20 px-4 py-2 hover:bg-luxury-gold hover:text-black transition-all"
        >
          Novo Administrador
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-12 text-center text-white/20 text-[10px] uppercase tracking-widest">Carregando membros...</div>
        ) : photographers.map(p => (
          <div key={p.id} className="p-6 bg-black/40 border border-white/5 flex items-center justify-between group hover:border-luxury-gold/20 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 flex items-center justify-center text-luxury-cream/40 font-serif italic text-xl">
                {p.name.charAt(0)}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-luxury-cream">{p.name}</p>
                <p className="text-[9px] text-luxury-cream/40 uppercase tracking-widest">{p.email}</p>
              </div>
            </div>
            <button 
              onClick={() => handleDelete(p.id, p.name)}
              className="p-2 text-white/10 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Administrador">
        <form onSubmit={handleAddAdmin} className="space-y-6">
          <FormInput 
            label="Nome Completo" 
            placeholder="Nome Sobrenome" 
            value={newAdmin.name} 
            onChange={(val) => setNewAdmin({...newAdmin, name: val})}
            required 
          />
          <FormInput 
            label="E-mail de Acesso" 
            placeholder="exemplo@email.com" 
            type="email"
            value={newAdmin.email}
            onChange={(val) => setNewAdmin({...newAdmin, email: val})}
            required 
          />
          <FormInput 
            label="Senha Provisória" 
            placeholder="••••••••" 
            type="password"
            value={newAdmin.password}
            onChange={(val) => setNewAdmin({...newAdmin, password: val})}
            required 
          />
          <div className="pt-4">
            <button type="submit" className="w-full py-5 bg-luxury-gold text-black text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-white transition-all shadow-xl">
              Confirmar Cadastro
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export const AdminSettings = () => {
  const [activeConfig, setActiveConfig] = useState<null | 'asaas' | 'r2' | 'team'>(null);

  return (
    <AdminLayout>
      <PageHeader title="Ajustes" subtitle="Configurações da conta, integrações e perfil" />
      <div className="max-w-2xl space-y-12 mb-20">
        <section className="space-y-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-luxury-gold">Integrações</h3>
          <div className="space-y-4">
             {/* Asaas */}
            <div className={cn(
              "p-6 bg-black/40 border transition-all duration-500",
              activeConfig === 'asaas' ? "border-luxury-gold/50" : "border-white/5"
            )}>
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white/5 flex items-center justify-center text-luxury-gold font-bold text-center pt-1 italic font-serif">A</div>
                   <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest">Asaas (Pagamentos)</p>
                      <p className="text-[9px] text-green-500 uppercase tracking-widest">Conectado</p>
                   </div>
                 </div>
                 <button 
                  onClick={() => setActiveConfig(activeConfig === 'asaas' ? null : 'asaas')}
                  className="text-[9px] font-bold text-luxury-cream/30 uppercase tracking-widest hover:text-luxury-gold"
                 >
                   {activeConfig === 'asaas' ? 'Fechar' : 'Configurar'}
                 </button>
              </div>
              
              {activeConfig === 'asaas' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 pt-4 border-t border-white/5">
                  <FormInput label="API Key (Asaas)" placeholder="Evolua para Produção" type="password" icon={<CreditCard size={16} />} />
                  <FormInput label="Webhook Secret" placeholder="••••••••" type="password" />
                  <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-luxury-gold hover:text-white transition-colors pt-2">
                    <Save size={14} /> Salvar Integração
                  </button>
                </div>
              )}
            </div>

            {/* R2 */}
            <div className={cn(
              "p-6 bg-black/40 border transition-all duration-500",
              activeConfig === 'r2' ? "border-luxury-gold/50" : "border-white/5"
            )}>
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white/5 flex items-center justify-center text-luxury-gold font-bold text-center pt-1 italic font-serif">C</div>
                   <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest">Cloudflare R2</p>
                      <p className="text-[9px] text-green-500 uppercase tracking-widest">Conectado</p>
                   </div>
                 </div>
                 <button 
                  onClick={() => setActiveConfig(activeConfig === 'r2' ? null : 'r2')}
                  className="text-[9px] font-bold text-luxury-cream/30 uppercase tracking-widest hover:text-luxury-gold"
                 >
                   {activeConfig === 'r2' ? 'Fechar' : 'Configurar'}
                 </button>
              </div>

              {activeConfig === 'r2' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 pt-4 border-t border-white/5">
                  <FormInput label="Account ID" placeholder="Seu ID da Cloudflare" icon={<Cloud size={16} />} />
                  <FormInput label="Access Key" placeholder="••••••••" type="password" />
                  <FormInput label="Secret Key" placeholder="••••••••" type="password" />
                  <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-luxury-gold hover:text-white transition-colors pt-2">
                    <Save size={14} /> Salvar Credenciais
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-8">
           <AdminTeam />
        </section>

        <section className="space-y-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-luxury-gold">Segurança</h3>
          <button className="w-full py-5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white/5 transition-colors">Alterar Senha de Acesso</button>
        </section>
      </div>
    </AdminLayout>
  );
};
