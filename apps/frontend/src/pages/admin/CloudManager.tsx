import { useState, useEffect } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { cn } from "@/lib/utils";
import { 
  Cloud, 
  Upload, 
  Search, 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Plus,
  CheckCircle2,
  HardDrive,
  Camera,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import api, { getStorageStats, uploadRawFile, deleteRawFiles } from "@/lib/api";
import { getStoragePublicUrl } from "@/lib/storage";
import { toast } from "sonner";
import { useRef } from "react";

// Mock data replaced with dynamic fetching

export const CloudManager = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [stats, setStats] = useState({
    totalSizeGB: 0,
    limitGB: 10,
    galleryCount: 0,
    totalSizeBytes: 0,
    objectCount: 0,
    formattedCostBRL: 'R$ 0,00'
  });
  const [allFiles, setAllFiles] = useState<any[]>([]);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [currentPath, setCurrentPath] = useState(""); // Folder navigation state
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Logic to identify folders and files for the current level
  const getDisplayItems = () => {
    const folders = new Set<string>();
    const filesAtCurrentLevel: any[] = [];
    
    // Normalize current path (ensure it ends with / unless root)
    const normalizedCurrent = currentPath ? (currentPath.endsWith('/') ? currentPath : currentPath + '/') : "";

    allFiles.forEach(file => {
      const remainingPath = file.storagePath.startsWith(normalizedCurrent) 
        ? file.storagePath.slice(normalizedCurrent.length) 
        : null;

      if (remainingPath) {
        if (remainingPath.includes('/')) {
          // It's a subfolder
          const folderName = remainingPath.split('/')[0];
          folders.add(folderName);
        } else {
          // It's a file at this level
          filesAtCurrentLevel.push(file);
        }
      }
    });

    const folderItems = Array.from(folders).map(name => ({
      id: `folder-${name}`,
      name: name,
      isFolder: true,
      storagePath: normalizedCurrent + name + '/',
      type: 'FOLDER',
      date: new Date().toISOString()
    }));

    return [...folderItems, ...filesAtCurrentLevel];
  };

  const navigateTo = (path: string) => {
    setCurrentPath(path);
  };

  const breadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    return [
      { name: 'Nuvem', path: '' },
      ...parts.map((p, i) => ({
        name: p,
        path: parts.slice(0, i + 1).join('/') + '/'
      }))
    ];
  };

  const displayItems = getDisplayItems();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const storageData = await getStorageStats();
      setStats({
        totalSizeGB: storageData.totalSizeGB,
        limitGB: storageData.limitGB,
        galleryCount: storageData.galleryCount,
        totalSizeBytes: storageData.totalSizeBytes,
        objectCount: storageData.objectCount,
        formattedCostBRL: storageData.formattedCostBRL
      });

      const { data: recentPhotos, error: photoError } = await supabase
        .from('photos')
        .select(`
          id,
          filename,
          storage_path,
          size,
          created_at,
          galleries ( title )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (photoError) throw photoError;

      // Get raw objects from R2
      const r2Objects = (storageData as any).objects || [];
      const fileMap = new Map();

      // 1. Initial list from R2 (physical truth)
      r2Objects.forEach((obj: any) => {
        if (!obj.key || obj.key.endsWith('/')) return; // Skip folders
        fileMap.set(obj.key, {
          id: obj.key,
          storagePath: obj.key,
          name: obj.key.split('/').pop(),
          size: formatSize(obj.size),
          type: getFileType(obj.key),
          bucket: 'Sistema / R2',
          status: 'unsynced',
          date: obj.lastModified
        });
      });

      // 2. Overwrite with DB metadata (enriched)
      (recentPhotos || []).forEach(p => {
        const key = p.storage_path || p.filename;
        fileMap.set(key, {
          id: p.id,
          storagePath: p.storage_path,
          name: p.filename,
          size: formatSize(Number(p.size)),
          type: getFileType(p.filename),
          bucket: (p.galleries as any)?.title || 'N/A',
          status: 'sync',
          date: p.created_at
        });
      });

      const processedAll = Array.from(fileMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setAllFiles(processedAll);
      setRecentFiles(processedAll.slice(0, 10));

    } catch (error: any) {
      toast.error("Erro ao carregar dados da nuvem: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (filename: string) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return 'IMG';
    if (['raw', 'nef', 'cr2', 'arw'].includes(ext || '')) return 'RAW';
    return 'DOC';
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    try {
      await uploadRawFile(file);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      fetchData(); // recarregar a tela para refletir R2 real
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteClick = async (file: any) => {
    if (confirm(`Excluir permanentemente '${file.name}'?`)) {
      try {
        if (file.status === 'sync') {
          await api.delete(`/storage/${file.id}`);
        } else {
          await deleteRawFiles([file.id]); // id here is the raw object key
        }
        toast.success("Arquivo excluído com sucesso");
        fetchData();
      } catch (error: any) {
        toast.error("Erro ao excluir arquivo: " + error.message);
      }
    }
  };

  const handleDownloadClick = (file: any) => {
    if (file.storagePath) {
      const url = getStoragePublicUrl(file.storagePath);
      window.open(url, '_blank');
    } else {
      toast.error("Caminho não encontrado para download");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-luxury-gold/50 animate-pulse text-xs uppercase tracking-widest">Acessando servidores R2...</div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header with Stats */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div className="space-y-4 flex-1">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-luxury-gold/10 rounded-full text-luxury-gold">
                  <Cloud size={24} />
               </div>
               <div className="space-y-1">
                  <h1 className="text-serif text-4xl text-luxury-cream tracking-tight">Nuvem <span className="italic opacity-80">Carsena</span></h1>
                  <p className="text-luxury-cream/40 font-sans text-[10px] tracking-widest uppercase italic">Gerenciamento de Ativos e Storage Cloudflare R2</p>
               </div>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                <div className="space-y-1 border-l border-luxury-gold/20 pl-4 py-1">
                   <p className="text-[10px] text-luxury-cream/40 uppercase tracking-widest leading-none">Espaço Utilizado</p>
                   <p className="text-xl font-serif text-luxury-cream leading-tight">
                      {formatSize(stats.totalSizeBytes)} <span className="text-luxury-cream/30 text-xs lowercase">de</span> <span className="text-luxury-cream/30">{stats.limitGB} GB</span>
                   </p>
                </div>
                 <div className="space-y-1 border-l border-white/5 pl-4 py-1">
                    <p className="text-[10px] text-luxury-cream/40 uppercase tracking-widest leading-none">Custo Estimado</p>
                    <p className="text-xl font-serif text-luxury-gold leading-tight">
                      {stats.totalSizeGB <= 10 ? 'Grátis (até 10GB)' : stats.formattedCostBRL}
                    </p>
                 </div>
                 <div className="space-y-1 border-l border-white/5 pl-4 py-1">
                    <p className="text-[10px] text-luxury-cream/40 uppercase tracking-widest leading-none">Arquivos no R2</p>
                    <p className="text-xl font-serif text-luxury-cream leading-tight">{(stats as any).objectCount || 0}</p>
                 </div>
                 <div className="space-y-1 border-l border-white/5 pl-4 py-1">
                    <p className="text-[10px] text-luxury-cream/40 uppercase tracking-widest leading-none">Pastas Ativas</p>
                    <p className="text-xl font-serif text-luxury-cream leading-tight">{stats.galleryCount}</p>
                 </div>
             </div>
          </div>

          <div className="flex items-center gap-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileSelect} 
            />
            <button 
              onClick={handleUploadClick}
              disabled={isUploading}
              className="flex items-center justify-center gap-3 px-10 border border-luxury-gold py-4 bg-luxury-gold text-luxury-black text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-white hover:border-white transition-all w-full md:w-auto overflow-hidden relative shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              {isUploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-luxury-black border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Fazer Upload
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-cream/30 group-focus-within:text-luxury-gold transition-colors" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar arquivos ou pastas específicas..." 
              className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-4 text-[11px] uppercase tracking-widest text-luxury-cream placeholder:text-white/20 focus:border-luxury-gold/40 outline-none transition-all focus:bg-white/[0.08]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setLayout("grid")}
              className={`px-6 py-4 border text-[9px] font-bold uppercase tracking-[0.2em] transition-colors ${layout === 'grid' ? 'border-luxury-gold/40 bg-luxury-gold/5 text-luxury-gold' : 'border-white/5 bg-white/5 text-luxury-cream/60 hover:text-white'}`}>
              Gride
            </button>
            <button 
              onClick={() => setLayout("list")}
              className={`px-6 py-4 border text-[9px] font-bold uppercase tracking-[0.2em] transition-colors ${layout === 'list' ? 'border-luxury-gold/40 bg-luxury-gold/5 text-luxury-gold' : 'border-white/5 bg-white/5 text-luxury-cream/60 hover:text-white'}`}>
              Lista
            </button>
            <button onClick={handleUploadClick} className="ml-2 w-12 h-12 flex items-center justify-center border border-white/10 hover:border-luxury-gold transition-colors text-luxury-gold">
               <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Breadcrumbs Navigation */}
        <div className="flex items-center gap-2 py-2 border-y border-white/5 overflow-x-auto no-scrollbar">
          {breadcrumbs().map((crumb, i) => (
            <div key={crumb.path} className="flex items-center gap-2 flex-shrink-0">
              {i > 0 && <ChevronRight size={14} className="text-white/10" />}
              <button 
                onClick={() => navigateTo(crumb.path)}
                className={cn(
                  "text-[10px] uppercase tracking-widest font-bold transition-colors",
                  i === breadcrumbs().length - 1 ? "text-luxury-gold" : "text-luxury-cream/40 hover:text-luxury-cream"
                )}
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Explorer Grid */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-serif text-2xl text-luxury-cream">Explorer / Pastas</h3>
               <p className="text-[10px] text-luxury-cream/30 uppercase tracking-[0.2em]">Total: {(stats as any).objectCount || 0} arquivos em R2</p>
            </div>
            
            {layout === 'list' ? (
            <div className="bg-white/5 border border-white/5 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2">
                    <th className="p-4 text-[9px] font-bold uppercase tracking-widest text-luxury-cream/30 w-12 text-center">Tipo</th>
                    <th className="p-4 text-[9px] font-bold uppercase tracking-widest text-luxury-cream/30">Nome & Origem da Pasta</th>
                    <th className="p-4 text-[9px] font-bold uppercase tracking-widest text-luxury-cream/30 w-24">Tamanho</th>
                    <th className="p-4 text-[9px] font-bold uppercase tracking-widest text-luxury-cream/30 text-right w-24">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems
                    .filter(f => f.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item) => (
                    <tr 
                      key={item.id} 
                      onClick={() => item.isFolder && navigateTo(item.storagePath)}
                      className={cn(
                        "border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group",
                        item.isFolder ? "cursor-pointer bg-white/[0.02]" : ""
                      )}
                    >
                      <td className="p-4 text-center text-luxury-gold/40 group-hover:text-luxury-gold transition-colors">
                        {item.isFolder ? <Folder size={16} className="mx-auto" /> : item.type === "RAW" ? <Camera size={16} className="mx-auto" /> : item.type === "IMG" ? <ImageIcon size={16} className="mx-auto" /> : <FileText size={16} className="mx-auto" />}
                      </td>
                      <td className="p-4 min-w-0 pr-6">
                        <p className={cn(
                          "text-xs uppercase tracking-widest font-bold truncate",
                          item.isFolder ? "text-luxury-gold" : "text-luxury-cream"
                        )}>{item.name}{item.isFolder && '/'}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <p className="text-[9px] text-luxury-cream/40 uppercase tracking-widest truncate">{item.isFolder ? 'Pasta de Arquivos' : item.storagePath}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-[10px] text-luxury-cream/60 uppercase tracking-widest">{item.size || '--'}</p>
                        <p className="text-[8px] text-luxury-cream/20 uppercase tracking-[0.2em] mt-1">{new Date(item.date).toLocaleDateString()}</p>
                      </td>
                      <td className="p-4 flex items-center justify-end gap-1 h-full pt-6">
                        {!item.isFolder && (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDownloadClick(item); }}
                              className="p-2 text-white/20 hover:text-luxury-gold hover:bg-luxury-gold/10 transition-all rounded"
                              title="Fazer Download"
                            >
                               <Download size={14} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}
                              className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all rounded"
                              title="Excluir Arquivo"
                            >
                               <Trash2 size={14} />
                            </button>
                          </>
                        )}
                        {item.isFolder && (
                           <ChevronRight size={14} className="text-white/10 group-hover:text-luxury-gold transition-colors mr-2" />
                        )}
                      </td>
                    </tr>
                  ))}
                  {displayItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center border-dashed border-white/5 opacity-40">
                        <p className="text-[10px] uppercase tracking-widest">Pasta vazia</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {displayItems
                .filter(f => f.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => item.isFolder && navigateTo(item.storagePath)}
                  className={cn(
                    "group relative aspect-square border overflow-hidden flex flex-col items-center justify-center p-4 transition-all",
                    item.isFolder 
                      ? "bg-luxury-gold/5 border-luxury-gold/10 hover:border-luxury-gold/40 cursor-pointer" 
                      : "bg-white/5 border-white/5 hover:border-luxury-gold/30"
                  )}
                >
                  {item.isFolder ? (
                    <div className="flex flex-col items-center gap-2">
                       <Folder size={48} className="text-luxury-gold/40 group-hover:text-luxury-gold transition-colors" />
                       <p className="text-[10px] uppercase tracking-widest font-bold text-luxury-gold text-center line-clamp-1 w-full">{item.name}</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-full aspect-video mb-3 overflow-hidden bg-black/20 border border-white/5 flex items-center justify-center group-hover:border-luxury-gold/30 transition-all">
                        {item.type === "IMG" ? (
                          <img 
                            src={getStoragePublicUrl(item.storagePath)} 
                            alt={item.name} 
                            className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-all duration-500 scale-110 group-hover:scale-100"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-luxury-gold/30 group-hover:text-luxury-gold transition-colors">
                            {item.type === "RAW" ? <Camera size={32} /> : <FileText size={32} />}
                          </div>
                        )}
                      </div>
                      <p className="text-[9px] uppercase tracking-widest font-bold text-luxury-cream text-center line-clamp-1 w-full">{item.name}</p>
                      <p className="text-[7px] text-luxury-cream/40 uppercase tracking-widest mt-0.5 text-center w-full truncate">{item.storagePath}</p>
                      
                      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDownloadClick(item); }}
                          className="p-3 bg-white/10 text-white rounded-full hover:bg-luxury-gold transition-all"
                        >
                           <Download size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}
                          className="p-3 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"
                        >
                           <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {displayItems.length === 0 && (
                <div className="col-span-full p-12 text-center border border-dashed border-white/5 opacity-40">
                  <p className="text-[10px] uppercase tracking-widest">Pasta vazia</p>
                </div>
              )}
            </div>
            )}
          </div>

          {/* Recent/Usage Sidebar */}
          <div className="lg:col-span-4 space-y-10">
             {/* Recent Activity */}
             <div className="space-y-6">
                <h3 className="text-serif text-2xl text-luxury-cream">Recentes</h3>
                <div className="space-y-3">
                  {recentFiles.length > 0 ? recentFiles.map((file) => (
                    <div key={file.id} className="p-4 bg-black/40 border border-white/5 flex items-center gap-4 group">
                       <div className="p-2 bg-white/5 rounded-none text-luxury-gold/40 group-hover:text-luxury-gold transition-colors">
                          {file.type === "RAW" ? <Camera size={18} /> : file.type === "IMG" ? <ImageIcon size={18} /> : <FileText size={18} />}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-luxury-cream truncate">{file.name}</p>
                          <p className="text-[8px] uppercase tracking-widest text-luxury-cream/20 mt-0.5">{file.size} • {file.bucket}</p>
                       </div>
                       <div className="flex gap-1">
                          <button 
                            onClick={() => handleDownloadClick(file)}
                            className="p-1.5 text-white/10 hover:text-luxury-gold transition-colors"
                          >
                             <Download size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(file)}
                            className="p-1.5 text-white/10 hover:text-red-500 transition-colors"
                          >
                             <Trash2 size={14} />
                          </button>
                       </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center bg-white/2 border border-dashed border-white/5 opacity-30">
                      <p className="text-[9px] uppercase tracking-widest">Nenhum upload recente</p>
                    </div>
                  )}
                </div>
             </div>

             {/* Detailed Folder Usage */}
             <div className="p-8 bg-black/60 border border-white/5 space-y-6">
                <div className="flex items-center gap-3 text-luxury-cream/60">
                   <Folder size={18} />
                   <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">Ocupação por Pasta</h4>
                </div>
                <div className="space-y-4">
                  {(stats as any).buckets?.length > 0 ? (stats as any).buckets.map((bucket: any) => (
                    <div key={bucket.id} className="space-y-2 group">
                      <div className="flex justify-between text-[9px] uppercase tracking-widest">
                        <span className="text-luxury-cream font-bold truncate max-w-[150px]">{bucket.name}</span>
                        <span className="text-luxury-cream/40">{formatSize(bucket.size)}</span>
                      </div>
                      <div className="h-[2px] bg-white/5 w-full overflow-hidden">
                        <div 
                          className="h-full bg-luxury-gold/40 transition-all duration-1000" 
                          style={{ width: `${Math.min(100, (bucket.size / stats.totalSizeBytes) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )) : (
                    <p className="text-[9px] text-luxury-cream/20 uppercase tracking-widest text-center py-4">Nenhuma pasta identificada</p>
                  )}
                </div>
             </div>

             {/* R2 Stats Detail */}
             <div className="p-8 bg-luxury-gold/5 border border-luxury-gold/10 space-y-6">
                <div className="flex items-center gap-3 text-luxury-gold">
                   <HardDrive size={20} />
                   <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">Custo Cloudflare R2</h4>
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <div className="flex justify-between text-[9px] uppercase tracking-widest font-bold">
                         <span className="text-luxury-cream/40">Ocupado (Total)</span>
                         <span className="text-luxury-gold">
                           {stats.totalSizeBytes > 0 && stats.totalSizeBytes < 1024 * 1024 
                             ? "< 0.01%" 
                             : `${((stats.totalSizeBytes / (stats.limitGB * 1024 * 1024 * 1024)) * 100).toFixed(2)}%`}
                         </span>
                      </div>
                      <div className="h-1 bg-white/10 w-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${Math.max(stats.totalSizeBytes > 0 ? 0.5 : 0, (stats.totalSizeBytes / (stats.limitGB * 1024 * 1024 * 1024)) * 100)}%` }}
                           transition={{ duration: 1.5, ease: "circOut" }}
                           className="h-full bg-luxury-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                         />
                      </div>
                   </div>
                   <div className="flex flex-col gap-2 pt-2">
                       <div className="flex justify-between items-center py-2 border-b border-white/5">
                          <p className="text-[9px] text-luxury-cream/40 uppercase tracking-widest">Franquia Gratuita</p>
                          <p className="text-[9px] text-luxury-gold uppercase tracking-widest">10 GB</p>
                       </div>
                       <div className="flex justify-between items-center py-2 border-b border-white/5">
                          <p className="text-[9px] text-luxury-cream/40 uppercase tracking-widest">Excedente</p>
                          <p className="text-[9px] text-luxury-cream uppercase tracking-widest">
                            {stats.totalSizeGB <= 10 ? '0 GB' : `${(stats.totalSizeGB - 10).toFixed(2)} GB`}
                          </p>
                       </div>
                       <div className="flex justify-between items-center py-2">
                          <p className="text-[9px] text-luxury-cream/40 uppercase tracking-widest">Preço Estimado</p>
                          <p className="text-[11px] text-luxury-gold font-bold uppercase tracking-widest">{stats.formattedCostBRL}</p>
                       </div>
                       <div className="mt-4">
                          <a 
                            href="https://dash.cloudflare.com/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full py-3 border border-luxury-gold/20 text-[9px] text-luxury-gold hover:bg-luxury-gold hover:text-black transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] font-bold"
                          >
                             Painel Cloudflare <ExternalLink size={12} />
                          </a>
                       </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Success Feedback */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-12 right-12 bg-luxury-gold text-black px-8 py-4 flex items-center gap-3 shadow-2xl z-50 border border-white/20"
          >
            <CheckCircle2 size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Ativo enviado com sucesso para a nuvem</span>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};
