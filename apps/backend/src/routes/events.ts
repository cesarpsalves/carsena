import { Router } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// List Public Events
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('app_carsena.events')
      .select(`
        *,
        ticket_tiers (*)
      `)
      .order('date', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Event Details and tickets
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { data: event, error: eventError } = await supabase
      .from('app_carsena.events')
      .select(`
        *,
        ticket_tiers (*)
      `)
      .eq('id', id)
      .single();

    if (eventError) throw eventError;
    res.json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Validate Ticket (QR Code Check-in)
router.patch('/tickets/:id/validate', async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase.rpc('check_in_ticket', { target_ticket_id: id });

    if (error) throw error;
    res.json(data); // returns { success, message, ticket_code }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const eventsRouter = router;
