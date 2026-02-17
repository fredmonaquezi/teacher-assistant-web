import { createClient } from "@supabase/supabase-js";
import { loadSupabaseClientEnv } from "./config/env";

const { supabaseUrl, supabaseAnonKey } = loadSupabaseClientEnv();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
