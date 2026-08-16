/**
 * Thin fetch wrapper for the browser. Always resolves — network failures come
 * back as an ordinary { ok: false } so callers never need a try/catch.
 */
export async function api(path, { method = "GET", body } = {}) {
  try {
    const res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { error: "Could not reach the server. Check your connection." },
    };
  }
}

/** Pull a human-readable message out of any error payload this app returns. */
export function messageFrom(data, fallback = "Something went wrong.") {
  if (!data) return fallback;
  if (data.error) return data.error;
  if (data.fields) return Object.values(data.fields)[0] ?? fallback;
  return fallback;
}
