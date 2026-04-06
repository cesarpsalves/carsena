import { Router } from "express";
import { PutObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, r2Service } from "../lib/r2";
import { supabase } from "../lib/supabase";
import crypto from "crypto";

const router = Router();

/**
 * POST /api/storage/presigned-url
 * Generates a signed URL for direct upload to Cloudflare R2
 */
router.post("/presigned-url", async (req, res) => {
  const { contentType, fileName, galleryId } = req.body;

  if (!contentType || !fileName || !galleryId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const fileExtension = fileName.split(".").pop();
    const uuid = crypto.randomUUID();
    const uniqueFileName = `${uuid}.${fileExtension}`;
    
    // Structure: galleries/{id}/{version}/{unique_filename}
    // versions: original (raw), preview (1920px), thumb (400px)
    const versions = ["original", "preview", "thumb"];
    const results: Record<string, { url: string; storagePath: string }> = {};

    for (const version of versions) {
      // Use webp for generated versions to save space
      const extension = version === "original" ? fileExtension : "webp";
      const storagePath = `galleries/${galleryId}/${version}/${uuid}.${extension}`;
      
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || "fotografia",
        Key: storagePath,
        ContentType: version === "original" ? contentType : "image/webp",
      });

      const url = await getSignedUrl(r2, command, { expiresIn: 300 });
      results[version] = { url, storagePath };
    }

    res.json({
      uniqueFileName,
      versions: results
    });
  } catch (error) {
    console.error("Error generating presigned URLs:", error);
    res.status(500).json({ error: "Failed to generate presigned URLs" });
  }
});

/**
 * POST /api/storage/upload-direct
 * Generates a presigned URL for direct upload to R2 without needing a gallery (e.g., system files)
 */
router.post("/upload-direct", async (req, res) => {
  const { contentType, fileName, prefix = "system" } = req.body;

  if (!contentType || !fileName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const fileExtension = fileName.split(".").pop();
    const uuid = crypto.randomUUID();
    const storagePath = `${prefix}/${uuid}.${fileExtension}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || "fotografia",
      Key: storagePath,
      ContentType: contentType,
    });

    const url = await getSignedUrl(r2, command, { expiresIn: 300 });

    res.json({
      url,
      storagePath,
      uniqueFileName: `${uuid}.${fileExtension}`
    });
  } catch (error: any) {
    console.error("Error generating direct presigned URL:", error);
    res.status(500).json({ error: "Failed to generate presigned URL", details: error.message });
  }
});

/**
 * DELETE /api/storage/bulk
 * Deletes arbitrary objects directly from Cloudflare R2
 */
router.delete("/bulk", async (req, res) => {
  console.log("🗑️ Storage: DELETE /bulk called with keys:", req.body.keys);
  const { keys } = req.body; // Expects { keys: string[] }

  if (!keys || !Array.isArray(keys) || keys.length === 0) {
    return res.status(400).json({ error: "No keys provided for deletion" });
  }

  try {
    const objectsToDelete = keys.map((key: string) => ({ Key: key }));

    const deleteCommand = new DeleteObjectsCommand({
      Bucket: process.env.R2_BUCKET_NAME || "fotografia",
      Delete: { Objects: objectsToDelete }
    });
    
    await r2.send(deleteCommand);
    console.log("✅ Storage: Successfully deleted objects from R2");

    res.json({ success: true, message: "Objects deleted successfully" });
  } catch (error: any) {
    console.error("❌ Storage: Error deleting raw objects:", error);
    res.status(500).json({ error: "Failed to delete objects", details: error.message });
  }
});

/**
 * GET /api/storage/stats
 * Returns REAL storage usage summary from Cloudflare R2
 */
router.get("/stats", async (req, res) => {
  console.log("📊 Storage: GET /stats called");
  try {
    // 1. Get real objects from R2
    const bucketStats = await r2Service.getBucketStats();
    const objects = (bucketStats as any).objects || [];
    
    // 2. Fetch galleries from DB to get names
    const { data: galleries, error: galleryError } = await supabase
      .schema('app_carsena')
      .from('galleries')
      .select('id, title, customers(name)');

    if (galleryError) throw galleryError;

    // 3. Initialize buckets with all galleries from DB
    const galleryBuckets: Record<string, any> = {};
    galleries?.forEach(g => {
      galleryBuckets[g.id] = {
        id: g.id,
        name: g.title,
        customer: (g as any)?.customers?.name || "Sem Cliente",
        size: 0,
        count: 0,
        isGallery: true
      };
    });

    let systemSize = 0;
    let systemCount = 0;

    // 4. Update sizes from real R2 objects
    objects.forEach((obj: any) => {
      if (obj.key.startsWith('galleries/')) {
        const parts = obj.key.split('/');
        const galleryId = parts[1];
        
        if (galleryBuckets[galleryId]) {
          galleryBuckets[galleryId].size += (obj.size || 0);
          galleryBuckets[galleryId].count += 1;
        } else {
          // Object in a gallery folder that's NOT in the DB (orphaned)
          systemSize += (obj.size || 0);
          systemCount += 1;
        }
      } else {
        systemSize += (obj.size || 0);
        systemCount += 1;
      }
    });

    // 5. Transform into array and add system bucket if exists
    const finalBuckets = Object.values(galleryBuckets).filter(b => b.count > 0);
    
    if (systemCount > 0) {
      finalBuckets.push({
        id: 'system',
        name: 'Arquivos de Sistema / Assets',
        customer: 'Plataforma Carsena',
        size: systemSize,
        count: systemCount,
        isGallery: false
      });
    }

    const totalSizeBytes = bucketStats.totalSizeBytes;
    const totalGB = totalSizeBytes / (1024 * 1024 * 1024);
    
    // Cloudflare R2 Cost Calculation:
    // First 10GB FREE, then $0.015 per GB
    const billableGB = Math.max(0, totalGB - 10);
    const estimatedCostUSD = billableGB * 0.015;
    const exchangeRateBRL = 5.15; // Fixed reference for estimation
    const estimatedCostBRL = estimatedCostUSD * exchangeRateBRL;

    res.json({
      totalSizeBytes: bucketStats.totalSizeBytes,
      totalSizeMB: Number((bucketStats.totalSizeBytes / (1024 * 1024)).toFixed(2)),
      totalSizeGB: Number(totalGB.toFixed(3)),
      galleryCount: galleries?.length || 0,
      objectCount: bucketStats.objectCount,
      limitGB: 10,
      estimatedCostUSD,
      estimatedCostBRL,
      formattedCostBRL: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedCostBRL),
      buckets: finalBuckets,
      objects: (bucketStats as any).objects || [],
      realTime: true
    });
  } catch (error: any) {
    console.error("❌ Error fetching storage stats:", error);
    res.status(500).json({ 
      error: "Failed to fetch storage stats",
      details: error.message 
    });
  }
});



/**
 * DELETE /api/storage/:id
 * Deletes a photo from R2 and Database
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Get photo data from DB first
    const { data: photo, error: fetchError } = await supabase
      .schema('app_carsena')
      .from("photos")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    // 2. Delete from Cloudflare R2
    const objectsToDelete = [
      { Key: photo.storage_path },
      { Key: photo.watermark_path },
      { Key: photo.thumbnail_path }
    ].filter(obj => obj.Key);

    if (objectsToDelete.length > 0) {
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: process.env.R2_BUCKET_NAME || "fotografia",
        Delete: { Objects: objectsToDelete as any[] }
      });
      await r2.send(deleteCommand);
    }

    // 3. Delete from DB
    const { error: deleteError } = await supabase
      .schema('app_carsena')
      .from("photos")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    res.json({ success: true, message: "Photo deleted successfully" });
  } catch (error: any) {
    console.error("❌ Error deleting photo:", error);
    res.status(500).json({ error: "Failed to delete photo", details: error.message });
  }
});

export default router;
