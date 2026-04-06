-- Genesis Migration for Carsena Fotografia
-- Schema: app_photoapp_core

CREATE SCHEMA IF NOT EXISTS app_photoapp_core;

-- 1. Photographers (The Professionals)
CREATE TABLE IF NOT EXISTS app_photoapp_core.photographers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    bio TEXT,
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 2. Clients
CREATE TABLE IF NOT EXISTS app_photoapp_core.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 3. Events
CREATE TABLE IF NOT EXISTS app_photoapp_core.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photographer_id UUID REFERENCES app_photoapp_core.photographers(id),
    name TEXT NOT NULL,
    description TEXT,
    date DATE,
    location TEXT,
    event_type TEXT DEFAULT 'session', -- 'wedding', 'session', 'event', etc.
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 4. Galleries
CREATE TABLE IF NOT EXISTS app_photoapp_core.galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES app_photoapp_core.events(id),
    photographer_id UUID REFERENCES app_photoapp_core.photographers(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft',
    is_private BOOLEAN DEFAULT false,
    password_hash TEXT,
    slug TEXT UNIQUE NOT NULL,
    cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 5. Photos
CREATE TABLE IF NOT EXISTS app_photoapp_core.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_id UUID REFERENCES app_photoapp_core.galleries(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT,
    mime_type TEXT,
    size BIGINT,
    width INTEGER,
    height INTEGER,
    metadata JSONB DEFAULT '{}',
    is_premium BOOLEAN DEFAULT false,
    price NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. System Settings (Consolidating R2, Asaas, etc.)
CREATE TABLE IF NOT EXISTS app_photoapp_core.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_photos_gallery_id ON app_photoapp_core.photos(gallery_id);
CREATE INDEX IF NOT EXISTS idx_galleries_photographer_id ON app_photoapp_core.galleries(photographer_id);
CREATE INDEX IF NOT EXISTS idx_galleries_slug ON app_photoapp_core.galleries(slug);
