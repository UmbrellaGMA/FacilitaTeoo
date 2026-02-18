import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Verify the caller is authenticated and is MASTER
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Não autorizado');
        }

        // Create a client with the user's token to verify identity
        const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            global: { headers: { Authorization: authHeader } }
        });

        // Get the calling user from the JWT
        const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
            global: { headers: { Authorization: authHeader } }
        });
        const { data: { user: caller }, error: authError } = await anonClient.auth.getUser();
        if (authError || !caller) {
            throw new Error('Não autorizado');
        }

        // Verify caller is MASTER
        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: callerProfile } = await adminClient
            .from('user_profiles')
            .select('role')
            .eq('id', caller.id)
            .single();

        if (!callerProfile || callerProfile.role !== 'MASTER') {
            throw new Error('Apenas administradores podem executar esta ação');
        }

        const { action, userId, payload } = await req.json();

        if (!action) {
            throw new Error('Ação não especificada');
        }

        let result: any = { success: true };

        switch (action) {
            case 'delete_user': {
                if (!userId) throw new Error('ID do usuário não informado');

                // Check if user is deletable
                const { data: targetProfile } = await adminClient
                    .from('user_profiles')
                    .select('is_deletable')
                    .eq('id', userId)
                    .single();

                if (!targetProfile?.is_deletable) {
                    throw new Error('Este usuário não pode ser excluído');
                }

                // Delete profile first (cascades related data)
                const { error: profileError } = await adminClient
                    .from('user_profiles')
                    .delete()
                    .eq('id', userId);

                if (profileError) {
                    console.error('Error deleting profile:', profileError);
                    throw new Error('Erro ao excluir perfil: ' + profileError.message);
                }

                // Delete from auth.users using admin API
                const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);

                if (authDeleteError) {
                    console.error('Error deleting auth user:', authDeleteError);
                    throw new Error('Perfil removido, mas erro ao excluir autenticação: ' + authDeleteError.message);
                }

                result = { success: true, message: 'Usuário excluído completamente' };
                break;
            }

            case 'update_user_auth_email': {
                if (!userId) throw new Error('ID do usuário não informado');
                if (!payload?.email) throw new Error('Email não informado');

                const { error } = await adminClient.auth.admin.updateUserById(userId, {
                    email: payload.email,
                });
                if (error) throw new Error('Erro ao atualizar email: ' + error.message);

                result = { success: true, message: 'Email atualizado' };
                break;
            }

            case 'update_user_auth_password': {
                if (!userId) throw new Error('ID do usuário não informado');
                if (!payload?.password) throw new Error('Senha não informada');

                const { error } = await adminClient.auth.admin.updateUserById(userId, {
                    password: payload.password,
                });
                if (error) throw new Error('Erro ao atualizar senha: ' + error.message);

                result = { success: true, message: 'Senha atualizada' };
                break;
            }

            default:
                throw new Error(`Ação desconhecida: ${action}`);
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error('Admin Action Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
