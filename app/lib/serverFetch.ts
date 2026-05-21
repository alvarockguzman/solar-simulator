import { Agent } from "undici";

/**
 * Fetch para llamadas server-side (Google Apps Script, Monday).
 * En desarrollo local, algunos entornos Windows fallan la verificación TLS
 * (UNABLE_TO_VERIFY_LEAF_SIGNATURE). Si pasa, activá en .env.local:
 * LEAD_SKIP_TLS_VERIFY=true
 */
function getDevDispatcher(): Agent | undefined {
  if (
    process.env.NODE_ENV === "development" &&
    process.env.LEAD_SKIP_TLS_VERIFY === "true"
  ) {
    return new Agent({ connect: { rejectUnauthorized: false } });
  }
  return undefined;
}

export async function serverFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const dispatcher = getDevDispatcher();
  if (dispatcher) {
    return fetch(url, { ...init, dispatcher } as RequestInit);
  }
  return fetch(url, init);
}
