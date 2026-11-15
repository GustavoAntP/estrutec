jest.mock("../src/servicos/usuarioServico", () => ({
  cadastrarUsuario: jest.fn(),
  listarUsuarios: jest.fn(),
  editarUsuario: jest.fn(),
  alterarStatusUsuario: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const usuarioServico = require("../src/servicos/usuarioServico");
const usuarioRotas = require("../src/rotas/usuarioRotas");

const app = express();

app.use(express.json());
app.use("/usuarios", usuarioRotas);

describe("Integração das rotas de usuários - Estrutec", () => {
  const segredoOriginal = process.env.JWT_SECRET;
  const segredoTeste = "estrutec-chave-isolada-testes-usuarios";

  let usuario;

  const gerarToken = (perfil = "ADMINISTRADOR", opcoes = {}) =>
    jwt.sign(
      {
        id: 99,
        nome: "Administrador Teste",
        email: "admin@estrutec.com",
        perfil,
      },
      segredoTeste,
      opcoes
    );

  beforeAll(() => {
    process.env.JWT_SECRET = segredoTeste;
  });

  afterAll(() => {
    if (segredoOriginal === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = segredoOriginal;
    }
  });

  beforeEach(() => {
    jest.resetAllMocks();

    usuario = {
      id: 7,
      nome: "Maria da Silva",
      cpf: "12345678909",
      email: "maria@exemplo.com.br",
      ativo: true,
      perfil: "OPERADOR",
    };

    usuarioServico.cadastrarUsuario.mockResolvedValue(usuario);

    usuarioServico.listarUsuarios.mockResolvedValue([
      usuario,
    ]);

    usuarioServico.editarUsuario.mockResolvedValue({
      ...usuario,
      nome: "Maria Atualizada",
    });

    usuarioServico.alterarStatusUsuario.mockResolvedValue({
      ...usuario,
      ativo: false,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Autenticação das rotas", () => {
    test.each([
      ["get", "/usuarios"],
      ["post", "/usuarios"],
      ["put", "/usuarios/7"],
      ["patch", "/usuarios/7/status"],
    ])(
      "Deve bloquear %s %s sem autenticação",
      async (metodo, caminho) => {
        const resposta = await request(app)[metodo](caminho);

        expect(resposta.status).toBe(401);

        expect(resposta.body).toEqual({
          erro: "Token não informado.",
        });

        expect(
          usuarioServico.cadastrarUsuario
        ).not.toHaveBeenCalled();

        expect(
          usuarioServico.listarUsuarios
        ).not.toHaveBeenCalled();

        expect(
          usuarioServico.editarUsuario
        ).not.toHaveBeenCalled();

        expect(
          usuarioServico.alterarStatusUsuario
        ).not.toHaveBeenCalled();
      }
    );

    test.each([
      ["formato Token", "Token abc123"],
      ["Bearer sem token", "Bearer"],
      ["prefixo minúsculo", "bearer abc123"],
    ])(
      "Deve rejeitar autorização com %s",
      async (_, autorizacao) => {
        const resposta = await request(app)
          .get("/usuarios")
          .set("Authorization", autorizacao);

        expect(resposta.status).toBe(401);

        expect(resposta.body).toEqual({
          erro: "Formato de token inválido.",
        });

        expect(
          usuarioServico.listarUsuarios
        ).not.toHaveBeenCalled();
      }
    );

    test("Deve rejeitar JWT inválido", async () => {
      const resposta = await request(app)
        .get("/usuarios")
        .set("Authorization", "Bearer token-invalido");

      expect(resposta.status).toBe(401);

      expect(resposta.body).toEqual({
        erro: "Token inválido ou expirado.",
      });

      expect(
        usuarioServico.listarUsuarios
      ).not.toHaveBeenCalled();
    });

    test("Deve rejeitar JWT expirado", async () => {
      const token = gerarToken("ADMINISTRADOR", {
        expiresIn: -1,
      });

      const resposta = await request(app)
        .get("/usuarios")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(401);

      expect(resposta.body).toEqual({
        erro: "Token inválido ou expirado.",
      });

      expect(
        usuarioServico.listarUsuarios
      ).not.toHaveBeenCalled();
    });

    test("Deve rejeitar JWT assinado com segredo incorreto", async () => {
      const token = jwt.sign(
        {
          id: 99,
          perfil: "ADMINISTRADOR",
        },
        "chave-incorreta"
      );

      const resposta = await request(app)
        .get("/usuarios")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(401);

      expect(resposta.body).toEqual({
        erro: "Token inválido ou expirado.",
      });
    });
  });

  describe("Permissões administrativas", () => {
    test.each([
      ["get", "/usuarios"],
      ["post", "/usuarios"],
      ["put", "/usuarios/7"],
      ["patch", "/usuarios/7/status"],
    ])(
      "Deve impedir operador de executar %s %s",
      async (metodo, caminho) => {
        const token = gerarToken("OPERADOR");

        const resposta = await request(app)
          [metodo](caminho)
          .set("Authorization", `Bearer ${token}`);

        expect(resposta.status).toBe(403);

        expect(resposta.body).toEqual({
          erro: "Acesso permitido somente para administradores.",
        });

        expect(
          usuarioServico.cadastrarUsuario
        ).not.toHaveBeenCalled();

        expect(
          usuarioServico.listarUsuarios
        ).not.toHaveBeenCalled();

        expect(
          usuarioServico.editarUsuario
        ).not.toHaveBeenCalled();

        expect(
          usuarioServico.alterarStatusUsuario
        ).not.toHaveBeenCalled();
      }
    );

    test("Deve rejeitar perfil administrador em letras minúsculas", async () => {
      const token = gerarToken("administrador");

      const resposta = await request(app)
        .get("/usuarios")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(403);

      expect(resposta.body).toEqual({
        erro: "Acesso permitido somente para administradores.",
      });
    });

    test("Deve rejeitar token sem perfil administrativo", async () => {
      const token = jwt.sign(
        {
          id: 99,
          nome: "Usuário sem perfil",
        },
        segredoTeste
      );

      const resposta = await request(app)
        .get("/usuarios")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(403);

      expect(resposta.body).toEqual({
        erro: "Acesso permitido somente para administradores.",
      });

      expect(
        usuarioServico.listarUsuarios
      ).not.toHaveBeenCalled();
    });
  });

  describe("Listagem de usuários", () => {
    test("Deve permitir listagem por administrador", async () => {
      const token = gerarToken();

      const resposta = await request(app)
        .get("/usuarios")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        usuarios: [usuario],
      });

      expect(
        usuarioServico.listarUsuarios
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar lista vazia quando não houver usuários", async () => {
      usuarioServico.listarUsuarios.mockResolvedValue([]);

      const token = gerarToken();

      const resposta = await request(app)
        .get("/usuarios")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        usuarios: [],
      });
    });

    test("Deve retornar erro 500 quando a listagem falhar", async () => {
      const erroConsole = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      usuarioServico.listarUsuarios.mockRejectedValue(
        new Error("Falha ao consultar usuários")
      );

      const token = gerarToken();

      const resposta = await request(app)
        .get("/usuarios")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(500);

      expect(resposta.body).toEqual({
        erro: "Falha ao consultar usuários",
      });

      expect(erroConsole).toHaveBeenCalledWith(
        "ERRO AO LISTAR USUÁRIOS:",
        expect.any(Error)
      );

      expect(
        usuarioServico.listarUsuarios
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("Cadastro de usuários", () => {
    test("Deve permitir cadastro por administrador", async () => {
      const token = gerarToken();

      const dados = {
        nome: "Maria da Silva",
        cpf: "123.456.789-09",
        email: "maria@exemplo.com.br",
        senha: "Senha@123",
        perfil: "OPERADOR",
      };

      const resposta = await request(app)
        .post("/usuarios")
        .set("Authorization", `Bearer ${token}`)
        .send(dados);

      expect(resposta.status).toBe(201);

      expect(resposta.body).toEqual({
        mensagem: "Usuário cadastrado com sucesso!",
        usuario,
      });

      expect(
        usuarioServico.cadastrarUsuario
      ).toHaveBeenCalledWith(dados);

      expect(
        usuarioServico.cadastrarUsuario
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar erro 400 quando o cadastro falhar", async () => {
      usuarioServico.cadastrarUsuario.mockRejectedValue(
        new Error("Nome, CPF, e-mail e senha são obrigatórios.")
      );

      const token = gerarToken();

      const resposta = await request(app)
        .post("/usuarios")
        .set("Authorization", `Bearer ${token}`)
        .send({
          nome: "",
        });

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "Nome, CPF, e-mail e senha são obrigatórios.",
      });

      expect(
        usuarioServico.cadastrarUsuario
      ).toHaveBeenCalledWith({
        nome: "",
      });
    });

    test("Deve encaminhar os dados recebidos ao serviço", async () => {
      const token = gerarToken();

      const dados = {
        nome: "Novo Operador",
        cpf: "98765432100",
        email: "operador@estrutec.com",
        senha: "SenhaTeste123",
      };

      const resposta = await request(app)
        .post("/usuarios")
        .set("Authorization", `Bearer ${token}`)
        .send(dados);

      expect(resposta.status).toBe(201);

      expect(
        usuarioServico.cadastrarUsuario
      ).toHaveBeenCalledWith(dados);

      expect(
        usuarioServico.cadastrarUsuario
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edição de usuários", () => {
    test("Deve permitir edição por administrador", async () => {
      const token = gerarToken();

      const dados = {
        nome: "Maria Atualizada",
        cpf: "12345678909",
        email: "maria@exemplo.com.br",
        perfil: "OPERADOR",
      };

      const resposta = await request(app)
        .put("/usuarios/7")
        .set("Authorization", `Bearer ${token}`)
        .send(dados);

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        mensagem: "Usuário atualizado com sucesso!",
        usuario: {
          ...usuario,
          nome: "Maria Atualizada",
        },
      });

      expect(
        usuarioServico.editarUsuario
      ).toHaveBeenCalledWith("7", dados);

      expect(
        usuarioServico.editarUsuario
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar erro 400 quando a edição falhar", async () => {
      usuarioServico.editarUsuario.mockRejectedValue(
        new Error("Usuário não encontrado.")
      );

      const token = gerarToken();

      const dados = {
        nome: "Usuário Inexistente",
      };

      const resposta = await request(app)
        .put("/usuarios/999")
        .set("Authorization", `Bearer ${token}`)
        .send(dados);

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "Usuário não encontrado.",
      });

      expect(
        usuarioServico.editarUsuario
      ).toHaveBeenCalledWith("999", dados);
    });

    test("Deve encaminhar identificador e dados de edição", async () => {
      const token = gerarToken();

      const dados = {
        nome: "Usuário Teste",
        perfil: "ADMINISTRADOR",
      };

      const resposta = await request(app)
        .put("/usuarios/42")
        .set("Authorization", `Bearer ${token}`)
        .send(dados);

      expect(resposta.status).toBe(200);

      expect(
        usuarioServico.editarUsuario
      ).toHaveBeenCalledWith("42", dados);

      expect(
        usuarioServico.editarUsuario
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("Alteração de status dos usuários", () => {
    test("Deve permitir ativação por administrador", async () => {
      usuarioServico.alterarStatusUsuario.mockResolvedValue({
        ...usuario,
        ativo: true,
      });

      const token = gerarToken();

      const resposta = await request(app)
        .patch("/usuarios/7/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ativo: true,
        });

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        mensagem: "Usuário ativado com sucesso!",
        usuario: {
          ...usuario,
          ativo: true,
        },
      });

      expect(
        usuarioServico.alterarStatusUsuario
      ).toHaveBeenCalledWith("7", true, 99);

      expect(
        usuarioServico.alterarStatusUsuario
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve permitir desativação por administrador", async () => {
      const token = gerarToken();

      const resposta = await request(app)
        .patch("/usuarios/7/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ativo: false,
        });

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        mensagem: "Usuário desativado com sucesso!",
        usuario: {
          ...usuario,
          ativo: false,
        },
      });

      expect(
        usuarioServico.alterarStatusUsuario
      ).toHaveBeenCalledWith("7", false, 99);
    });

    test("Deve retornar erro 400 ao tentar desativar a própria conta", async () => {
      usuarioServico.alterarStatusUsuario.mockRejectedValue(
        new Error("Você não pode desativar sua própria conta.")
      );

      const token = gerarToken();

      const resposta = await request(app)
        .patch("/usuarios/99/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ativo: false,
        });

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "Você não pode desativar sua própria conta.",
      });

      expect(
        usuarioServico.alterarStatusUsuario
      ).toHaveBeenCalledWith("99", false, 99);
    });

    test("Deve retornar erro 400 para status inválido", async () => {
      usuarioServico.alterarStatusUsuario.mockRejectedValue(
        new Error("O campo ativo deve ser verdadeiro ou falso.")
      );

      const token = gerarToken();

      const resposta = await request(app)
        .patch("/usuarios/7/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ativo: "false",
        });

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "O campo ativo deve ser verdadeiro ou falso.",
      });

      expect(
        usuarioServico.alterarStatusUsuario
      ).toHaveBeenCalledWith("7", "false", 99);
    });

    test("Deve retornar erro 400 para usuário inexistente", async () => {
      usuarioServico.alterarStatusUsuario.mockRejectedValue(
        new Error("Usuário não encontrado.")
      );

      const token = gerarToken();

      const resposta = await request(app)
        .patch("/usuarios/999/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ativo: false,
        });

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "Usuário não encontrado.",
      });

      expect(
        usuarioServico.alterarStatusUsuario
      ).toHaveBeenCalledWith("999", false, 99);
    });

    test("Deve encaminhar status ausente ao serviço para validação", async () => {
      usuarioServico.alterarStatusUsuario.mockRejectedValue(
        new Error("O campo ativo deve ser verdadeiro ou falso.")
      );

      const token = gerarToken();

      const resposta = await request(app)
        .patch("/usuarios/7/status")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "O campo ativo deve ser verdadeiro ou falso.",
      });

      expect(
        usuarioServico.alterarStatusUsuario
      ).toHaveBeenCalledWith("7", undefined, 99);
    });
  });
});