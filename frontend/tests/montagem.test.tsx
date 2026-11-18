import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import MontagemPage from "@/app/projetos/[id]/montagem/page";

import { apiAutenticada } from "@/servicos/api";

import {
  criarResposta,
  configurarContextoDeTeste,
} from "./apoioProjeto";

// ============================================
// MOCKS
// ============================================

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

// ============================================
// CONFIGURAÇÃO COMPARTILHADA
// ============================================

beforeEach(() => {
  configurarContextoDeTeste(apiMock, pushMock);
});

// ============================================
// CARREGAMENTO DA PÁGINA
// ============================================

async function abrirPaginaMontagem() {
  render(<MontagemPage />);

  expect(
    await screen.findByRole("heading", {
      name: "Planejamento da montagem",
    })
  ).toBeInTheDocument();

  // Aguarda o carregamento dos cadastros
  // antes de encerrar o teste.
  await waitFor(() => {
    const seletores =
      screen.getAllByRole("combobox");

    expect(seletores[0]).not.toBeDisabled();

    expect(
      seletores[seletores.length - 1]
    ).not.toBeDisabled();
  });
}

describe("Montagem - ESTRUTEC", () => {

  test("deve apresentar carregamento inicial", () => {
    // Mantém as requisições pendentes apenas
    // durante este teste de carregamento.
    apiMock.mockImplementation(
      () => new Promise(() => {})
    );

    render(<MontagemPage />);

    expect(
      screen.getByText("Carregando montagem...")
    ).toBeInTheDocument();
  });

  test("deve carregar os dados da montagem", async () => {
    await abrirPaginaMontagem();

    expect(apiMock).toHaveBeenCalledWith(
      "/projetos/7/montagem"
    );

    expect(apiMock).toHaveBeenCalledWith(
      "/projetos/7/montagem/equipamentos"
    );

    expect(apiMock).toHaveBeenCalledWith(
      "/projetos/7/montagem/equipes"
    );

    expect(apiMock).toHaveBeenCalledWith(
      "/equipamentos"
    );

    expect(apiMock).toHaveBeenCalledWith(
      "/equipes"
    );
  });

  test("deve carregar custos gerais ja cadastrados", async () => {
    apiMock.mockImplementation(
      async (caminho: string) => {
        if (caminho === "/projetos/7/montagem") {
          return criarResposta({
            montagem: {
              custo_hospedagem: 250,
              custo_alimentacao: 150,
              custo_transporte_equipe: 100,
              outros_custos: 50,
              observacoes: "Montagem noturna",
            },
          });
        }

        return criarResposta({}, 404);
      }
    );

    await abrirPaginaMontagem();

    expect(
      screen.getByDisplayValue("250")
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("150")
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("Montagem noturna")
    ).toBeInTheDocument();
  });

  test("deve redirecionar para login quando a sessao expirar", async () => {
    window.localStorage.setItem(
      "estrutec_token",
      "token-expirado"
    );

    apiMock.mockImplementation(
      async (caminho: string) => {
        if (caminho === "/projetos/7/montagem") {
          return criarResposta({}, 401);
        }

        return criarResposta({}, 404);
      }
    );

    render(<MontagemPage />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        "/login"
      );
    });

    expect(
      window.localStorage.getItem(
        "estrutec_token"
      )
    ).toBeNull();
  });

  test("deve apresentar erro de conexao", async () => {
    apiMock.mockImplementation(
      async (caminho: string) => {
        if (caminho === "/projetos/7/montagem") {
          throw new Error(
            "Servidor indisponivel"
          );
        }

        return criarResposta({}, 404);
      }
    );

    render(<MontagemPage />);

    expect(
      await screen.findByText(
        "Não foi possível conectar ao servidor."
      )
    ).toBeInTheDocument();
  });

  test("deve salvar os custos gerais da montagem", async () => {
    apiMock.mockImplementation(
      async (
        caminho: string,
        opcoes?: { method?: string }
      ) => {
        if (
          caminho === "/projetos/7/montagem" &&
          opcoes?.method === "PUT"
        ) {
          return criarResposta({
            mensagem:
              "Dados da montagem salvos com sucesso!",
          });
        }

        return criarResposta({}, 404);
      }
    );

    await abrirPaginaMontagem();

    fireEvent.change(
      screen.getByPlaceholderText(
        "Observações sobre a montagem..."
      ),
      {
        target: {
          value: "Transporte noturno",
        },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Salvar custos gerais",
      })
    );

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/projetos/7/montagem",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            custoHospedagem: 0,
            custoAlimentacao: 0,
            custoTransporteEquipe: 0,
            outrosCustos: 0,
            observacoes: "Transporte noturno",
          }),
        })
      );
    });

    expect(
      await screen.findByText(
        "Dados da montagem salvos com sucesso!"
      )
    ).toBeInTheDocument();
  });

  test("deve validar equipamento antes de adicionar", async () => {
    await abrirPaginaMontagem();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Adicionar equipamento",
      })
    );

    expect(
      screen.getByText(
        "Informe o nome do equipamento."
      )
    ).toBeInTheDocument();

    expect(apiMock).not.toHaveBeenCalledWith(
      "/projetos/7/montagem/equipamentos",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  test("deve validar equipe antes de adicionar", async () => {
    await abrirPaginaMontagem();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Adicionar equipe",
      })
    );

    expect(
      screen.getByText(
        "Informe a função da equipe."
      )
    ).toBeInTheDocument();

    expect(apiMock).not.toHaveBeenCalledWith(
      "/projetos/7/montagem/equipes",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  test("deve calcular e confirmar a montagem", async () => {
    const custosCalculados = {
      equipamentos: {
        quantidade: 0,
        custoTotal: 0,
        detalhes: [],
      },

      equipes: {
        quantidade: 0,
        custoTotal: 0,
        detalhes: [],
      },

      custosGerais: {
        hospedagem: 100,
        alimentacao: 50,
        transporteEquipe: 30,
        outrosCustos: 20,
        total: 200,
      },

      custoTotalMontagem: 200,
    };

    apiMock.mockImplementation(
      async (
        caminho: string,
        opcoes?: { method?: string }
      ) => {
        if (
          caminho ===
          "/projetos/7/montagem/custos"
        ) {
          return criarResposta(
            custosCalculados
          );
        }

        if (
          caminho ===
            "/projetos/7/montagem/confirmar" &&
          opcoes?.method === "POST"
        ) {
          return criarResposta({
            mensagem:
              "Montagem confirmada com sucesso!",
          });
        }

        return criarResposta({}, 404);
      }
    );

    await abrirPaginaMontagem();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Calcular montagem",
      })
    );

    expect(
      await screen.findByRole("button", {
        name: "Confirmar montagem",
      })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/projetos/7/montagem/custos",
        expect.objectContaining({
          cache: "no-store",
        })
      );
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Confirmar montagem",
      })
    );

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/projetos/7/montagem/confirmar",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    expect(
      await screen.findByText(
        "Montagem confirmada com sucesso!"
      )
    ).toBeInTheDocument();
  });

});