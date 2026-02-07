
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://atluigqzaymbkgfyxgks.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_c4VPMpDPsdM8O_-DTOaTbg_PBf-vaWm';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFetch() {
    const { data: { user } } = await supabase.auth.signInWithPassword({
        email: 'adminmaster@admin.com',
        password: 'Admin2003',
    });

    if (!user) {
        console.log("Login failed");
        return;
    }

    console.log("Logged in as:", user.email, "Role:", user.role);

    const { data, error } = await supabase
        .from('user_profiles')
        .select('*');

    if (error) {
        console.error('Error fetching profiles:', error);
    } else {
        console.log('Profiles found:', data ? data.length : 0);
        if (data && data.length > 0) {
            console.log('First profile:', data[0]);
        }
    }
}

testFetch();
