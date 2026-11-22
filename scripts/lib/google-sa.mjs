// Service account Google (chỉ dùng cho script marketing chạy trên Mac mini). Ký JWT bằng node:crypto, không cần thư viện.
// Khoá: GOOGLE_REPORTING_SA_FILE (mặc định .env.google-reporting.json, gitignored).
import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";

const sa = JSON.parse(readFileSync(process.env.GOOGLE_REPORTING_SA_FILE || ".env.google-reporting.json", "utf8"));
const b64url = (buf) => Buffer.from(buf).toString("base64url");

export async function getToken(scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope, aud: sa.token_uri, iat: now, exp: now + 3600 }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const jwt = `${header}.${claim}.${b64url(signer.sign(sa.private_key))}`;
  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`token ${scope}: ${JSON.stringify(data)}`);
  return data.access_token;
}

export async function call(url, token, body, extraHeaders = {}, method) {
  const res = await fetch(url, {
    method: method || (body ? "POST" : "GET"),
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...extraHeaders },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const msg = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data?.error ?? data).slice(0, 800);
    throw new Error(`HTTP ${res.status} ${msg}`);
  }
  return data;
}
