import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { photo_id } = await req.json()

    if (!photo_id) {
      throw new Error('photo_id is required')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get photo data
    const { data: photo, error: photoError } = await supabaseClient
      .from('photos')
      .withSchema('app_carsena')
      .select('*')
      .eq('id', photo_id)
      .single()

    if (photoError || !photo) {
      throw new Error('Photo not found in database')
    }

    // 2. Download original image
    const { data: originalBlob, error: downloadError } = await supabaseClient
      .storage
      .from('fotografia')
      .download(photo.storage_path)

    if (downloadError) {
      throw new Error(`Failed to download original image: ${downloadError.message}`)
    }

    const originalBuffer = await originalBlob.arrayBuffer()
    const img = await Image.decode(originalBuffer)

    // 3. Download watermark (CARSENA logo)
    // For now, let's assume it's in assets/watermark.png
    const { data: watermarkBlob, error: wError } = await supabaseClient
      .storage
      .from('assets')
      .download('watermark.png')

    if (wError) {
      console.warn("Watermark not found in assets/watermark.png, skipping watermark application.")
    }

    // 4. Processing: Watermark
    if (watermarkBlob) {
        const watermarkBuffer = await watermarkBlob.arrayBuffer()
        const watermarkImg = await Image.decode(watermarkBuffer)
        
        // Resize watermark relative to target image (e.g., 30% of width)
        const targetW = img.width * 0.4
        watermarkImg.resize(targetW, Image.RESIZE_AUTO)
        
        // Overlay (Centered)
        img.composite(watermarkImg, (img.width - watermarkImg.width) / 2, (img.height - watermarkImg.height) / 2)
    }

    // 5. Save Watermarked Version
    const watermarkedBuffer = await img.encode(0.8) // 80% quality
    const galleryId = photo.gallery_id
    const filename = photo.filename
    const watermarkPath = `watermarked/${galleryId}/${filename}`

    const { error: uploadWError } = await supabaseClient
      .storage
      .from('fotografia')
      .upload(watermarkPath, watermarkedBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      })

    if (uploadWError) {
      throw new Error(`Failed to upload watermarked version: ${uploadWError.message}`)
    }

    // 6. Processing: Thumbnail (e.g., 600px width)
    img.resize(600, Image.RESIZE_AUTO)
    const thumbnailBuffer = await img.encode(0.7) // 70% quality
    const thumbnailPath = `thumbnails/${galleryId}/${filename}`

    const { error: uploadTError } = await supabaseClient
      .storage
      .from('fotografia')
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      })

    if (uploadTError) {
      throw new Error(`Failed to upload thumbnail: ${uploadTError.message}`)
    }

    // 7. Update Database
    const { error: updateError } = await supabaseClient
      .from('photos')
      .withSchema('app_carsena')
      .update({
        watermark_path: watermarkPath,
        thumbnail_path: thumbnailPath,
        is_processed: true
      })
      .eq('id', photo_id)

    if (updateError) {
      throw new Error(`Failed to update photo record: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Foto processada com sucesso!',
        data: { watermarkPath, thumbnailPath }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
