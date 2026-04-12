-- Add CPF to customers
ALTER TABLE app_carsena.customers ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Create service types table
CREATE TABLE IF NOT EXISTS app_carsena.service_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for service_types
ALTER TABLE app_carsena.service_types ENABLE ROW LEVEL SECURITY;

-- Simple policy for admin access
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_types' AND policyname = 'Allow all access to service_types'
    ) THEN
        CREATE POLICY "Allow all access to service_types" ON app_carsena.service_types FOR ALL USING (true);
    END IF;
END $$;

-- Pre-populate service types
INSERT INTO app_carsena.service_types (name, category, is_default) VALUES
('Casamento', 'Eventos Sociais', true),
('Aniversário Infantil', 'Eventos Sociais', true),
('15 Anos', 'Eventos Sociais', true),
('Formatura', 'Eventos Sociais', true),
('Batizado', 'Eventos Sociais', true),
('Gestante', 'Ensaios (Portraits)', true),
('Newborn', 'Ensaios (Portraits)', true),
('Individual Feminino', 'Ensaios (Portraits)', true),
('Individual Masculino', 'Ensaios (Portraits)', true),
('Casal / Pré-Wedding', 'Ensaios (Portraits)', true),
('Família', 'Ensaios (Portraits)', true),
('Pet', 'Ensaios (Portraits)', true),
('Imobiliário', 'Comercial', true),
('Gastronomia', 'Comercial', true),
('Produto / E-commerce', 'Comercial', true),
('Evento Corporativo', 'Comercial', true),
('Moda / Lookbook', 'Editorial', true),
('Boudoir', 'Editorial', true)
ON CONFLICT DO NOTHING;
