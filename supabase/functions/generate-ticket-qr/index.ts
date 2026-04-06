import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { qrcode } from "https://deno.land/x/qrcode@v2.0.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ticket_id } = await req.json()

    if (!ticket_id) {
      throw new Error('Ticket ID is required')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch ticket and event data
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('tickets')
      .select(`
        id,
        status,
        is_revoked,
        customer_email,
        events (
          title,
          date,
          location
        )
      `)
      .eq('id', ticket_id)
      .single()

    if (ticketError || !ticket) {
      throw new Error('Ticket not found')
    }

    if (ticket.is_revoked) {
      throw new Error('Ticket has been revoked')
    }

    // 2. Generate a secure token/payload for the QR
    // In a real prod environment, we would sign this with a secret
    // For now, we'll create a structured string that will be validated by the 'validate-ticket' function
    const payload = JSON.stringify({
      t: ticket.id,
      e: ticket.customer_email,
      s: 'SIGNED_BY_CARSENA_V1' // Place holder for real signature logic
    })

    // 3. Generate QR Code image (base64)
    const qrImage = await qrcode(payload)

    return new Response(
      JSON.stringify({ 
        qr_code: qrImage,
        ticket_info: {
          event: ticket.events.title,
          date: ticket.events.date,
          location: ticket.events.location
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
