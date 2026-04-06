-- Migration: Cleanup Legacy Schemas
-- Description: Drops old schemas from the previous iteration to leave only app_carsena.
-- WARNING: This action is IRREVERSIBLE. Ensure app_carsena is fully functional first.

-- Drop schemas
DROP SCHEMA IF EXISTS app_photoapp CASCADE;
DROP SCHEMA IF EXISTS app_photoapp_analytics CASCADE;
DROP SCHEMA IF EXISTS app_photoapp_core CASCADE;
DROP SCHEMA IF EXISTS app_photoapp_engagement CASCADE;
DROP SCHEMA IF EXISTS app_photoapp_integrations CASCADE;
DROP SCHEMA IF EXISTS app_photoapp_processing CASCADE;
DROP SCHEMA IF EXISTS app_photoapp_sales CASCADE;
DROP SCHEMA IF EXISTS app_photoapp_storage CASCADE;

-- Optional: Clean up any old roles or permissions if they were specific to these schemas.
-- (Keeping them for now to avoid breaking Supabase built-in roles if they were linked).
