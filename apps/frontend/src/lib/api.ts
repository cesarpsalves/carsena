import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

export const getStorageStats = async () => {
  const { data } = await api.get('/storage/stats');
  return data;
};

export const uploadRawFile = async (file: File) => {
  // 1. Get Presigned URL for direct upload
  const { data } = await api.post('/storage/upload-direct', {
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    prefix: 'system'
  });
  
  // 2. Upload to Cloudflare R2
  const uploadRes = await fetch(data.url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream'
    }
  });

  if (!uploadRes.ok) {
    throw new Error('Failed to upload file to R2');
  }

  return data;
};

export const deleteRawFiles = async (keys: string[]) => {
  const { data } = await api.delete('/storage/bulk', {
    data: { keys }
  });
  return data;
};

// --- Photographer Management (Admin CRUD) ---
export const getPhotographers = async () => {
  const { data } = await api.get('/admin/photographers');
  return data;
};

export const createPhotographer = async (photographerData: any) => {
  const { data } = await api.post('/admin/photographers', photographerData);
  return data;
};

export const deletePhotographer = async (id: string) => {
  const { data } = await api.delete(`/admin/photographers/${id}`);
  return data;
};

export default api;
