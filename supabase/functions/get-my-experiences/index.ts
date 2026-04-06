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
    // 1. Initialize Supabase Client with Auth header from request
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // 2. Identification: find customer profile linked to the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    // Find our application customer record
    // Using SERVICE ROLE client for this to ensure we can cross-reference schema safely
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: customer, error: customerError } = await adminClient
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (customerError || !customer) {
      return new Response(
        JSON.stringify({ 
          galleries: [], 
          tickets: [], 
          message: 'No customer profile found for this user.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // 3. Fetch Galleries
    const { data: galleries, error: galleriesError } = await adminClient
      .from('galleries')
      .select(`
        id,
        title,
        cover_url,
        status,
        expires_at,
        created_at
      `)
      .eq('customer_id', customer.id)
      .eq('status', 'published')

    // 4. Fetch Tickets (with Event details)
    const { data: tickets, error: ticketsError } = await adminClient
      .from('tickets')
      .select(`
        id,
        status,
        created_at,
        events (
          id,
          title,
          date,
          location,
          thumbnail_url
        ),
        ticket_tiers (
          name,
          price
        )
      `)
      .eq('customer_id', customer.id)
      .not('status', 'eq', 'cancelled')

    return new Response(
      JSON.stringify({ 
        galleries: galleries || [],
        tickets: tickets || [],
        metadata: {
          customer_id: customer.id,
          generated_at: new Date().toISOString()
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
