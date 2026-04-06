import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  ArrowRight,
  CheckCircle2, 
  Heart, 
  Download, 
  Share2, 
  Maximize2, 
  Lock, 
  CameraOff, 
  Clock, 
  X, 
  ShieldCheck,
  CreditCard,
  Info
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { getStoragePublicUrl } from "../../lib/storage";

interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  watermarkUrl: string;
  filename: string;
  isFavorite: boolean;
  isSelected: boolean;
  isProcessed: boolean;
  isCourtesy: boolean;
}

interface GalleryMetadata {
  id: string;
  title: string;
  status: string;
  customer_id: string;
  expires_at: string | null;
  subtitle: string;
  price: number;
  amount_paid: number;
  created_at: string;
}

export const GalleryView = () => {
  const { id } = useParams<{ id: string }>();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [gallery, setGallery] = useState<GalleryMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const fetchGalleryData = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // 1. Fetch Gallery Metadata (Explicitly using app_carsena schema if client supports it, else use standard)
      const { data: galleryData, error: galleryError } = await supabase
        .schema('app_carsena')
        .from('galleries')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (galleryError) throw galleryError;
      
      if (!galleryData) {
        setGallery(null);
        setLoading(false);
        return;
      }

      const isExpired = galleryData.expires_at ? new Date(galleryData.expires_at) < new Date() : false;

      setGallery({
        ...galleryData,
        status: isExpired ? 'expired' : galleryData.status,
        subtitle: new Date(galleryData.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      });

      if (galleryData.status !== 'published' || isExpired) {
        setLoading(false);
        return;
      }

      // 2. Fetch Photos & Selections in parallel
      const [photosRes, selectionsRes] = await Promise.all([
        supabase.schema('app_carsena').from('photos').select('*').eq('gallery_id', id).order('created_at', { ascending: true }),
        supabase.schema('app_carsena').from('photo_selections').select('*').eq('customer_id', galleryData.customer_id)
      ]);

      if (photosRes.error) throw photosRes.error;
      if (selectionsRes.error) throw selectionsRes.error;

      const selectionsMap = new Map(
        (selectionsRes.data || []).map(s => [s.photo_id, s])
      );

      const formattedPhotos: Photo[] = (photosRes.data || []).map(p => {
        const sel = selectionsMap.get(p.id);
        
        return {
          id: p.id,
          url: getStoragePublicUrl(p.storage_path),
          thumbnailUrl: getStoragePublicUrl(p.thumbnail_path || p.storage_path),
          watermarkUrl: getStoragePublicUrl(p.watermark_path || p.storage_path),
          filename: p.filename,
          isFavorite: sel?.is_favorite || false,
          isSelected: false, // not stored in DB, only local state
          isProcessed: p.is_processed !== false, // default true unless explicitly false
          isCourtesy: p.is_courtesy || false
        };
      });

      setPhotos(formattedPhotos);
    } catch (err: any) {
      console.error("Error fetching gallery:", err);
      toast.error("Erro ao carregar memórias.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGalleryData();
  }, [fetchGalleryData]);

  const persistSelection = async (photoId: string, updates: Partial<{ isFavorite: boolean }>) => {
    if (!gallery || !gallery.customer_id) return; // sem cliente, não salva
    
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    const newFavorite = updates.isFavorite !== undefined ? updates.isFavorite : photo.isFavorite;

    try {
      if (!newFavorite) {
        await supabase
          .schema('app_carsena')
          .from('photo_selections')
          .delete()
          .match({ photo_id: photoId, customer_id: gallery.customer_id });
      } else {
        await supabase
          .schema('app_carsena')
          .from('photo_selections')
          .upsert({
            photo_id: photoId,
            customer_id: gallery.customer_id,
            is_favorite: newFavorite,
          }, { onConflict: 'photo_id,customer_id' });
      }
    } catch (err: any) {
      toast.error("Falha ao salvar preferência.");
    }
  };

  const toggleFavorite = async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;
    const newFavorite = !photo.isFavorite;
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, isFavorite: newFavorite } : p));
    // Update selectedPhoto state if it's open in fullscreen
    setSelectedPhoto(prev => (prev && prev.id === photoId) ? { ...prev, isFavorite: newFavorite } : prev);
    await persistSelection(photoId, { isFavorite: newFavorite });
  };

  const toggleSelect = (photoId: string) => {
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, isSelected: !p.isSelected } : p));
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(`✨ Confira minha galeria exclusiva Carsena: ${url}`).then(() => {
      toast.success("Link da galeria copiado! Agora você pode compartilhar.");
    }).catch(() => {
      toast.error("Erro ao copiar link.");
    });
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedPhoto) return;
    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
    if (currentIndex === -1) return;

    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0) nextIndex = photos.length - 1;
    if (nextIndex >= photos.length) nextIndex = 0;

    setSelectedPhoto(photos[nextIndex]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      if (e.key === 'Escape') setSelectedPhoto(null);
      if (e.key === 'ArrowRight') navigatePhoto('next');
      if (e.key === 'ArrowLeft') navigatePhoto('prev');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, photos]);

  const isPaid = gallery ? Number(gallery.amount_paid || 0) >= Number(gallery.price || 0) : false;
  const isPhotoUnlocked = (photo: Photo) => isPaid || photo.isCourtesy;
  const selectedCount = photos.filter(p => p.isSelected).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] text-[#d4af37] font-bold uppercase tracking-[0.3em]">Preparando sua Galeria...</p>
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 text-center space-y-8">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
          <X size={40} />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-light text-white">Memória não encontrada</h1>
          <p className="text-white/40 max-w-sm mx-auto text-sm">Este link é inválido ou a galeria foi removida pelo fotógrafo.</p>
        </div>
        <Link to="/cliente" className="px-8 py-4 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#d4af37] hover:bg-white/10 transition-all">Voltar ao Início</Link>
      </div>
    );
  }

  if (gallery.status === 'expired') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 text-center space-y-8">
        <div className="w-24 h-24 bg-[#d4af37]/10 rounded-full flex items-center justify-center text-[#d4af37]">
          <Clock size={40} />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-light text-white">Acesso Expirado</h1>
          <p className="text-white/40 max-w-sm mx-auto text-sm leading-relaxed">
            O prazo de visualização desta galeria terminou em {new Date(gallery.expires_at!).toLocaleDateString('pt-BR')}. 
            Entre em contato com seu fotógrafo para reativar o acesso.
          </p>
        </div>
        <Link to="/cliente" className="px-8 py-4 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">Minha Área do Cliente</Link>
      </div>
    );
  }

  if (gallery.status !== 'published') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 text-center space-y-12 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#d4af37]/5 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col items-center space-y-8">
          <div className="w-20 h-20 bg-white/5 border border-white/10 flex items-center justify-center text-[#d4af37] relative">
            <Clock size={32} strokeWidth={1} className="animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#d4af37] text-black text-[8px] font-bold flex items-center justify-center">!</div>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl font-light tracking-tight text-white">Em Preparação <span className="italic text-[#d4af37]">Artesanal</span></h1>
            <p className="text-white/60 max-w-md mx-auto text-sm leading-relaxed uppercase tracking-widest italic">{gallery.title}</p>
            <p className="text-white/30 max-w-md mx-auto text-sm leading-relaxed">
              O fotógrafo está finalizando a curadoria e o tratamento de suas memórias. 
              Cada detalhe está sendo revisado para garantir a excelência Carsena.
            </p>
          </div>

          <div className="bg-white/5 border border-white/5 p-6 space-y-3 rounded-2xl w-full max-w-sm">
             <p className="text-[10px] text-[#d4af37] uppercase tracking-[0.2em] font-bold">Próximos Passos</p>
             <p className="text-[10px] text-white/40 uppercase tracking-widest leading-loose">
              Assim que a edição for concluída, você receberá uma notificação automática liberando o seu acesso exclusivo.
             </p>
          </div>

          <Link to="/cliente" className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors group">
            <ArrowLeft size={14} className="group-hover:-translate-x-2 transition-transform" />
            Voltar ao Início
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white select-none">
      {/* Dynamic Header Badge for Status */}
      {!isPaid && (
        <div className="bg-[#d4af37] text-black px-6 py-3 text-center text-[10px] font-black uppercase tracking-[0.5em] sticky top-0 z-[100] shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-6">
            <ShieldCheck size={14} />
            <span>Galeria Protegida • Aguardando Liberação de Saldo</span>
            <Link to={`/cliente/checkout/${gallery.id}`} className="bg-black text-white px-4 py-1 rounded-full text-[8px] hover:scale-105 transition-transform flex items-center gap-2">
              <CreditCard size={10} /> PAGAR AGORA
            </Link>
          </div>
        </div>
      )}

      {/* Gallery Header */}
      <header className={`p-8 md:p-12 lg:p-20 flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-white/5 ${!isPaid ? 'pt-12' : ''}`}>
        <div className="space-y-8">
          <Link to="/cliente" className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#d4af37] hover:-translate-x-2 transition-transform w-fit">
            <ArrowLeft size={16} />
            Área do Cliente
          </Link>
          <div className="space-y-3">
            <h1 className="text-6xl md:text-8xl font-light tracking-tighter leading-none">{gallery.title}</h1>
            <div className="flex items-center gap-6 text-white/40 text-[11px] uppercase tracking-[0.3em]">
               <span>{gallery.subtitle}</span>
               <div className="w-1 h-1 bg-[#d4af37] rounded-full" />
               <span>{photos.length} Registros</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {!isPaid ? (
             <Link 
              to={`/cliente/checkout/${gallery.id}`}
              className="px-10 py-5 bg-[#d4af37] text-black text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-white transition-all shadow-xl shadow-[#d4af37]/20"
             >
               <Lock size={16} />
               Liberar Fotos HD
             </Link>
          ) : (
             <button 
               onClick={() => setIsSelectMode(!isSelectMode)}
               className={cn(
                 "px-10 py-5 text-[10px] font-bold uppercase tracking-[0.3em] border transition-all flex items-center gap-3",
                 isSelectMode ? "bg-white text-black border-white" : "border-white/10 text-white/40 hover:text-white hover:border-white"
               )}
             >
               {isSelectMode ? <CheckCircle2 size={16} /> : <Heart size={16} />}
               {isSelectMode ? `Finalizar (${selectedCount})` : "Selecionar Favoritas"}
             </button>
          )}

          <button 
            onClick={handleShare}
            className="p-5 bg-white/5 border border-white/10 text-white/40 hover:text-[#d4af37] hover:border-[#d4af37]/40 transition-all rounded-full group"
            title="Compartilhar Galeria"
          >
            <Share2 size={20} className="group-active:scale-90 transition-transform" />
          </button>
        </div>
      </header>

      {/* Grid Content */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        {!isPaid && (
          <div className="mb-16 p-8 bg-white/[0.02] border border-white/5 rounded-3xl flex flex-col md:flex-row items-center gap-8">
            <div className="w-16 h-16 bg-[#d4af37]/10 rounded-2xl flex items-center justify-center text-[#d4af37] flex-shrink-0">
               <Info size={32} />
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
               <h3 className="text-xl font-light">Visualização de Amostra Ativada</h3>
               <p className="text-white/40 text-sm leading-relaxed">
                 As fotos abaixo são versões de baixa resolução com marca d'água automática. 
                 Após a confirmação do pagamento, os arquivos originais em alta definição serão liberados instantaneamente para download e seleção.
               </p>
            </div>
            <Link 
              to={`/cliente/checkout/${gallery.id}`}
              className="whitespace-nowrap px-8 py-4 bg-white/5 border border-[#d4af37]/30 text-[#d4af37] text-[10px] font-bold uppercase tracking-widest hover:bg-[#d4af37] hover:text-black transition-all rounded-full"
            >
              Realizar Pagamento
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          <AnimatePresence>
            {photos.map((photo, idx) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "group relative aspect-[3/4] bg-white/[0.02] overflow-hidden cursor-pointer rounded-2xl transition-all duration-500",
                  photo.isSelected && "ring-4 ring-[#d4af37] ring-offset-4 ring-offset-[#0a0a0a]",
                  !photo.isProcessed && "cursor-wait opacity-40 bg-white/5"
                )}
                onClick={() => isSelectMode ? toggleSelect(photo.id) : setSelectedPhoto(photo)}
              >
                {/* Photo Display - Fallback to watermark if not paid and not courtesy */}
                <img 
                  src={!isPhotoUnlocked(photo) ? photo.watermarkUrl : photo.thumbnailUrl} 
                  alt={photo.filename}
                  className={cn(
                    "w-full h-full object-cover transition-all duration-1000 group-hover:scale-110",
                    isSelectMode && !photo.isSelected && "opacity-30 grayscale",
                    !photo.isProcessed && "blur-xl"
                  )}
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                />

                {/* Protective Overlay if not paid and not courtesy */}
                {!isPhotoUnlocked(photo) && (
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 transition-opacity group-hover:opacity-100">
                      <p className="text-white font-black text-6xl rotate-45 select-none tracking-[1em]">CARSENA</p>
                   </div>
                )}

                {/* Courtesy Badge */}
                {photo.isCourtesy && !isPaid && (
                  <div className="absolute top-6 left-6 z-10 px-3 py-1 bg-luxury-gold text-black text-[8px] font-black uppercase tracking-widest rounded-full shadow-2xl backdrop-blur-md">
                    Foto Cortesia
                  </div>
                )}

                {/* Actions Overlay */}
                <div className="absolute inset-x-6 top-6 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(photo.id); }}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all",
                      photo.isFavorite ? "bg-[#d4af37] border-[#d4af37] text-black" : "bg-black/40 border-white/10 text-white hover:border-[#d4af37] hover:text-[#d4af37]"
                    )}
                  >
                    <Heart size={16} fill={photo.isFavorite ? "black" : "none"} />
                  </button>
                  <button className="w-10 h-10 bg-black/40 border border-white/10 text-white rounded-full flex items-center justify-center backdrop-blur-xl hover:bg-[#d4af37] hover:border-[#d4af37] hover:text-black transition-all">
                    <Maximize2 size={16} />
                  </button>
                </div>

                <div className="absolute inset-x-6 bottom-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded text-[8px] font-bold text-white/60 tracking-widest uppercase">
                      #{idx + 1} • {photo.filename.split('.')[0]}
                   </div>
                   {isPhotoUnlocked(photo) && (
                     <button 
                       className="text-[#d4af37] hover:text-white transition-colors"
                       onClick={(e) => {
                         e.stopPropagation();
                         const link = document.createElement('a');
                         link.href = photo.url;
                         link.download = photo.filename;
                         document.body.appendChild(link);
                         link.click();
                         document.body.removeChild(link);
                       }}
                      >
                        <Download size={18} />
                     </button>
                   )}
                </div>

                {/* Selection Checkmark */}
                {photo.isSelected && (
                  <div className="absolute inset-0 bg-[#d4af37]/20 flex items-center justify-center">
                    <div className="w-16 h-16 bg-[#d4af37] rounded-full flex items-center justify-center text-black shadow-2xl animate-in zoom-in">
                       <CheckCircle2 size={32} />
                    </div>
                  </div>
                )}

                {!photo.isProcessed && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                     <div className="w-8 h-8 border border-[#d4af37] border-t-transparent rounded-full animate-spin" />
                     <span className="text-[8px] text-[#d4af37] uppercase tracking-[0.3em] font-black">Em Edição</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Fullscreen Preview Portal (Simulated for now) */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col pt-10"
          >
            <div className="px-8 flex items-center justify-between mb-8">
               <div className="flex items-center gap-6">
                 <button onClick={() => setSelectedPhoto(null)} className="p-3 text-white/40 hover:text-white transition-colors flex items-center gap-3 text-[10px] font-bold tracking-widest uppercase">
                   <X size={20} /> Fechar
                 </button>
                 <div className="h-4 w-px bg-white/10" />
                 <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">{selectedPhoto.filename}</p>
               </div>
               
               <div className="flex items-center gap-4">
                 <button 
                  onClick={() => toggleFavorite(selectedPhoto.id)}
                  className={cn(
                    "p-4 rounded-full border transition-all",
                    selectedPhoto.isFavorite ? "bg-[#d4af37] border-[#d4af37] text-black" : "border-white/10 text-white hover:text-[#d4af37]"
                  )}
                 >
                   <Heart size={20} fill={selectedPhoto.isFavorite ? "black" : "none"} />
                 </button>
                 {isPhotoUnlocked(selectedPhoto) && (
                   <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedPhoto.url;
                      link.download = selectedPhoto.filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="px-8 py-4 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-[#d4af37] transition-all"
                   >
                     Baixar em HD
                   </button>
                 )}
               </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 md:p-12 relative group/modal">
               {/* Navigation Arrows */}
               <button 
                onClick={(e) => { e.stopPropagation(); navigatePhoto('prev'); }}
                className="absolute left-4 md:left-12 z-10 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white/20 hover:text-white transition-all opacity-0 group-hover/modal:opacity-100"
               >
                 <ArrowLeft size={32} strokeWidth={1} />
               </button>

               <img 
                src={!isPhotoUnlocked(selectedPhoto) ? selectedPhoto.watermarkUrl : selectedPhoto.url} 
                alt="Full Preview" 
                className="max-w-full max-h-[75vh] md:max-h-full object-contain shadow-[0_0_100px_rgba(0,0,0,0.5)] select-none"
                onContextMenu={(e) => e.preventDefault()}
               />

               <button 
                onClick={(e) => { e.stopPropagation(); navigatePhoto('next'); }}
                className="absolute right-4 md:right-12 z-10 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white/20 hover:text-white transition-all opacity-0 group-hover/modal:opacity-100"
               >
                 <ArrowRight size={32} strokeWidth={1} />
               </button>

               {!isPhotoUnlocked(selectedPhoto) && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                    <p className="text-white font-black text-[20vw] rotate-12 select-none tracking-[2em]">CARSENA</p>
                 </div>
               )}
            </div>

            <div className="h-28 md:h-36 flex items-center justify-center p-6 bg-black/60 border-t border-white/5">
               <div className="flex items-center gap-3 overflow-x-auto no-scrollbar max-w-5xl px-8 py-2">
                  {photos.map((p, i) => (
                    <button 
                      key={p.id}
                      onClick={() => setSelectedPhoto(p)}
                      className={cn(
                        "w-12 h-16 md:w-16 md:h-20 flex-shrink-0 border-2 transition-all opacity-50 hover:opacity-100 hover:scale-105",
                        selectedPhoto.id === p.id ? "border-[#d4af37] opacity-100 scale-110 grayscale-0" : "border-transparent grayscale"
                      )}
                    >
                      <img src={p.thumbnailUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[8px] text-center text-white/40">{i+1}</div>
                    </button>
                  ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-20 border-t border-white/5 text-center flex flex-col items-center gap-6">
         <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
            <CameraOff size={24} className="text-white/20" />
         </div>
         <p className="text-[10px] text-white/20 uppercase tracking-[0.5em] font-medium">Fine Art Photography Service</p>
         <div className="flex items-center gap-4 text-[9px] text-[#d4af37] font-bold">
            <ShieldCheck size={14} />
            PROTEÇÃO DIGITAL CARSENA ATIVA
         </div>
      </footer>
    </div>
  );
};

export default GalleryView;
