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

  const headers = new Headers(opcoes.headers);

  const usandoFormData =
    opcoes.body instanceof FormData;

  if (
    !usandoFormData &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  return fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers,
  });
}