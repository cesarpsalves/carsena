import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { AsaasService } from '../services/asaas';
import { emailService } from '../services/email';
import { TicketService } from '../services/ticketService';

const router = Router();

// Create Checkout — Generates PIX payment via Asaas
router.post('/checkout', async (req, res) => {
  const {
    customer_name,
    customer_email,
    customer_document,
    items = [],
    gallery_id,
    payment_method = 'PIX'
  } = req.body;

  try {
    // 1. Check/Create Asaas Customer
    // The supabase client already has schema 'app_carsena' configured in lib/supabase.ts
    const { data: existingCustomerMap } = await supabase
      .from('asaas_customers')
      .select('asaas_customer_id, client_id')
      .eq('metadata->>email', customer_email)
      .single();

    let asaasCustomerId: string;

    if (existingCustomerMap) {
      asaasCustomerId = existingCustomerMap.asaas_customer_id;
      
      // ALWAYS update customer in Asaas to ensure CPF is present (fixes PDF generation error)
      await AsaasService.updateCustomer(asaasCustomerId, {
        name: customer_name,
        email: customer_email,
        cpfCnpj: customer_document
      }).catch(err => console.error('⚠️ Falha ao atualizar cliente no Asaas:', err.message));

    } else {
      // Create in Asaas
      const newAsaasCustomer = await AsaasService.createCustomer({
        name: customer_name,
        email: customer_email,
        cpfCnpj: customer_document
      });

      asaasCustomerId = newAsaasCustomer.id;

      // Save mapping
      await supabase
        .from('asaas_customers')
        .insert([{
          client_id: null,
          asaas_customer_id: asaasCustomerId,
          metadata: { name: customer_name, email: customer_email }
        }]);
    }

    let finalItems = [...items];
    let total_amount = 0;

    // 2. Handle Gallery Balance Payment
    if (gallery_id) {
      const { data: gallery, error: galleryError } = await supabase
        .from('galleries')
        .select('id, title, price, amount_paid, customer_id')
        .eq('id', gallery_id)
        .single();

      if (galleryError || !gallery) throw new Error('Galeria não encontrada');

      const balance = Number(gallery.price || 0) - Number(gallery.amount_paid || 0);
      if (balance <= 0) throw new Error('Esta galeria não possui saldo pendente');

      finalItems = [{
        item_id: gallery_id,
        item_type: 'gallery_balance',
        unit_price: balance,
        quantity: 1,
        name: `Saldo Galeria - ${gallery.title}`
      }];

      total_amount = balance;
    } else {
      // 3. Calculate Total from items
      total_amount = finalItems.reduce((acc: number, item: any) => acc + (item.unit_price * item.quantity), 0);
    }

    // 4. Apply Payment Fees (5% markup for Credit Card)
    let final_total = total_amount;
    if (payment_method === 'CREDIT_CARD') {
      final_total = Number((total_amount * 1.05).toFixed(2));
    }

    if (final_total <= 0) throw new Error('Valor inválido para pagamento');

    // 5. Create Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_id: null,
        customer_email,
        customer_name,
        total_amount: final_total,
        status: 'pending',
        payment_method,
        item_type: finalItems[0]?.item_type || 'gallery',
        item_id: finalItems[0]?.item_id || gallery_id || null
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // 5. Create Order Items (using correct column names: resource_type, resource_id)
    const orderItems = finalItems.map((item: any) => ({
      order_id: order.id,
      resource_type: item.item_type,
      resource_id: item.item_id,
      unit_price: item.unit_price,
      quantity: item.quantity,
    }));

    await supabase.from('order_items').insert(orderItems);

    // 6. Create Asaas Payment
    const asaasPayment = await AsaasService.createPayment({
      customer: asaasCustomerId,
      billingType: payment_method as any,
      value: final_total,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: `Pedido ${order.id} - Carsena`,
      externalReference: order.id
    });

    // 7. Update Order with Asaas Data
    let updateData: any = {
      asaas_payment_id: asaasPayment.id,
      external_id: asaasPayment.id,
      checkout_url: asaasPayment.invoiceUrl
    };

    // If PIX, get QR Code
    if (payment_method === 'PIX') {
      const pixData = await AsaasService.getPixQrCode(asaasPayment.id);
      updateData.pix_qrcode = pixData.encodedImage;
      updateData.pix_qrcode_text = pixData.payload;
      updateData.pix_expiration = asaasPayment.dueDate;
    }

    await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    // 8. Send confirmation email (non-blocking)
    emailService.sendOrderConfirmation(customer_email, {
      id: order.id,
      total: total_amount,
      customerName: customer_name,
      pixPayload: updateData.pix_qrcode_text,
      pixImage: updateData.pix_qrcode
    }).catch(err => console.error('Falha ao enviar e-mail de confirmação:', err));

    res.json({
      success: true,
      orderId: order.id,
      payment: {
        id: asaasPayment.id,
        url: asaasPayment.invoiceUrl,
        pix_qrcode: updateData.pix_qrcode,
        pix_qrcode_text: updateData.pix_qrcode_text,
        total: final_total,
        original_total: total_amount,
        method: payment_method
      }
    });

  } catch (error: any) {
    console.error('❌ Checkout error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Photographer manually registers a cash/presential payment
router.post('/galleries/:galleryId/register-payment', async (req, res) => {
  const { galleryId } = req.params;
  const { amount, method = 'manual' } = req.body;

  try {
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const { data: gallery, error: gError } = await supabase
      .from('galleries')
      .select('id, price, amount_paid, title')
      .eq('id', galleryId)
      .single();

    if (gError || !gallery) {
      return res.status(404).json({ error: 'Galeria não encontrada' });
    }

    const newAmountPaid = Number(gallery.amount_paid || 0) + Number(amount);

    const { error: updateError } = await supabase
      .from('galleries')
      .update({
        amount_paid: newAmountPaid,
        updated_at: new Date().toISOString()
      })
      .eq('id', galleryId);

    if (updateError) throw updateError;

    // Create a manual order record for audit
    await supabase.from('orders').insert([{
      total_amount: Number(amount),
      status: 'paid',
      payment_method: method,
      item_type: 'gallery',
      item_id: galleryId
    }]);

    const isPaid = newAmountPaid >= Number(gallery.price || 0);

    console.log(`💰 Manual payment registered for gallery ${galleryId}: R$ ${amount} (${method}). isPaid: ${isPaid}`);

    res.json({
      success: true,
      gallery_id: galleryId,
      new_amount_paid: newAmountPaid,
      is_paid: isPaid
    });

  } catch (error: any) {
    console.error('❌ Register payment error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Photographer manually marks an order as paid (e.g. cash, bank transfer)
router.post('/orders/:orderId/mark-as-paid', async (req, res) => {
  const { orderId } = req.params;
  const { method = 'manual' } = req.body;

  try {
    // 1. Update order status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({ status: 'paid', payment_method: method, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // 2. Trigger Ticket Generation (if any)
    await TicketService.generateTicketsForOrder(orderId).catch(err => {
      console.error(`❌ Manual Payment: Failed to process tickets for order ${orderId}:`, err);
    });

    console.log(`💰 Order ${orderId} manually marked as paid via ${method}.`);

    res.json({
      success: true,
      order_id: orderId,
      status: 'paid'
    });

  } catch (error: any) {
    console.error('❌ Mark as paid error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export const paymentsRouter = router;
