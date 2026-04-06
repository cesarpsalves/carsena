import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { qr_payload } = await req.json()

    if (!qr_payload) {
      throw new Error('QR Payload is required')
    }

    // 1. Verify the payload (must be parsed from the JSON generated in generate-ticket-qr)
    let payload;
    try {
      payload = JSON.parse(qr_payload)
    } catch (e) {
      throw new Error('Invalid QR format')
    }

    if (!payload.t || payload.s !== 'SIGNED_BY_CARSENA_V1') {
      throw new Error('Security signature failed or invalid ticket')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Fetch ticket and current status
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('tickets')
      .select(`
        id,
        status,
        checked_in_at,
        is_revoked,
        customer_email,
        events (
          title
        )
      `)
      .eq('id', payload.t)
      .single()

    if (ticketError || !ticket) {
      throw new Error('Ticket not found in record')
    }

    if (ticket.is_revoked) {
      throw new Error('Ticket has been revoked and is invalid')
    }

    if (ticket.checked_in_at) {
      throw new Error(`Ticket already used at ${new Date(ticket.checked_in_at).toLocaleString('pt-BR')}`)
    }

    // 3. Update Check-in status
    const { error: updateError } = await supabaseClient
      .from('tickets')
      .update({ 
        checked_in_at: new Date().toISOString(),
        status: 'validated'
      })
      .eq('id', ticket.id)

    if (updateError) {
      throw new Error('Failed to update ticket status')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Entrada autorizada!',
        details: {
          customer: ticket.customer_email,
          event: ticket.events.title,
          time: new Date().toLocaleTimeString('pt-BR')
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
