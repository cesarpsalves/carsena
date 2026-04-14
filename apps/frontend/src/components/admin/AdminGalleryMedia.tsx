import React, { useState, useEffect } from "react";
import { Trash2, Loader2, ImageIcon, ExternalLink, Heart, Gift, Star, Award, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { getStoragePublicUrl } from "@/lib/storage";
import { motion, AnimatePresence } from "framer-motion";

interface Photo {
  id: string;
  storage_path: string;
  thumbnail_path: string | null;
  watermark_path: string | null;
  filename: string;
  is_processed: boolean;
  is_courtesy?: boolean;
  is_highlight?: boolean;
  is_favorite?: boolean; // Derived from photo_selections
}

interface AdminGalleryMediaProps {
  galleryId: string;
  coverImageUrl?: string;
  onUpdate?: () => void;
}

export const AdminGalleryMedia: React.FC<AdminGalleryMediaProps> = ({ 
  galleryId, 
  coverImageUrl,
  onUpdate 
}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(3);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      // 1. Fetch Photos
      const { data: photosData, error: photosError } = await supabase
        .schema('app_carsena')
        .from("photos")
        .select("*")
        .eq("gallery_id", galleryId)
        .order("created_at", { ascending: false });

      if (photosError) throw photosError;

      // 2. Fetch Favorites for this gallery
      const { data: favoritesData } = await supabase
        .schema('app_carsena')
        .from("photo_selections")
        .select("photo_id")
        .eq("is_favorite", true);
      
      // Note: We might want to filter favorites by the gallery's customer to be more precise,
      // but for simple cases, any favorite for these photo IDs works.
      const favoriteIds = new Set((favoritesData || []).map(f => f.photo_id));

      const enrichedPhotos = (photosData || []).map(p => ({
        ...p,
        is_favorite: favoriteIds.has(p.id)
      }));

      setPhotos(enrichedPhotos);
    } catch (error: any) {
      toast.error("Erro ao carregar fotos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (galleryId) {
      fetchPhotos();
      
      const channel = supabase
        .channel(`photos-${galleryId}`)
        .on(
          "postgres_changes",
          { 
            event: "*", 
            schema: "app_carsena", 
            table: "photos",
            filter: `gallery_id=eq.${galleryId}`
          },
          () => {
            fetchPhotos();
          }
        )
        .on(
          "postgres_changes",
          { 
            event: "*", 
            schema: "app_carsena", 
            table: "photo_selections",
            // Unfortunately supabase doesn't support joins in filters dynamically easily,
            // but we can just refetch on any photo_selection change, it's cheap enough for this use case
          },
          () => {
            fetchPhotos();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [galleryId]);

  const handleToggleCourtesy = async (photo: Photo) => {
    setProcessingId(photo.id);
    try {
      const newState = !photo.is_courtesy;
      const { error } = await supabase
        .schema('app_carsena')
        .from("photos")
        .update({ is_courtesy: newState })
        .eq("id", photo.id);

      if (error) throw error;
      
      setPhotos(current => 
        current.map(p => p.id === photo.id ? { ...p, is_courtesy: newState } : p)
      );
      toast.success(newState ? "Foto marcada como cortesia!" : "Cortesia removida.");
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleHighlight = async (photo: Photo) => {
    setProcessingId(photo.id);
    try {
      const newState = !photo.is_highlight;
      const { error } = await supabase
        .schema('app_carsena')
        .from("photos")
        .update({ is_highlight: newState })
        .eq("id", photo.id);

      if (error) throw error;
      
      setPhotos(current => 
        current.map(p => p.id === photo.id ? { ...p, is_highlight: newState } : p)
      );
      toast.success(newState ? "Foto em destaque!" : "Destaque removido.");
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSetCover = async (photo: Photo) => {
    setProcessingId(photo.id);
    try {
      const url = getStoragePublicUrl(photo.thumbnail_path || photo.storage_path);
      const { error } = await supabase
        .schema('app_carsena')
        .from("galleries")
        .update({ cover_url: url })
        .eq("id", galleryId);

      if (error) throw error;
      
      toast.success("Capa da galeria atualizada!");
      if (onUpdate) onUpdate();
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (photo: Photo) => {
    if (!confirm("Tem certeza que deseja excluir esta foto permanentemente?")) return;
    
    setProcessingId(photo.id);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/storage/${photo.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao excluir mídia");
      }

      toast.success("Mídia excluída com sucesso");
      setPhotos(photos.filter(p => p.id !== photo.id));
      if (onUpdate) onUpdate();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 border border-dashed border-white/5 bg-white/2 rounded-xl">
        <Loader2 className="w-8 h-8 text-luxury-gold animate-spin" />
        <p className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-bold">Analisando portfólio...</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 border border-dashed border-white/5 bg-white/2 rounded-xl">
        <ImageIcon className="w-8 h-8 text-white/10" />
        <p className="text-[10px] uppercase tracking-widest text-luxury-cream/20 font-bold">Nenhuma captura encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-luxury-gold/10 flex items-center justify-center text-luxury-gold rounded-full">
             <Award size={18} />
           </div>
           <div>
             <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-luxury-gold">Acervo Visual</h4>
             <p className="text-[9px] text-white/40 uppercase tracking-widest">{photos.length} capturas nesta sessão</p>
           </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center bg-white/5 border border-white/10 p-1 rounded-lg">
            {[2, 3, 4].map((size) => (
              <button
                key={size}
                onClick={() => setGridSize(size)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center text-[10px] font-bold rounded transition-all",
                  gridSize === size ? "bg-luxury-gold text-black shadow-lg" : "text-white/20 hover:text-white/40"
                )}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4 text-[8px] uppercase tracking-widest text-white/30 border-l border-white/5 pl-6">
             <button 
               onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
               className={cn(
                 "flex items-center gap-1.5 transition-all",
                 showFavoritesOnly ? "text-red-400" : "hover:text-white"
               )}
             >
               <div className={cn("w-2 h-2 rounded-full", showFavoritesOnly ? "bg-red-400 animate-pulse" : "bg-red-500/50")} /> 
               Favoritos {showFavoritesOnly ? '(Filtrado)' : ''}
             </button>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-400" /> Cortesia</div>
          </div>
        </div>
      </div>

      <div className={cn(
        "grid gap-6 transition-all duration-500",
        gridSize === 2 && "grid-cols-1 sm:grid-cols-2",
        gridSize === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        gridSize === 4 && "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4",
      )}>
        {photos.filter(p => showFavoritesOnly ? p.is_favorite : true).map((photo) => {
          const displayUrl = getStoragePublicUrl(photo.thumbnail_path || photo.storage_path);
          const isCover = coverImageUrl === displayUrl;
          const isProcessing = processingId === photo.id || !photo.is_processed;

          return (
            <div 
              key={photo.id} 
              className="group flex flex-col bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-2xl transition-all"
            >
              {/* Container da Imagem (Clicável para abrir Lightbox) */}
              <div 
                className="relative aspect-square cursor-pointer overflow-hidden"
                onClick={() => {
                  setSelectedPhoto(photo);
                  setLightboxOpen(true);
                }}
              >
                <img 
                  src={displayUrl} 
                  alt={photo.filename}
                  className={cn(
                    "w-full h-full object-cover transition-all duration-500",
                    isCover ? "opacity-100" : "opacity-80 hover:opacity-100 hover:scale-105",
                    photo.is_highlight && "ring-4 ring-luxury-gold ring-inset"
                  )}
                />
                
                {/* Badges do Canto Superior (Status Permanentes) */}
                <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-none">
                    <div className="flex flex-col gap-1.5">
                      {isCover && (
                        <div className="bg-luxury-gold text-black text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-lg">
                          Capa da Galeria
                        </div>
                      )}
                      {photo.is_highlight && (
                        <div className="bg-white text-black text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-lg flex items-center gap-1">
                          <Star size={10} fill="black" /> Destaque
                        </div>
                      )}
                      {photo.is_courtesy && (
                        <div className="bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-lg flex items-center gap-1">
                          <Gift size={10} fill="white" /> Cortesia (Liberada)
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1.5">
                      {photo.is_favorite && (
                        <div className="bg-red-500 text-white p-2 rounded-full shadow-lg border-2 border-white/20 animate-pulse" title="Favoritada pelo Cliente">
                          <Heart size={14} fill="white" />
                        </div>
                      )}
                    </div>
                </div>

                {!photo.is_processed && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                     <Loader2 size={24} className="text-luxury-gold animate-spin" />
                     <span className="text-[9px] uppercase font-bold tracking-widest text-luxury-gold bg-black/50 px-3 py-1 rounded">Blindando...</span>
                  </div>
                )}
                
                {/* Image Filename Hover Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-8 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-[9px] text-white/70 font-mono truncate">{photo.filename}</p>
                </div>
              </div>

              {/* Botões de Ação Sempre Visíveis e Grandes */}
              <div className="p-3 bg-luxury-black flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={isProcessing}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCourtesy(photo);
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2.5 rounded text-[9px] font-bold uppercase transition-all",
                      photo.is_courtesy ? "bg-blue-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                    )}
                  >
                    <Gift size={12} /> {photo.is_courtesy ? 'Liberada' : 'Dar Cortesia'}
                  </button>
                  
                  <button
                    disabled={isProcessing}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleHighlight(photo);
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2.5 rounded text-[9px] font-bold uppercase transition-all",
                      photo.is_highlight ? "bg-luxury-gold text-black" : "bg-white/10 text-white hover:bg-white/20"
                    )}
                  >
                    <Star size={12} /> {photo.is_highlight ? 'No Destaque' : 'Destacar'}
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    disabled={isProcessing}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetCover(photo);
                    }}
                    className={cn(
                      "col-span-3 flex items-center justify-center gap-1.5 py-2.5 rounded text-[9px] font-bold uppercase transition-all",
                      isCover ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
                    )}
                  >
                    <ImageIcon size={12} /> {isCover ? 'Capa Selecionada' : 'Definir como Capa'}
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(photo);
                    }}
                    className="col-span-1 flex items-center justify-center py-2.5 bg-red-500/20 text-red-500 rounded hover:bg-red-500 hover:text-white transition-all"
                    title="Excluir"
                  >
                     <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {lightboxOpen && selectedPhoto && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxOpen(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl aspect-video md:aspect-auto md:h-[80vh] bg-luxury-black border border-white/10 flex flex-col md:flex-row overflow-hidden shadow-fill rounded-2xl"
            >
              <button 
                onClick={() => setLightboxOpen(false)}
                className="absolute top-6 right-6 z-10 p-3 bg-black/50 text-white rounded-full hover:bg-white hover:text-black transition-all"
              >
                <X size={24} />
              </button>

              <div className="flex-1 bg-black flex items-center justify-center overflow-hidden p-4">
                <img 
                  src={getStoragePublicUrl(selectedPhoto.storage_path)} 
                  className="max-w-full max-h-full object-contain shadow-2xl"
                  alt={selectedPhoto.filename}
                />
              </div>

              <div className="w-full md:w-80 bg-white/5 border-l border-white/5 p-8 flex flex-col justify-between">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-serif text-2xl text-luxury-cream mb-2 truncate" title={selectedPhoto.filename}>
                      {selectedPhoto.filename}
                    </h3>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/20">Metadados e Controle</p>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={() => handleToggleCourtesy(selectedPhoto)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-lg border transition-all",
                        selectedPhoto.is_courtesy 
                          ? "bg-blue-500/10 border-blue-500/50 text-blue-400" 
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Gift size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Liberar Foto</span>
                      </div>
                      <div className={cn("w-2 h-2 rounded-full", selectedPhoto.is_courtesy ? "bg-blue-400 animate-pulse" : "bg-white/10")} />
                    </button>

                    <button
                      onClick={() => handleToggleHighlight(selectedPhoto)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-lg border transition-all",
                        selectedPhoto.is_highlight 
                          ? "bg-luxury-gold/10 border-luxury-gold/50 text-luxury-gold" 
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Star size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Destaque Vitrine</span>
                      </div>
                      <div className={cn("w-2 h-2 rounded-full", selectedPhoto.is_highlight ? "bg-luxury-gold animate-pulse" : "bg-white/10")} />
                    </button>

                    <button
                      onClick={() => handleSetCover(selectedPhoto)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-lg border transition-all",
                        coverImageUrl === getStoragePublicUrl(selectedPhoto.thumbnail_path || selectedPhoto.storage_path)
                          ? "bg-white/10 border-white/50 text-white" 
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <ImageIcon size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Definir como Capa</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 space-y-4">
                  <div className="flex gap-2">
                    <a 
                      href={getStoragePublicUrl(selectedPhoto.storage_path)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex-1 py-4 bg-white/5 text-white/60 rounded flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all"
                    >
                      <ExternalLink size={16} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Original</span>
                    </a>
                  </div>
                  <button
                    onClick={() => {
                      handleDelete(selectedPhoto);
                      setLightboxOpen(false);
                    }}
                    className="w-full py-4 text-red-500/60 border border-red-500/20 rounded flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all uppercase text-[9px] font-bold tracking-widest"
                  >
                    <Trash2 size={16} />
                    Excluir Permanentemente
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
