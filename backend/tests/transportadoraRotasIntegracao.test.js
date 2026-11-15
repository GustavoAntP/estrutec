jest.mock("../src/servicos/transportadoraServico", () => ({
  cadastrarTransportadora: jest.fn(),
  listarTransportadoras: jest.fn(),
  editarTransportadora: jest.fn(),
  alterarStatusTransportadora: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const transportadoraServico = require("../src/servicos/transportadoraServico");
const transportadoraRotas = require("../src/rotas/transportadoraRotas");

const app = express();

app.use(express.json());
app.use("/transportadoras", transportadoraRotas);

describe("Integração das rotas de transportadoras - Estrutec", () => {
  const segredoOriginal = process.env.JWT_SECRET;
  const segredoTeste = "estrutec-chave-isolada-transportadoras";

  let transportadora;

  const gerarToken = (perfil = "USUARIO", opcoes = {}) =>
    jwt.sign(
      {
        id: 99,
        nome: "Usuário Teste",
        email: "teste@estrutec.com",
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

    transportadora = {
      id: 7,
      razao_social: "Transportadora Alfa Ltda.",
      nome_fantasia: "Transportes Alfa",
      cnpj: "12345678000195",
      email: "contato@alfa.com.br",
      telefone: "(47) 99999-9999",
      cidade: "Joinville",
      estado: "SC",
      observacoes: "Transporte de pré-moldados",
      ativo: true,
    };

    transportadoraServico.listarTransportadoras.mockResolvedValue([
      transportadora,
    ]);

    transportadoraServico.cadastrarTransportadora.mockResolvedValue(
      transportadora
    );

    transportadoraServico.editarTransportadora.mockResolvedValue({
      ...transportadora,
      razao_social: "Transportadora Atualizada Ltda.",
    });

    transportadoraServico.alterarStatusTransportadora.mockResolvedValue({
      ...transportadora,
      ativo: false,
    });
  });

  describe("Autenticação", () => {
    test.each([
      ["get", "/transportadoras"],
      ["post", "/transportadoras"],
      ["put", "/transportadoras/7"],
      ["patch", "/transportadoras/7/status"],
    ])(
      "Deve bloquear %s %s sem autenticação",
      async (metodo, caminho) => {
        const resposta = await request(app)[metodo](caminho);

        expect(resposta.status).toBe(401);

        expect(resposta.body).toEqual({
          erro: "Token não informado.",
        });

        expect(
          transportadoraServico.listarTransportadoras
        ).not.toHaveBeenCalled();

        expect(
          transportadoraServico.cadastrarTransportadora
        ).not.toHaveBeenCalled();

        expect(
          transportadoraServico.editarTransportadora
        ).not.toHaveBeenCalled();

        expect(
          transportadoraServico.alterarStatusTransportadora
        ).not.toHaveBeenCalled();
      }
    );

    test("Deve rejeitar formato de token inválido", async () => {
      const resposta = await request(app)
        .get("/transportadoras")
        .set("Authorization", "Token abc123");

      expect(resposta.status).toBe(401);

      expect(resposta.body).toEqual({
        erro: "Formato de token inválido.",
      });
    });

    test("Deve rejeitar token JWT inválido", async () => {
      const resposta = await request(app)
        .get("/transportadoras")
        .set("Authorization", "Bearer token-invalido");

      expect(resposta.status).toBe(401);

      expect(resposta.body).toEqual({
        erro: "Token inválido ou expirado.",
      });

      expect(
        transportadoraServico.listarTransportadoras
      ).not.toHaveBeenCalled();
    });

    test("Deve rejeitar token JWT expirado", async () => {
      const token = gerarToken("USUARIO", {
        expiresIn: -1,
      });

      const resposta = await request(app)
        .get("/transportadoras")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(401);

      expect(resposta.body).toEqual({
        erro: "Token inválido ou expirado.",
      });

      expect(
        transportadoraServico.listarTransportadoras
      ).not.toHaveBeenCalled();
    });
  });

  describe("Permissões administrativas", () => {
    test.each([
      ["post", "/transportadoras"],
      ["put", "/transportadoras/7"],
      ["patch", "/transportadoras/7/status"],
    ])(
      "Deve impedir usuário comum de executar %s %s",
      async (metodo, caminho) => {
        const token = gerarToken("USUARIO");

        const resposta = await request(app)
          [metodo](caminho)
          .set("Authorization", `Bearer ${token}`);

        expect(resposta.status).toBe(403);

        expect(resposta.body).toEqual({
          erro: "Acesso permitido somente para administradores.",
        });

        expect(
          transportadoraServico.cadastrarTransportadora
        ).not.toHaveBeenCalled();

        expect(
          transportadoraServico.editarTransportadora
        ).not.toHaveBeenCalled();

        expect(
          transportadoraServico.alterarStatusTransportadora
        ).not.toHaveBeenCalled();
      }
    );

    test("Deve exigir o perfil ADMINISTRADOR", async () => {
      const token = gerarToken("administrador");

      const resposta = await request(app)
        .post("/transportadoras")
        .set("Authorization", `Bearer ${token}`)
        .send({
          razao_social: "Transportadora Teste",
        });

      expect(resposta.status).toBe(403);

      expect(resposta.body).toEqual({
        erro: "Acesso permitido somente para administradores.",
      });

      expect(
        transportadoraServico.cadastrarTransportadora
      ).not.toHaveBeenCalled();
    });
  });

  describe("Listagem de transportadoras", () => {
    test("Deve permitir listagem para usuário autenticado", async () => {
      const token = gerarToken("USUARIO");

      const resposta = await request(app)
        .get("/transportadoras")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        transportadoras: [transportadora],
      });

      expect(
        transportadoraServico.listarTransportadoras
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve permitir listagem para administrador", async () => {
      const token = gerarToken("ADMINISTRADOR");

      const resposta = await request(app)
        .get("/transportadoras")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(200);

      expect(resposta.body.transportadoras).toHaveLength(1);

      expect(resposta.body.transportadoras[0]).toEqual(
        transportadora
      );
    });

    test("Deve retornar lista vazia quando não houver transportadoras", async () => {
      transportadoraServico.listarTransportadoras.mockResolvedValue([]);

      const token = gerarToken();

      const resposta = await request(app)
        .get("/transportadoras")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        transportadoras: [],
      });
    });

    test("Deve retornar erro 400 quando a listagem falhar", async () => {
      transportadoraServico.listarTransportadoras.mockRejectedValue(
        new Error("Falha ao consultar transportadoras")
      );

      const token = gerarToken();

      const resposta = await request(app)
        .get("/transportadoras")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "Falha ao consultar transportadoras",
      });
    });
  });

  describe("Cadastro de transportadoras", () => {
    test("Deve permitir cadastro por administrador", async () => {
      const token = gerarToken("ADMINISTRADOR");

      const dados = {
        razao_social: "Transportadora Alfa Ltda.",
        nome_fantasia: "Transportes Alfa",
        cnpj: "12.345.678/0001-95",
        email: "contato@alfa.com.br",
        telefone: "(47) 99999-9999",
        cidade: "Joinville",
        estado: "SC",
        observacoes: "Transporte de pré-moldados",
      };

      const resposta = await request(app)
        .post("/transportadoras")
        .set("Authorization", `Bearer ${token}`)
        .send(dados);

      expect(resposta.status).toBe(201);

      expect(resposta.body).toEqual({
        mensagem: "Transportadora cadastrada com sucesso.",
        transportadora,
      });

      expect(
        transportadoraServico.cadastrarTransportadora
      ).toHaveBeenCalledWith(dados);

      expect(
        transportadoraServico.cadastrarTransportadora
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar erro 400 quando o cadastro falhar", async () => {
      transportadoraServico.cadastrarTransportadora.mockRejectedValue(
        new Error("Informe a razão social da transportadora.")
      );

      const token = gerarToken("ADMINISTRADOR");

      const resposta = await request(app)
        .post("/transportadoras")
        .set("Authorization", `Bearer ${token}`)
        .send({
          razao_social: "",
        });

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "Informe a razão social da transportadora.",
      });
    });

    test("Deve encaminhar os dados recebidos ao serviço", async () => {
      const token = gerarToken("ADMINISTRADOR");

      const resposta = await request(app)
        .post("/transportadoras")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(resposta.status).toBe(201);

      expect(
        transportadoraServico.cadastrarTransportadora
      ).toHaveBeenCalledWith({});

      expect(
        transportadoraServico.cadastrarTransportadora
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edição de transportadoras", () => {
    test("Deve permitir edição por administrador", async () => {
      const token = gerarToken("ADMINISTRADOR");

      const dados = {
        razao_social: "Transportadora Atualizada Ltda.",
        cidade: "Curitiba",
        estado: "PR",
      };

      const resposta = await request(app)
        .put("/transportadoras/7")
        .set("Authorization", `Bearer ${token}`)
        .send(dados);

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        mensagem: "Transportadora atualizada com sucesso.",
        transportadora: {
          ...transportadora,
          razao_social: "Transportadora Atualizada Ltda.",
        },
      });

      expect(
        transportadoraServico.editarTransportadora
      ).toHaveBeenCalledWith("7", dados);

      expect(
        transportadoraServico.editarTransportadora
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar erro 400 quando a edição falhar", async () => {
      transportadoraServico.editarTransportadora.mockRejectedValue(
        new Error("Transportadora não encontrada.")
      );

      const token = gerarToken("ADMINISTRADOR");

      const resposta = await request(app)
        .put("/transportadoras/999")
        .set("Authorization", `Bearer ${token}`)
        .send({
          razao_social: "Transportadora Inexistente",
        });

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "Transportadora não encontrada.",
      });

      expect(
        transportadoraServico.editarTransportadora
      ).toHaveBeenCalledWith(
        "999",
        {
          razao_social: "Transportadora Inexistente",
        }
      );
    });
  });

  describe("Alteração de status", () => {
    test("Deve permitir ativação por administrador", async () => {
      transportadoraServico.alterarStatusTransportadora.mockResolvedValue({
        ...transportadora,
        ativo: true,
      });

      const token = gerarToken("ADMINISTRADOR");

      const resposta = await request(app)
        .patch("/transportadoras/7/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ativo: true,
        });

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        mensagem: "Transportadora ativada com sucesso.",
        transportadora: {
          ...transportadora,
          ativo: true,
        },
      });

      expect(
        transportadoraServico.alterarStatusTransportadora
      ).toHaveBeenCalledWith("7", true);

      expect(
        transportadoraServico.alterarStatusTransportadora
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve permitir desativação por administrador", async () => {
      const token = gerarToken("ADMINISTRADOR");

      const resposta = await request(app)
        .patch("/transportadoras/7/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ativo: false,
        });

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        mensagem: "Transportadora desativada com sucesso.",
        transportadora: {
          ...transportadora,
          ativo: false,
        },
      });

      expect(
        transportadoraServico.alterarStatusTransportadora
      ).toHaveBeenCalledWith("7", false);
    });

    test("Deve retornar erro 400 quando a alteração de status falhar", async () => {
      transportadoraServico.alterarStatusTransportadora.mockRejectedValue(
        new Error("Transportadora não encontrada.")
      );

      const token = gerarToken("ADMINISTRADOR");

      const resposta = await request(app)
        .patch("/transportadoras/999/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ativo: false,
        });

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "Transportadora não encontrada.",
      });

      expect(
        transportadoraServico.alterarStatusTransportadora
      ).toHaveBeenCalledWith("999", false);
    });
  });
});