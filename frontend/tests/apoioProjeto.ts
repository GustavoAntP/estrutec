import { useParams, useRouter } from "next/navigation";

// =============================================
// RESPOSTAS SIMULADAS DA API
// =============================================

export function criarResposta(
  dados: unknown = {},
  status = 200
) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: jest.fn().mockResolvedValue(dados),
  };
}

// =============================================
// CONFIGURAÇÃO COMPARTILHADA DOS TESTES
// =============================================

export function configurarContextoDeTeste(
  apiMock: jest.Mock,
  pushMock: jest.Mock
) {
  jest.resetAllMocks();

  window.localStorage.clear();

  (useParams as jest.Mock).mockReturnValue({
    id: "7",
  });

  (useRouter as jest.Mock).mockReturnValue({
    push: pushMock,
  });

  apiMock.mockImplementation(
    async () => criarResposta({}, 404)
  );
}