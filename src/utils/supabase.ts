import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_SUPABASE_URL;
const supabaseKey = process.env.NEXT_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Faltan las variables de entorno de Supabase.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);