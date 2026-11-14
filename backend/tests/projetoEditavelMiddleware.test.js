jest.mock("../src/modelos/Projeto", () => ({
  findOne: jest.fn(),
}));

const Projeto = require("../src/modelos/Projeto");

const verificarProjetoEditavel = require(
  "../src/middlewares/projetoEditavelMiddleware"
);

describe("Proteção de projetos - Estrutec", () => {
  let req;
  let res;
  let next;
  let projeto;

  beforeEach(() => {
    jest.resetAllMocks();

    req = {
      params: {
        id: "7",
      },
      usuario: {
        id: 99,
        nome: "Usuario Teste",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    projeto = {
      id: 7,
      usuario_id: 99,
      codigo: "EST-007",
      nome: "Projeto Teste",
      status: "EM_ANDAMENTO",
    };

    Projeto.findOne.mockResolvedValue(projeto);
  });

  test("Deve consultar o projeto pelo ID e usuario autenticado", async () => {
    await verificarProjetoEditavel(req, res, next);

    expect(Projeto.findOne).toHaveBeenCalledWith({
      where: {
        id: "7",
        usuario_id: 99,
      },
    });

    expect(req.projeto).toBe(projeto);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("Deve bloquear acesso a projeto inexistente", async () => {
    Projeto.findOne.mockResolvedValue(null);

    await verificarProjetoEditavel(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      erro: "Projeto não encontrado.",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("Deve bloquear alteracoes em projeto finalizado", async () => {
    projeto.status = "FINALIZADO";

    await verificarProjetoEditavel(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);

    expect(res.json).toHaveBeenCalledWith({
      erro: expect.stringContaining(
        "Este projeto está finalizado"
      ),
    });

    expect(next).not.toHaveBeenCalled();
    expect(req.projeto).toBeUndefined();
  });

  test.each([
    "EM_ANDAMENTO",
    "FABRICACAO_CALCULADA",
    "LOGISTICA_CALCULADA",
    "MONTAGEM_CALCULADA",
  ])("Deve permitir edicao no status %s", async (status) => {
    projeto.status = status;

    await verificarProjetoEditavel(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.projeto).toBe(projeto);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("Deve impedir acesso a projeto de outro usuario", async () => {
    req.usuario.id = 200;

    Projeto.findOne.mockResolvedValue(null);

    await verificarProjetoEditavel(req, res, next);

    expect(Projeto.findOne).toHaveBeenCalledWith({
      where: {
        id: "7",
        usuario_id: 200,
      },
    });

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  test("Deve tratar falhas na consulta ao banco de dados", async () => {
    Projeto.findOne.mockRejectedValue(
      new Error("Falha na consulta ao banco de dados")
    );

    await verificarProjetoEditavel(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      erro: "Erro ao verificar situação do projeto.",
    });

    expect(next).not.toHaveBeenCalled();
  });
});