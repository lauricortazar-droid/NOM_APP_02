import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)) ||
  'https://jzjphfcwpbwitqriqffs.supabase.co';

const supabaseKey = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_API_KEY)) ||
  'sb_publishable_yhtT0dEBDx4_VWrlxPLGmw_Z7xg63fe';

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
