import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)) ||
  '';

const supabaseKey = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_API_KEY)) ||
  '';

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) throw new Error('Supabase no está configurado. Este prototipo solo admite datos ficticios.');
  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
};
