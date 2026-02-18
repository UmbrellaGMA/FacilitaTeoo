import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Initialize Mercado Pago - token via variável de ambiente do Supabase
const ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") ?? "";

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
        let { plan, userEmail, userId, origin } = await req.json();

        // Ensure origin is defined and valid
        if (!origin) {
            origin = req.headers.get('origin') || 'http://localhost:5173';
        }

        // Remove trailing slash if present to avoid double slashes
        if (origin.endsWith('/')) {
            origin = origin.slice(0, -1);
        }

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

            // notification_url: 'https://atluigqzaymbkgfyxgks.supabase.co/functions/v1/mp-webhook', // This would be the production webhook URL
            // Using auto_return 'approved' causes validation issues on localhost sometimes, so we rely on the user returning.
            // But to track payment status, we need metadata.

            metadata: {
                user_id: userId,
                plan_id: plan.id,
                duration_days: 30 // Assuming monthly for now, or get from plan.interval
            },

            external_reference: plan.id,
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
            throw new Error(`MP Error ${mpData.message} | Sent Back URLs: ${JSON.stringify(preferenceData.back_urls)}`);
        }

        console.log('Preference created successfully:', mpData.id);

        return new Response(JSON.stringify({ init_point: mpData.init_point }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error('Edge Function Error:', error.message);
        // Include preferenceData in the error response if it exists (we need to move the declaration up or assume it might be undefined)
        return new Response(JSON.stringify({
            error: error.message,
            debug_origin: req.headers.get('origin'), // Log header origin
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
