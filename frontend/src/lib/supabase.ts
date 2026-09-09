import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder.supabase.co')) {
  throw new Error('Missing or invalid Supabase environment variables. Please check your D:\\RoadGuard\\frontend\\.env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
