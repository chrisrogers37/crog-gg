/**
 * Where the API answers: same-origin `/api/*` unless VITE_API_URL names
 * another origin (leave it unset on Vercel).
 */
export const API_URL = import.meta.env.VITE_API_URL || "";
