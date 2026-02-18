import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
    try {
        const url = new URL(req.url); // Keep for parsing if needed

        // Only allow POST
        if (req.method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
        }

        const body = await req.json();
        console.log("Webhook received:", body);

        const { type, data } = body;

        // Check if it's a payment notification
        if ((type === "payment" || body.topic === "payment") && (data?.id || body.resource)) {
            const paymentId = data?.id || body.resource?.split("/").pop(); // Handle both formats if needed

            console.log("Processing payment ID:", paymentId);

            // Fetch payment details from Mercado Pago
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    "Authorization": `Bearer ${MP_ACCESS_TOKEN}`
                }
            });

            if (!mpResponse.ok) {
                console.error("Failed to fetch payment from MP:", await mpResponse.text());
                return new Response("Error fetching payment", { status: 500 });
            }

            const payment = await mpResponse.json();
            console.log("Payment status:", payment.status);

            if (payment.status === "approved") {
                const { metadata } = payment;
                console.log("Payment metadata:", metadata);

                const userId = metadata.user_id;
                const planId = metadata.plan_id;
                const durationDays = metadata.duration_days || 30;

                if (userId && planId) {
                    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

                    const startDate = new Date();
                    const endDate = new Date();
                    endDate.setDate(startDate.getDate() + Number(durationDays));

                    // Check existing subscription
                    const { data: existingSub } = await supabase
                        .from("user_subscriptions")
                        .select("id")
                        .eq("user_id", userId)
                        .single();

                    let error;
                    if (existingSub) {
                        const { error: updateError } = await supabase.from("user_subscriptions").update({
                            status: "active",
                            plan_id: planId,
                            starts_at: startDate.toISOString(),
                            expires_at: endDate.toISOString()
                        }).eq("user_id", userId);
                        error = updateError;
                    } else {
                        const { error: insertError } = await supabase.from("user_subscriptions").insert({
                            user_id: userId,
                            plan_id: planId,
                            status: "active",
                            starts_at: startDate.toISOString(),
                            expires_at: endDate.toISOString()
                        });
                        error = insertError;
                    }

                    if (error) {
                        console.error("Supabase update error:", error);
                        return new Response("Database error", { status: 500 });
                    }

                    console.log("Subscription updated successfully for user:", userId);
                } else {
                    console.error("Missing metadata (user_id or plan_id)");
                }
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200
        });

    } catch (error) {
        console.error("Webhook Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400
        });
    }
});
