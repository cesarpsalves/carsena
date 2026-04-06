import React, { useState, useCallback } from "react";
import { Upload, X, CheckCircle2, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadPhotoWithVersions } from "../../lib/storage";

interface UploadZoneProps {
  onUploadComplete: (storagePath: string) => void;
  galleryId: string;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUploadComplete, galleryId }) => {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const startUpload = async (uploadingFile: UploadingFile) => {
    setFiles(prev => prev.map(f => f.id === uploadingFile.id ? { ...f, status: "uploading" } : f));

    try {
      const result = await uploadPhotoWithVersions(uploadingFile.file, galleryId);
      
      setFiles(prev => prev.map(f => f.id === uploadingFile.id ? { ...f, status: "completed", progress: 100 } : f));
      onUploadComplete(result.storagePath);
    } catch (error: any) {
      setFiles(prev => prev.map(f => f.id === uploadingFile.id ? { ...f, status: "error", error: error.message } : f));
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    const newFiles: UploadingFile[] = droppedFiles.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      progress: 0,
      status: "pending"
    }));

    setFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(f => startUpload(f));
  }, [galleryId]);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const selectedFiles = Array.from(e.target.files).filter(f => f.type.startsWith("image/"));
    const newFiles: UploadingFile[] = selectedFiles.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      progress: 0,
      status: "pending"
    }));

    setFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(f => startUpload(f));
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-4 ${
          isDragging ? "border-amber-500 bg-amber-500/10" : "border-white/10 hover:border-white/20 bg-white/5"
        }`}
      >
        <Upload className={`w-10 h-10 ${isDragging ? "text-amber-500" : "text-white/40"}`} />
        <div className="text-center">
          <p className="text-white font-medium">Arraste fotos aqui</p>
          <p className="text-white/40 text-sm">ou clique para selecionar</p>
        </div>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={onFileSelect}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {files.map((file) => (
            <div key={file.id} className="bg-white/5 rounded-lg p-3 flex items-center gap-3 border border-white/10">
              <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center overflow-hidden">
                <ImageIcon className="w-5 h-5 text-white/20" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{file.file.name}</p>
                <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      file.status === "error" ? "bg-red-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {file.status === "uploading" && <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />}
                {file.status === "completed" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {file.status === "error" && <X className="w-4 h-4 text-red-500" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
