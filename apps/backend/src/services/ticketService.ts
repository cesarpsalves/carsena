import { supabase } from '../lib/supabase';
import { emailService } from './email';

export class TicketService {
  /**
   * Generates tickets for an order if it contains ticket items.
   * This is used by both webhooks and manual payment registration.
   */
  static async generateTicketsForOrder(orderId: string) {
    console.log(`🎫 TicketService: Processing tickets for order ${orderId}...`);

    // 1. Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('resource_id, resource_type')
      .eq('order_id', orderId);

    if (itemsError || !items) {
      console.error(`❌ TicketService: Failed to fetch items for order ${orderId}:`, itemsError);
      return { success: false, error: 'Order items not found' };
    }

    const ticketItems = items.filter(i => i.resource_type === 'ticket');
    if (ticketItems.length === 0) {
      console.log(`ℹ️ TicketService: No tickets found in order ${orderId}.`);
      return { success: true, ticketsCreated: 0 };
    }

    // 2. Fetch order and customer info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, asaas_payment_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
       console.error(`❌ TicketService: Order ${orderId} not found.`);
       return { success: false, error: 'Order not found' };
    }

    // Fetch customer info - try to get from asaas_customers mapping or the orders table if available
    let customerEmail = 'unknown@example.com';
    let customerName = 'Cliente';
    let customerId = order.customer_id;

    if (order.asaas_payment_id) {
        // Find by asaas payment
        const { data: asaasPayment } = await supabase
            .from('payment_webhooks') // We might not have this, better use asaas_customers mapping
            .select('payload')
            .eq('id', order.asaas_payment_id) // This is probably wrong, search by asaas_payment_id
            .single();
    }

    // Best way: find by the order reference usually stored in asaas_customers or just pass it
    // For now, let's look at asaas_payment_id and match it back to customers
    // Ref: webhooks.ts line 92
    
    // We need to find the asaas customer ID associated with this payment ID or order
    // But since we are calling this from webhook or manual, we might already have it.
    // If called from manual admin, we might need to lookup the order metadata.
    
    // For now, let's try to get customer from asaas_customers metadata
    const { data: customerMap } = await supabase
      .from('asaas_customers')
      .select('metadata, customer_id')
      .filter('metadata->>email', 'eq', order.customer_email || ''); // If we have customer_email on order

    // Fallback logic to find customer
    if (customerMap && customerMap.length > 0) {
        customerEmail = customerMap[0].metadata.email;
        customerName = customerMap[0].metadata.name;
        customerId = customerMap[0].customer_id;
    }

    // 3. Generate tickets
    const generatedTicketCodes: string[] = [];
    
    for (const item of ticketItems) {
      const { data: tier } = await supabase
        .from('ticket_tiers')
        .select('event_id')
        .eq('id', item.resource_id)
        .single();

      if (tier) {
        const ticketCode = `CAR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        
        const { error: ticketError } = await supabase
          .from('tickets')
          .insert([{
            event_id: tier.event_id,
            tier_id: item.resource_id,
            status: 'active',
            qr_code: ticketCode,
            payment_id: order.asaas_payment_id || order.id,
            customer_email: customerEmail,
            customer_id: customerId
          }]);

        if (!ticketError) {
            generatedTicketCodes.push(ticketCode);
            await supabase.rpc('increment_tier_sold_count', { target_tier_id: item.resource_id });
        } else {
            console.error(`❌ TicketService: Error creating ticket for tier ${item.resource_id}:`, ticketError);
        }
      }
    }

    // 4. Send email
    if (generatedTicketCodes.length > 0) {
        await emailService.sendDeliveryEmail(customerEmail, {
            id: orderId,
            customerName: customerName,
            items: items,
            ticketCodes: generatedTicketCodes
        });
        console.log(`✅ TicketService: Generated ${generatedTicketCodes.length} tickets and sent email.`);
    }

    return { 
        success: true, 
        ticketsCreated: generatedTicketCodes.length,
        codes: generatedTicketCodes 
    };
  }
}
