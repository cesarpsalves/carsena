-- Migration: Sync CMS and Coupon tables to app_carsena
-- Description: Creates and migrates Landing settings, sections and coupons from the legacy schema.

-- 1. Create Photographers table in app_carsena (if not exists)
CREATE TABLE IF NOT EXISTS app_carsena.photographers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  bio text,
  profile_image_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Create Landing Settings table
CREATE TABLE IF NOT EXISTS app_carsena.landing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid REFERENCES app_carsena.photographers(id),
  whatsapp_number text,
  contact_email text,
  instagram_username text,
  hero_title text DEFAULT 'Cada momento merece ser eternizado',
  hero_subtitle text DEFAULT 'Capturamos a essência dos seus momentos mais especiais com arte, sensibilidade e técnica profissional.',
  hero_image_url text,
  hero_cta_primary_label text DEFAULT 'Ver Portfólio',
  hero_cta_secondary_label text DEFAULT 'Agendar Sessão',
  footer_text text DEFAULT '© 2026 Carsena Fotografia. Todos os direitos reservados.',
  show_events boolean DEFAULT true,
  show_galleries boolean DEFAULT true,
  show_about boolean DEFAULT true,
  show_contact boolean DEFAULT true,
  show_instagram boolean DEFAULT true,
  show_testimonials boolean DEFAULT true,
  is_active boolean DEFAULT true,
  watermark_text text DEFAULT 'Carsena Digital',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Create Landing Sections table
CREATE TABLE IF NOT EXISTS app_carsena.landing_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid REFERENCES app_carsena.photographers(id),
  section_key text NOT NULL,
  title text,
  subtitle text,
  content jsonb DEFAULT '{}'::jsonb,
  display_order integer DEFAULT 0,
  enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. Create Coupons table
CREATE TABLE IF NOT EXISTS app_carsena.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value numeric NOT NULL,
  active boolean DEFAULT true,
  usage_limit integer,
  usage_count integer DEFAULT 0,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 5. Data Migration (Best effort)
-- We use DO block to wrap migration logic and handle cases where schema might not exist or tables are empty.

DO $$
BEGIN
    -- Migrate Photographers
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app_photoapp_core' AND table_name = 'photographers') THEN
        INSERT INTO app_carsena.photographers (id, name, email, bio, profile_image_url, created_at, updated_at)
        SELECT id, name, email, bio, profile_image_url, created_at, updated_at
        FROM app_photoapp_core.photographers
        ON CONFLICT (email) DO NOTHING;
    END IF;

    -- Migrate Landing Settings
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app_photoapp_core' AND table_name = 'landing_settings') THEN
        INSERT INTO app_carsena.landing_settings (id, photographer_id, whatsapp_number, contact_email, instagram_username, hero_title, hero_subtitle, hero_image_url, hero_cta_primary_label, hero_cta_secondary_label, footer_text, show_events, show_galleries, show_about, show_contact, show_instagram, show_testimonials, is_active, watermark_text, created_at, updated_at)
        SELECT id, photographer_id, whatsapp_number, contact_email, instagram_username, hero_title, hero_subtitle, hero_image_url, hero_cta_primary_label, hero_cta_secondary_label, footer_text, show_events, show_galleries, show_about, show_contact, show_instagram, show_testimonials, is_active, watermark_text, created_at, updated_at
        FROM app_photoapp_core.landing_settings
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Migrate Landing Sections
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app_photoapp_core' AND table_name = 'landing_sections') THEN
        INSERT INTO app_carsena.landing_sections (id, photographer_id, section_key, title, subtitle, content, display_order, enabled, created_at, updated_at)
        SELECT id, photographer_id, section_key, title, subtitle, content, display_order, enabled, created_at, updated_at
        FROM app_photoapp_core.landing_sections
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Migrate Coupons
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app_photoapp_core' AND table_name = 'coupons') THEN
        INSERT INTO app_carsena.coupons (id, code, type, value, active, usage_limit, usage_count, expires_at, created_at, updated_at)
        SELECT id, code, type, value, active, usage_limit, usage_count, expires_at, created_at, updated_at
        FROM app_photoapp_core.coupons
        ON CONFLICT (code) DO NOTHING;
    END IF;
END $$;

-- 6. RLS Policies
ALTER TABLE app_carsena.photographers ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_carsena.landing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_carsena.landing_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_carsena.coupons ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
DROP POLICY IF EXISTS "Admins can manage photographers" ON app_carsena.photographers;
CREATE POLICY "Admins can manage photographers" ON app_carsena.photographers FOR ALL TO authenticated 
USING ((SELECT role FROM app_carsena.customers WHERE email = auth.email()) = 'admin');

DROP POLICY IF EXISTS "Admins can manage landing_settings" ON app_carsena.landing_settings;
CREATE POLICY "Admins can manage landing_settings" ON app_carsena.landing_settings FOR ALL TO authenticated 
USING ((SELECT role FROM app_carsena.customers WHERE email = auth.email()) = 'admin');

DROP POLICY IF EXISTS "Admins can manage landing_sections" ON app_carsena.landing_sections;
CREATE POLICY "Admins can manage landing_sections" ON app_carsena.landing_sections FOR ALL TO authenticated 
USING ((SELECT role FROM app_carsena.customers WHERE email = auth.email()) = 'admin');

DROP POLICY IF EXISTS "Admins can manage coupons" ON app_carsena.coupons;
CREATE POLICY "Admins can manage coupons" ON app_carsena.coupons FOR ALL TO authenticated 
USING ((SELECT role FROM app_carsena.customers WHERE email = auth.email()) = 'admin');

-- Public/Authenticated read access
DROP POLICY IF EXISTS "Public can view landing_settings" ON app_carsena.landing_settings;
CREATE POLICY "Public can view landing_settings" ON app_carsena.landing_settings FOR SELECT TO public 
USING (is_active = true);

DROP POLICY IF EXISTS "Public can view landing_sections" ON app_carsena.landing_sections;
CREATE POLICY "Public can view landing_sections" ON app_carsena.landing_sections FOR SELECT TO public 
USING (enabled = true);

DROP POLICY IF EXISTS "Public can view photographers" ON app_carsena.photographers;
CREATE POLICY "Public can view photographers" ON app_carsena.photographers FOR SELECT TO public 
USING (true);
