import { supabase } from './supabase';

export interface TicketTier {
  id?: string;
  event_id?: string;
  name: string;
  price: number;
  stock_total: number;
  stock_sold: number;
  active: boolean;
}

export interface Event {
  id?: string;
  title: string;
  description: string;
  date: string;
  location: string;
  status: 'open' | 'closed';
  thumbnail_url?: string;
  ticket_tiers?: TicketTier[];
}

export const eventService = {
  // Público (Site)
  async getEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .schema('app_carsena')
      .from('events')
      .select('*, ticket_tiers(*)')
      .eq('status', 'open')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }
    return data || [];
  },

  // Administrativo (Gerenciamento completo)
  async getAllEventsAdmin(): Promise<Event[]> {
    const { data, error } = await supabase
      .schema('app_carsena')
      .from('events')
      .select('*, ticket_tiers(*)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching admin events:', error);
      return [];
    }
    return data || [];
  },

  async saveEvent(event: any, tiers: any[]) {
    // 1. Salvar o Evento
    const eventData = {
      title: event.title || event.name, // Suporta ambos temporariamente para compatibilidade
      description: event.description,
      date: event.date,
      location: event.location,
      status: event.status || 'open',
      thumbnail_url: event.thumbnail_url || event.image_url // Mantém compatibilidade temporária
    };

    let eventId = event.id;

    if (eventId) {
      const { error } = await supabase
        .schema('app_carsena')
        .from('events')
        .update(eventData)
        .eq('id', eventId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .schema('app_carsena')
        .from('events')
        .insert([eventData])
        .select()
        .single();
      if (error) throw error;
      eventId = data.id;
    }

    // 2. Salvar os Tiers (Lotes)
    // Primeiro, desativamos lotes antigos que não estão na lista (se for edição)
    // Ou simplesmente limpamos e recriamos (mais simples para agora)
    if (event.id) {
        await supabase.schema('app_carsena').from('ticket_tiers').delete().eq('event_id', eventId);
    }

    const tiersData = tiers.map(t => ({
      event_id: eventId,
      name: t.name,
      price: t.price,
      stock_total: t.stock_total || t.capacity || 50,
      stock_sold: t.stock_sold || t.sold_count || 0,
      active: true
    }));

    const { error: tierError } = await supabase
      .schema('app_carsena')
      .from('ticket_tiers')
      .insert(tiersData);

    if (tierError) throw tierError;

    return eventId;
  },

  async deleteEvent(id: string) {
    // 1. Deletar dependents
    await supabase.schema('app_carsena').from('tickets').delete().eq('event_id', id);
    await supabase.schema('app_carsena').from('ticket_tiers').delete().eq('event_id', id);
    
    // 2. Deletar evento
    const { error } = await supabase
      .schema('app_carsena')
      .from('events')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    const { error } = await supabase
      .schema('app_carsena')
      .from('events')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) throw error;
  }
};
