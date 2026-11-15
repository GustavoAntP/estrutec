import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";

import AdministracaoPage from "@/app/administracao/page";
import RedefinirSenhaPage from "@/app/redefinir-senha/page";
import PainelPage from "@/app/painel/page";
import NovoProjetoPage from "@/app/projetos/novo/page";
import RelatorioPage from "@/app/projetos/[id]/relatorio/page";

import {
  useRouter,
  useParams,
} from "next/navigation";

import {
  api,
  apiAutenticada,
} from "@/servicos/api";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock("@/servicos/api", () => ({
  api: jest.fn(),
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

const apiMock = api as jest.Mock;
const apiAutenticadaMock = apiAutenticada as jest.Mock;

const criarResposta = (
  dados: unknown,
  status = 200
) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => dados,
  blob: async () =>
    new Blob(["PDF de teste"], {
      type: "application/pdf",
    }),
});

const empresas = [
  {
    id: 1,
    razao_social: "Empresa Alfa Ltda.",
    nome_fantasia: "Empresa Alfa",
    cnpj: null,
    ativo: true,
  },
  {
    id: 2,
    razao_social: "Empresa Inativa Ltda.",
    nome_fantasia: null,
    cnpj: null,
    ativo: false,
  },
];

const projetos = [
  {
    id: 7,
    codigo: "EST-007",
    nome: "Galpão Industrial",
    cliente: "Empresa Alfa",
    origem: "Joinville",
    destino: "Curitiba",
    prazo: "2026-12-20",
    bdi: 20,
    status: "FINALIZADO",
  },
  {
    id: 8,
    codigo: "EST-008",
    nome: "Centro Logístico",
    cliente: "Empresa Alfa",
    origem: "Joinville",
    destino: "Araquari",
    prazo: "2026-12-30",
    bdi: 15,
    status: "RASCUNHO",
  },
];

const armazenarUsuario = (
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
      nome: "Usuário de Teste",
      email: "usuario@estrutec.com",
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

  window.localStorage.clear();

  window.history.replaceState(
    {},
    "",
    "/"
  );

  Object.defineProperty(
    URL,
    "createObjectURL",
    {
      configurable: true,
      writable: true,
      value: jest.fn(
        () => "blob:estrutec-teste"
      ),
    }
  );

  Object.defineProperty(
    URL,
    "revokeObjectURL",
    {
      configurable: true,
      writable: true,
      value: jest.fn(),
    }
  );
});

describe("Administração - Estrutec", () => {
  test("Deve apresentar o painel administrativo", () => {
    armazenarUsuario();

    render(<AdministracaoPage />);

    expect(
      screen.getByRole("heading", {
        name: "Gerenciamento",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Gerenciamento do sistema"
      )
    ).toBeInTheDocument();

    expect(
      replaceMock
    ).not.toHaveBeenCalled();
  });

  test("Deve redirecionar usuário sem autenticação", () => {
    render(<AdministracaoPage />);

    expect(
      replaceMock
    ).toHaveBeenCalledWith("/");
  });

  test("Deve redirecionar quando não existir usuário salvo", () => {
    localStorage.setItem(
      "estrutec_token",
      "token-teste"
    );

    render(<AdministracaoPage />);

    expect(
      replaceMock
    ).toHaveBeenCalledWith("/");
  });

  test("Deve impedir acesso de operador", () => {
    armazenarUsuario("OPERADOR");

    render(<AdministracaoPage />);

    expect(
      replaceMock
    ).toHaveBeenCalledWith("/painel");
  });

  test("Deve permitir acesso de administrador", () => {
    armazenarUsuario("ADMINISTRADOR");

    render(<AdministracaoPage />);

    expect(
      replaceMock
    ).not.toHaveBeenCalled();

    expect(
      screen.getByText("Usuários")
    ).toBeInTheDocument();
  });

  test("Deve limpar autenticação inválida", () => {
    localStorage.setItem(
      "estrutec_token",
      "token-teste"
    );

    localStorage.setItem(
      "estrutec_usuario",
      "json-invalido"
    );

    render(<AdministracaoPage />);

    expect(
      localStorage.getItem("estrutec_token")
    ).toBeNull();

    expect(
      localStorage.getItem("estrutec_usuario")
    ).toBeNull();

    expect(
      replaceMock
    ).toHaveBeenCalledWith("/");
  });

  test("Deve permitir voltar ao painel", () => {
    armazenarUsuario();

    render(<AdministracaoPage />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Voltar ao painel",
      })
    );

    expect(
      pushMock
    ).toHaveBeenCalledWith("/painel");
  });

  test.each([
    ["Usuários", "/administracao/usuarios"],
    ["Empresas clientes", "/administracao/clientes"],
    ["Transportadoras", "/administracao/transportadoras"],
    ["Equipamentos", "/administracao/equipamentos"],
    ["Equipes", "/administracao/equipes"],
    ["Parâmetros de Fabricação", "/administracao/fabricacao"],
    ["Cavalos Mecânicos", "/administracao/cavalos-mecanicos"],
    ["Carretas", "/administracao/carretas"],
  ])(
    "Deve navegar para %s",
    (nome, caminho) => {
      armazenarUsuario();

      render(<AdministracaoPage />);

      fireEvent.click(
        screen.getByRole("button", {
          name: new RegExp(nome, "i"),
        })
      );

      expect(
        pushMock
      ).toHaveBeenCalledWith(caminho);
    }
  );
});

describe("Redefinição de senha - Estrutec", () => {
  const preencherSenhas = (
    senha: string,
    confirmacao = senha
  ) => {
    fireEvent.change(
      screen.getByLabelText("Nova senha"),
      {
        target: {
          value: senha,
        },
      }
    );

    fireEvent.change(
      screen.getByLabelText(
        "Confirmar nova senha"
      ),
      {
        target: {
          value: confirmacao,
        },
      }
    );
  };

  const enviar = () => {
    fireEvent.click(
      screen.getByRole("button", {
        name: "Redefinir senha",
      })
    );
  };

  beforeEach(() => {
    window.history.replaceState(
      {},
      "",
      "/redefinir-senha?token=token-valido"
    );
  });

  test("Deve apresentar o formulário de redefinição", () => {
    render(<RedefinirSenhaPage />);

    expect(
      screen.getByRole("heading", {
        name: "Criar nova senha",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Nova senha")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(
        "Confirmar nova senha"
      )
    ).toBeInTheDocument();
  });

  test("Deve rejeitar link sem token", () => {
    window.history.replaceState(
      {},
      "",
      "/redefinir-senha"
    );

    render(<RedefinirSenhaPage />);

    expect(
      screen.getByText(
        "Link de recuperação inválido."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Redefinir senha",
      })
    ).toBeDisabled();
  });

  test("Deve rejeitar senha com menos de oito caracteres", () => {
    render(<RedefinirSenhaPage />);

    preencherSenhas("1234567");

    enviar();

    expect(
      screen.getByText(
        "A senha deve possuir pelo menos 8 caracteres."
      )
    ).toBeInTheDocument();

    expect(
      apiMock
    ).not.toHaveBeenCalled();
  });

  test("Deve rejeitar senhas diferentes", () => {
    render(<RedefinirSenhaPage />);

    preencherSenhas(
      "Senha12345",
      "Senha54321"
    );

    enviar();

    expect(
      screen.getByText(
        "As senhas informadas não são iguais."
      )
    ).toBeInTheDocument();

    expect(
      apiMock
    ).not.toHaveBeenCalled();
  });

  test("Deve redefinir a senha com sucesso", async () => {
    apiMock.mockResolvedValue(
      criarResposta({
        mensagem: "Senha redefinida com sucesso.",
      })
    );

    render(<RedefinirSenhaPage />);

    preencherSenhas("SenhaSegura123");

    enviar();

    await waitFor(() => {
      expect(
        apiMock
      ).toHaveBeenCalledWith(
        "/auth/redefinir-senha",
        {
          method: "POST",
          body: JSON.stringify({
            token: "token-valido",
            novaSenha: "SenhaSegura123",
          }),
        }
      );
    });

    expect(
      await screen.findByText(
        "Senha alterada!"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Voltar para o Login",
      })
    ).toBeInTheDocument();
  });

  test("Deve retornar para o login após redefinição", async () => {
    apiMock.mockResolvedValue(
      criarResposta({
        mensagem: "Senha alterada.",
      })
    );

    render(<RedefinirSenhaPage />);

    preencherSenhas("SenhaSegura123");

    enviar();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Voltar para o Login",
      })
    );

    expect(
      pushMock
    ).toHaveBeenCalledWith("/login");
  });

  test("Deve apresentar erro para token expirado", async () => {
    apiMock.mockResolvedValue(
      criarResposta(
        {
          erro: "Token expirado.",
        },
        400
      )
    );

    render(<RedefinirSenhaPage />);

    preencherSenhas("SenhaSegura123");

    enviar();

    expect(
      await screen.findByText(
        "Token expirado."
      )
    ).toBeInTheDocument();
  });

  test("Deve apresentar erro quando o servidor estiver indisponível", async () => {
    apiMock.mockRejectedValue(
      new Error("Falha de conexão")
    );

    render(<RedefinirSenhaPage />);

    preencherSenhas("SenhaSegura123");

    enviar();

    expect(
      await screen.findByText(
        "Não foi possível conectar ao servidor."
      )
    ).toBeInTheDocument();
  });
});

describe("Painel de projetos - Estrutec", () => {
  beforeEach(() => {
    apiAutenticadaMock.mockImplementation(
      async (caminho: string) => {
        if (caminho === "/clientes") {
          return criarResposta({
            clientes: empresas,
          });
        }

        if (
          caminho.startsWith("/projetos")
        ) {
          return criarResposta({
            projetos,
          });
        }

        throw new Error(
          `Rota inesperada: ${caminho}`
        );
      }
    );
  });

  test("Deve carregar a lista de projetos", async () => {
    render(<PainelPage />);

    expect(
      await screen.findByText(
        "Galpão Industrial"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Centro Logístico"
      )
    ).toBeInTheDocument();

    expect(
      apiAutenticadaMock
    ).toHaveBeenCalledWith("/projetos");
  });

  test("Deve mostrar mensagem quando não existirem projetos", async () => {
    apiAutenticadaMock.mockImplementation(
      async (caminho: string) => {
        if (caminho === "/clientes") {
          return criarResposta({
            clientes: [],
          });
        }

        return criarResposta({
          projetos: [],
        });
      }
    );

    render(<PainelPage />);

    expect(
      await screen.findByText(
        "Nenhum projeto cadastrado"
      )
    ).toBeInTheDocument();
  });

  test("Deve permitir abrir um projeto", async () => {
    render(<PainelPage />);

    await screen.findByText(
      "Galpão Industrial"
    );

    fireEvent.click(
      screen.getAllByRole("button", {
        name: /Abrir projeto/i,
      })[0]
    );

    expect(
      pushMock
    ).toHaveBeenCalledWith(
      "/projetos/7"
    );
  });

  test("Deve permitir criar um novo projeto", async () => {
    render(<PainelPage />);

    await screen.findByText(
      "Galpão Industrial"
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Novo projeto/i,
      })
    );

    expect(
      pushMock
    ).toHaveBeenCalledWith(
      "/projetos/novo"
    );
  });

test("Deve mostrar a administração para administradores", async () => {
  armazenarUsuario("ADMINISTRADOR");

  render(<PainelPage />);

  await screen.findByText("Galpão Industrial");

  await screen.findByRole("option", {
    name: "Empresa Alfa",
  });

  expect(
    screen.getByRole("button", {
      name: "Administração",
    })
  ).toBeInTheDocument();
});

test("Deve ocultar administração para operadores", async () => {
  armazenarUsuario("OPERADOR");

  render(<PainelPage />);

  await screen.findByText("Galpão Industrial");

  await screen.findByRole("option", {
    name: "Empresa Alfa",
  });

  expect(
    screen.queryByRole("button", {
      name: "Administração",
    })
  ).not.toBeInTheDocument();
});

test("Deve permitir acessar a administração", async () => {
  armazenarUsuario("ADMINISTRADOR");

  render(<PainelPage />);

  await screen.findByText("Galpão Industrial");

  await screen.findByRole("option", {
    name: "Empresa Alfa",
  });

  fireEvent.click(
    screen.getByRole("button", {
      name: "Administração",
    })
  );

  expect(pushMock).toHaveBeenCalledWith(
    "/administracao"
  );
});

test("Deve realizar logout", async () => {
  armazenarUsuario();

  render(<PainelPage />);

  await screen.findByText("Galpão Industrial");

  await screen.findByRole("option", {
    name: "Empresa Alfa",
  });

  fireEvent.click(
    screen.getByRole("button", {
      name: "Sair",
    })
  );

  expect(
    localStorage.getItem("estrutec_token")
  ).toBeNull();

  expect(pushMock).toHaveBeenCalledWith(
    "/login"
  );
});

  test("Deve aplicar filtros de busca", async () => {
    render(<PainelPage />);

    await screen.findByText(
      "Galpão Industrial"
    );

    await screen.findByRole("option", {
      name: "Empresa Alfa",
    });

    fireEvent.change(
      screen.getByPlaceholderText(
        "Código, nome ou cliente..."
      ),
      {
        target: {
          value: "Galpão",
        },
      }
    );

    fireEvent.change(
      screen.getAllByRole("combobox")[0],
      {
        target: {
          value: "1",
        },
      }
    );

    fireEvent.change(
      screen.getAllByRole("combobox")[1],
      {
        target: {
          value: "FINALIZADO",
        },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Filtrar",
      })
    );

    await waitFor(() => {
      expect(
        apiAutenticadaMock
      ).toHaveBeenCalledWith(
        expect.stringContaining(
          "busca=Galp%C3%A3o&clienteEmpresaId=1&status=FINALIZADO"
        )
      );
    });
  });

  test("Deve apresentar erro quando a listagem falhar", async () => {
    apiAutenticadaMock.mockImplementation(
      async (caminho: string) => {
        if (caminho === "/clientes") {
          return criarResposta({
            clientes: [],
          });
        }

        return criarResposta(
          {
            erro: "Falha ao listar projetos.",
          },
          500
        );
      }
    );

    render(<PainelPage />);

    expect(
      await screen.findByText(
        "Falha ao listar projetos."
      )
    ).toBeInTheDocument();
  });

  test("Deve tratar falha de conexão", async () => {
    apiAutenticadaMock.mockImplementation(
      async (caminho: string) => {
        if (caminho === "/clientes") {
          return criarResposta({
            clientes: [],
          });
        }

        throw new Error("Conexão indisponível");
      }
    );

    render(<PainelPage />);

    expect(
      await screen.findByText(
        "Não foi possível conectar ao servidor."
      )
    ).toBeInTheDocument();
  });

  test("Deve redirecionar quando a sessão expirar", async () => {
    armazenarUsuario();

    apiAutenticadaMock.mockImplementation(
      async (caminho: string) => {
        if (caminho === "/clientes") {
          return criarResposta({
            clientes: [],
          });
        }

        return criarResposta({}, 401);
      }
    );

    render(<PainelPage />);

    await waitFor(() => {
      expect(
        pushMock
      ).toHaveBeenCalledWith("/login");
    });

    expect(
      localStorage.getItem(
        "estrutec_token"
      )
    ).toBeNull();
  });
});

describe("Cadastro de projetos - Estrutec", () => {
  beforeEach(() => {
    apiAutenticadaMock.mockImplementation(
      async (caminho: string) => {
        if (caminho === "/clientes") {
          return criarResposta({
            clientes: empresas,
          });
        }

        if (caminho === "/projetos") {
          return criarResposta(
            {
              mensagem: "Projeto cadastrado.",
            },
            201
          );
        }

        throw new Error(
          `Rota inesperada: ${caminho}`
        );
      }
    );
  });

  const preencherProjeto = async () => {
    await screen.findByRole("option", {
      name: "Empresa Alfa",
    });

    fireEvent.change(
      screen.getByLabelText(/Código/i),
      {
        target: {
          value: "EST-010",
        },
      }
    );

    fireEvent.change(
      screen.getByLabelText(
        /Nome do projeto/i
      ),
      {
        target: {
          value: "Galpão de Testes",
        },
      }
    );

    fireEvent.change(
      screen.getByLabelText(
        /Empresa cliente/i
      ),
      {
        target: {
          value: "1",
        },
      }
    );

    fireEvent.change(
      screen.getByLabelText(/Origem/i),
      {
        target: {
          value: "Joinville",
        },
      }
    );

    fireEvent.change(
      screen.getByLabelText(/Destino/i),
      {
        target: {
          value: "Curitiba",
        },
      }
    );

    fireEvent.change(
      screen.getByLabelText(/Prazo/i),
      {
        target: {
          value: "2026-12-20",
        },
      }
    );

    fireEvent.change(
      screen.getByLabelText(/BDI/i),
      {
        target: {
          value: "20",
        },
      }
    );
  };

test("Deve apresentar o formulário de novo projeto", async () => {
  render(<NovoProjetoPage />);

  await screen.findByRole("option", {
    name: "Empresa Alfa",
  });

  expect(
    screen.getByRole("heading", {
      name: "Novo Projeto",
    })
  ).toBeInTheDocument();

  expect(
    screen.getByRole("button", {
      name: "Criar projeto",
    })
  ).toBeInTheDocument();
});

  test("Deve listar apenas empresas ativas", async () => {
    render(<NovoProjetoPage />);

    expect(
      await screen.findByRole("option", {
        name: "Empresa Alfa",
      })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("option", {
        name: "Empresa Inativa Ltda.",
      })
    ).not.toBeInTheDocument();
  });

test("Deve impedir cadastro com formulário vazio", async () => {
  render(<NovoProjetoPage />);

  await screen.findByRole("option", {
    name: "Empresa Alfa",
  });

  fireEvent.click(
    screen.getByRole("button", {
      name: "Criar projeto",
    })
  );

  expect(
    apiAutenticadaMock
  ).not.toHaveBeenCalledWith(
    "/projetos",
    expect.anything()
  );
});

  test("Deve cadastrar projeto com os dados informados", async () => {
    render(<NovoProjetoPage />);

    await preencherProjeto();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Criar projeto",
      })
    );

    await waitFor(() => {
      expect(
        apiAutenticadaMock
      ).toHaveBeenCalledWith(
        "/projetos",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    const chamada =
      apiAutenticadaMock.mock.calls.find(
        ([caminho]) =>
          caminho === "/projetos"
      );

    expect(chamada).toBeDefined();

    const dados = JSON.parse(
      chamada![1].body
    );

    expect(dados).toEqual({
      codigo: "EST-010",
      nome: "Galpão de Testes",
      cliente: "Empresa Alfa",
      cliente_empresa_id: 1,
      responsavel: null,
      origem: "Joinville",
      destino: "Curitiba",
      prazo: "2026-12-20",
      bdi: 20,
      observacoes: null,
    });

    await waitFor(() => {
      expect(
        pushMock
      ).toHaveBeenCalledWith(
        "/painel"
      );
    });
  });

  test("Deve apresentar erro de cadastro duplicado", async () => {
    apiAutenticadaMock.mockImplementation(
      async (caminho: string) => {
        if (caminho === "/clientes") {
          return criarResposta({
            clientes: empresas,
          });
        }

        return criarResposta(
          {
            erro: "Código já cadastrado.",
          },
          400
        );
      }
    );

    render(<NovoProjetoPage />);

    await preencherProjeto();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Criar projeto",
      })
    );

    expect(
      await screen.findByText(
        "Código já cadastrado."
      )
    ).toBeInTheDocument();

    expect(
      pushMock
    ).not.toHaveBeenCalled();
  });

  test("Deve tratar falha de conexão no cadastro", async () => {
    apiAutenticadaMock.mockImplementation(
      async (caminho: string) => {
        if (caminho === "/clientes") {
          return criarResposta({
            clientes: empresas,
          });
        }

        throw new Error(
          "Servidor indisponível"
        );
      }
    );

    render(<NovoProjetoPage />);

    await preencherProjeto();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Criar projeto",
      })
    );

    expect(
      await screen.findByText(
        "Não foi possível conectar ao servidor."
      )
    ).toBeInTheDocument();
  });

test("Deve cancelar a criação do projeto", async () => {
  render(<NovoProjetoPage />);

  await screen.findByRole("option", {
    name: "Empresa Alfa",
  });

  fireEvent.click(
    screen.getByRole("button", {
      name: "Cancelar",
    })
  );

  expect(pushMock).toHaveBeenCalledWith(
    "/painel"
  );
});

test("Deve voltar ao painel pelo cabeçalho", async () => {
  render(<NovoProjetoPage />);

  await screen.findByRole("option", {
    name: "Empresa Alfa",
  });

  fireEvent.click(
    screen.getByRole("button", {
      name: "Voltar",
    })
  );

  expect(pushMock).toHaveBeenCalledWith(
    "/painel"
  );
});

  test("Deve redirecionar quando o token expirar no cadastro", async () => {
    armazenarUsuario();

    apiAutenticadaMock.mockImplementation(
      async (caminho: string) => {
        if (caminho === "/clientes") {
          return criarResposta({
            clientes: empresas,
          });
        }

        return criarResposta({}, 401);
      }
    );

    render(<NovoProjetoPage />);

    await preencherProjeto();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Criar projeto",
      })
    );

    await waitFor(() => {
      expect(
        pushMock
      ).toHaveBeenCalledWith(
        "/login"
      );
    });

    expect(
      localStorage.getItem(
        "estrutec_token"
      )
    ).toBeNull();
  });
});

describe("Relatório final - Estrutec", () => {
  beforeEach(() => {
    apiAutenticadaMock.mockResolvedValue(
      criarResposta({})
    );
  });

  test("Deve carregar e apresentar o PDF", async () => {
    render(<RelatorioPage />);

    expect(
      await screen.findByTitle(
        "Relatório final do projeto"
      )
    ).toBeInTheDocument();

    expect(
      apiAutenticadaMock
    ).toHaveBeenCalledWith(
      "/projetos/7/relatorio-final",
      {
        cache: "no-store",
      }
    );

    expect(
      URL.createObjectURL
    ).toHaveBeenCalledTimes(1);

    expect(
      screen.getByText(
        "Documento gerado"
      )
    ).toBeInTheDocument();
  });

  test("Deve permitir atualizar o relatório", async () => {
    render(<RelatorioPage />);

    await screen.findByTitle(
      "Relatório final do projeto"
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Atualizar",
      })
    );

    await waitFor(() => {
      expect(
        apiAutenticadaMock
      ).toHaveBeenCalledTimes(2);
    });
  });

  test("Deve apresentar erro retornado pela API", async () => {
    apiAutenticadaMock.mockResolvedValue(
      criarResposta(
        {
          erro: "Projeto não finalizado.",
        },
        400
      )
    );

    render(<RelatorioPage />);

    expect(
      await screen.findByText(
        "Projeto não finalizado."
      )
    ).toBeInTheDocument();
  });

  test("Deve apresentar mensagem padrão quando o erro não tiver detalhes", async () => {
    apiAutenticadaMock.mockResolvedValue(
      criarResposta({}, 500)
    );

    render(<RelatorioPage />);

    expect(
      await screen.findByText(
        "Não foi possível gerar o relatório final."
      )
    ).toBeInTheDocument();
  });

  test("Deve permitir tentar novamente após uma falha", async () => {
    apiAutenticadaMock
      .mockResolvedValueOnce(
        criarResposta(
          {
            erro: "Erro temporário.",
          },
          500
        )
      )
      .mockResolvedValueOnce(
        criarResposta({})
      );

    render(<RelatorioPage />);

    await screen.findByText(
      "Erro temporário."
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Tentar novamente",
      })
    );

    expect(
      await screen.findByTitle(
        "Relatório final do projeto"
      )
    ).toBeInTheDocument();

    expect(
      apiAutenticadaMock
    ).toHaveBeenCalledTimes(2);
  });

  test("Deve tratar falha de conexão ao gerar PDF", async () => {
    apiAutenticadaMock.mockRejectedValue(
      new Error("Falha de conexão")
    );

    render(<RelatorioPage />);

    expect(
      await screen.findByText(
        "Não foi possível conectar ao servidor."
      )
    ).toBeInTheDocument();
  });

  test("Deve redirecionar quando a sessão expirar", async () => {
    armazenarUsuario();

    apiAutenticadaMock.mockResolvedValue(
      criarResposta({}, 401)
    );

    render(<RelatorioPage />);

    await waitFor(() => {
      expect(
        pushMock
      ).toHaveBeenCalledWith(
        "/login"
      );
    });

    expect(
      localStorage.getItem(
        "estrutec_token"
      )
    ).toBeNull();
  });

test("Deve voltar ao resumo do projeto", async () => {
  render(<RelatorioPage />);

  await screen.findByTitle(
    "Relatório final do projeto"
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: "Voltar ao resumo",
    })
  );

  expect(pushMock).toHaveBeenCalledWith(
    "/projetos/7/resumo"
  );
});
});