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
        tier:ticket_tiers(*),
        customer:customers(name, email)
      `)
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      throw new Error(`Ticket não encontrado: ${error?.message || ''}`);
    }

    if (!config) {
      console.warn('Google Wallet credentials not found in .env');
      return `\#google-wallet-not-configured-${ticketId}`;
    }

    // Clean up class ID if it contains the full email/client id
    const cleanClassId = config.classId.includes('@') || config.classId.includes('.com')
      ? 'ingresso_carsena_v1' // Fallback to a generic name
      : config.classId;

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
            classId: `${config.issuerId}.${cleanClassId}`,
            state: 'ACTIVE',
            barcode: {
              type: 'QR_CODE',
              value: ticket.qr_code,
              alternateText: ticket.qr_code
            },
            reservationId: ticket.id.substring(0, 8).toUpperCase(),
            ticketHolderName: ticket.customer?.name || ticket.customer_email.split('@')[0] || 'Participante',
            ticketNumber: ticket.id.substring(0, 12).toUpperCase(),
            venueName: {
              defaultValue: {
                language: 'pt-BR',
                value: ticket.event.location || 'Local do Evento'
              }
            },
            dateTime: {
              start: ticket.event.date ? new Date(ticket.event.date).toISOString() : new Date().toISOString()
            }
          }
        ]
      }
    };

    const token = jwt.sign(payload, config.privateKey, { algorithm: 'RS256' });
    
    console.log('[GoogleWallet] Link generated successfully for ticket:', ticketId);
    console.log('[GoogleWallet] Using Issuer ID:', config.issuerId);
    console.log('[GoogleWallet] Using Class ID:', `${config.issuerId}.${cleanClassId}`);
    
    return `https://pay.google.com/gp/v/save/${token}`;
  }
}
