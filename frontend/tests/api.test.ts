import {
  api,
  apiAutenticada,
} from "@/servicos/api";

// Simulação dos cabeçalhos HTTP.
// Mantém os testes independentes do navegador real.
class HeadersSimulados {
  private valores = new Map<string, string>();

  constructor(iniciais?: HeadersInit) {
    if (!iniciais) return;

    if (Array.isArray(iniciais)) {
      iniciais.forEach(([chave, valor]) => {
        this.set(chave, valor);
      });

      return;
    }

    if (
      typeof (iniciais as Headers).forEach === "function"
    ) {
      (iniciais as Headers).forEach((valor, chave) => {
        this.set(chave, valor);
      });

      return;
    }

    Object.entries(
      iniciais as Record<string, string>
    ).forEach(([chave, valor]) => {
      this.set(chave, valor);
    });
  }

  set(chave: string, valor: string) {
    this.valores.set(
      chave.toLowerCase(),
      valor
    );
  }

  get(chave: string): string | null {
    return (
      this.valores.get(chave.toLowerCase()) ?? null
    );
  }

  has(chave: string): boolean {
    return this.valores.has(chave.toLowerCase());
  }

  forEach(
    callback: (valor: string, chave: string) => void
  ) {
    this.valores.forEach(callback);
  }
}

const fetchMock = jest.fn();

const fetchOriginal = globalThis.fetch;
const headersOriginais = globalThis.Headers;

beforeAll(() => {
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    writable: true,
    value: fetchMock,
  });

  Object.defineProperty(globalThis, "Headers", {
    configurable: true,
    writable: true,
    value: HeadersSimulados,
  });
});

beforeEach(() => {
  fetchMock.mockReset();

  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
  });

  window.localStorage.clear();
});

afterAll(() => {
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    writable: true,
    value: fetchOriginal,
  });

  Object.defineProperty(globalThis, "Headers", {
    configurable: true,
    writable: true,
    value: headersOriginais,
  });
});

describe("Servico de API - ESTRUTEC", () => {
  describe("Requisicoes publicas", () => {
    test("deve realizar requisicao HTTP", async () => {
      await api("/projetos");

      expect(fetchMock).toHaveBeenCalledTimes(1);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/projetos$/),
        expect.any(Object)
      );
    });

    test("deve adicionar Content-Type JSON", async () => {
      await api("/clientes");

      const opcoes = fetchMock.mock.calls[0][1];

      expect(opcoes.headers).toEqual({
        "Content-Type": "application/json",
      });
    });

    test("deve preservar metodo e corpo da requisicao", async () => {
      const dados = {
        nome: "Projeto Teste",
      };

      await api("/projetos", {
        method: "POST",
        body: JSON.stringify(dados),
      });

      const opcoes = fetchMock.mock.calls[0][1];

      expect(opcoes.method).toBe("POST");

      expect(opcoes.body).toBe(
        JSON.stringify(dados)
      );
    });

    test("deve permitir cabecalhos personalizados", async () => {
      await api("/projetos", {
        headers: {
          "X-Origem": "ESTRUTEC",
        },
      });

      const opcoes = fetchMock.mock.calls[0][1];

      expect(opcoes.headers).toEqual({
        "Content-Type": "application/json",
        "X-Origem": "ESTRUTEC",
      });
    });

    test("deve retornar a resposta da API", async () => {
      const resposta = {
        ok: true,
        status: 201,
      };

      fetchMock.mockResolvedValue(resposta);

      const resultado = await api("/projetos");

      expect(resultado).toBe(resposta);
    });

    test("deve propagar erros de conexao", async () => {
      fetchMock.mockRejectedValue(
        new Error("Servidor indisponivel")
      );

      await expect(
        api("/projetos")
      ).rejects.toThrow("Servidor indisponivel");
    });
  });

  describe("Requisicoes autenticadas", () => {
    test("deve enviar token JWT no cabecalho Authorization", async () => {
      window.localStorage.setItem(
        "estrutec_token",
        "token-jwt-teste"
      );

      await apiAutenticada("/usuarios");

      const opcoes = fetchMock.mock.calls[0][1];

      expect(
        opcoes.headers.get("Authorization")
      ).toBe("Bearer token-jwt-teste");
    });

    test("nao deve enviar Authorization sem token", async () => {
      await apiAutenticada("/usuarios");

      const opcoes = fetchMock.mock.calls[0][1];

      expect(
        opcoes.headers.has("Authorization")
      ).toBe(false);
    });

    test("deve configurar JSON em requisicoes comuns", async () => {
      await apiAutenticada("/projetos", {
        method: "POST",
        body: JSON.stringify({
          nome: "Projeto Teste",
        }),
      });

      const opcoes = fetchMock.mock.calls[0][1];

      expect(
        opcoes.headers.get("Content-Type")
      ).toBe("application/json");
    });

    test("nao deve definir Content-Type automaticamente para FormData", async () => {
      const formulario = new FormData();

      formulario.append(
        "arquivo",
        new Blob(["teste"], {
          type: "text/plain",
        }),
        "teste.txt"
      );

      await apiAutenticada("/importacao", {
        method: "POST",
        body: formulario,
      });

      const opcoes = fetchMock.mock.calls[0][1];

      expect(
        opcoes.headers.has("Content-Type")
      ).toBe(false);

      expect(opcoes.body).toBe(formulario);
    });

    test("deve preservar cabecalhos personalizados", async () => {
      await apiAutenticada("/projetos", {
        headers: {
          "X-Origem": "Painel",
        },
      });

      const opcoes = fetchMock.mock.calls[0][1];

      expect(
        opcoes.headers.get("X-Origem")
      ).toBe("Painel");
    });

    test("deve preservar o Content-Type informado", async () => {
      await apiAutenticada("/projetos", {
        headers: {
          "Content-Type": "text/plain",
        },
      });

      const opcoes = fetchMock.mock.calls[0][1];

      expect(
        opcoes.headers.get("Content-Type")
      ).toBe("text/plain");
    });

    test("deve preservar o metodo HTTP", async () => {
      await apiAutenticada("/projetos/1", {
        method: "DELETE",
      });

      const opcoes = fetchMock.mock.calls[0][1];

      expect(opcoes.method).toBe("DELETE");
    });

    test("deve propagar falhas da API", async () => {
      fetchMock.mockRejectedValue(
        new Error("Falha na requisicao")
      );

      await expect(
        apiAutenticada("/usuarios")
      ).rejects.toThrow("Falha na requisicao");
    });
  });
});