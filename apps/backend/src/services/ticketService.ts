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

    // Fetch customer info - prioritizing the new columns on the order
    let customerEmail = order.customer_email || 'unknown@example.com';
    let customerName = order.customer_name || 'Cliente';
    let customerId = order.customer_id;

    if (customerEmail === 'unknown@example.com' && order.customer_id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('name, email')
        .eq('id', order.customer_id)
        .single();
      
      if (customer) {
        customerEmail = customer.email;
        customerName = customer.name;
      }
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
            order_id: orderId,
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
