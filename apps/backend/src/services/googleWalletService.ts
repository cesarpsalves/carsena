import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase';

interface GoogleWalletConfig {
  serviceAccountEmail: string;
  privateKey: string;
  issuerId: string;
  classId: string;
}

export class GoogleWalletService {
  private static getConfig(): GoogleWalletConfig | null {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
    const classId = process.env.GOOGLE_WALLET_CLASS_ID;

    if (!email || !key || !issuerId || !classId) {
      return null;
    }

    return {
      serviceAccountEmail: email,
      privateKey: key,
      issuerId,
      classId
    };
  }

  /**
   * Generates a "Save to Google Wallet" link for a specific ticket
   */
  static async generateSaveLink(ticketId: string): Promise<string> {
    const config = this.getConfig();
    
    // Fetch ticket details from DB
    const { data: ticket, error } = await supabase
      .schema('app_carsena')
      .from('tickets')
      .select(`
        *,
        event:events(*),
        tier:event_tiers(*)
      `)
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      throw new Error('Ticket not found');
    }

    // If config is missing, return a "pre-configured" or mockup link
    // or throw error depending on how we want to handle it.
    // For now, let's return a special URL if not configured.
    if (!config) {
      console.warn('Google Wallet credentials not found in .env');
      return `\#google-wallet-not-configured-${ticketId}`;
    }

    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      iss: config.serviceAccountEmail,
      aud: 'google',
      typ: 'savetowallet',
      iat: now,
      payload: {
        eventTicketObjects: [
          {
            id: `${config.issuerId}.${ticket.id}`,
            classId: `${config.issuerId}.${config.classId}`,
            state: 'ACTIVE',
            barcode: {
              type: 'QR_CODE',
              value: ticket.qr_code,
              alternateText: ticket.id.substring(0, 8).toUpperCase()
            },
            reservationId: ticket.id.substring(0, 8).toUpperCase(),
            ticketHolderName: ticket.customer_name || 'Participante',
            ticketNumber: ticket.id.substring(0, 12),
            venueName: {
              defaultValue: {
                language: 'pt-BR',
                value: ticket.event.location || 'Local do Evento'
              }
            }
          }
        ]
      }
    };

    const token = jwt.sign(payload, config.privateKey, { algorithm: 'RS256' });
    return `https://pay.google.com/gp/v/save/${token}`;
  }
}
