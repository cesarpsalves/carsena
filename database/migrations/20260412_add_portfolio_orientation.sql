-- Migration: Add orientation to portfolio_images
-- Added on: 2026-04-12

ALTER TABLE app_carsena.portfolio_images ADD COLUMN orientation TEXT DEFAULT 'landscape';
