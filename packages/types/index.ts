/**
 * @carsena/types
 * Domínio de dados para a plataforma Carsena Fotografia
 */

export interface Photographer {
  id: string;
  name: string;
  bio?: string;
  profile_url?: string;
  email: string;
}

export interface Gallery {
  id: string;
  title: string;
  description?: string;
  photographer_id: string;
  is_private: boolean;
  slug: string;
  created_at: string;
}

export interface Photo {
  id: string;
  gallery_id: string;
  url: string;
  thumbnail_url?: string;
  metadata?: Record<string, any>;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  location?: string;
  photographer_id: string;
}
