import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";

import ResumoPage from "@/app/projetos/[id]/resumo/page";
import ConfiguracaoFabricacaoPage from "@/app/administracao/fabricacao/page";

import {
  useRouter,
  useParams,
} from "next/navigation";

import { apiAutenticada } from "@/servicos/api";

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
const replaceMock = jest.fn();

const apiMock = apiAutenticada as jest.Mock;

const criarResposta = (
  dados: unknown,
  status = 200
) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => dados,
});

const resumoBase = {
  projeto: {
    id: 7,
    codigo: "EST-007",
    nome: "Galpão Industrial",
    cliente: "Empresa Alfa",
    status: "RASCUNHO",
  },
  custos: {
    fabricacao: 7000,
    logistica: 2000,
    montagem: 1000,
    custoDireto: 10000,
  },
  bdi: {
    percentual: 25,
    valor: 2500,
  },
  valorFinal: 12500,
};

const configuracaoBase = {
  fck_mpa: 30,
  taxa_armadura_kg_m3: 120,
  consumo_cimento_kg_m3: 350,
  consumo_areia_m3_m3: 0.55,
  consumo_brita_m3_m3: 0.8,
  consumo_agua_l_m3: 180,
  neoprene_m2_por_viga: 0.3,
  preco_cimento_rs_kg: 0.85,
  preco_areia_rs_m3: 120,
  preco_brita_rs_m3: 150,
  preco_agua_rs_l: 0.01,
  preco_aco_rs_kg: 6.5,
  preco_neoprene_rs_m2: 90,
};

const autenticarAdministrador = (
  perfil = "ADMINISTRADOR"
) => {
  localStorage.setItem(
    "estrutec_token",
    "token-teste"
  );

  localStorage.setItem(
    "estrutec_usuario",
    JSON.stringify({
      id: 99,
      nome: "Administrador Teste",
      perfil,
    })
  );
};

beforeEach(() => {
  jest.resetAllMocks();

  (useRouter as jest.Mock).mockReturnValue({
    push: pushMock,
    replace: replaceMock,
  });

  (useParams as jest.Mock).mockReturnValue({
    id: "7",
  });

  localStorage.clear();
});

describe("Resumo financeiro - Estrutec", () => {
  const carregarPagina = async (
    dados = resumoBase
  ) => {
    apiMock.mockResolvedValue(
      criarResposta(dados)
    );

    render(<ResumoPage />);

    await screen.findByRole("heading", {
      name: "Visão financeira do projeto",
    });
  };

  test("Deve carregar o resumo financeiro do projeto", async () => {
    await carregarPagina();

    expect(apiMock).toHaveBeenCalledWith(
      "/projetos/7/resumo-financeiro",
      {
        cache: "no-store",
      }
    );

    expect(
      screen.getByText(/Galpão Industrial/)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Empresa Alfa/)
    ).toBeInTheDocument();
  });

  test("Deve apresentar os custos do projeto", async () => {
    await carregarPagina();

    expect(
      screen.getByRole("heading", {
        name: "Composição do Custo Direto",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Fabricação")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Logística")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Montagem")
    ).toBeInTheDocument();
  });

  test("Deve apresentar o BDI aplicado", async () => {
    await carregarPagina();

    expect(
      screen.getByText("Percentual do BDI")
    ).toBeInTheDocument();

    expect(
      screen.getByText("25%")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Valor do BDI")
    ).toBeInTheDocument();
  });

  test("Deve apresentar o valor final formatado em reais", async () => {
    await carregarPagina();

    expect(
      screen.getByText(/12\.500,00/)
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "VALOR FINAL DO PROJETO"
      )
    ).toBeInTheDocument();
  });

  test("Deve permitir atualizar o resumo financeiro", async () => {
    await carregarPagina();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Atualizar resumo",
      })
    );

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledTimes(2);
    });

    expect(apiMock).toHaveBeenNthCalledWith(
      2,
      "/projetos/7/resumo-financeiro",
      {
        cache: "no-store",
      }
    );
  });

  test("Deve permitir voltar ao projeto", async () => {
    await carregarPagina();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Voltar ao projeto",
      })
    );

    expect(
      pushMock
    ).toHaveBeenCalledWith("/projetos/7");
  });

  test("Deve permitir abrir confirmação de finalização", async () => {
    await carregarPagina();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Finalizar projeto",
      })
    );

    expect(
      screen.getByRole("heading", {
        name: "Finalizar projeto?",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Sim, finalizar projeto",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Atenção")
    ).toBeInTheDocument();
  });

  test("Deve permitir cancelar a finalização", async () => {
    await carregarPagina();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Finalizar projeto",
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Cancelar",
      })
    );

    expect(
      screen.queryByRole("heading", {
        name: "Finalizar projeto?",
      })
    ).not.toBeInTheDocument();

    expect(
      apiMock
    ).toHaveBeenCalledTimes(1);
  });

  test("Deve finalizar o projeto com sucesso", async () => {
    let finalizado = false;

    apiMock.mockImplementation(
      async (
        caminho: string,
        opcoes?: RequestInit
      ) => {
        if (
          caminho === "/projetos/7/finalizar" &&
          opcoes?.method === "POST"
        ) {
          finalizado = true;

          return criarResposta({
            mensagem: "Projeto finalizado com sucesso!",
          });
        }

        return criarResposta({
          ...resumoBase,
          projeto: {
            ...resumoBase.projeto,
            status: finalizado
              ? "FINALIZADO"
              : "RASCUNHO",
          },
        });
      }
    );

    render(<ResumoPage />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Finalizar projeto",
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sim, finalizar projeto",
      })
    );

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/projetos/7/finalizar",
        {
          method: "POST",
        }
      );
    });

    expect(
      await screen.findByRole("button", {
        name: /Abrir relatório final/,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Projeto finalizado\. As etapas estão/
      )
    ).toBeInTheDocument();
  });

  test("Deve exibir opção de relatório para projeto finalizado", async () => {
    await carregarPagina({
      ...resumoBase,
      projeto: {
        ...resumoBase.projeto,
        status: "FINALIZADO",
      },
    });

    expect(
      screen.queryByRole("button", {
        name: "Finalizar projeto",
      })
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /Abrir relatório final/,
      })
    ).toBeInTheDocument();
  });

  test("Deve navegar para o relatório final", async () => {
    await carregarPagina({
      ...resumoBase,
      projeto: {
        ...resumoBase.projeto,
        status: "FINALIZADO",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /Abrir relatório final/,
      })
    );

    expect(pushMock).toHaveBeenCalledWith(
      "/projetos/7/relatorio"
    );
  });

  test("Deve apresentar erro quando a finalização falhar", async () => {
    apiMock.mockImplementation(
      async (caminho: string) => {
        if (
          caminho === "/projetos/7/finalizar"
        ) {
          return criarResposta(
            {
              erro: "Existem etapas pendentes.",
            },
            400
          );
        }

        return criarResposta(resumoBase);
      }
    );

    render(<ResumoPage />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Finalizar projeto",
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sim, finalizar projeto",
      })
    );

    expect(
      await screen.findByText(
        "Existem etapas pendentes."
      )
    ).toBeInTheDocument();
  });

  test("Deve apresentar mensagem padrão para falha de finalização", async () => {
    apiMock.mockImplementation(
      async (caminho: string) => {
        if (
          caminho === "/projetos/7/finalizar"
        ) {
          return criarResposta({}, 500);
        }

        return criarResposta(resumoBase);
      }
    );

    render(<ResumoPage />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Finalizar projeto",
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sim, finalizar projeto",
      })
    );

    expect(
      await screen.findByText(
        "Não foi possível finalizar o projeto."
      )
    ).toBeInTheDocument();
  });

  test("Deve tratar falha ao carregar o resumo", async () => {
    apiMock.mockResolvedValue(
      criarResposta(
        {
          erro: "Resumo indisponível.",
        },
        400
      )
    );

    render(<ResumoPage />);

    expect(
      await screen.findByText(
        "Resumo indisponível."
      )
    ).toBeInTheDocument();
  });

  test("Deve apresentar mensagem padrão quando a API não informar o erro", async () => {
    apiMock.mockResolvedValue(
      criarResposta({}, 500)
    );

    render(<ResumoPage />);

    expect(
      await screen.findByText(
        "Não foi possível carregar o resumo financeiro."
      )
    ).toBeInTheDocument();
  });

  test("Deve tratar falha de conexão", async () => {
    apiMock.mockRejectedValue(
      new Error("Servidor indisponível")
    );

    render(<ResumoPage />);

    expect(
      await screen.findByText(
        "Não foi possível conectar ao servidor."
      )
    ).toBeInTheDocument();
  });

  test("Deve redirecionar quando a sessão expirar", async () => {
    localStorage.setItem(
      "estrutec_token",
      "token-expirado"
    );

    apiMock.mockResolvedValue(
      criarResposta({}, 401)
    );

    render(<ResumoPage />);

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

describe("Parâmetros de fabricação - Estrutec", () => {
  const caminho =
    "/configuracoes/fabricacao-padrao";

  const configurarApi = () => {
    apiMock.mockImplementation(
      async (
        rota: string,
        opcoes?: RequestInit
      ) => {
        if (rota !== caminho) {
          throw new Error(
            `Rota inesperada: ${rota}`
          );
        }

        if (opcoes?.method === "PUT") {
          return criarResposta({
            mensagem: "Configuração salva.",
          });
        }

        return criarResposta({
          configuracao: configuracaoBase,
        });
      }
    );
  };

  const abrirPagina = async () => {
    autenticarAdministrador();
    configurarApi();

    render(<ConfiguracaoFabricacaoPage />);

    await waitFor(() => {
      expect(
        screen.getAllByRole("spinbutton")
      ).toHaveLength(13);
    });
  };

  test("Deve impedir acesso sem autenticação", async () => {
    render(<ConfiguracaoFabricacaoPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/"
      );
    });

    expect(
      apiMock
    ).not.toHaveBeenCalled();
  });

  test("Deve impedir acesso sem usuário salvo", async () => {
    localStorage.setItem(
      "estrutec_token",
      "token-teste"
    );

    render(<ConfiguracaoFabricacaoPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/"
      );
    });

    expect(
      apiMock
    ).not.toHaveBeenCalled();
  });

  test("Deve impedir acesso de operador", async () => {
    autenticarAdministrador("OPERADOR");

    render(<ConfiguracaoFabricacaoPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/painel"
      );
    });

    expect(
      apiMock
    ).not.toHaveBeenCalled();
  });

  test("Deve limpar autenticação inválida", async () => {
    localStorage.setItem(
      "estrutec_token",
      "token-teste"
    );

    localStorage.setItem(
      "estrutec_usuario",
      "json-invalido"
    );

    render(<ConfiguracaoFabricacaoPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/"
      );
    });

    expect(
      localStorage.getItem("estrutec_token")
    ).toBeNull();

    expect(
      localStorage.getItem("estrutec_usuario")
    ).toBeNull();
  });

  test("Deve carregar os parâmetros de fabricação", async () => {
    await abrirPagina();

    expect(apiMock).toHaveBeenCalledWith(
      caminho
    );

    expect(
      screen.getByRole("heading", {
        name: "Parâmetros de Fabricação",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Parâmetros técnicos",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Preços dos materiais",
      })
    ).toBeInTheDocument();
  });

  test("Deve apresentar os valores retornados pela API", async () => {
    await abrirPagina();

    const campos =
      screen.getAllByRole("spinbutton");

    expect(campos[0]).toHaveValue(30);
    expect(campos[1]).toHaveValue(120);
    expect(campos[2]).toHaveValue(350);
    expect(campos[3]).toHaveValue(0.55);
    expect(campos[4]).toHaveValue(0.8);
    expect(campos[5]).toHaveValue(180);
    expect(campos[6]).toHaveValue(0.3);
    expect(campos[7]).toHaveValue(0.85);
    expect(campos[8]).toHaveValue(120);
    expect(campos[9]).toHaveValue(150);
    expect(campos[10]).toHaveValue(0.01);
    expect(campos[11]).toHaveValue(6.5);
    expect(campos[12]).toHaveValue(90);
  });

  test("Deve permitir alterar os campos numéricos", async () => {
    await abrirPagina();

    const campos =
      screen.getAllByRole("spinbutton");

    fireEvent.change(campos[0], {
      target: {
        value: "40",
      },
    });

    fireEvent.change(campos[1], {
      target: {
        value: "150",
      },
    });

    fireEvent.change(campos[11], {
      target: {
        value: "7.25",
      },
    });

    expect(campos[0]).toHaveValue(40);
    expect(campos[1]).toHaveValue(150);
    expect(campos[11]).toHaveValue(7.25);
  });

  test("Deve salvar os parâmetros convertidos em números", async () => {
    await abrirPagina();

    const campos =
      screen.getAllByRole("spinbutton");

    fireEvent.change(campos[0], {
      target: {
        value: "35",
      },
    });

    fireEvent.change(campos[11], {
      target: {
        value: "8.5",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Salvar configurações",
      })
    );

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        caminho,
        expect.objectContaining({
          method: "PUT",
        })
      );
    });

    const chamada =
      apiMock.mock.calls.find(
        ([, opcoes]) =>
          opcoes?.method === "PUT"
      );

    expect(chamada).toBeDefined();

    const dados = JSON.parse(
      chamada![1].body
    );

    expect(dados).toEqual({
      fckMpa: 35,
      taxaArmaduraKgM3: 120,
      consumoCimentoKgM3: 350,
      consumoAreiaM3M3: 0.55,
      consumoBritaM3M3: 0.8,
      consumoAguaLM3: 180,
      neopreneM2PorViga: 0.3,
      precoCimentoRsKg: 0.85,
      precoAreiaRsM3: 120,
      precoBritaRsM3: 150,
      precoAguaRsL: 0.01,
      precoAcoRsKg: 8.5,
      precoNeopreneRsM2: 90,
    });

    expect(
      await screen.findByText(
        "Configurações de fabricação atualizadas com sucesso!"
      )
    ).toBeInTheDocument();
  });

  test("Deve permitir voltar à administração", async () => {
    await abrirPagina();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Voltar",
      })
    );

    expect(pushMock).toHaveBeenCalledWith(
      "/administracao"
    );
  });

  test("Deve apresentar erro retornado ao carregar configurações", async () => {
    autenticarAdministrador();

    apiMock.mockResolvedValue(
      criarResposta(
        {
          erro: "Configuração indisponível.",
        },
        500
      )
    );

    render(<ConfiguracaoFabricacaoPage />);

    expect(
      await screen.findByText(
        "Configuração indisponível."
      )
    ).toBeInTheDocument();
  });

  test("Deve apresentar erro padrão de carregamento", async () => {
    autenticarAdministrador();

    apiMock.mockResolvedValue(
      criarResposta({}, 500)
    );

    render(<ConfiguracaoFabricacaoPage />);

    expect(
      await screen.findByText(
        "Não foi possível carregar as configurações."
      )
    ).toBeInTheDocument();
  });

  test("Deve tratar falha de conexão no carregamento", async () => {
    autenticarAdministrador();

    apiMock.mockRejectedValue(
      new Error("Servidor indisponível")
    );

    render(<ConfiguracaoFabricacaoPage />);

    expect(
      await screen.findByText(
        "Servidor indisponível"
      )
    ).toBeInTheDocument();
  });

  test("Deve apresentar erro retornado ao salvar", async () => {
    autenticarAdministrador();

    apiMock.mockImplementation(
      async (
        rota: string,
        opcoes?: RequestInit
      ) => {
        if (opcoes?.method === "PUT") {
          return criarResposta(
            {
              erro: "Valores inválidos.",
            },
            400
          );
        }

        return criarResposta({
          configuracao: configuracaoBase,
        });
      }
    );

    render(<ConfiguracaoFabricacaoPage />);

    const botao =
      await screen.findByRole("button", {
        name: "Salvar configurações",
      });

    fireEvent.click(botao);

    expect(
      await screen.findByText(
        "Valores inválidos."
      )
    ).toBeInTheDocument();
  });

  test("Deve apresentar mensagem padrão quando falhar ao salvar", async () => {
    autenticarAdministrador();

    apiMock.mockImplementation(
      async (
        rota: string,
        opcoes?: RequestInit
      ) => {
        if (opcoes?.method === "PUT") {
          return criarResposta({}, 500);
        }

        return criarResposta({
          configuracao: configuracaoBase,
        });
      }
    );

    render(<ConfiguracaoFabricacaoPage />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Salvar configurações",
      })
    );

    expect(
      await screen.findByText(
        "Não foi possível salvar as configurações."
      )
    ).toBeInTheDocument();
  });

  test("Deve tratar falha de conexão ao salvar", async () => {
    autenticarAdministrador();

    apiMock.mockImplementation(
      async (
        rota: string,
        opcoes?: RequestInit
      ) => {
        if (opcoes?.method === "PUT") {
          throw new Error(
            "Falha de conexão"
          );
        }

        return criarResposta({
          configuracao: configuracaoBase,
        });
      }
    );

    render(<ConfiguracaoFabricacaoPage />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Salvar configurações",
      })
    );

    expect(
      await screen.findByText(
        "Falha de conexão"
      )
    ).toBeInTheDocument();
  });

  test("Deve bloquear o botão enquanto salva", async () => {
    autenticarAdministrador();

    let concluirRequisicao!: (
      valor: ReturnType<typeof criarResposta>
    ) => void;

    apiMock.mockImplementation(
      (
        rota: string,
        opcoes?: RequestInit
      ) => {
        if (opcoes?.method === "PUT") {
          return new Promise((resolve) => {
            concluirRequisicao = resolve;
          });
        }

        return Promise.resolve(
          criarResposta({
            configuracao: configuracaoBase,
          })
        );
      }
    );

    render(<ConfiguracaoFabricacaoPage />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Salvar configurações",
      })
    );

    expect(
      screen.getByRole("button", {
        name: "Salvando...",
      })
    ).toBeDisabled();

    concluirRequisicao(
      criarResposta({
        mensagem: "Configuração salva.",
      })
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Salvar configurações",
        })
      ).toBeEnabled();
    });
  });
});