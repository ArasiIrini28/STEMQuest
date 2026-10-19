import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
let error = "";
function configuredClient() {
  if (!url && !key) return null;
  if (!url || !key) {
    error =
      "Production setup is incomplete. Both Supabase public values are required. Demo mode remains available.";
    return null;
  }
  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol))
      throw new Error("Invalid protocol");
    return createClient(url, key);
  } catch {
    error =
      "The Supabase URL or public key configuration is invalid. Check .env.local, then restart. Demo mode remains available.";
    return null;
  }
}
export const supabase = configuredClient();
export const connected = !!supabase;
export const configurationError = error;
