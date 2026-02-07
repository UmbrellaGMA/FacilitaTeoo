
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://atluigqzaymbkgfyxgks.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_c4VPMpDPsdM8O_-DTOaTbg_PBf-vaWm';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRPC() {
    const { data: { user } } = await supabase.auth.signInWithPassword({
        email: 'adminmaster@admin.com',
        password: 'Admin2003',
    });

    if (!user) {
        console.log("Login failed");
        return;
    }

    console.log("Logged in as:", user.email);

    const { data, error } = await supabase.rpc('get_admin_users_data');

    if (error) {
        console.error('Error calling RPC:', error);
    } else {
        console.log('Users found:', data ? data.length : 0);
        if (data && data.length > 0) {
            console.log('First user data:', data[0]);
        }
    }
}

testRPC();
