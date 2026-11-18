import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import ImportacaoPage from "@/app/projetos/[id]/importacao/page";

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
// RESPOSTAS SIMULADAS DA API
// ============================================

const criarResposta = (
  dados: unknown,
  status = 200
) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => dados,
});

type RespostaMock = ReturnType<typeof criarResposta>;

// ============================================
// DADOS SIMULADOS
// ============================================

const resultadoValido = {
  mensagem: "Planilha analisada com sucesso.",

  resumo: {
    totalLinhas: 2,
    totalPecas: 3,
    pilares: 1,
    vigas: 1,
    elementosComErro: 0,
  },

  elementos: [
    {
      linhaOrigem: 4,
      nomeAplicacao: "V-01",
      tipo: "VIGA",
      secao: "RETANGULAR",
      largura: 0.25,
      altura: 0.5,
      comprimento: 6,
      quantidade: 2,
      erros: [],
    },
    {
      linha_origem: 5,
      nome_aplicacao: "P-01",
      tipo: "PILAR",
      secao: "QUADRADA",
      largura: 0.3,
      altura: 0.3,
      comprimento: 3,
      quantidade: 1,
      erros: [],
    },
  ],

  erros: [],
};

const resultadoComErros = {
  ...resultadoValido,

  resumo: {
    ...resultadoValido.resumo,
    elementosComErro: 1,
  },

  elementos: [
    {
      ...resultadoValido.elementos[0],
      erros: ["Dimensão inválida"],
    },
    resultadoValido.elementos[1],
  ],

  erros: [
    "Linha 4: dimensão inválida",
  ],
};

// ============================================
// CONFIGURAÇÃO
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
// FUNÇÕES AUXILIARES
// ============================================

function criarArquivo(
  nome = "elementos.xlsx"
) {
  return new File(
    ["conteudo-simulado"],
    nome,
    {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
  );
}

function selecionarArquivo(
  nome = "elementos.xlsx"
) {
  const arquivo = criarArquivo(nome);

  const input = screen.getByLabelText(
    /Selecione a planilha do projeto/i
  ) as HTMLInputElement;

  fireEvent.change(input, {
    target: {
      files: [arquivo],
    },
  });

  return arquivo;
}

function enviarArquivo() {
  fireEvent.click(
    screen.getByRole("button", {
      name: "Importar planilha",
    })
  );
}

async function importarResultado(
  dados: unknown = resultadoValido
) {
  apiMock.mockResolvedValueOnce(
    criarResposta(dados)
  );

  render(<ImportacaoPage />);

  selecionarArquivo();
  enviarArquivo();

  await screen.findByText(
    "Planilha processada"
  );
}

function confirmarImportacao() {
  fireEvent.click(
    screen.getByRole("button", {
      name: "Confirmar importação",
    })
  );
}

// ============================================
// TESTES
// ============================================

describe("Importação - ESTRUTEC", () => {

  // ------------------------------------------
  // 1. RENDERIZAÇÃO E NAVEGAÇÃO
  // ------------------------------------------

  test("deve apresentar a página de importação", () => {
    render(<ImportacaoPage />);

    expect(
      screen.getByRole("heading", {
        name: "Elementos pré-moldados",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Importar planilha",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(
        /Selecione a planilha do projeto/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Importar planilha",
      })
    ).toBeDisabled();

    expect(apiMock).not.toHaveBeenCalled();
  });

  test("deve permitir voltar ao projeto", () => {
    render(<ImportacaoPage />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Voltar ao projeto",
      })
    );

    expect(pushMock).toHaveBeenCalledWith(
      "/projetos/7"
    );
  });

  // ------------------------------------------
  // 2. SELEÇÃO E VALIDAÇÃO DE ARQUIVOS
  // ------------------------------------------

  test.each([
    "elementos.xls",
    "elementos.pdf",
  ])(
    "deve rejeitar arquivo inválido %s",
    (nomeArquivo) => {
      render(<ImportacaoPage />);

      selecionarArquivo(nomeArquivo);

      expect(
        screen.getByText(
          "Selecione uma planilha no formato .xlsx."
        )
      ).toBeInTheDocument();

      expect(
        screen.getByRole("button", {
          name: "Importar planilha",
        })
      ).toBeDisabled();

      expect(apiMock).not.toHaveBeenCalled();
    }
  );

  test("deve aceitar planilha XLSX", () => {
    render(<ImportacaoPage />);

    selecionarArquivo(
      "projeto-estrutec.XLSX"
    );

    expect(
      screen.getByText(
        "projeto-estrutec.XLSX"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Arquivo selecionado"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Importar planilha",
      })
    ).toBeEnabled();
  });

  test("deve limpar seleção quando nenhum arquivo for informado", () => {
    render(<ImportacaoPage />);

    selecionarArquivo();

    const input = screen.getByLabelText(
      /Selecione a planilha do projeto/i
    );

    fireEvent.change(input, {
      target: {
        files: [],
      },
    });

    expect(
      screen.queryByText(
        "elementos.xlsx"
      )
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Importar planilha",
      })
    ).toBeDisabled();
  });

  test("deve impedir envio sem selecionar planilha", () => {
    render(<ImportacaoPage />);

    const botao = screen.getByRole(
      "button",
      {
        name: "Importar planilha",
      }
    );

    expect(botao).toBeDisabled();

    // Submete o formulário diretamente para
    // verificar também a validação do handler.
    const formulario = botao.closest("form");

    expect(formulario).not.toBeNull();

    fireEvent.submit(formulario!);

    expect(
      screen.getByText(
        "Selecione uma planilha antes de continuar."
      )
    ).toBeInTheDocument();

    expect(apiMock).not.toHaveBeenCalled();
  });

  // ------------------------------------------
  // 3. ENVIO DA PLANILHA
  // ------------------------------------------

  test("deve enviar a planilha para a API utilizando FormData", async () => {
    apiMock.mockResolvedValueOnce(
      criarResposta(resultadoValido)
    );

    render(<ImportacaoPage />);

    const arquivo = selecionarArquivo();

    enviarArquivo();

    await screen.findByText(
      "Planilha processada"
    );

    expect(apiMock).toHaveBeenCalledWith(
      "/projetos/7/importar-planilha",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      })
    );

    const opcoes = apiMock.mock.calls[0][1];

    const formData = opcoes.body as FormData;

    expect(
      formData.get("arquivo")
    ).toEqual(arquivo);

    expect(apiMock).toHaveBeenCalledTimes(1);
  });

  test("deve apresentar processamento durante envio", async () => {
    let resolver!: (
      resposta: RespostaMock
    ) => void;

    apiMock.mockImplementationOnce(
      () =>
        new Promise<RespostaMock>(
          (resolve) => {
            resolver = resolve;
          }
        )
    );

    render(<ImportacaoPage />);

    selecionarArquivo();
    enviarArquivo();

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Processando...",
        })
      ).toBeDisabled();
    });

    await act(async () => {
      resolver(
        criarResposta(resultadoValido)
      );
    });

    expect(
      await screen.findByText(
        "Planilha processada"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Importar planilha",
      })
    ).toBeEnabled();
  });

  // ------------------------------------------
  // 4. RESULTADO DA IMPORTAÇÃO
  // ------------------------------------------

  test("deve apresentar resumo da importação", async () => {
    await importarResultado();

    expect(
      screen.getByText(
        "Planilha analisada com sucesso."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Pronto para confirmar"
      )
    ).toBeInTheDocument();

    const verificarIndicador = (
      rotulo: string,
      valor: string
    ) => {
      const indicador = screen
        .getByText(rotulo)
        .parentElement;

      expect(indicador).toHaveTextContent(
        valor
      );
    };

    verificarIndicador(
      "Linhas identificadas",
      "2"
    );

    verificarIndicador(
      "Total de peças",
      "3"
    );

    verificarIndicador(
      "Pilares",
      "1"
    );

    verificarIndicador(
      "Vigas",
      "1"
    );

    verificarIndicador(
      "Elementos com erro",
      "0"
    );
  });

  test("deve apresentar elementos identificados na planilha", async () => {
    await importarResultado();

    expect(
      screen.getByText("V-01")
    ).toBeInTheDocument();

    expect(
      screen.getByText("P-01")
    ).toBeInTheDocument();

    expect(
      screen.getByText("2 registro(s)")
    ).toBeInTheDocument();

    const linhaViga = screen.getByRole(
      "row",
      {
        name: /V-01/,
      }
    );

    expect(
      within(linhaViga).getByText(
        "RETANGULAR"
      )
    ).toBeInTheDocument();

    expect(
      within(linhaViga).getByText(
        "0,250"
      )
    ).toBeInTheDocument();

    expect(
      within(linhaViga).getByText(
        "0,500"
      )
    ).toBeInTheDocument();

    expect(
      within(linhaViga).getByText(
        "6,000"
      )
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("Válido")
    ).toHaveLength(2);
  });

  test("deve aceitar nomes e linhas em diferentes formatos da API", async () => {
    await importarResultado();

    const linhaViga = screen.getByRole(
      "row",
      {
        name: /V-01/,
      }
    );

    const linhaPilar = screen.getByRole(
      "row",
      {
        name: /P-01/,
      }
    );

    expect(
      within(linhaViga).getByText("4")
    ).toBeInTheDocument();

    expect(
      within(linhaPilar).getByText("5")
    ).toBeInTheDocument();

    expect(
      within(linhaPilar).getByText(
        "QUADRADA"
      )
    ).toBeInTheDocument();
  });

  test("deve tratar campos ausentes e dimensões não numéricas", async () => {
    const dados = {
      ...resultadoValido,

      resumo: {
        totalLinhas: 1,
        totalPecas: 1,
        pilares: 0,
        vigas: 1,
        elementosComErro: 0,
      },

      elementos: [
        {
          linha: 9,
          nomeAplicacao: "V-TESTE",
          tipo: "VIGA",
          largura: "não informado",
          altura: null,
          comprimento: undefined,
          quantidade: 1,
          erros: [],
        },
      ],
    };

    await importarResultado(dados);

    const linha = screen.getByRole(
      "row",
      {
        name: /V-TESTE/,
      }
    );

    expect(
      within(linha).getByText(
        "não informado"
      )
    ).toBeInTheDocument();

    expect(
      within(linha).getAllByText("-")
        .length
    ).toBeGreaterThanOrEqual(2);

    expect(
      within(linha).getByText("Válido")
    ).toBeInTheDocument();
  });

  // ------------------------------------------
  // 5. ELEMENTOS INVÁLIDOS
  // ------------------------------------------

  test("deve apresentar problemas encontrados na planilha", async () => {
    await importarResultado(
      resultadoComErros
    );

    expect(
      screen.getByText(
        "Revisão necessária"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Problemas encontrados:"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Linha 4: dimensão inválida"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("Com erro")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Confirmar importação",
      })
    ).toBeDisabled();
  });

  test("não deve confirmar importação com elementos inválidos", async () => {
    await importarResultado(
      resultadoComErros
    );

    const botao = screen.getByRole(
      "button",
      {
        name: "Confirmar importação",
      }
    );

    expect(botao).toBeDisabled();

    fireEvent.click(botao);

    expect(apiMock).toHaveBeenCalledTimes(1);
  });

  // ------------------------------------------
  // 6. ERROS NO ENVIO
  // ------------------------------------------

  test("deve apresentar erro retornado pela API", async () => {
    apiMock.mockResolvedValueOnce(
      criarResposta(
        {
          erro: "Planilha inválida.",
        },
        400
      )
    );

    render(<ImportacaoPage />);

    selecionarArquivo();
    enviarArquivo();

    expect(
      await screen.findByText(
        "Planilha inválida."
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        "Planilha processada"
      )
    ).not.toBeInTheDocument();
  });

  test("deve apresentar mensagem padrão quando importação falhar", async () => {
    apiMock.mockResolvedValueOnce(
      criarResposta({}, 500)
    );

    render(<ImportacaoPage />);

    selecionarArquivo();
    enviarArquivo();

    expect(
      await screen.findByText(
        "Não foi possível importar a planilha."
      )
    ).toBeInTheDocument();
  });

  test("deve apresentar erro de conexão durante importação", async () => {
    apiMock.mockRejectedValueOnce(
      new Error("Servidor indisponível")
    );

    render(<ImportacaoPage />);

    selecionarArquivo();
    enviarArquivo();

    expect(
      await screen.findByText(
        "Não foi possível conectar ao servidor."
      )
    ).toBeInTheDocument();
  });

  test("deve redirecionar ao login quando sessão expirar no envio", async () => {
    apiMock.mockResolvedValueOnce(
      criarResposta({}, 401)
    );

    render(<ImportacaoPage />);

    selecionarArquivo();
    enviarArquivo();

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        "/login"
      );
    });

    expect(
      localStorage.getItem(
        "estrutec_token"
      )
    ).toBeNull();
  });

  test("deve limpar resultado anterior quando outra planilha for selecionada", async () => {
    await importarResultado();

    expect(
      screen.getByText(
        "Planilha processada"
      )
    ).toBeInTheDocument();

    selecionarArquivo(
      "nova-planilha.xlsx"
    );

    expect(
      screen.getByText(
        "nova-planilha.xlsx"
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        "Planilha processada"
      )
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Confirmar importação",
      })
    ).not.toBeInTheDocument();
  });

  // ------------------------------------------
  // 7. CONFIRMAÇÃO DA IMPORTAÇÃO
  // ------------------------------------------

  test("deve enviar elementos para confirmação", async () => {
    await importarResultado();

    apiMock.mockResolvedValueOnce(
      criarResposta({
        mensagem:
          "Importação confirmada.",
      })
    );

    confirmarImportacao();

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/projetos/7/confirmar-importacao",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            elementos:
              resultadoValido.elementos,
          }),
        })
      );
    });

    expect(
      await screen.findByText(
        "Importação confirmada."
      )
    ).toBeInTheDocument();

    expect(apiMock).toHaveBeenCalledTimes(2);
  });

  test("deve confirmar importação com sucesso e liberar fabricação", async () => {
    await importarResultado();

    apiMock.mockResolvedValueOnce(
      criarResposta({
        mensagem:
          "Elementos importados com sucesso!",
      })
    );

    confirmarImportacao();

    expect(
      await screen.findByText(
        "Importação confirmada"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Elementos importados com sucesso!"
      )
    ).toBeInTheDocument();

    const botao = screen.getByRole(
      "button",
      {
        name: /Continuar para fabricação/,
      }
    );

    expect(botao).toBeEnabled();

    fireEvent.click(botao);

    expect(pushMock).toHaveBeenCalledWith(
      "/projetos/7/fabricacao"
    );
  });

  test("deve apresentar mensagem padrão de confirmação", async () => {
    await importarResultado();

    apiMock.mockResolvedValueOnce(
      criarResposta({})
    );

    confirmarImportacao();

    expect(
      await screen.findByText(
        "Importação confirmada com sucesso!"
      )
    ).toBeInTheDocument();
  });

  test("deve apresentar estado de confirmação em andamento", async () => {
    await importarResultado();

    let resolver!: (
      resposta: RespostaMock
    ) => void;

    apiMock.mockImplementationOnce(
      () =>
        new Promise<RespostaMock>(
          (resolve) => {
            resolver = resolve;
          }
        )
    );

    confirmarImportacao();

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Confirmando...",
        })
      ).toBeDisabled();
    });

    await act(async () => {
      resolver(
        criarResposta({
          mensagem: "Confirmado!",
        })
      );
    });

    expect(
      await screen.findByText(
        "Confirmado!"
      )
    ).toBeInTheDocument();
  });

  // ------------------------------------------
  // 8. ERROS NA CONFIRMAÇÃO
  // ------------------------------------------

  test("deve apresentar erro retornado ao confirmar importação", async () => {
    await importarResultado();

    apiMock.mockResolvedValueOnce(
      criarResposta(
        {
          erro:
            "Não foi possível salvar os elementos.",
        },
        400
      )
    );

    confirmarImportacao();

    expect(
      await screen.findByText(
        "Não foi possível salvar os elementos."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Confirmar importação",
      })
    ).toBeEnabled();
  });

  test("deve apresentar erro padrão na confirmação", async () => {
    await importarResultado();

    apiMock.mockResolvedValueOnce(
      criarResposta({}, 500)
    );

    confirmarImportacao();

    expect(
      await screen.findByText(
        "Não foi possível confirmar a importação."
      )
    ).toBeInTheDocument();
  });

  test("deve apresentar erro de conexão durante confirmação", async () => {
    await importarResultado();

    apiMock.mockRejectedValueOnce(
      new Error("Falha na conexão")
    );

    confirmarImportacao();

    expect(
      await screen.findByText(
        "Não foi possível conectar ao servidor."
      )
    ).toBeInTheDocument();
  });

  test("deve redirecionar ao login quando sessão expirar na confirmação", async () => {
    await importarResultado();

    apiMock.mockResolvedValueOnce(
      criarResposta({}, 401)
    );

    confirmarImportacao();

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        "/login"
      );
    });

    expect(
      localStorage.getItem(
        "estrutec_token"
      )
    ).toBeNull();
  });

  // ------------------------------------------
  // 9. REINÍCIO DO FLUXO
  // ------------------------------------------

  test("deve limpar confirmação anterior ao selecionar outra planilha", async () => {
    await importarResultado();

    apiMock.mockResolvedValueOnce(
      criarResposta({
        mensagem:
          "Importação concluída!",
      })
    );

    confirmarImportacao();

    expect(
      await screen.findByText(
        "Importação concluída!"
      )
    ).toBeInTheDocument();

    selecionarArquivo(
      "segunda-planilha.xlsx"
    );

    expect(
      screen.queryByText(
        "Importação concluída!"
      )
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(
        "Importação confirmada"
      )
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Importar planilha",
      })
    ).toBeEnabled();
  });

});