import { serverFetch } from "../serverFetch";

const MONDAY_API_URL = "https://api.monday.com/v2";

interface MondayGraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export function getMondayConfig() {
  const token = process.env.MONDAY_API_TOKEN?.trim();
  const boardId = process.env.MONDAY_BOARD_ID?.trim();
  return { token, boardId };
}

export function isMondayConfigured(): boolean {
  const { token, boardId } = getMondayConfig();
  return Boolean(token && boardId);
}

export async function mondayQuery<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<{ data: T } | { error: string }> {
  const { token } = getMondayConfig();
  if (!token) {
    return { error: "MONDAY_API_TOKEN no configurada en el servidor" };
  }

  let res: Response;
  try {
    res = await serverFetch(MONDAY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: `Error de conexión con Monday: ${message}` };
  }

  const json = (await res.json()) as MondayGraphQLResponse<T>;

  if (!res.ok) {
    return {
      error: `Monday HTTP ${res.status}: ${JSON.stringify(json).slice(0, 300)}`,
    };
  }

  if (json.errors?.length) {
    return { error: json.errors.map((e) => e.message).join("; ") };
  }

  if (!json.data) {
    return { error: "Monday respondió sin data" };
  }

  return { data: json.data };
}
