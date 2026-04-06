import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { emailService } from '../services/email';
import { TicketService } from '../services/ticketService';

const router = Router();

// Asaas Webhook Handler
// The supabase client already has schema 'app_carsena' configured in lib/supabase.ts
router.post('/asaas', async (req, res) => {
  const { event, payment } = req.body;
  const asaasToken = req.headers['asaas-access-token'];

  // 1. Validate Webhook Signature
  if (process.env.ASAAS_WEBHOOK_SECRET && asaasToken !== process.env.ASAAS_WEBHOOK_SECRET) {
    console.error('❌ Invalid Asaas Webhook Token');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log(`🔔 Asaas Webhook event: ${event} for payment ${payment?.id}`);

    // 2. Audit/Log Webhook
    await supabase
      .from('payment_webhooks')
      .insert([{
        event_type: event,
        payload: req.body,
        processed: false
      }]);

    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_SETTLED') {
      const orderId = payment.externalReference;

      if (!orderId) {
        console.warn('⚠️ No externalReference (orderId) found in payment');
        return res.status(200).send('OK');
      }

      // 3. Update Order Status
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single();

      if (orderError) throw orderError;

      // 4. Release Products based on order_items
      // NOTE: columns are resource_type and resource_id (not product_type/product_id)
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('resource_id, resource_type')
        .eq('order_id', orderId);

      if (!itemsError && items) {
        // GALLERY BALANCE — Release HD access by setting amount_paid = price
        const galleryItems = items.filter(i => i.resource_type === 'gallery_balance');
        for (const item of galleryItems) {
          const { data: gallery } = await supabase
            .from('galleries')
            .select('price')
            .eq('id', item.resource_id)
            .single();

          if (gallery) {
            await supabase
              .from('galleries')
              .update({ amount_paid: gallery.price, updated_at: new Date().toISOString() })
              .eq('id', item.resource_id);

            console.log(`✅ Gallery ${item.resource_id} released HD (fully paid).`);
          }
        }

        // PHOTO ACCESS — Individual photo unlocks
        const photoItems = items.filter(i => i.resource_type === 'photo');
        if (photoItems.length > 0) {
          const accessRecords = photoItems.map(item => ({
            order_id: orderId,
            photo_id: item.resource_id,
            expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
          }));
          await supabase.from('photo_access').insert(accessRecords);
          console.log(`✅ Released access for ${photoItems.length} photos (Order ${orderId}).`);
        }

        // 4. TICKETS - Centralized Ticket Generation & Email Delivery
        await TicketService.generateTicketsForOrder(orderId).catch(err => {
            console.error(`❌ Webhook: Failed to process tickets for order ${orderId}:`, err);
        });
      }

      console.log(`✅ Pedido ${orderId} marcado como pago e produtos liberados.`);
    }

    res.status(200).send('Webhook processed');
  } catch (error: any) {
    console.error('❌ Webhook error:', error.message);
    // Log error in payment_webhooks
    await supabase
      .from('payment_webhooks')
      .update({ error_message: error.message })
      .eq('payload->payment->>id', payment?.id);

    res.status(500).json({ error: error.message });
  }
});

export const webhooksRouter = router;
