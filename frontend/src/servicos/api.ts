const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

export async function api(
  caminho: string,
  opcoes: RequestInit = {}
) {
  const resposta = await fetch(
    `${API_URL}${caminho}`,
    {
      ...opcoes,
      headers: {
        "Content-Type": "application/json",
        ...opcoes.headers,
      },
    }
  );

  return resposta;
}