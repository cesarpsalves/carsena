import { supabase } from "./supabase";

export interface UploadResult {
  photoId: string;
  storagePath: string;
  uniqueFileName: string;
}

/**
 * Uploads a file to Cloudflare R2 using presigned URLs from the backend.
 */
export const uploadPhotoWithVersions = async (file: File, galleryId: string): Promise<UploadResult> => {
  try {
    // 1. Get Presigned URLs from Backend
    const response = await fetch(`${import.meta.env.VITE_API_URL}/storage/presigned-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        galleryId: galleryId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get upload URLs");
    }

    const { versions } = await response.json();
    const original = versions.original;

    // 2. Upload Original to Cloudflare R2
    const uploadRes = await fetch(original.url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    if (!uploadRes.ok) {
      throw new Error("Failed to upload to R2");
    }

    // 3. Register in Database (Table: photos)
    const { data: photoData, error: dbError } = await supabase
      .from("photos")
      .insert({
        gallery_id: galleryId,
        storage_path: original.storagePath,
        thumbnail_path: original.storagePath, // Use original for instant fallback preview
        watermark_path: original.storagePath, // Use original until background process creates watermark
        filename: file.name,
        is_processed: true, // Unlock media in UI instantly
        size: file.size, // Importante para as estatísticas do CloudManager
        metadata: {
          type: file.type,
          lastModified: file.lastModified
        }
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return { 
      photoId: photoData.id, 
      storagePath: original.storagePath, 
      uniqueFileName: original.storagePath.split('/').pop() || file.name
    };
  } catch (error) {
    console.error("R2 Upload Error:", error);
    throw error;
  }
};

/**
 * Gets a public URL for an R2 object
 */
export const getStoragePublicUrl = (storagePath: string) => {
  if (!storagePath) return "";
  
  // Se já for uma URL completa (ex: Unsplash ou outro serviço), retorna ela mesma
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return storagePath;
  }
  
  const publicDomain = import.meta.env.VITE_R2_PUBLIC_URL || "https://pub-9020162f221740e6ae4138986574168a.r2.dev";
  return `${publicDomain}/${storagePath}`;
};

/**
 * Faz upload de um arquivo avulso (como capa de evento) para o Cloudflare R2
 */
export const uploadDirect = async (file: File, prefix = "system"): Promise<string> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/storage/upload-direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        prefix
      })
    });

    if (!response.ok) {
      throw new Error("Falha ao obter URL de upload direto");
    }

    const { url, storagePath } = await response.json();

    const uploadRes = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    if (!uploadRes.ok) {
      throw new Error("Falha no upload físico para o R2");
    }

    return storagePath;
  } catch (error) {
    console.error("Erro no uploadDirect:", error);
    throw error;
  }
};

/**
 * Deleta arquivos do R2
 */
export const deleteDirect = async (keys: string[]): Promise<void> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/storage/bulk`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys })
    });

    if (!response.ok) {
      throw new Error("Falha ao deletar arquivos");
    }
  } catch (error) {
    console.error("Erro no deleteDirect:", error);
  }
};
