/** Same live API this whole marketplace reads from. Never include `/backend` — routes add that prefix themselves. */
export function getApiOrigin() {
  const raw = (process.env.API_ORIGIN || "").trim();
  const origin = (raw || (process.env.VERCEL ? "https://api.lnoc.app" : "http://localhost:3001"))
    .replace(/\/+$/, "")
    .replace(/\/backend$/i, "");
  return origin;
}
