jest.mock("../src/modelos/Projeto", () => ({
  findOne: jest.fn(),
}));

jest.mock("../src/servicos/projetoServico", () => ({
  cadastrarProjeto: jest.fn(),
  listarProjetos: jest.fn(),
  buscarProjetoPorId: jest.fn(),
  atualizarProjeto: jest.fn(),
  excluirProjeto: jest.fn(),
  reabrirProjeto: jest.fn(),
}));

jest.mock("../src/servicos/logisticaPropriaServico", () => ({
  salvarLogisticaPropria: jest.fn(),
  buscarLogisticaPropria: jest.fn(),
  calcularCustoFreteProprio: jest.fn(),
  sugerirQuantidadeViagens: jest.fn(),
  aplicarSugestaoViagens: jest.fn(),
}));

jest.mock("../src/controladores/planilhaControlador", () => ({
  importar: jest.fn(),
}));

jest.mock("../src/controladores/elementoProjetoControlador", () => ({
  confirmarImportacao: jest.fn(),
  listar: jest.fn(),
  atualizar: jest.fn(),
}));

jest.mock("../src/controladores/fabricacaoControlador", () => ({
  calcularVolumes: jest.fn(),
  calcularMateriais: jest.fn(),
  calcularCustos: jest.fn(),
  confirmar: jest.fn(),
}));

jest.mock("../src/controladores/configuracaoFabricacaoControlador", () => ({
  buscar: jest.fn(),
  salvar: jest.fn(),
}));

jest.mock("../src/controladores/precoFabricacaoControlador", () => ({
  buscar: jest.fn(),
  salvar: jest.fn(),
}));

jest.mock("../src/controladores/logisticaControlador", () => ({
  buscar: jest.fn(),
  salvar: jest.fn(),
  calcularCusto: jest.fn(),
  confirmar: jest.fn(),
}));

jest.mock("../src/controladores/logisticaTerceirizadaControlador", () => ({
  buscar: jest.fn(),
  salvar: jest.fn(),
}));

jest.mock("../src/controladores/montagemControlador", () => ({
  buscar: jest.fn(),
  salvar: jest.fn(),
  calcularCustos: jest.fn(),
  confirmar: jest.fn(),
}));

jest.mock("../src/controladores/equipamentoMontagemControlador", () => ({
  listar: jest.fn(),
  cadastrar: jest.fn(),
  atualizar: jest.fn(),
  excluir: jest.fn(),
}));

jest.mock("../src/controladores/equipeMontagemControlador", () => ({
  listar: jest.fn(),
  cadastrar: jest.fn(),
  atualizar: jest.fn(),
  excluir: jest.fn(),
}));

jest.mock("../src/controladores/resumoFinanceiroControlador", () => ({
  calcular: jest.fn(),
  finalizar: jest.fn(),
}));

jest.mock("../src/controladores/relatorioControlador", () => ({
  gerarFinal: jest.fn(),
}));

jest.mock("../src/middlewares/uploadPlanilhaMiddleware", () => ({
  single: jest.fn(() => (req, res, next) => next()),
}));

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const Projeto = require("../src/modelos/Projeto");
const projetoServico = require("../src/servicos/projetoServico");
const logisticaPropriaServico = require(
  "../src/servicos/logisticaPropriaServico"
);

const projetoRotas = require("../src/rotas/projetoRotas");

const app = express();

app.use(express.json());
app.use("/projetos", projetoRotas);

describe("Integração das rotas de projetos - Estrutec", () => {
  let token;
  let projeto;

  const segredoAnterior = process.env.JWT_SECRET;
  const segredoTeste = "estrutec-chave-de-testes-http-isolada";

  beforeAll(() => {
    process.env.JWT_SECRET = segredoTeste;
  });

  afterAll(() => {
    if (segredoAnterior === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = segredoAnterior;
    }
  });

  beforeEach(() => {
    jest.resetAllMocks();

    token = jwt.sign(
      {
        id: 99,
        nome: "Usuario Teste",
        email: "teste@estrutec.com",
        perfil: "USUARIO",
      },
      segredoTeste
    );

    projeto = {
      id: 7,
      codigo: "EST-007",
      nome: "Projeto de Vigas",
      usuario_id: 99,
      status: "EM_ANDAMENTO",
    };

    Projeto.findOne.mockResolvedValue(projeto);

    projetoServico.listarProjetos.mockResolvedValue([projeto]);
    projetoServico.buscarProjetoPorId.mockResolvedValue(projeto);
    projetoServico.cadastrarProjeto.mockResolvedValue(projeto);

    projetoServico.atualizarProjeto.mockResolvedValue({
      ...projeto,
      nome: "Projeto Atualizado",
    });

    projetoServico.excluirProjeto.mockResolvedValue(true);

    logisticaPropriaServico.aplicarSugestaoViagens.mockResolvedValue({
      quantidadeAnterior: 2,
      quantidadeAtual: 3,
    });
  });

  test.each([
    ["GET", "/projetos"],
    ["GET", "/projetos/7"],
    ["POST", "/projetos"],
    ["PUT", "/projetos/7"],
    ["DELETE", "/projetos/7"],
    [
      "POST",
      "/projetos/7/logistica/propria/aplicar-sugestao-viagens",
    ],
  ])(
    "Deve bloquear %s %s sem autenticação",
    async (metodo, caminho) => {
      const resposta = await request(app)[metodo.toLowerCase()](
        caminho
      );

      expect(resposta.status).toBe(401);

      expect(resposta.body).toEqual({
        erro: "Token não informado.",
      });
    }
  );

  test("Deve rejeitar formato de token inválido", async () => {
    const resposta = await request(app)
      .get("/projetos")
      .set("Authorization", "Token abc123");

    expect(resposta.status).toBe(401);

    expect(resposta.body).toEqual({
      erro: "Formato de token inválido.",
    });
  });

  test("Deve rejeitar token JWT inválido", async () => {
    const resposta = await request(app)
      .get("/projetos")
      .set("Authorization", "Bearer token-invalido");

    expect(resposta.status).toBe(401);

    expect(resposta.body).toEqual({
      erro: "Token inválido ou expirado.",
    });
  });

  test("Deve listar projetos com autenticação válida", async () => {
    const resposta = await request(app)
      .get("/projetos")
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);

    expect(resposta.body).toEqual({
      projetos: [projeto],
    });

    expect(projetoServico.listarProjetos).toHaveBeenCalledWith(
      99,
      {
        busca: undefined,
        clienteEmpresaId: undefined,
        status: undefined,
      }
    );
  });

  test("Deve atualizar um projeto com autenticação válida", async () => {
    const resposta = await request(app)
      .put("/projetos/7")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nome: "Projeto Atualizado",
      });

    expect(resposta.status).toBe(200);

    expect(resposta.body.projeto.nome).toBe(
      "Projeto Atualizado"
    );

    expect(Projeto.findOne).toHaveBeenCalledWith({
      where: {
        id: "7",
        usuario_id: 99,
      },
    });

    expect(
      projetoServico.atualizarProjeto
    ).toHaveBeenCalledWith(
      "7",
      {
        nome: "Projeto Atualizado",
      },
      99
    );
  });

  test("Deve impedir alteração de projeto de outro usuário", async () => {
    Projeto.findOne.mockResolvedValue(null);

    const resposta = await request(app)
      .put("/projetos/7")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nome: "Alteração não autorizada",
      });

    expect(resposta.status).toBe(404);

    expect(resposta.body).toEqual({
      erro: "Projeto não encontrado.",
    });

    expect(
      projetoServico.atualizarProjeto
    ).not.toHaveBeenCalled();
  });

  test("Deve bloquear alteração de projeto finalizado", async () => {
    Projeto.findOne.mockResolvedValue({
      ...projeto,
      status: "FINALIZADO",
    });

    const resposta = await request(app)
      .put("/projetos/7")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nome: "Alteração indevida",
      });

    expect(resposta.status).toBe(409);

    expect(resposta.body.erro).toContain(
      "Este projeto está finalizado"
    );

    expect(
      projetoServico.atualizarProjeto
    ).not.toHaveBeenCalled();
  });

  test("Deve excluir um projeto com autenticação válida", async () => {
    const resposta = await request(app)
      .delete("/projetos/7")
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);

    expect(resposta.body).toEqual({
      mensagem: "Projeto excluído com sucesso!",
    });

    expect(
      projetoServico.excluirProjeto
    ).toHaveBeenCalledWith("7", 99);
  });

  test("Deve aplicar sugestão de viagens com autenticação válida", async () => {
    const resposta = await request(app)
      .post(
        "/projetos/7/logistica/propria/aplicar-sugestao-viagens"
      )
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);

    expect(resposta.body).toEqual({
      mensagem: "Sugestão de viagens aplicada com sucesso!",
      resultado: {
        quantidadeAnterior: 2,
        quantidadeAtual: 3,
      },
    });

    expect(
      logisticaPropriaServico.aplicarSugestaoViagens
    ).toHaveBeenCalledWith("7", 99);
  });

  test("Deve impedir sugestão de viagens em projeto finalizado", async () => {
    Projeto.findOne.mockResolvedValue({
      ...projeto,
      status: "FINALIZADO",
    });

    const resposta = await request(app)
      .post(
        "/projetos/7/logistica/propria/aplicar-sugestao-viagens"
      )
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(409);

    expect(
      logisticaPropriaServico.aplicarSugestaoViagens
    ).not.toHaveBeenCalled();
  });
});