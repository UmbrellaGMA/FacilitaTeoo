import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Initialize Mercado Pago
// NOTE: It is recommended to use Deno.env.get("MP_ACCESS_TOKEN") for security
const ACCESS_TOKEN = "APP_USR-4332005898484834-020720-626589c734f048a0910ee01c5fb3e991-237865162";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { plan, userEmail, origin } = await req.json();

        // Validate input
        if (!plan || !plan.price || !userEmail) {
            throw new Error('Dados inválidos: Plano ou Email faltando.');
        }

        console.log(`Creating preference for ${userEmail} - Plan: ${plan.name} (${plan.price})`);

        const preferenceData = {
            items: [
                {
                    title: plan.name,
                    quantity: 1,
                    unit_price: Number(plan.price),
                    currency_id: 'BRL',
                    description: plan.description || `Assinatura ${plan.name}`,
                },
            ],
            payer: {
                email: userEmail,
            },
            back_urls: {
                success: `${origin}/settings?payment=success`,
                failure: `${origin}/settings?payment=failure`,
                pending: `${origin}/settings?payment=pending`,
            },
            auto_return: 'approved',
            external_reference: plan.id, // Store plan ID here to retrieve later correctly
        };

        const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preferenceData)
        });

        const mpData = await mpResponse.json();

        if (!mpResponse.ok) {
            console.error('Mercado Pago Error:', mpData);
            throw new Error(mpData.message || 'Erro ao criar preferência no Mercado Pago');
        }

        console.log('Preference created successfully:', mpData.id);

        return new Response(JSON.stringify({ init_point: mpData.init_point }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error('Edge Function Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
