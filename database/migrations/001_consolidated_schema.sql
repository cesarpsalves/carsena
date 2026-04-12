-- Carsena Consolidated Schema Migration
-- Objective: Centralize everything in app_carsena and provide a clean foundation.

CREATE SCHEMA IF NOT EXISTS app_carsena;
SET search_path TO app_carsena;

-- 1. Helper: Updated At Trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Photographers (Admins/Professionals)
CREATE TABLE IF NOT EXISTS photographers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE, -- Link to supabase auth.users
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    bio TEXT,
    profile_image_url TEXT,
    user_type TEXT DEFAULT 'photographer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Customers (Clients)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photographer_id UUID REFERENCES photographers(id),
    name TEXT NOT NULL,
    description TEXT,
    date DATE,
    location TEXT,
    event_type TEXT DEFAULT 'session',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Ticket Tiers
CREATE TABLE IF NOT EXISTS ticket_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    capacity INTEGER,
    sold_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Galleries
CREATE TABLE IF NOT EXISTS galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    photographer_id UUID REFERENCES photographers(id),
    customer_id UUID REFERENCES customers(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft',
    price NUMERIC(10, 2) DEFAULT 0,
    amount_paid NUMERIC(10, 2) DEFAULT 0,
    is_private BOOLEAN DEFAULT false,
    password_hash TEXT,
    slug TEXT UNIQUE NOT NULL,
    cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Photos
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
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

-- 8. Asaas Mapping
CREATE TABLE IF NOT EXISTS asaas_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES customers(id),
    asaas_customer_id TEXT UNIQUE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    total_amount NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    item_type TEXT, -- 'gallery', 'ticket', 'photo'
    item_id UUID,
    asaas_payment_id TEXT,
    external_id TEXT,
    checkout_url TEXT,
    pix_qrcode TEXT,
    pix_qrcode_text TEXT,
    pix_expiration TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL,
    resource_id UUID NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER DEFAULT 1
);

-- 11. Tickets (The actual issued ticket)
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    tier_id UUID REFERENCES ticket_tiers(id),
    customer_id UUID REFERENCES customers(id),
    customer_email TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'validated', 'cancelled'
    qr_code TEXT UNIQUE NOT NULL,
    payment_id TEXT,
    validated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Portfolio
CREATE TABLE IF NOT EXISTS portfolio_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_path TEXT NOT NULL,
    title TEXT,
    category TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- FUNCTIONS & RPC
-- ──────────────────────────────────────────────

-- RPC: Check-in Ticket
CREATE OR REPLACE FUNCTION check_in_ticket(target_ticket_id UUID)
RETURNS JSON AS $$
DECLARE
    t_status TEXT;
    t_code TEXT;
BEGIN
    SELECT status, qr_code INTO t_status, t_code FROM app_carsena.tickets WHERE id = target_ticket_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Ingresso não encontrado');
    END IF;

    IF t_status = 'validated' THEN
        RETURN json_build_object('success', false, 'message', 'Ingresso já foi validado anteriormente', 'ticket_code', t_code);
    END IF;

    UPDATE app_carsena.tickets SET status = 'validated', validated_at = NOW() WHERE id = target_ticket_id;
    
    RETURN json_build_object('success', true, 'message', 'Check-in realizado com sucesso!', 'ticket_code', t_code);
END;
$$ LANGUAGE plpgsql;

-- RPC: Increment Tier Sold Count
CREATE OR REPLACE FUNCTION increment_tier_sold_count(target_tier_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE app_carsena.ticket_tiers SET sold_count = sold_count + 1 WHERE id = target_tier_id;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────
-- PERMISSIONS & RLS
-- ──────────────────────────────────────────────
GRANT USAGE ON SCHEMA app_carsena TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA app_carsena TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA app_carsena TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app_carsena TO authenticated, service_role;

-- Enable RLS for portfolio
ALTER TABLE app_carsena.portfolio_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Portfolio" ON app_carsena.portfolio_images;
CREATE POLICY "Public Read Portfolio" ON app_carsena.portfolio_images FOR SELECT USING (true);
