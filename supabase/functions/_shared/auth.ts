/**
 * Shared authentication helpers for Edge Functions
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

interface AuthResult {
  user: { id: string; email: string } | null;
  error: string | null;
}

interface RoleResult {
  user: { id: string; email: string; role: string } | null;
  error: string | null;
}

/**
 * Verifies the JWT from the Authorization header and returns the authenticated user.
 */
export async function verifyAuth(
  req: Request,
  supabaseUrl: string,
  supabaseServiceKey: string,
): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: error?.message || "Invalid or expired token" };
  }

  return {
    user: { id: user.id, email: user.email || "" },
    error: null,
  };
}

/**
 * Verifies the JWT and checks that the user has one of the allowed roles
 * by looking up the `profiles` table.
 */
export async function verifyRole(
  req: Request,
  supabaseUrl: string,
  supabaseServiceKey: string,
  allowedRoles: string[],
): Promise<RoleResult> {
  const authResult = await verifyAuth(req, supabaseUrl, supabaseServiceKey);
  if (authResult.error || !authResult.user) {
    return { user: null, error: authResult.error || "Not authenticated" };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authResult.user.id)
    .single();

  if (profileError || !profile) {
    return { user: null, error: "User profile not found" };
  }

  const userRole = profile.role || "user";

  if (!allowedRoles.includes(userRole)) {
    return { user: null, error: `Insufficient permissions. Required: ${allowedRoles.join(", ")}` };
  }

  return {
    user: { ...authResult.user, role: userRole },
    error: null,
  };
}
