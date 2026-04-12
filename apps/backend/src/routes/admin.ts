import { Router } from "express";
import { supabase } from "../lib/supabase";
import { r2Service } from "../lib/r2";

const router = Router();

/**
 * GET /api/admin/stats
 * Returns consolidated dashboard statistics from app_carsena schema.
 * The supabase client has schema 'app_carsena' configured in lib/supabase.ts
 */
router.get("/stats", async (req, res) => {
  try {
    // 1. Fetch gallery financials (amount_paid = real paid, price = total contracted)
    const { data: galleryData, error: galleryError } = await supabase
      .from('galleries')
      .select('price, amount_paid, status, customer_id');

    if (galleryError) throw galleryError;

    const galleries = galleryData || [];

    // Total actually paid by clients (sum of amount_paid)
    const totalPaid = galleries.reduce((acc, g) => acc + Number(g.amount_paid || 0), 0);

    // Total pending (remaining balance across all galleries)
    const totalPending = galleries.reduce((acc, g) => {
      const remaining = Number(g.price || 0) - Number(g.amount_paid || 0);
      return acc + (remaining > 0 ? remaining : 0);
    }, 0);

    // Average ticket (paid galleries only)
    const paidGalleries = galleries.filter(g => Number(g.amount_paid || 0) > 0);
    const avgTicket = paidGalleries.length > 0 ? totalPaid / paidGalleries.length : 0;

    // Active galleries (published)
    const activeSessions = galleries.filter(g => g.status === 'published').length;

    // 2. Fetch Total Customers
    const { count: totalCustomers, error: customersError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    if (customersError) throw customersError;

    // 3. Fetch REAL Storage Stats from R2 (instead of DB metadata)
    const r2Stats = await r2Service.getBucketStats();
    const totalSizeBytes = r2Stats.totalSizeBytes;
    const totalGB = totalSizeBytes / (1024 * 1024 * 1024);
    
    // Cloudflare R2 Cost Calculation:
    // First 10GB FREE, then $0.015 per GB per month
    const billableGB = Math.max(0, totalGB - 10);
    const estimatedCostUSD = billableGB * 0.015;
    const exchangeRateBRL = 5.60; // Ajustado para uma cotação mais realista/atual
    const estimatedCostBRL = estimatedCostUSD * exchangeRateBRL;

    const brlFormatter = new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    res.json({
      billing: {
        total: totalPaid,
        formatted: brlFormatter.format(totalPaid)
      },
      pending: {
        total: totalPending,
        formatted: brlFormatter.format(totalPending)
      },
      avgTicket: {
        total: avgTicket,
        formatted: brlFormatter.format(avgTicket)
      },
      sessions: {
        active: activeSessions,
        total: galleries.length
      },
      customers: {
        total: totalCustomers || 0
      },
      storage: {
        totalSizeBytes,
        totalSizeMB: Number((totalSizeBytes / (1024 * 1024)).toFixed(2)),
        totalSizeGB: Number(totalGB.toFixed(2)),
        objectCount: r2Stats.objectCount,
        limitGB: 10,
        estimatedCostUSD,
        estimatedCostBRL,
        formattedCostBRL: brlFormatter.format(estimatedCostBRL)
      }
    });
  } catch (error: any) {
    console.error("❌ Error fetching admin stats:", error);
    res.status(500).json({
      error: "Failed to fetch admin statistics",
      details: error.message
    });
  }
});

/**
 * GET /api/admin/photographers
 * Returns list of all administrators (photographers).
 */
router.get("/photographers", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('photographers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error("❌ Error listing photographers:", error);
    res.status(500).json({ error: "Failed to list photographers" });
  }
});

/**
 * POST /api/admin/photographers
 * Creates a new administrative user.
 */
router.post("/photographers", async (req, res) => {
  const { name, email, password, user_type = 'photographer' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }

  try {
    // 1. Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) throw authError;

    // 2. Add to photographers table
    const { data: photographer, error: photographerError } = await supabase
      .from('photographers')
      .insert({
        auth_id: authUser.user.id,
        name,
        email,
        user_type
      })
      .select()
      .single();

    if (photographerError) {
      // Rollback auth user if DB insert fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw photographerError;
    }

    res.status(201).json(photographer);
  } catch (error: any) {
    console.error("❌ Error creating photographer:", error);
    res.status(500).json({ error: error.message || "Failed to create photographer" });
  }
});

/**
 * PATCH /api/admin/photographers/:id
 * Updates an administrator details.
 */
router.patch("/photographers/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, user_type, password } = req.body;

  try {
    // 1. Get current data to find auth_id
    const { data: current, error: fetchError } = await supabase
      .from('photographers')
      .select('auth_id, email')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // 2. Update Auth if needed (email or password)
    if (current.auth_id) {
      const updateData: any = {};
      if (email && email !== current.email) updateData.email = email;
      if (password) updateData.password = password;
      if (name) updateData.user_metadata = { name };

      if (Object.keys(updateData).length > 0) {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          current.auth_id,
          updateData
        );
        if (authError) throw authError;
      }
    }

    // 3. Update professionals table
    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (name) updatePayload.name = name;
    if (email) updatePayload.email = email;
    if (user_type) updatePayload.user_type = user_type;

    const { data: updated, error: dbError } = await supabase
      .from('photographers')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (dbError) throw dbError;

    res.json(updated);
  } catch (error: any) {
    console.error("❌ Error updating photographer:", error);
    res.status(500).json({ error: error.message || "Failed to update photographer" });
  }
});

/**
 * DELETE /api/admin/photographers/:id
 * Removes an administrator.
 */
router.delete("/photographers/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Get photographer details to find auth_id
    const { data: photographer, error: fetchError } = await supabase
      .from('photographers')
      .select('auth_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // 2. Delete from auth.users if exists
    if (photographer.auth_id) {
      await supabase.auth.admin.deleteUser(photographer.auth_id);
    }

    // 3. Delete from photographers table
    const { error: deleteError } = await supabase
      .from('photographers')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({ success: true });
  } catch (error: any) {
    console.error("❌ Error deleting photographer:", error);
    res.status(500).json({ error: "Failed to delete photographer" });
  }
});

export const adminRouter = router;
