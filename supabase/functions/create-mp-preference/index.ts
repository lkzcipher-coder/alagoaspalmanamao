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
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Sistema de pagamento em configuração (Access Token ausente)" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { userId, planType = 'mensal' } = await req.json()
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Buscar configurações financeiras
    const { data: config, error: configError } = await supabaseAdmin
      .from('configuracoes_financeiras')
      .select('*')
      .single()

    if (configError || !config) {
      console.error("Erro ao buscar configurações financeiras:", configError)
      return new Response(
        JSON.stringify({ error: "Erro ao buscar configurações da assinatura" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const isAnnual = planType === 'anual'
    const price = isAnnual ? Number(config.vip_price_annual) : Number(config.vip_price)
    const maxInstallments = isAnnual ? Number(config.max_parcelas_anual) : Number(config.max_parcelas_mensal)

    // 2. Criar preferência no Mercado Pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            title: `Assinatura VIP ${isAnnual ? 'Anual' : 'Mensal'} - Guia de Turismo`,
            unit_price: price,
            quantity: 1,
            currency_id: 'BRL',
          }
        ],
        payment_methods: {
          installments: maxInstallments,
        },
        metadata: {
          user_id: userId,
          plan_type: planType,
        },
        back_urls: {
          success: `${req.headers.get('origin')}?payment=success`,
          failure: `${req.headers.get('origin')}?payment=failure`,
          pending: `${req.headers.get('origin')}?payment=pending`,
        },
        auto_return: 'approved',
        notification_url: `https://fxkrpadnrdewpbfmawzo.supabase.co/functions/v1/mp-webhook`,
        external_reference: `${userId}:${planType}`, // Fallback if metadata is not easily accessible
      }),
    })

    const preference = await response.json()

    if (!response.ok) {
      console.error("Erro no Mercado Pago:", preference)
      return new Response(
        JSON.stringify({ error: "Erro ao criar preferência de pagamento" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Registrar pagamento pendente
    await supabaseAdmin.from('payments').insert({
      user_id: userId,
      amount: price,
      status: 'pending',
      external_id: preference.id,
      provider: 'mercadopago',
      // Você pode querer adicionar uma coluna 'plan_type' na tabela de pagamentos futuramente
    })

    return new Response(
      JSON.stringify({ checkoutUrl: preference.init_point }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Erro na Edge Function create-mp-preference:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})