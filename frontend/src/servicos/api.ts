const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

export async function api(
  caminho: string,
  opcoes: RequestInit = {}
) {
  return fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      "Content-Type": "application/json",
      ...opcoes.headers,
    },
  });
}

export async function apiAutenticada(
  caminho: string,
  opcoes: RequestInit = {}
) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("estrutec_token")
      : null;

  return fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...opcoes.headers,
    },
  });
}