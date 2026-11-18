import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";

import ProjetoPage from "@/app/projetos/[id]/page";

import {
  useRouter,
  useParams,
} from "next/navigation";

import { apiAutenticada } from "@/servicos/api";

// ============================================
// MOCKS
// ============================================

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
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

const pushMock = jest.fn();

const apiMock = apiAutenticada as jest.Mock;

// ============================================
// RESPOSTAS SIMULADAS
// ============================================

const criarResposta = (
  dados: unknown,
  status = 200
) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => dados,
});

// ============================================
// DADOS DO PROJETO
// ============================================

const projetoBase = {
  id: 7,
  codigo: "EST-007",
  nome: "Galpão Industrial",
  cliente: "Empresa Alfa",
  responsavel: "Gustavo Pereira",
  origem: "Joinville",
  destino: "Curitiba",
  prazo: "2026-12-20",
  bdi: 20,
  status: "RASCUNHO",
  observacoes: "Projeto de vigas pré-moldadas",
};

const projetoFinalizado = {
  ...projetoBase,
  status: "FINALIZADO",
};

// ============================================
// CONFIGURAÇÃO DOS TESTES
// ============================================

beforeEach(() => {
  jest.resetAllMocks();

  (useRouter as jest.Mock).mockReturnValue({
    push: pushMock,
  });

  (useParams as jest.Mock).mockReturnValue({
    id: "7",
  });

  localStorage.clear();

  localStorage.setItem(
    "estrutec_token",
    "token-teste"
  );
});

// ============================================
// FUNÇÃO AUXILIAR
// ============================================

const carregarProjeto = async (
  projeto = projetoBase
) => {
  apiMock.mockResolvedValueOnce(
    criarResposta({
      projeto,
    })
  );

  render(<ProjetoPage />);

  await screen.findByRole("heading", {
    name: projeto.nome,
  });
};

// ============================================
// TESTES
// ============================================

describe("Detalhes do Projeto - ESTRUTEC", () => {

  // ------------------------------------------
  // 1. CARREGAMENTO
  // ------------------------------------------

  test("deve apresentar carregamento inicial", () => {
    apiMock.mockImplementationOnce(
      () => new Promise(() => {})
    );

    render(<ProjetoPage />);

    expect(
      screen.getByText("Carregando projeto...")
    ).toBeInTheDocument();
  });

  test("deve carregar os dados do projeto", async () => {
    await carregarProjeto();

    expect(apiMock).toHaveBeenCalledWith(
      "/projetos/7"
    );

    expect(
      screen.getByRole("heading", {
        name: "Galpão Industrial",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Empresa Alfa")
    ).toBeInTheDocument();
  });

  test("deve apresentar as informações gerais", async () => {
    await carregarProjeto();

    expect(
      screen.getByText("Gustavo Pereira")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Joinville")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Curitiba")
    ).toBeInTheDocument();

    expect(
      screen.getByText("20/12/2026")
    ).toBeInTheDocument();

    expect(
      screen.getByText("20%")
    ).toBeInTheDocument();
  });

  test("deve apresentar observações do projeto", async () => {
    await carregarProjeto();

    expect(
      screen.getByText(
        "Projeto de vigas pré-moldadas"
      )
    ).toBeInTheDocument();
  });

  test("deve carregar projeto retornado diretamente pela API", async () => {
    apiMock.mockResolvedValueOnce(
      criarResposta(projetoBase)
    );

    render(<ProjetoPage />);

    expect(
      await screen.findByRole("heading", {
        name: "Galpão Industrial",
      })
    ).toBeInTheDocument();
  });

  // ------------------------------------------
  // 2. TRATAMENTO DE ERROS
  // ------------------------------------------

  test("deve apresentar erro retornado pelo servidor", async () => {
    apiMock.mockResolvedValueOnce(
      criarResposta(
        {
          erro: "Projeto não encontrado.",
        },
        404
      )
    );

    render(<ProjetoPage />);

    expect(
      await screen.findByText(
        "Projeto não encontrado."
      )
    ).toBeInTheDocument();
  });

  test("deve apresentar mensagem padrão de erro", async () => {
    apiMock.mockResolvedValueOnce(
      criarResposta({}, 500)
    );

    render(<ProjetoPage />);

    expect(
      await screen.findByText(
        "Não foi possível carregar o projeto."
      )
    ).toBeInTheDocument();
  });

  test("deve apresentar erro de conexão", async () => {
    apiMock.mockRejectedValueOnce(
      new Error("Erro de conexão")
    );

    render(<ProjetoPage />);

    expect(
      await screen.findByText(
        "Não foi possível conectar ao servidor."
      )
    ).toBeInTheDocument();
  });

  test("deve redirecionar quando a sessão expirar", async () => {
    apiMock.mockResolvedValueOnce(
      criarResposta({}, 401)
    );

    render(<ProjetoPage />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        "/login"
      );
    });

    expect(
      localStorage.getItem("estrutec_token")
    ).toBeNull();
  });

  // ------------------------------------------
  // 3. NAVEGAÇÃO
  // ------------------------------------------

  test("deve permitir voltar ao painel", async () => {
    await carregarProjeto();

    fireEvent.click(
      screen.getByRole("button", {
        name: /Voltar ao painel/,
      })
    );

    expect(pushMock).toHaveBeenCalledWith(
      "/painel"
    );
  });

  test("deve permitir voltar ao painel após erro", async () => {
    apiMock.mockRejectedValueOnce(
      new Error("Falha")
    );

    render(<ProjetoPage />);

    const botao = await screen.findByRole(
      "button",
      {
        name: "Voltar ao painel",
      }
    );

    fireEvent.click(botao);

    expect(pushMock).toHaveBeenCalledWith(
      "/painel"
    );
  });

  test("deve permitir acessar importação", async () => {
    await carregarProjeto();

    fireEvent.click(
      screen.getByRole("button", {
        name: /^1\. Importação/,
      })
    );

    expect(pushMock).toHaveBeenCalledWith(
      "/projetos/7/importacao"
    );
  });

  test("deve permitir acessar fabricação", async () => {
    await carregarProjeto();

    fireEvent.click(
      screen.getByRole("button", {
        name: /^2\. Fabricação/,
      })
    );

    expect(pushMock).toHaveBeenCalledWith(
      "/projetos/7/fabricacao"
    );
  });

  // ------------------------------------------
  // 4. BLOQUEIO DAS ETAPAS
  // ------------------------------------------

  test("deve bloquear etapas em projeto rascunho", async () => {
    await carregarProjeto();

    expect(
      screen.getByRole("button", {
        name: /^3\. Logística/,
      })
    ).toBeDisabled();

    expect(
      screen.getByRole("button", {
        name: /^4\. Montagem/,
      })
    ).toBeDisabled();

    expect(
      screen.getByRole("button", {
        name: /^5\. Resumo Financeiro/,
      })
    ).toBeDisabled();

    expect(
      screen.getByRole("button", {
        name: /^6\. Relatório/,
      })
    ).toBeDisabled();
  });

  test("deve liberar logística após fabricação calculada", async () => {
    await carregarProjeto({
      ...projetoBase,
      status: "FABRICACAO_CALCULADA",
    });

    expect(
      screen.getByRole("button", {
        name: /^3\. Logística/,
      })
    ).toBeEnabled();

    expect(
      screen.getByRole("button", {
        name: /^4\. Montagem/,
      })
    ).toBeDisabled();
  });

  test("deve liberar montagem após logística calculada", async () => {
    await carregarProjeto({
      ...projetoBase,
      status: "LOGISTICA_CALCULADA",
    });

    expect(
      screen.getByRole("button", {
        name: /^4\. Montagem/,
      })
    ).toBeEnabled();

    expect(
      screen.getByRole("button", {
        name: /^5\. Resumo Financeiro/,
      })
    ).toBeDisabled();
  });

  test("deve liberar resumo após montagem calculada", async () => {
    await carregarProjeto({
      ...projetoBase,
      status: "MONTAGEM_CALCULADA",
    });

    expect(
      screen.getByRole("button", {
        name: /^5\. Resumo Financeiro/,
      })
    ).toBeEnabled();

    expect(
      screen.getByRole("button", {
        name: /^6\. Relatório/,
      })
    ).toBeDisabled();
  });

  test("deve liberar todas as etapas em projeto finalizado", async () => {
    await carregarProjeto(projetoFinalizado);

    const etapas = [
      /^1\. Importação/,
      /^2\. Fabricação/,
      /^3\. Logística/,
      /^4\. Montagem/,
      /^5\. Resumo Financeiro/,
      /^6\. Relatório/,
    ];

    etapas.forEach((etapa) => {
      expect(
        screen.getByRole("button", {
          name: etapa,
        })
      ).toBeEnabled();
    });
  });

  test("deve permitir navegar para logística", async () => {
    await carregarProjeto({
      ...projetoBase,
      status: "FABRICACAO_CALCULADA",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /^3\. Logística/,
      })
    );

    expect(pushMock).toHaveBeenCalledWith(
      "/projetos/7/logistica"
    );
  });

  test("deve permitir navegar para montagem", async () => {
    await carregarProjeto({
      ...projetoBase,
      status: "LOGISTICA_CALCULADA",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /^4\. Montagem/,
      })
    );

    expect(pushMock).toHaveBeenCalledWith(
      "/projetos/7/montagem"
    );
  });

  test("deve permitir navegar para resumo", async () => {
    await carregarProjeto({
      ...projetoBase,
      status: "MONTAGEM_CALCULADA",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /^5\. Resumo Financeiro/,
      })
    );

    expect(pushMock).toHaveBeenCalledWith(
      "/projetos/7/resumo"
    );
  });

  test("deve permitir navegar para relatório", async () => {
    await carregarProjeto(projetoFinalizado);

    fireEvent.click(
      screen.getByRole("button", {
        name: /^6\. Relatório/,
      })
    );

    expect(pushMock).toHaveBeenCalledWith(
      "/projetos/7/relatorio"
    );
  });

  // ------------------------------------------
  // 5. REABERTURA DO PROJETO
  // ------------------------------------------

  test("deve apresentar opção de reabertura em projeto finalizado", async () => {
    await carregarProjeto(projetoFinalizado);

    expect(
      screen.getByRole("button", {
        name: "Reabrir projeto",
      })
    ).toBeInTheDocument();
  });

  test("não deve apresentar reabertura em projeto não finalizado", async () => {
    await carregarProjeto();

    expect(
      screen.queryByRole("button", {
        name: "Reabrir projeto",
      })
    ).not.toBeInTheDocument();
  });

  test("deve abrir confirmação de reabertura", async () => {
    await carregarProjeto(projetoFinalizado);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Reabrir projeto",
      })
    );

    expect(
      screen.getByRole("heading", {
        name: "Reabrir projeto?",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Sim, reabrir projeto",
      })
    ).toBeInTheDocument();
  });

  test("deve cancelar reabertura do projeto", async () => {
    await carregarProjeto(projetoFinalizado);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Reabrir projeto",
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Cancelar",
      })
    );

    expect(
      screen.queryByRole("heading", {
        name: "Reabrir projeto?",
      })
    ).not.toBeInTheDocument();

    expect(apiMock).toHaveBeenCalledTimes(1);
  });

  test("deve reabrir projeto finalizado com sucesso", async () => {
    await carregarProjeto(projetoFinalizado);

    apiMock.mockResolvedValueOnce(
      criarResposta({
        mensagem: "Projeto reaberto com sucesso!",
      })
    );

    apiMock.mockResolvedValueOnce(
      criarResposta({
        projeto: {
          ...projetoBase,
          status: "MONTAGEM_CALCULADA",
        },
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Reabrir projeto",
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sim, reabrir projeto",
      })
    );

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/projetos/7/reabrir",
        {
          method: "POST",
        }
      );
    });

    expect(
      await screen.findByText(
        "Projeto reaberto com sucesso!"
      )
    ).toBeInTheDocument();

    expect(apiMock).toHaveBeenCalledTimes(3);

    expect(
      screen.getByRole("button", {
        name: /^6\. Relatório/,
      })
    ).toBeDisabled();
  });

  test("deve apresentar erro ao tentar reabrir projeto", async () => {
    await carregarProjeto(projetoFinalizado);

    apiMock.mockResolvedValueOnce(
      criarResposta(
        {
          erro: "Projeto não pode ser reaberto.",
        },
        400
      )
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Reabrir projeto",
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sim, reabrir projeto",
      })
    );

    expect(
      await screen.findByText(
        "Projeto não pode ser reaberto."
      )
    ).toBeInTheDocument();
  });

  test("deve apresentar erro de conexão na reabertura", async () => {
    await carregarProjeto(projetoFinalizado);

    apiMock.mockRejectedValueOnce(
      new Error("Servidor indisponível")
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Reabrir projeto",
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sim, reabrir projeto",
      })
    );

    expect(
      await screen.findByText(
        "Não foi possível conectar ao servidor."
      )
    ).toBeInTheDocument();
  });

  test("deve redirecionar quando sessão expirar na reabertura", async () => {
    await carregarProjeto(projetoFinalizado);

    apiMock.mockResolvedValueOnce(
      criarResposta({}, 401)
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Reabrir projeto",
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sim, reabrir projeto",
      })
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        "/login"
      );
    });

    expect(
      localStorage.getItem("estrutec_token")
    ).toBeNull();
  });

});