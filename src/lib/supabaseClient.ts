import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let cachedClient: SupabaseClient | null = null;

export const getSupabaseConfigError = () => {
  if (!supabaseUrl && !supabaseAnonKey) {
    return "Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";
  }
  if (!supabaseUrl) {
    return "Missing NEXT_PUBLIC_SUPABASE_URL.";
  }
  if (!supabaseAnonKey) {
    return "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY.";
  }
  return null;
};

export const getSupabaseClient = () => {
  if (cachedClient) return cachedClient;
  const configError = getSupabaseConfigError();
  if (configError) {
    throw new Error(`Supabase client is not configured. ${configError}`);
  }
  cachedClient = createClient(supabaseUrl, supabaseAnonKey);
  return cachedClient;
};
