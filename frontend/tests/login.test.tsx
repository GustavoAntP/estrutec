import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/login/page";
import { api } from "@/servicos/api";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/servicos/api", () => ({
  api: jest.fn(),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const { priority, ...atributos } = props;
    return require("react").createElement("img", atributos);
  },
}));

const apiMock = api as jest.Mock;
const pushMock = jest.fn();

const preencherLogin = (
  identificador = "usuario@estrutec.com",
  senha = "senha123"
) => {
  fireEvent.change(
    screen.getByLabelText("CPF ou e-mail"),
    {
      target: { value: identificador },
    }
  );

  fireEvent.change(
    screen.getByLabelText("Senha"),
    {
      target: { value: senha },
    }
  );
};

const enviarLogin = () => {
  fireEvent.click(
    screen.getByRole("button", {
      name: "Entrar no Estrutec",
    })
  );
};

const abrirRecuperacao = () => {
  fireEvent.click(
    screen.getByRole("button", {
      name: "Esqueci minha senha",
    })
  );
};

const preencherRecuperacao = (identificador: string) => {
  fireEvent.change(
    document.getElementById("recuperacao")!,
    {
      target: { value: identificador },
    }
  );
};

describe("Tela de login - Estrutec", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: pushMock,
    });

    window.localStorage.clear();
  });

  describe("Renderização inicial", () => {
    test("Deve apresentar o título da tela de login", () => {
      render(<LoginPage />);

      expect(
        screen.getByRole("heading", {
          name: "Acesse sua conta",
        })
      ).toBeInTheDocument();
    });

    test("Deve apresentar os campos de identificação e senha", () => {
      render(<LoginPage />);

      expect(
        screen.getByLabelText("CPF ou e-mail")
      ).toBeInTheDocument();

      expect(
        screen.getByLabelText("Senha")
      ).toBeInTheDocument();
    });

    test("Deve apresentar o botão de login", () => {
      render(<LoginPage />);

      expect(
        screen.getByRole("button", {
          name: "Entrar no Estrutec",
        })
      ).toBeEnabled();
    });

    test("Deve apresentar as opções de acesso", () => {
      render(<LoginPage />);

      expect(
        screen.getByRole("button", {
          name: "Não possuo conta",
        })
      ).toBeInTheDocument();

      expect(
        screen.getByRole("button", {
          name: "Esqueci minha senha",
        })
      ).toBeInTheDocument();
    });

    test("Deve impedir envio com campos obrigatórios vazios", () => {
      render(<LoginPage />);

      enviarLogin();

      expect(apiMock).not.toHaveBeenCalled();
      expect(pushMock).not.toHaveBeenCalled();
    });
  });

  describe("Autenticação", () => {
    test("Deve realizar login com sucesso", async () => {
      apiMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          token: "token-valido-estrutec",
          usuario: {
            id: 7,
            nome: "Usuário Teste",
            perfil: "ADMINISTRADOR",
          },
        }),
      });

      render(<LoginPage />);

      preencherLogin();
      enviarLogin();

      await waitFor(() => {
        expect(apiMock).toHaveBeenCalledWith(
          "/auth/login",
          {
            method: "POST",
            body: JSON.stringify({
              identificador: "usuario@estrutec.com",
              senha: "senha123",
            }),
          }
        );
      });

      await waitFor(() => {
        expect(pushMock).toHaveBeenCalledWith(
          "/painel"
        );
      });
    });

    test("Deve armazenar o token após login", async () => {
      apiMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          token: "jwt-teste",
          usuario: {
            id: 12,
            nome: "Administrador",
          },
        }),
      });

      render(<LoginPage />);

      preencherLogin();
      enviarLogin();

      await waitFor(() => {
        expect(
          window.localStorage.getItem("estrutec_token")
        ).toBe("jwt-teste");
      });

      expect(
        JSON.parse(
          window.localStorage.getItem("estrutec_usuario")!
        )
      ).toEqual({
        id: 12,
        nome: "Administrador",
      });
    });

    test("Deve apresentar erro para credenciais inválidas", async () => {
      apiMock.mockResolvedValue({
        ok: false,
        json: async () => ({
          erro: "Credenciais inválidas.",
        }),
      });

      render(<LoginPage />);

      preencherLogin(
        "usuario@estrutec.com",
        "senha-errada"
      );

      enviarLogin();

      expect(
        await screen.findByText("Credenciais inválidas.")
      ).toBeInTheDocument();

      expect(pushMock).not.toHaveBeenCalled();
    });

    test("Deve apresentar mensagem padrão quando o servidor rejeitar o login", async () => {
      apiMock.mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      render(<LoginPage />);

      preencherLogin();
      enviarLogin();

      expect(
        await screen.findByText(
          "Não foi possível realizar o login."
        )
      ).toBeInTheDocument();

      expect(pushMock).not.toHaveBeenCalled();
    });

    test("Deve tratar falha de conexão com o servidor", async () => {
      apiMock.mockRejectedValue(
        new Error("Falha de conexão")
      );

      render(<LoginPage />);

      preencherLogin();
      enviarLogin();

      expect(
        await screen.findByText(
          "Não foi possível conectar ao servidor."
        )
      ).toBeInTheDocument();

      expect(pushMock).not.toHaveBeenCalled();
    });

    test("Deve bloquear o botão enquanto o login está sendo processado", async () => {
      let resolverRequisicao!: (valor: unknown) => void;

      apiMock.mockReturnValue(
        new Promise((resolve) => {
          resolverRequisicao = resolve;
        })
      );

      render(<LoginPage />);

      preencherLogin();
      enviarLogin();

      expect(
        screen.getByRole("button", {
          name: "Entrando...",
        })
      ).toBeDisabled();

      resolverRequisicao({
        ok: true,
        json: async () => ({
          token: "token",
          usuario: { id: 1 },
        }),
      });

      await waitFor(() => {
        expect(pushMock).toHaveBeenCalledWith(
          "/painel"
        );
      });
    });

    test("Deve liberar novamente o botão após falha", async () => {
      apiMock.mockRejectedValue(
        new Error("Servidor indisponível")
      );

      render(<LoginPage />);

      preencherLogin();
      enviarLogin();

      await screen.findByText(
        "Não foi possível conectar ao servidor."
      );

      expect(
        screen.getByRole("button", {
          name: "Entrar no Estrutec",
        })
      ).toBeEnabled();
    });
  });

  describe("Modal para usuários sem conta", () => {
    test("Deve abrir o modal de solicitação de acesso", () => {
      render(<LoginPage />);

      fireEvent.click(
        screen.getByRole("button", {
          name: "Não possuo conta",
        })
      );

      expect(
        screen.getByRole("heading", {
          name: "Não possui uma conta?",
        })
      ).toBeInTheDocument();

      expect(
        screen.getByText("Como solicitar acesso?")
      ).toBeInTheDocument();
    });

    test("Deve fechar o modal ao clicar em Entendi", () => {
      render(<LoginPage />);

      fireEvent.click(
        screen.getByRole("button", {
          name: "Não possuo conta",
        })
      );

      fireEvent.click(
        screen.getByRole("button", {
          name: "Entendi",
        })
      );

      expect(
        screen.queryByRole("heading", {
          name: "Não possui uma conta?",
        })
      ).not.toBeInTheDocument();
    });
  });

  describe("Recuperação de senha", () => {
    test("Deve abrir a recuperação de senha", () => {
      render(<LoginPage />);

      abrirRecuperacao();

      expect(
        screen.getByRole("heading", {
          name: "Recuperar senha",
        })
      ).toBeInTheDocument();

      expect(
        screen.getByRole("button", {
          name: "Enviar link",
        })
      ).toBeInTheDocument();
    });

    test("Deve preencher a recuperação com o identificador informado no login", () => {
      render(<LoginPage />);

      fireEvent.change(
        screen.getByLabelText("CPF ou e-mail"),
        {
          target: {
            value: "usuario@estrutec.com",
          },
        }
      );

      abrirRecuperacao();

      expect(
        document.getElementById("recuperacao")
      ).toHaveValue("usuario@estrutec.com");
    });

    test("Deve exigir CPF ou e-mail na recuperação", () => {
      render(<LoginPage />);

      abrirRecuperacao();

      fireEvent.click(
        screen.getByRole("button", {
          name: "Enviar link",
        })
      );

      expect(
        screen.getByText("Informe seu CPF ou e-mail.")
      ).toBeInTheDocument();

      expect(apiMock).not.toHaveBeenCalled();
    });

    test("Deve solicitar recuperação de senha com sucesso", async () => {
      apiMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          mensagem: "Instruções enviadas com sucesso.",
        }),
      });

      render(<LoginPage />);

      abrirRecuperacao();

      preencherRecuperacao("usuario@estrutec.com");

      fireEvent.click(
        screen.getByRole("button", {
          name: "Enviar link",
        })
      );

      await waitFor(() => {
        expect(apiMock).toHaveBeenCalledWith(
          "/auth/esqueci-senha",
          {
            method: "POST",
            body: JSON.stringify({
              identificador: "usuario@estrutec.com",
            }),
          }
        );
      });

      expect(
        await screen.findByText(
          "Instruções enviadas com sucesso."
        )
      ).toBeInTheDocument();
    });

    test("Deve apresentar erro quando a recuperação falhar", async () => {
      apiMock.mockResolvedValue({
        ok: false,
        json: async () => ({
          erro: "Não foi possível recuperar a senha.",
        }),
      });

      render(<LoginPage />);

      abrirRecuperacao();
      preencherRecuperacao("usuario@estrutec.com");

      fireEvent.click(
        screen.getByRole("button", {
          name: "Enviar link",
        })
      );

      expect(
        await screen.findByText(
          "Não foi possível recuperar a senha."
        )
      ).toBeInTheDocument();
    });

    test("Deve tratar falha de conexão durante a recuperação", async () => {
      apiMock.mockRejectedValue(
        new Error("Servidor indisponível")
      );

      render(<LoginPage />);

      abrirRecuperacao();
      preencherRecuperacao("usuario@estrutec.com");

      fireEvent.click(
        screen.getByRole("button", {
          name: "Enviar link",
        })
      );

      expect(
        await screen.findByText(
          "Não foi possível conectar ao servidor."
        )
      ).toBeInTheDocument();
    });

    test("Deve permitir cancelar a recuperação", () => {
      render(<LoginPage />);

      abrirRecuperacao();

      fireEvent.click(
        screen.getByRole("button", {
          name: "Cancelar",
        })
      );

      expect(
        screen.queryByRole("heading", {
          name: "Recuperar senha",
        })
      ).not.toBeInTheDocument();
    });
  });
});