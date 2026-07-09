import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";

// Load .env from project root in Node.js environment
config({ path: path.resolve(process.cwd(), "../../.env") });

export function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase credentials in environment variables");
  }

  // Use service_role/secret key if available to bypass RLS in the admin dashboard
  return createClient(url, key, {
    auth: {
      persistSession: false
    }
  });
}
