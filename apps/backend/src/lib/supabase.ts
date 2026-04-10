import { createClient } from '@supabase/supabase-js';
import path from 'path';

// Redundant dotenv call removed, now handled in index.ts

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'app_carsena'
  }
});
