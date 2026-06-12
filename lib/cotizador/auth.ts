/**
 * Auth simple por password compartida para la herramienta interna /cotizador.
 * El token de sesión es el SHA-256 de la password + un salt fijo, así la cookie
 * no expone la password y se invalida sola si la password cambia.
 * Usa Web Crypto: funciona tanto en edge (middleware) como en Node.
 */

export const COTIZADOR_COOKIE = "cotizador_session";
export const COTIZADOR_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

const TOKEN_SALT = "cotizador-v1";

export async function sessionTokenFromPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`${password}:${TOKEN_SALT}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** true si la cookie corresponde a la APP_PASSWORD actual. */
export async function isValidSessionToken(
  token: string | undefined,
  appPassword: string | undefined
): Promise<boolean> {
  if (!token || !appPassword) return false;
  const expected = await sessionTokenFromPassword(appPassword);
  return token === expected;
}
