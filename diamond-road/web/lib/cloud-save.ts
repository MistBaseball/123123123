/**
 * Cloud save with a personal code (settings): the career is kept on the same Supabase project
 * as the hall of fame (tools/hall-of-fame/cloud-save.sql), under a short code like "K7QF-2M9X".
 * Whoever has the code can load (and keep saving to) that career, on any computer.
 */
import { HOF_KEY, HOF_URL } from "./hof-config";
import type { Career } from "./game/engine";

const CODE_KEY = "diamond-road-cloud-code";
/** No 0/O, 1/I/L: easy to read out and type. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_PATTERN = /^[A-Z2-9]{4}-[A-Z2-9]{4}$/;

export const cloudConfigured = () => !!HOF_URL && !!HOF_KEY;

const headers = (): Record<string, string> => ({
  apikey: HOF_KEY,
  "Content-Type": "application/json",
  ...(HOF_KEY.startsWith("eyJ") ? { Authorization: `Bearer ${HOF_KEY}` } : {}),
});

/** "abcd2345" / "ABCD 2345" → "ABCD-2345" (or null if it cannot be a code). */
export function normalizeCode(input: string): string | null {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.length !== 8) return null;
  const code = `${raw.slice(0, 4)}-${raw.slice(4)}`;
  return CODE_PATTERN.test(code) ? code : null;
}

export function newCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

export function loadCode(): string | null {
  try {
    const c = localStorage.getItem(CODE_KEY);
    return c && CODE_PATTERN.test(c) ? c : null;
  } catch {
    return null;
  }
}
export function saveCode(code: string | null) {
  try {
    if (code) localStorage.setItem(CODE_KEY, code);
    else localStorage.removeItem(CODE_KEY);
  } catch {
    /* private mode: the code lasts for this visit */
  }
}

/** Uploads the career under the code. Throws "no-function" if the server part is missing. */
export async function uploadCareer(code: string, career: Career): Promise<void> {
  const res = await fetch(`${HOF_URL}/rest/v1/rpc/cloud_save`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ p_code: code, p_data: career }),
  });
  if (!res.ok) throw new Error(res.status === 404 ? "no-function" : "failed");
}

/** The career saved under the code, or null if there is none. */
export async function downloadCareer(code: string): Promise<unknown | null> {
  const res = await fetch(`${HOF_URL}/rest/v1/rpc/cloud_load`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ p_code: code }),
  });
  if (!res.ok) throw new Error(res.status === 404 ? "no-function" : "failed");
  const data = await res.json();
  return data && typeof data === "object" ? data : null;
}
