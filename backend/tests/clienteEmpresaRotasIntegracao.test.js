jest.mock("../src/servicos/clienteEmpresaServico", () => ({
  cadastrarClienteEmpresa: jest.fn(),
  listarClientesEmpresas: jest.fn(),
  editarClienteEmpresa: jest.fn(),
  excluirClienteEmpresa: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const clienteEmpresaServico = require("../src/servicos/clienteEmpresaServico");
const clienteEmpresaRotas = require("../src/rotas/clienteEmpresaRotas");

const app = express();

app.use(express.json());
app.use("/clientes", clienteEmpresaRotas);

describe("Integração das rotas de empresas clientes - Estrutec", () => {
  const segredoOriginal = process.env.JWT_SECRET;
  const segredoTeste = "estrutec-chave-isolada-para-testes-clientes";

  let cliente;

  const gerarToken = (perfil = "USUARIO") =>
    jwt.sign(
      {
        id: 99,
        nome: "Usuário Teste",
        email: "teste@estrutec.com",
        perfil,
      },
      segredoTeste
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

    cliente = {
      id: 7,
      razao_social: "Construtora Alfa Ltda.",
      nome_fantasia: "Construtora Alfa",
      cnpj: "12345678000195",
      email: "contato@alfa.com.br",
      telefone: "(47) 99999-9999",
      cidade: "Joinville",
      estado: "SC",
    };

    clienteEmpresaServico.cadastrarClienteEmpresa.mockResolvedValue(cliente);

    clienteEmpresaServico.listarClientesEmpresas.mockResolvedValue([
      cliente,
    ]);

    clienteEmpresaServico.editarClienteEmpresa.mockResolvedValue({
      ...cliente,
      razao_social: "Construtora Atualizada Ltda.",
    });

    clienteEmpresaServico.excluirClienteEmpresa.mockResolvedValue({
      mensagem: "Empresa cliente excluída com sucesso!",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Autenticação", () => {
    test.each([
      ["get", "/clientes"],
      ["post", "/clientes"],
      ["put", "/clientes/7"],
      ["delete", "/clientes/7"],
    ])(
      "Deve bloquear %s %s sem autenticação",
      async (metodo, caminho) => {
        const resposta = await request(app)[metodo](caminho);

        expect(resposta.status).toBe(401);

        expect(resposta.body).toEqual({
          erro: "Token não informado.",
        });
      }
    );

    test("Deve rejeitar formato de token inválido", async () => {
      const resposta = await request(app)
        .get("/clientes")
        .set("Authorization", "Token abc123");

      expect(resposta.status).toBe(401);

      expect(resposta.body).toEqual({
        erro: "Formato de token inválido.",
      });

      expect(
        clienteEmpresaServico.listarClientesEmpresas
      ).not.toHaveBeenCalled();
    });

    test("Deve rejeitar token JWT inválido", async () => {
      const resposta = await request(app)
        .get("/clientes")
        .set("Authorization", "Bearer token-invalido");

      expect(resposta.status).toBe(401);

      expect(resposta.body).toEqual({
        erro: "Token inválido ou expirado.",
      });

      expect(
        clienteEmpresaServico.listarClientesEmpresas
      ).not.toHaveBeenCalled();
    });
  });

  describe("Listagem de empresas", () => {
    test("Deve permitir listagem para usuário autenticado", async () => {
      const token = gerarToken("USUARIO");

      const resposta = await request(app)
        .get("/clientes")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        clientes: [cliente],
      });

      expect(
        clienteEmpresaServico.listarClientesEmpresas
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve permitir listagem para administrador", async () => {
      const token = gerarToken("ADMINISTRADOR");

      const resposta = await request(app)
        .get("/clientes")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(200);

      expect(resposta.body.clientes).toHaveLength(1);

      expect(resposta.body.clientes[0]).toEqual(cliente);
    });

    test("Deve retornar lista vazia quando não houver empresas", async () => {
      clienteEmpresaServico.listarClientesEmpresas.mockResolvedValue([]);

      const token = gerarToken();

      const resposta = await request(app)
        .get("/clientes")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        clientes: [],
      });
    });

    test("Deve retornar erro 500 quando a listagem falhar", async () => {
      const erroConsole = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      clienteEmpresaServico.listarClientesEmpresas.mockRejectedValue(
        new Error("Falha na consulta ao banco de dados")
      );

      const token = gerarToken();

      const resposta = await request(app)
        .get("/clientes")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(500);

      expect(resposta.body).toEqual({
        erro: "Não foi possível listar as empresas clientes.",
      });

      expect(erroConsole).toHaveBeenCalled();

      erroConsole.mockRestore();
    });
  });

  describe("Permissões administrativas", () => {
    test.each([
      ["post", "/clientes"],
      ["put", "/clientes/7"],
      ["delete", "/clientes/7"],
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
          clienteEmpresaServico.cadastrarClienteEmpresa
        ).not.toHaveBeenCalled();

        expect(
          clienteEmpresaServico.editarClienteEmpresa
        ).not.toHaveBeenCalled();

        expect(
          clienteEmpresaServico.excluirClienteEmpresa
        ).not.toHaveBeenCalled();
      }
    );
  });

  describe("Cadastro de empresas", () => {
    test("Deve permitir cadastro por administrador", async () => {
      const token = gerarToken("ADMINISTRADOR");

      const dados = {
        razao_social: "Construtora Alfa Ltda.",
        nome_fantasia: "Construtora Alfa",
        cnpj: "12.345.678/0001-95",
        email: "contato@alfa.com.br",
        cidade: "Joinville",
        estado: "SC",
      };

      const resposta = await request(app)
        .post("/clientes")
        .set("Authorization", `Bearer ${token}`)
        .send(dados);

      expect(resposta.status).toBe(201);

      expect(resposta.body).toEqual({
        mensagem: "Empresa cliente cadastrada com sucesso!",
        cliente,
      });

      expect(
        clienteEmpresaServico.cadastrarClienteEmpresa
      ).toHaveBeenCalledWith(dados);

      expect(
        clienteEmpresaServico.cadastrarClienteEmpresa
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar erro 400 quando o cadastro falhar", async () => {
      clienteEmpresaServico.cadastrarClienteEmpresa.mockRejectedValue(
        new Error("A razão social é obrigatória.")
      );

      const token = gerarToken("ADMINISTRADOR");

      const resposta = await request(app)
        .post("/clientes")
        .set("Authorization", `Bearer ${token}`)
        .send({
          razao_social: "",
        });

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "A razão social é obrigatória.",
      });
    });
  });

  describe("Edição de empresas", () => {
    test("Deve permitir edição por administrador", async () => {
      const token = gerarToken("ADMINISTRADOR");

      const dados = {
        razao_social: "Construtora Atualizada Ltda.",
        cidade: "Curitiba",
        estado: "PR",
      };

      const resposta = await request(app)
        .put("/clientes/7")
        .set("Authorization", `Bearer ${token}`)
        .send(dados);

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        mensagem: "Empresa cliente atualizada com sucesso!",
        cliente: {
          ...cliente,
          razao_social: "Construtora Atualizada Ltda.",
        },
      });

      expect(
        clienteEmpresaServico.editarClienteEmpresa
      ).toHaveBeenCalledWith("7", dados);

      expect(
        clienteEmpresaServico.editarClienteEmpresa
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar erro 400 quando a edição falhar", async () => {
      clienteEmpresaServico.editarClienteEmpresa.mockRejectedValue(
        new Error("Empresa cliente não encontrada.")
      );

      const token = gerarToken("ADMINISTRADOR");

      const resposta = await request(app)
        .put("/clientes/999")
        .set("Authorization", `Bearer ${token}`)
        .send({
          razao_social: "Empresa Inexistente",
        });

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "Empresa cliente não encontrada.",
      });

      expect(
        clienteEmpresaServico.editarClienteEmpresa
      ).toHaveBeenCalledWith(
        "999",
        {
          razao_social: "Empresa Inexistente",
        }
      );
    });
  });

  describe("Exclusão de empresas", () => {
    test("Deve permitir exclusão por administrador", async () => {
      const token = gerarToken("ADMINISTRADOR");

      const resposta = await request(app)
        .delete("/clientes/7")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(200);

      expect(resposta.body).toEqual({
        mensagem: "Empresa cliente excluída com sucesso!",
      });

      expect(
        clienteEmpresaServico.excluirClienteEmpresa
      ).toHaveBeenCalledWith("7");

      expect(
        clienteEmpresaServico.excluirClienteEmpresa
      ).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar erro 400 quando a exclusão falhar", async () => {
      clienteEmpresaServico.excluirClienteEmpresa.mockRejectedValue(
        new Error("Empresa cliente não encontrada.")
      );

      const token = gerarToken("ADMINISTRADOR");

      const resposta = await request(app)
        .delete("/clientes/999")
        .set("Authorization", `Bearer ${token}`);

      expect(resposta.status).toBe(400);

      expect(resposta.body).toEqual({
        erro: "Empresa cliente não encontrada.",
      });
    });
  });
});