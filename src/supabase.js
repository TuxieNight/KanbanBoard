import { createClient } from '@supabase/supabase-js';

// Initialize a single Supabase client instance for the app.
export const supabase = createClient(
  'https://xdbmjrnmjndvnajmffmc.supabase.co',
  'sb_publishable_-yTf3U63CuEYZYUoli9hOQ_b1OsVPwA'
);