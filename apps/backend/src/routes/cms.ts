import { Router } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// Get Landing Page Settings & Sections
router.get('/landing', async (req, res) => {
  try {
    // 1. Get Settings
    const { data: settings, error: settingsError } = await supabase
      .from('app_carsena.landing_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (settingsError) throw settingsError;

    // 2. Get Sections
    const { data: sections, error: sectionsError } = await supabase
      .from('app_carsena.landing_sections')
      .select('*')
      .eq('enabled', true)
      .order('display_order', { ascending: true });

    if (sectionsError) throw sectionsError;

    // 3. Get Public Galleries (Portfolio)
    const { data: galleries, error: galleriesError } = await supabase
      .from('app_carsena.galleries')
      .select('id, title, description, cover_image_url, slug')
      .eq('status', 'published')
      .eq('is_private', false)
      .limit(6);

    if (galleriesError) throw galleriesError;

    res.json({
      settings,
      sections,
      portfolio: galleries || []
    });
  } catch (error: any) {
    console.error('❌ Error fetching landing content:', error.message);
    res.status(500).json({ error: 'Failed to fetch landing content' });
  }
});

export const cmsRouter = router;
