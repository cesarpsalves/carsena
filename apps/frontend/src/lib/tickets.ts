import { supabase } from "./supabase";

export const ticketService = {
  /**
   * Get ticket details from the database
   */
  async getTicket(ticketId: string) {
    const { data, error } = await supabase
      .schema('app_carsena')
      .from('tickets')
      .select(`
        id,
        status,
        qr_code,
        checked_in_at,
        is_revoked,
        events (
          id,
          title,
          date,
          location,
          description
        ),
        ticket_tiers (
          name,
          price
        ),
        customers (
          email,
          name
        )
      `)
      .eq('id', ticketId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Validate a ticket using the RPC function
   */
  async validateTicket(qrCode: string) {
    // Note: The RPC should handle the schema internally, 
    // but we can call it directly via supabase client.
    const { data, error } = await supabase.rpc('check_in_ticket', { 
      target_identifier: qrCode
    });

    if (error) throw error;
    return data; // { success: boolean, message: string, ticket_code: string }
  },

  /**
   * Get the Google Wallet link for a ticket
   */
  async getGoogleWalletUrl(ticketId: string): Promise<string> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tickets/${ticketId}/google-wallet`);
      if (!response.ok) throw new Error('Falha ao obter link do Google Wallet');
      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Error getting Google Wallet URL:', error);
      throw error;
    }
  }
};
