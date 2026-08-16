import { getSession } from "./auth.js";
import { fieldErrors } from "./validation.js";

export function json(data, init) {
  return Response.json(data, init);
}

export function error(message, status = 400, extra) {
  return Response.json({ error: message, ...extra }, { status });
}

export function validationError(zodError) {
  return Response.json(
    { error: "Validation failed", fields: fieldErrors(zodError) },
    { status: 400 }
  );
}

/**
 * Resolve the current user or short-circuit with a 401.
 * Callers do: `const { user, response } = await requireUser(); if (response) return response;`
 */
export async function requireUser() {
  const user = await getSession();
  if (!user) return { user: null, response: error("Not authenticated", 401) };
  return { user, response: null };
}

/** Parse a JSON body, tolerating an empty or malformed one. */
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Strip fields that should never be sent to the client. */
export function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}
