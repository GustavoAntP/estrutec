import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";

import LogisticaPage from "@/app/projetos/[id]/logistica/page";

import { apiAutenticada } from "@/servicos/api";

import {
  criarResposta,
  configurarContextoDeTeste,
} from "./apoioProjeto";

// MOCKS

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock("@/servicos/api", () => ({
  apiAutenticada: jest.fn(),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    priority,
    ...props
  }: Record<string, unknown>) =>
    require("react").createElement("img", props),
}));

const apiMock = apiAutenticada as jest.Mock;

const pushMock = jest.fn();

// CONFIGURAÇÃO DOS TESTES

beforeEach(() => {
  configurarContextoDeTeste(apiMock, pushMock);
});

describe("Logistica - ESTRUTEC", () => {

test("deve apresentar carregamento inicial", () => {
  // Simula uma API que ainda não respondeu.
  // Assim podemos verificar o estado de carregamento
  // sem provocar atualizações assíncronas após o teste.
  apiMock.mockImplementation(
    () => new Promise(() => {})
  );

  render(<LogisticaPage />);

  expect(
    screen.getByText("Carregando logística...")
  ).toBeInTheDocument();
});

  test("deve carregar a logistica do projeto", async () => {
    render(<LogisticaPage />);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/projetos/7/logistica"
      );
    });

    expect(
      await screen.findByRole("heading", {
        name: "Planejamento logístico",
      })
    ).toBeInTheDocument();
  });

  test("deve impedir salvar sem selecionar frete", async () => {
    render(<LogisticaPage />);

    const botao = await screen.findByRole(
      "button",
      {
        name: "Salvar modalidade",
      }
    );

    expect(botao).toBeDisabled();
  });

  test("deve permitir selecionar frete terceirizado", async () => {
    render(<LogisticaPage />);

    await screen.findByRole("heading", {
      name: "Planejamento logístico",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /Frete Terceirizado/i,
      })
    );

    expect(
      screen.getByRole("button", {
        name: "Salvar cotação",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Salvar modalidade",
      })
    ).toBeEnabled();
  });

  test("deve salvar a modalidade de transporte", async () => {
    apiMock.mockImplementation(
      async (
        _caminho: string,
        opcoes?: { method?: string }
      ) => {
        if (opcoes?.method === "PUT") {
          return criarResposta({
            mensagem: "Modalidade salva com sucesso!",
          });
        }

        return criarResposta({}, 404);
      }
    );

    render(<LogisticaPage />);

    await screen.findByRole("heading", {
      name: "Planejamento logístico",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /Frete Próprio/i,
      })
    );

    fireEvent.change(
      screen.getByPlaceholderText(
        "Observações sobre a logística..."
      ),
      {
        target: {
          value: "Transporte com frota própria",
        },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Salvar modalidade",
      })
    );

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/projetos/7/logistica",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            tipoFrete: "PROPRIO",
            observacoes:
              "Transporte com frota própria",
          }),
        })
      );
    });

    expect(
      await screen.findByText(
        "Modalidade salva com sucesso!"
      )
    ).toBeInTheDocument();
  });

  test("deve carregar uma modalidade ja cadastrada", async () => {
    apiMock.mockImplementation(async (caminho: string) => {
      if (caminho === "/projetos/7/logistica") {
        return criarResposta({
          logistica: {
            tipo_frete: "TERCEIRIZADO",
            observacoes: "Entrega contratada",
          },
        });
      }

      return criarResposta({}, 404);
    });

    render(<LogisticaPage />);

    expect(
      await screen.findByDisplayValue(
        "Entrega contratada"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Salvar cotação",
      })
    ).toBeInTheDocument();
  });

  test("deve redirecionar quando a sessao expirar", async () => {
    window.localStorage.setItem(
      "estrutec_token",
      "token-expirado"
    );

    apiMock.mockImplementation(async (caminho: string) => {
      if (caminho === "/projetos/7/logistica") {
        return criarResposta({}, 401);
      }

      return criarResposta({}, 404);
    });

    render(<LogisticaPage />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/login");
    });

    expect(
      window.localStorage.getItem("estrutec_token")
    ).toBeNull();
  });

  test("deve apresentar erro de conexao", async () => {
    apiMock.mockImplementation(async (caminho: string) => {
      if (caminho === "/projetos/7/logistica") {
        throw new Error("Servidor indisponivel");
      }

      return criarResposta({}, 404);
    });

    render(<LogisticaPage />);

    expect(
      await screen.findByText(
        "Não foi possível conectar ao servidor."
      )
    ).toBeInTheDocument();
  });

  test("deve validar a transportadora antes de salvar cotacao", async () => {
    render(<LogisticaPage />);

    await screen.findByRole("heading", {
      name: "Planejamento logístico",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /Frete Terceirizado/i,
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Salvar cotação",
      })
    );

    expect(
      screen.getByText("Informe a transportadora.")
    ).toBeInTheDocument();
  });

});