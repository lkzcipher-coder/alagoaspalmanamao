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
    const payload = await req.json()
    console.log("Webhook recebido:", JSON.stringify(payload))

    // O Mercado Pago envia o ID no corpo para notificações V2 (webhooks)
    // Pode vir como 'data.id' ou 'id' dependendo da versão/evento
    const resourceId = payload.data?.id || payload.resource?.split('/').pop() || payload.id
    const resourceType = payload.type || payload.topic

    console.log(`Processando recurso: ID=${resourceId}, Tipo=${resourceType}`)

    // Se for um evento de pagamento (payment) ou se tivermos um ID mas o tipo for incerto
    // Recomendado sempre buscar o pagamento se tivermos um ID que pareça de pagamento
    if (resourceId && (resourceType === 'payment' || !resourceType)) {
      const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
      if (!accessToken) {
        console.error("Access Token do Mercado Pago não configurado no Deno.env")
        return new Response("Config Error", { status: 500 })
      }

      console.log(`Buscando detalhes do pagamento ${resourceId} no Mercado Pago...`)
      
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Erro ao buscar pagamento ${resourceId}:`, errorText)
        return new Response(`Error fetching payment: ${errorText}`, { status: response.status })
      }

      const paymentData = await response.json()
      console.log(`Status do pagamento ${resourceId}: ${paymentData.status}`)

      if (paymentData.status === 'approved') {
        // Tentar pegar do metadata primeiro, senão do external_reference
        let userId = paymentData.metadata?.user_id
        let planType = paymentData.metadata?.plan_type

        // Mercado Pago as vezes transforma keys em snake_case ou as remove do metadata direto
        // dependendo de como foi enviado. Vamos checar variações.
        if (!userId) userId = paymentData.metadata?.userId
        if (!planType) planType = paymentData.metadata?.planType

        if (!userId && paymentData.external_reference) {
          console.log(`UserId não encontrado no metadata, tentando external_reference: ${paymentData.external_reference}`)
          const parts = paymentData.external_reference.split(':')
          userId = parts[0]
          planType = parts[1] || 'mensal'
        }

        if (!userId) {
          console.error("UserId não encontrado nos dados do pagamento:", JSON.stringify(paymentData))
          return new Response("User ID not found in payment data", { status: 200 }) // Respond 200 to avoid retries from MP
        }
        
        console.log(`Ativando VIP para usuário ${userId}. Plano: ${planType}`)

        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Calcular data de expiração dinâmica
        let monthsToAdd = 1;
        if (planType === 'anual') {
          monthsToAdd = 12;
        } else {
          // Buscar duração do plano configurada para o plano principal
          const { data: vipConfig } = await supabaseAdmin
            .from('configuracoes_vip')
            .select('vip_plan_duration_months')
            .maybeSingle();
          
          if (vipConfig?.vip_plan_duration_months) {
            monthsToAdd = vipConfig.vip_plan_duration_months;
          }
        }

        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + monthsToAdd);

        console.log(`Nova data de expiração: ${expiryDate.toISOString()}`)

        // 3. Atualizar perfil do usuário para VIP
        const { data: updateData, error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ 
            is_premium: true,
            premium_start_date: new Date().toISOString(),
            premium_expiry_date: expiryDate.toISOString()
          })
          .eq('id', userId)
          .select()

        if (updateError) {
          console.error("Erro ao atualizar perfil para VIP no Supabase:", updateError)
        } else {
          console.log("Perfil atualizado com sucesso:", JSON.stringify(updateData))
        }

        // 4. Registrar histórico de pagamento na tabela 'payment_history'
        console.log(`Registrando pagamento ${resourceId} no histórico...`)
        const { error: historyError } = await supabaseAdmin
          .from('payment_history')
          .insert({
            user_id: userId,
            amount: paymentData.transaction_amount,
            payment_method: paymentData.payment_method_id || paymentData.payment_type_id || 'unknown',
            plan_type: planType,
            mp_payment_id: resourceId.toString()
          })

        if (historyError) {
          console.error("Erro ao inserir no histórico de pagamentos:", historyError)
        } else {
          console.log("Pagamento registrado no histórico com sucesso!")
        }

        // 5. Atualizar registro de pagamento na tabela 'payments' (legado/auxiliar)
        const { error: paymentUpdateError } = await supabaseAdmin
          .from('payments')
          .update({ status: 'approved' })
          .eq('user_id', userId)
          .eq('status', 'pending')
      } else {
        console.log(`Pagamento ${resourceId} ainda não aprovado (status: ${paymentData.status})`)
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error("Erro crítico no Webhook do Mercado Pago:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})