-- Migration: Phase 3 - Galleries Real Flow (Revised)
-- Description: Adds roles, access codes, and photo selections.

-- 1. Add role to customers
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'app_carsena' AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'role') THEN
        ALTER TABLE app_carsena.customers ADD COLUMN role text DEFAULT 'customer';
    END IF;
END $$;

-- 2. Create photo_selections table
CREATE TABLE IF NOT EXISTS app_carsena.photo_selections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id uuid REFERENCES app_carsena.photos(id) ON DELETE CASCADE,
    customer_id uuid REFERENCES app_carsena.customers(id) ON DELETE CASCADE,
    gallery_id uuid REFERENCES app_carsena.galleries(id) ON DELETE CASCADE,
    selection_type text DEFAULT 'favorite', -- 'favorite', 'purchase', etc.
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Add access_code to galleries
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'app_carsena' AND TABLE_NAME = 'galleries' AND COLUMN_NAME = 'access_code') THEN
        ALTER TABLE app_carsena.galleries ADD COLUMN access_code text UNIQUE;
    END IF;
END $$;

-- 4. Ensure Admin User exists in customers table
INSERT INTO app_carsena.customers (name, email, role)
VALUES ('Paulo Alves', 'pauloalves@me.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- 5. Add RLS (Initial policies)
ALTER TABLE app_carsena.photo_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can manage their own selections" ON app_carsena.photo_selections;
CREATE POLICY "Customers can manage their own selections"
    ON app_carsena.photo_selections
    FOR ALL
    TO authenticated
    USING (customer_id = (SELECT id FROM app_carsena.customers WHERE email = auth.email()))
    WITH CHECK (customer_id = (SELECT id FROM app_carsena.customers WHERE email = auth.email()));

DROP POLICY IF EXISTS "Admins can manage all selections" ON app_carsena.photo_selections;
CREATE POLICY "Admins can manage all selections"
    ON app_carsena.photo_selections
    FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM app_carsena.customers WHERE email = auth.email() AND role = 'admin'));

-- 6. Update existing galleries with a simple access code (for testing)
UPDATE app_carsena.galleries 
SET access_code = upper(substring(id::text from 1 for 6))
WHERE access_code IS NULL;
