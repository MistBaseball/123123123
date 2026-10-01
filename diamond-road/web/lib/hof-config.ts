/**
 * Supabase project for the hall of fame (online ranking).
 *
 * Both values are public by design: the key only allows reading the ranking and calling
 * `submit_record`, which updates a career's row only with that career's own secret
 * (see tools/hall-of-fame/setup.sql). Empty = not connected yet: the game shows only the
 * player's own record. VITE_HOF_URL / VITE_HOF_KEY override them (local testing).
 */
const env = (import.meta.env ?? {}) as Record<string, string | undefined>;
export const HOF_URL: string = (
  env.VITE_HOF_URL || "https://exnxnghlfozfinmypziz.supabase.co"
).replace(/\/$/, "");
export const HOF_KEY: string = env.VITE_HOF_KEY || "sb_publishable_Sc4CHj4PldKetogXwVc83A_1INF1gVX";
