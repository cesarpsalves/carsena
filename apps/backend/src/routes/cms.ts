import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { r2 } from '../lib/r2';
import { DeleteObjectsCommand } from '@aws-sdk/client-s3';

const router = Router();

// Get Landing Page Settings & Sections
router.get('/landing', async (req, res) => {
  try {
    // 1. Get Settings
    const { data: settings, error: settingsError } = await supabase
      .from('landing_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (settingsError) throw settingsError;

    // 2. Get Sections
    const { data: sections, error: sectionsError } = await supabase
      .from('landing_sections')
      .select('*')
      .eq('enabled', true)
      .order('display_order', { ascending: true });

    if (sectionsError) throw sectionsError;

    // 3. Get Public Galleries (Portfolio)
    const { data: galleries, error: galleriesError } = await supabase
      .from('galleries')
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

// ──────────────────────────────────────────────
// Portfolio Images CRUD
// ──────────────────────────────────────────────

/**
 * GET /api/cms/portfolio-images
 * Returns all portfolio images ordered by display_order
 */
router.get('/portfolio-images', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('portfolio_images')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error('❌ Error fetching portfolio images:', error.message);
    res.status(500).json({ error: 'Failed to fetch portfolio images' });
  }
});

/**
 * POST /api/cms/portfolio-images
 * Saves a new portfolio image after upload to R2
 */
router.post('/portfolio-images', async (req, res) => {
  const { storage_path, title, category, display_order } = req.body;

  if (!storage_path) {
    return res.status(400).json({ error: 'storage_path is required' });
  }

  try {
    // Get current max order to append at end if not specified
    const { data: existing } = await supabase
      .from('portfolio_images')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = display_order ?? ((existing?.display_order ?? -1) + 1);

    const { data, error } = await supabase
      .from('portfolio_images')
      .insert([{ storage_path, title, category, display_order: nextOrder }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    console.error('❌ Error saving portfolio image:', error.message);
    res.status(500).json({ error: 'Failed to save portfolio image' });
  }
});

/**
 * PUT /api/cms/portfolio-images/reorder
 * Bulk-updates display_order for all images — must be BEFORE /:id route.
 * Body: { images: [{ id, display_order }] }
 */
router.put('/portfolio-images/reorder', async (req, res) => {
  const { images } = req.body as { images: { id: string; display_order: number }[] };

  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'images array is required' });
  }

  try {
    const updates = images.map(({ id, display_order }) =>
      supabase
        .from('portfolio_images')
        .update({ display_order, updated_at: new Date().toISOString() })
        .eq('id', id)
    );

    await Promise.all(updates);
    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error reordering portfolio images:', error.message);
    res.status(500).json({ error: 'Failed to reorder portfolio images' });
  }
});

/**
 * PUT /api/cms/portfolio-images/:id
 * Updates title, category of a portfolio image
 */
router.put('/portfolio-images/:id', async (req, res) => {
  const { id } = req.params;
  const { title, category } = req.body;

  try {
    const { data, error } = await supabase
      .from('portfolio_images')
      .update({ title, category, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error('❌ Error updating portfolio image:', error.message);
    res.status(500).json({ error: 'Failed to update portfolio image' });
  }
});

/**
 * DELETE /api/cms/portfolio-images/:id
 * Deletes a portfolio image from R2 and the database
 */
router.delete('/portfolio-images/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Fetch image data to get storage_path
    const { data: image, error: fetchError } = await supabase
      .from('portfolio_images')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError || !image) {
      return res.status(404).json({ error: 'Portfolio image not found' });
    }

    // 2. Delete from Cloudflare R2
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'fotografia',
      Delete: { Objects: [{ Key: image.storage_path }] },
    });
    await r2.send(deleteCommand);

    // 3. Delete from database
    const { error: dbError } = await supabase
      .from('portfolio_images')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error deleting portfolio image:', error.message);
    res.status(500).json({ error: 'Failed to delete portfolio image' });
  }
});

export const cmsRouter = router;
