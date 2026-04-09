import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { r2Service } from '../lib/r2';

const router = Router();

// Get single gallery
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('galleries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(104).json({ error: 'Gallery not found' });
    
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new gallery
router.post('/', async (req, res) => {
  const { title, description, is_private, photographer_id } = req.body;

  try {
    const { data, error } = await supabase
      .from('galleries')
      .insert([{ 
        title, 
        description, 
        is_private, 
        photographer_id,
        slug: title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        status: 'draft' 
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update gallery (e.g. set cover)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const { data, error } = await supabase
      .from('galleries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Request Upload URL for a photo
router.post('/:id/photos/upload-url', async (req, res) => {
  const { id: gallery_id } = req.params;
  const { fileName, contentType } = req.body;

  try {
    const key = `galleries/${gallery_id}/${Date.now()}-${fileName}`;
    const uploadUrl = await r2Service.getUploadUrl(key, contentType);

    res.json({ uploadUrl, key });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm Photo Upload and save to DB
router.post('/:id/photos/confirm', async (req, res) => {
  const { id: gallery_id } = req.params;
  const { versions, fileName, size, mimeType, width, height } = req.body;

  try {
    const { data, error } = await supabase
      .from('photos')
      .insert([{
        gallery_id,
        storage_path: versions.preview.storagePath, // Preview is used for default display
        original_path: versions.original.storagePath,
        preview_path: versions.preview.storagePath,
        thumbnail_path: versions.thumb.storagePath,
        filename: versions.original.storagePath.split('/').pop(),
        original_name: fileName,
        size,
        mime_type: mimeType,
        width: width || 0,
        height: height || 0,
        is_premium: false,
        price: 0
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error confirming upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// List photos in gallery
router.get('/:id/photos', async (req, res) => {
  const { id: gallery_id } = req.params;

  try {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('gallery_id', gallery_id);

    if (error) throw error;

    // Generate signed URLs for each photo
    const photosWithUrls = await Promise.all((data || []).map(async (photo: any) => {
      const url = await r2Service.getDownloadUrl(photo.storage_path);
      return { ...photo, url };
    }));

    res.json(photosWithUrls);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete photo
router.delete('/:id/photos/:photoId', async (req, res) => {
  const { id: gallery_id, photoId } = req.params;

  try {
    // 1. Get photo storage path
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('storage_path')
      .eq('id', photoId)
      .single();

    if (fetchError || !photo) throw fetchError || new Error('Photo not found');

    // 2. Delete from R2
    await r2Service.deleteObject(photo.storage_path);

    // 3. Delete from DB
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (deleteError) throw deleteError;

    res.json({ message: 'Photo deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: error.message });
  }
});

export const galleriesRouter = router;
