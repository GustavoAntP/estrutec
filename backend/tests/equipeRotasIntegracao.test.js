jest.mock("../src/servicos/equipeServico", () => ({
  cadastrarEquipe: jest.fn(),
  listarEquipes: jest.fn(),
  editarEquipe: jest.fn(),
  alterarStatusEquipe: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const equipeServico = require("../src/servicos/equipeServico");
const equipeRotas = require("../src/rotas/equipeRotas");

const app = express();

app.use(express.json());
app.use("/equipes", equipeRotas);

describe("Integração das rotas de equipes - Estrutec", () => {
  const segredoOriginal = process.env.JWT_SECRET;
  const segredoTeste = "estrutec-chave-isolada-testes-equipes";

  let equipe;

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

    equipe = {
      id: 7,
      nome: "Equipe de montagem",
      descricao: "Profissionais especializados",
      quantidade_padrao: 3,
      custo_diario_padrao: 180.75,
      ativo: true,
    };

    equipeServico.listarEquipes.mockResolvedValue([
      equipe,
    ]);

    equipeServico.cadastrarEquipe.mockResolvedValue(
      equipe
    );

    equipeServico.editarEquipe.mockResolvedValue({
      ...equipe,
      nome: "Equipe atualizada",
    });

    equipeServico.alterarStatusEquipe.mockResolvedValue({
      ...equipe,
      ativo: false,
    });
  });

  describe("Autenticação das rotas", () => {
    test.each([
      ["get", "/equipes"],
      ["post", "/equipes"],
      ["put", "/equipes/7"],
      ["patch", "/equipes/7/status"],
    ])(
      "Deve bloquear %s %s sem autenticação",
      async (metodo, caminho) => {
        const resposta = await request(app)[metodo](caminho);

        expect(resposta.status).toBe(401);

        expect(resposta.body).toEqual({
          erro: "Token não informado.",
        });

        expect(
          equipeServico.listarEquipes
        ).not.toHaveBeenCalled();

        expect(
          equipeServico.cadastrarEquipe
        ).not.toHaveBeenCalled();

        expect(
          equipeServico.editarEquipe
        ).not.toHaveBeenCalled();

        expect(
          equipeServico.alterarStatusEquipe
        ).not.toHaveBeenCalled();
      }
    );

    test.each([
      ["prefixo incorreto", "Token abc123"],
      ["Bearer sem token", "Bearer"],
      ["prefixo minúsculo", "bearer abc123"],
    ])(
      "Deve rejeitar autorização com %s",
      async (_, autorizacao) => {
        const resposta = await request(app)
          .get("/equipes")
          .set("Authorization", autorizacao);

        expect(resposta.status).toBe(401);

        expect(resposta.body).toEqual({
          erro: "Formato de token inválido.",
        });

        expect(
          equipeServico.listarEquipes
        ).not.toHaveBeenCalled();
      }
    );

    test("Deve rejeitar JWT inválido", async () => {
      const resposta = await request(app)
        .get("/equipes")
        .set("Authorization", "Bearer token-invalido");

      expect(resposta.status).toBe(401);

      expect(resposta.body).toEqual({
        erro: "Token inválido ou expirado.",
      });

      expect(
        equipeServico.listarEquipes
      ).not.toHaveBeenCalled();
    });

    test("Deve rejeitar JWT expirado", async () => {
      const token = gerarToken("ADMINISTRADOR", {
        expiresIn: -1,
      });

      const resposta = await request(app)
        .get("/equipes")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(401);

      expect(resposta.body).toEqual({
        erro: "Token inválido ou expirado.",
      });

      expect(
        equipeServico.listarEquipes
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
        .get("/equipes")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(401);

      expect(resposta.body).toEqual({
        erro: "Token inválido ou expirado.",
      });

      expect(
        equipeServico.listarEquipes
      ).not.toHaveBeenCalled();
    });
  });

  describe("Permissões administrativas", () => {
    test.each([
      ["post", "/equipes"],
      ["put", "/equipes/7"],
      ["patch", "/equipes/7/status"],
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
          equipeServico.cadastrarEquipe
        ).not.toHaveBeenCalled();

        expect(
          equipeServico.editarEquipe
        ).not.toHaveBeenCalled();

        expect(
          equipeServico.alterarStatusEquipe
        ).not.toHaveBeenCalled();
      }
    );

    test("Deve rejeitar perfil administrador em letras minúsculas", async () => {
      const token = gerarToken("administrador");

      const resposta = await request(app)
        .post("/equipes")
        .set("Authorization", `Bearer ${token}`)
        .send({
          nome: "Equipe teste",
        });

      expect(resposta.status).toBe(403);

      expect(resposta.body).toEqual({
        erro: "Acesso permitido somente para administradores.",
      });

      expect(
        equipeServico.cadastrarEquipe
      ).not.toHaveBeenCalled();
    });

    test("Deve rejeitar cadastro com token sem perfil administrativo", async () => {
      const token = jwt.sign(
        {
          id: 99,
          nome: "Usuário sem perfil",
        },
        segredoTeste
      );

      const resposta = await request(app)
        .post("/equipes")
        .set("Authorization", `Bearer ${token}`)
        .send({
          nome: "Equipe teste",
        });

      expect(resposta.status).toBe(403);

      expect(resposta.body).toEqual({
        erro: "Acesso permitido somente para administradores.",
      });

      expect(
        equipeServico.cadastrarEquipe
      ).not.toHaveBeenCalled();
    });
  });

  describe("Listagem de equipes", () => {
    test("Deve permitir listagem para operador autenticado", async () => {
      const token = gerarToken("OPERADOR");

      const resposta = await request(app)
        .get("/equipes")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        equipes: [equipe],
      });

      expect(
        equipeServico.listarEquipes
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve permitir listagem para administrador", async () => {
      const token = gerarToken("ADMINISTRADOR");

      const resposta = await request(app)
        .get("/equipes")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        equipes: [equipe],
      });

      expect(
        equipeServico.listarEquipes
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar lista vazia quando não houver equipes", async () => {
      equipeServico.listarEquipes.mockResolvedValue([]);

      const token = gerarToken("OPERADOR");

      const resposta = await request(app)
        .get("/equipes")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        equipes: [],
      });

      expect(
        equipeServico.listarEquipes
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar erro 400 quando a listagem falhar", async () => {
      equipeServico.listarEquipes.mockRejectedValue(
        new Error("Falha ao listar equipes")
      );

      const token = gerarToken();

      const resposta = await request(app)
        .get("/equipes")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "Falha ao listar equipes",
      });

      expect(
        equipeServico.listarEquipes
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("Cadastro de equipes", () => {
    test("Deve permitir cadastro por administrador", async () => {
      const token = gerarToken();

      const dados = {
        nome: "Equipe de montagem",
        descricao: "Profissionais especializados",
        quantidade_padrao: 3,
        custo_diario_padrao: 180.75,
      };

      const resposta = await request(app)
        .post("/equipes")
        .set("Authorization", `Bearer ${token}`)
        .send(dados);

      expect(resposta.status).toBe(201);

      expect(resposta.body).toEqual({
        mensagem: "Equipe cadastrada com sucesso.",
        equipe,
      });

      expect(
        equipeServico.cadastrarEquipe
      ).toHaveBeenCalledWith(dados);

      expect(
        equipeServico.cadastrarEquipe
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar erro 400 quando o cadastro falhar", async () => {
      equipeServico.cadastrarEquipe.mockRejectedValue(
        new Error("Informe o nome da equipe.")
      );

      const token = gerarToken();

      const resposta = await request(app)
        .post("/equipes")
        .set("Authorization", `Bearer ${token}`)
        .send({
          nome: "",
        });

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "Informe o nome da equipe.",
      });

      expect(
        equipeServico.cadastrarEquipe
      ).toHaveBeenCalledWith({
        nome: "",
      });
    });

    test("Deve encaminhar o corpo da requisição ao serviço", async () => {
      const token = gerarToken();

      const dados = {
        nome: "Equipe de instalação",
        quantidade_padrao: 5,
        custo_diario_padrao: 250,
      };

      const resposta = await request(app)
        .post("/equipes")
        .set("Authorization", `Bearer ${token}`)
        .send(dados);

      expect(resposta.status).toBe(201);

      expect(
        equipeServico.cadastrarEquipe
      ).toHaveBeenCalledWith(dados);

      expect(
        equipeServico.cadastrarEquipe
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edição de equipes", () => {
    test("Deve permitir edição por administrador", async () => {
      const token = gerarToken();

      const dados = {
        nome: "Equipe atualizada",
        descricao: "Equipe revisada",
        quantidade_padrao: 4,
        custo_diario_padrao: 200,
      };

      const resposta = await request(app)
        .put("/equipes/7")
        .set("Authorization", `Bearer ${token}`)
        .send(dados);

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        mensagem: "Equipe atualizada com sucesso.",
        equipe: {
          ...equipe,
          nome: "Equipe atualizada",
        },
      });

      expect(
        equipeServico.editarEquipe
      ).toHaveBeenCalledWith("7", dados);

      expect(
        equipeServico.editarEquipe
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar erro 400 quando a edição falhar", async () => {
      equipeServico.editarEquipe.mockRejectedValue(
        new Error("Equipe não encontrada.")
      );

      const token = gerarToken();

      const dados = {
        nome: "Equipe inexistente",
      };

      const resposta = await request(app)
        .put("/equipes/999")
        .set("Authorization", `Bearer ${token}`)
        .send(dados);

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "Equipe não encontrada.",
      });

      expect(
        equipeServico.editarEquipe
      ).toHaveBeenCalledWith("999", dados);
    });

    test("Deve encaminhar identificador e dados de edição", async () => {
      const token = gerarToken();

      const dados = {
        nome: "Equipe de montagem revisada",
        quantidade_padrao: 6,
      };

      const resposta = await request(app)
        .put("/equipes/42")
        .set("Authorization", `Bearer ${token}`)
        .send(dados);

      expect(resposta.status).toBe(200);

      expect(
        equipeServico.editarEquipe
      ).toHaveBeenCalledWith("42", dados);

      expect(
        equipeServico.editarEquipe
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("Alteração de status das equipes", () => {
    test("Deve permitir ativação por administrador", async () => {
      equipeServico.alterarStatusEquipe.mockResolvedValue({
        ...equipe,
        ativo: true,
      });

      const token = gerarToken();

      const resposta = await request(app)
        .patch("/equipes/7/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ativo: true,
        });

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        mensagem: "Equipe ativada com sucesso.",
        equipe: {
          ...equipe,
          ativo: true,
        },
      });

      expect(
        equipeServico.alterarStatusEquipe
      ).toHaveBeenCalledWith("7", true);

      expect(
        equipeServico.alterarStatusEquipe
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve permitir desativação por administrador", async () => {
      const token = gerarToken();

      const resposta = await request(app)
        .patch("/equipes/7/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ativo: false,
        });

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        mensagem: "Equipe desativada com sucesso.",
        equipe: {
          ...equipe,
          ativo: false,
        },
      });

      expect(
        equipeServico.alterarStatusEquipe
      ).toHaveBeenCalledWith("7", false);
    });

    test("Deve retornar erro 400 quando a alteração de status falhar", async () => {
      equipeServico.alterarStatusEquipe.mockRejectedValue(
        new Error("Equipe não encontrada.")
      );

      const token = gerarToken();

      const resposta = await request(app)
        .patch("/equipes/999/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ativo: false,
        });

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "Equipe não encontrada.",
      });

      expect(
        equipeServico.alterarStatusEquipe
      ).toHaveBeenCalledWith("999", false);
    });

    test("Deve encaminhar status ausente ao serviço", async () => {
      const token = gerarToken();

      const resposta = await request(app)
        .patch("/equipes/7/status")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(resposta.status).toBe(200);

      expect(
        equipeServico.alterarStatusEquipe
      ).toHaveBeenCalledWith("7", undefined);

      expect(
        equipeServico.alterarStatusEquipe
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve encaminhar status em texto sem conversão no controlador", async () => {
      const token = gerarToken();

      const resposta = await request(app)
        .patch("/equipes/7/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ativo: "false",
        });

      expect(resposta.status).toBe(200);

      expect(
        equipeServico.alterarStatusEquipe
      ).toHaveBeenCalledWith("7", "false");

      expect(
        equipeServico.alterarStatusEquipe
      ).toHaveBeenCalledTimes(1);
    });
  });
});