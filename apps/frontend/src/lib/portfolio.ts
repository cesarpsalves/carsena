const API_URL = import.meta.env.VITE_API_URL;
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || 'https://pub-9020162f221740e6ae4138986574168a.r2.dev';

export interface PortfolioImage {
  id: string;
  storage_path: string;
  title: string | null;
  category: string | null;
  orientation: 'portrait' | 'landscape';
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function getPortfolioPublicUrl(storagePath: string): string {
  if (!storagePath) return '';
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }
  return `${R2_PUBLIC_URL}/${storagePath}`;
}

export const portfolioService = {
  async getImages(): Promise<PortfolioImage[]> {
    try {
      const res = await fetch(`${API_URL}/cms/portfolio-images`);
      if (!res.ok) throw new Error('Failed to fetch portfolio images');
      return await res.json();
    } catch (error) {
      console.error('Error fetching portfolio images:', error);
      return [];
    }
  },

  /**
   * Uploads a file to R2 and saves metadata to the database.
   * Returns the created PortfolioImage record.
   */
  async uploadImage(
    file: File,
    meta: { title?: string; category?: string; orientation?: 'portrait' | 'landscape' }
  ): Promise<PortfolioImage> {
    // 1. Get presigned URL from backend
    const urlRes = await fetch(`${API_URL}/storage/portfolio-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, contentType: file.type }),
    });

    if (!urlRes.ok) throw new Error('Failed to get upload URL');
    const { url, storagePath } = await urlRes.json();

    // 2. Upload directly to Cloudflare R2
    const uploadRes = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });

    if (!uploadRes.ok) throw new Error('Failed to upload image to R2');

    // 3. Save metadata to the database
    const saveRes = await fetch(`${API_URL}/cms/portfolio-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storage_path: storagePath,
        title: meta.title || null,
        category: meta.category || null,
        orientation: meta.orientation || 'landscape',
      }),
    });

    if (!saveRes.ok) throw new Error('Failed to save portfolio image metadata');
    return await saveRes.json();
  },

  async updateImage(
    id: string,
    data: { title?: string; category?: string; orientation?: 'portrait' | 'landscape' }
  ): Promise<PortfolioImage> {
    const res = await fetch(`${API_URL}/cms/portfolio-images/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update portfolio image');
    return await res.json();
  },

  async reorder(images: { id: string; display_order: number }[]): Promise<void> {
    const res = await fetch(`${API_URL}/cms/portfolio-images/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images }),
    });
    if (!res.ok) throw new Error('Failed to reorder portfolio images');
  },

  async deleteImage(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/cms/portfolio-images/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete portfolio image');
  },
};
