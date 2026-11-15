jest.mock("../src/servicos/equipamentoServico", () => ({
  cadastrarEquipamento: jest.fn(),
  listarEquipamentos: jest.fn(),
  editarEquipamento: jest.fn(),
  alterarStatusEquipamento: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const equipamentoServico = require("../src/servicos/equipamentoServico");
const equipamentoRotas = require("../src/rotas/equipamentoRotas");

const app = express();

app.use(express.json());
app.use("/equipamentos", equipamentoRotas);

describe("Integração das rotas de equipamentos - Estrutec", () => {
  const segredoOriginal = process.env.JWT_SECRET;
  const segredoTeste = "estrutec-chave-isolada-testes-equipamentos";

  let equipamento;

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

    equipamento = {
      id: 7,
      nome: "Guindaste telescópico",
      descricao: "Equipamento para montagem de vigas",
      tipo_cobranca: "HORA",
      valor_padrao: 250,
      mobilizacao_padrao: 500,
      desmobilizacao_padrao: 300,
      ativo: true,
    };

    equipamentoServico.listarEquipamentos.mockResolvedValue([
      equipamento,
    ]);

    equipamentoServico.cadastrarEquipamento.mockResolvedValue(
      equipamento
    );

    equipamentoServico.editarEquipamento.mockResolvedValue({
      ...equipamento,
      nome: "Guindaste atualizado",
    });

    equipamentoServico.alterarStatusEquipamento.mockResolvedValue({
      ...equipamento,
      ativo: false,
    });
  });

  describe("Autenticação das rotas", () => {
    test.each([
      ["get", "/equipamentos"],
      ["post", "/equipamentos"],
      ["put", "/equipamentos/7"],
      ["patch", "/equipamentos/7/status"],
    ])(
      "Deve bloquear %s %s sem autenticação",
      async (metodo, caminho) => {
        const resposta = await request(app)[metodo](caminho);

        expect(resposta.status).toBe(401);

        expect(resposta.body).toEqual({
          erro: "Token não informado.",
        });

        expect(
          equipamentoServico.listarEquipamentos
        ).not.toHaveBeenCalled();

        expect(
          equipamentoServico.cadastrarEquipamento
        ).not.toHaveBeenCalled();

        expect(
          equipamentoServico.editarEquipamento
        ).not.toHaveBeenCalled();

        expect(
          equipamentoServico.alterarStatusEquipamento
        ).not.toHaveBeenCalled();
      }
    );

    test("Deve rejeitar formato de token inválido", async () => {
      const resposta = await request(app)
        .get("/equipamentos")
        .set("Authorization", "Token abc123");

      expect(resposta.status).toBe(401);

      expect(resposta.body).toEqual({
        erro: "Formato de token inválido.",
      });

      expect(
        equipamentoServico.listarEquipamentos
      ).not.toHaveBeenCalled();
    });

    test("Deve rejeitar JWT inválido", async () => {
      const resposta = await request(app)
        .get("/equipamentos")
        .set("Authorization", "Bearer token-invalido");

      expect(resposta.status).toBe(401);

      expect(resposta.body).toEqual({
        erro: "Token inválido ou expirado.",
      });

      expect(
        equipamentoServico.listarEquipamentos
      ).not.toHaveBeenCalled();
    });

    test("Deve rejeitar JWT expirado", async () => {
      const token = gerarToken("ADMINISTRADOR", {
        expiresIn: -1,
      });

      const resposta = await request(app)
        .get("/equipamentos")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(401);

      expect(resposta.body).toEqual({
        erro: "Token inválido ou expirado.",
      });

      expect(
        equipamentoServico.listarEquipamentos
      ).not.toHaveBeenCalled();
    });

    test("Deve rejeitar JWT com assinatura incorreta", async () => {
      const token = jwt.sign(
        {
          id: 99,
          perfil: "ADMINISTRADOR",
        },
        "segredo-incorreto"
      );

      const resposta = await request(app)
        .get("/equipamentos")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(401);

      expect(resposta.body).toEqual({
        erro: "Token inválido ou expirado.",
      });

      expect(
        equipamentoServico.listarEquipamentos
      ).not.toHaveBeenCalled();
    });
  });

  describe("Permissões administrativas", () => {
    test.each([
      ["post", "/equipamentos"],
      ["put", "/equipamentos/7"],
      ["patch", "/equipamentos/7/status"],
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
          equipamentoServico.cadastrarEquipamento
        ).not.toHaveBeenCalled();

        expect(
          equipamentoServico.editarEquipamento
        ).not.toHaveBeenCalled();

        expect(
          equipamentoServico.alterarStatusEquipamento
        ).not.toHaveBeenCalled();
      }
    );

    test("Deve rejeitar perfil administrador em letras minúsculas", async () => {
      const token = gerarToken("administrador");

      const resposta = await request(app)
        .post("/equipamentos")
        .set("Authorization", `Bearer ${token}`)
        .send({
          nome: "Guindaste",
        });

      expect(resposta.status).toBe(403);

      expect(resposta.body).toEqual({
        erro: "Acesso permitido somente para administradores.",
      });

      expect(
        equipamentoServico.cadastrarEquipamento
      ).not.toHaveBeenCalled();
    });
  });

  describe("Listagem de equipamentos", () => {
    test("Deve permitir listagem para usuário autenticado", async () => {
      const token = gerarToken("OPERADOR");

      const resposta = await request(app)
        .get("/equipamentos")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        equipamentos: [equipamento],
      });

      expect(
        equipamentoServico.listarEquipamentos
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve permitir listagem para administrador", async () => {
      const token = gerarToken("ADMINISTRADOR");

      const resposta = await request(app)
        .get("/equipamentos")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(200);

      expect(resposta.body.equipamentos).toHaveLength(1);

      expect(resposta.body.equipamentos[0]).toEqual(
        equipamento
      );

      expect(
        equipamentoServico.listarEquipamentos
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar lista vazia quando não houver equipamentos", async () => {
      equipamentoServico.listarEquipamentos.mockResolvedValue([]);

      const token = gerarToken("OPERADOR");

      const resposta = await request(app)
        .get("/equipamentos")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        equipamentos: [],
      });
    });

    test("Deve retornar erro 400 quando a listagem falhar", async () => {
      equipamentoServico.listarEquipamentos.mockRejectedValue(
        new Error("Falha ao listar equipamentos")
      );

      const token = gerarToken();

      const resposta = await request(app)
        .get("/equipamentos")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "Falha ao listar equipamentos",
      });

      expect(
        equipamentoServico.listarEquipamentos
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("Cadastro de equipamentos", () => {
    test("Deve permitir cadastro por administrador", async () => {
      const token = gerarToken();

      const dados = {
        nome: "Guindaste telescópico",
        descricao: "Equipamento para montagem de vigas",
        tipo_cobranca: "HORA",
        valor_padrao: 250,
        mobilizacao_padrao: 500,
        desmobilizacao_padrao: 300,
      };

      const resposta = await request(app)
        .post("/equipamentos")
        .set("Authorization", `Bearer ${token}`)
        .send(dados);

      expect(resposta.status).toBe(201);

      expect(resposta.body).toEqual({
        mensagem: "Equipamento cadastrado com sucesso.",
        equipamento,
      });

      expect(
        equipamentoServico.cadastrarEquipamento
      ).toHaveBeenCalledWith(dados);

      expect(
        equipamentoServico.cadastrarEquipamento
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar erro 400 quando o cadastro falhar", async () => {
      equipamentoServico.cadastrarEquipamento.mockRejectedValue(
        new Error("Informe o nome do equipamento.")
      );

      const token = gerarToken();

      const resposta = await request(app)
        .post("/equipamentos")
        .set("Authorization", `Bearer ${token}`)
        .send({
          nome: "",
        });

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "Informe o nome do equipamento.",
      });

      expect(
        equipamentoServico.cadastrarEquipamento
      ).toHaveBeenCalledWith({
        nome: "",
      });
    });

    test("Deve encaminhar o corpo da requisição ao serviço", async () => {
      const token = gerarToken();

      const dados = {
        nome: "Caminhão Munck",
        tipo_cobranca: "DIA",
        valor_padrao: 1200,
      };

      const resposta = await request(app)
        .post("/equipamentos")
        .set("Authorization", `Bearer ${token}`)
        .send(dados);

      expect(resposta.status).toBe(201);

      expect(
        equipamentoServico.cadastrarEquipamento
      ).toHaveBeenCalledWith(dados);

      expect(
        equipamentoServico.cadastrarEquipamento
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edição de equipamentos", () => {
    test("Deve permitir edição por administrador", async () => {
      const token = gerarToken();

      const dados = {
        nome: "Guindaste atualizado",
        descricao: "Equipamento revisado",
        tipo_cobranca: "DIA",
        valor_padrao: 1500,
      };

      const resposta = await request(app)
        .put("/equipamentos/7")
        .set("Authorization", `Bearer ${token}`)
        .send(dados);

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        mensagem: "Equipamento atualizado com sucesso.",
        equipamento: {
          ...equipamento,
          nome: "Guindaste atualizado",
        },
      });

      expect(
        equipamentoServico.editarEquipamento
      ).toHaveBeenCalledWith("7", dados);

      expect(
        equipamentoServico.editarEquipamento
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar erro 400 quando a edição falhar", async () => {
      equipamentoServico.editarEquipamento.mockRejectedValue(
        new Error("Equipamento não encontrado.")
      );

      const token = gerarToken();

      const dados = {
        nome: "Equipamento inexistente",
      };

      const resposta = await request(app)
        .put("/equipamentos/999")
        .set("Authorization", `Bearer ${token}`)
        .send(dados);

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "Equipamento não encontrado.",
      });

      expect(
        equipamentoServico.editarEquipamento
      ).toHaveBeenCalledWith("999", dados);
    });
  });

  describe("Alteração de status dos equipamentos", () => {
    test("Deve permitir ativação por administrador", async () => {
      equipamentoServico.alterarStatusEquipamento.mockResolvedValue({
        ...equipamento,
        ativo: true,
      });

      const token = gerarToken();

      const resposta = await request(app)
        .patch("/equipamentos/7/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ativo: true,
        });

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        mensagem: "Equipamento ativado com sucesso.",
        equipamento: {
          ...equipamento,
          ativo: true,
        },
      });

      expect(
        equipamentoServico.alterarStatusEquipamento
      ).toHaveBeenCalledWith("7", true);

      expect(
        equipamentoServico.alterarStatusEquipamento
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve permitir desativação por administrador", async () => {
      const token = gerarToken();

      const resposta = await request(app)
        .patch("/equipamentos/7/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ativo: false,
        });

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        mensagem: "Equipamento desativado com sucesso.",
        equipamento: {
          ...equipamento,
          ativo: false,
        },
      });

      expect(
        equipamentoServico.alterarStatusEquipamento
      ).toHaveBeenCalledWith("7", false);
    });

    test("Deve retornar erro 400 quando a alteração de status falhar", async () => {
      equipamentoServico.alterarStatusEquipamento.mockRejectedValue(
        new Error("Equipamento não encontrado.")
      );

      const token = gerarToken();

      const resposta = await request(app)
        .patch("/equipamentos/999/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ativo: false,
        });

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "Equipamento não encontrado.",
      });

      expect(
        equipamentoServico.alterarStatusEquipamento
      ).toHaveBeenCalledWith("999", false);
    });
  });
});