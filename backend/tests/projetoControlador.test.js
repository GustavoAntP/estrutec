jest.mock("../src/servicos/projetoServico", () => ({
  cadastrarProjeto: jest.fn(),
  listarProjetos: jest.fn(),
  buscarProjetoPorId: jest.fn(),
  atualizarProjeto: jest.fn(),
  excluirProjeto: jest.fn(),
  reabrirProjeto: jest.fn(),
}));

const projetoServico = require("../src/servicos/projetoServico");
const projetoControlador = require("../src/controladores/projetoControlador");

describe("Controlador de projetos - Estrutec", () => {
  let req;
  let res;
  let projeto;

  beforeEach(() => {
    jest.resetAllMocks();

    projeto = {
      id: 7,
      codigo: "EST-007",
      nome: "Projeto de Vigas",
      cliente: "Construtora Exemplo",
      destino: "Joinville",
      status: "EM_ANDAMENTO",
      usuario_id: 99,
    };

    req = {
      body: {
        codigo: "EST-007",
        nome: "Projeto de Vigas",
        cliente: "Construtora Exemplo",
        destino: "Joinville",
      },
      params: {
        id: "7",
      },
      query: {},
      usuario: {
        id: 99,
        nome: "Usuario Teste",
      },
      usuarioId: 99,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    projetoServico.cadastrarProjeto.mockResolvedValue(projeto);
    projetoServico.listarProjetos.mockResolvedValue([projeto]);
    projetoServico.buscarProjetoPorId.mockResolvedValue(projeto);

    projetoServico.atualizarProjeto.mockResolvedValue({
      ...projeto,
      nome: "Projeto Atualizado",
    });

    projetoServico.excluirProjeto.mockResolvedValue(true);

    projetoServico.reabrirProjeto.mockResolvedValue({
      ...projeto,
      status: "MONTAGEM_CALCULADA",
    });
  });

  describe("Cadastro de projetos", () => {
    test("Deve cadastrar um projeto com sucesso", async () => {
      await projetoControlador.cadastrar(req, res);

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith({
        mensagem: "Projeto cadastrado com sucesso!",
        projeto,
      });
    });

    test("Deve enviar os dados e o usuario ao servico", async () => {
      await projetoControlador.cadastrar(req, res);

      expect(projetoServico.cadastrarProjeto).toHaveBeenCalledWith(
        req.body,
        99
      );

      expect(projetoServico.cadastrarProjeto).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar erro 400 quando o cadastro falhar", async () => {
      projetoServico.cadastrarProjeto.mockRejectedValue(
        new Error("Código, nome do projeto e destino são obrigatórios.")
      );

      await projetoControlador.cadastrar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        erro: "Código, nome do projeto e destino são obrigatórios.",
      });
    });
  });

  describe("Listagem de projetos", () => {
    test("Deve listar projetos com os filtros informados", async () => {
      req.query = {
        busca: "Vigas",
        clienteEmpresaId: "5",
        status: "EM_ANDAMENTO",
      };

      await projetoControlador.listar(req, res);

      expect(projetoServico.listarProjetos).toHaveBeenCalledWith(
        99,
        {
          busca: "Vigas",
          clienteEmpresaId: "5",
          status: "EM_ANDAMENTO",
        }
      );

      expect(res.json).toHaveBeenCalledWith({
        projetos: [projeto],
      });
    });

    test("Deve listar projetos sem filtros opcionais", async () => {
      await projetoControlador.listar(req, res);

      expect(projetoServico.listarProjetos).toHaveBeenCalledWith(
        99,
        {
          busca: undefined,
          clienteEmpresaId: undefined,
          status: undefined,
        }
      );
    });

    test("Deve retornar uma lista vazia quando nao houver projetos", async () => {
      projetoServico.listarProjetos.mockResolvedValue([]);

      await projetoControlador.listar(req, res);

      expect(res.json).toHaveBeenCalledWith({
        projetos: [],
      });

      expect(res.status).not.toHaveBeenCalled();
    });

    test("Deve retornar erro 400 quando a listagem falhar", async () => {
      projetoServico.listarProjetos.mockRejectedValue(
        new Error("Erro ao listar projetos.")
      );

      await projetoControlador.listar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        erro: "Erro ao listar projetos.",
      });
    });
  });

  describe("Consulta de projetos", () => {
    test("Deve buscar um projeto com sucesso", async () => {
      await projetoControlador.buscarPorId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        projeto,
      });
    });

    test("Deve consultar o projeto pelo ID e usuario", async () => {
      await projetoControlador.buscarPorId(req, res);

      expect(projetoServico.buscarProjetoPorId).toHaveBeenCalledWith(
        "7",
        99
      );

      expect(projetoServico.buscarProjetoPorId).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar erro 404 para projeto inexistente", async () => {
      projetoServico.buscarProjetoPorId.mockRejectedValue(
        new Error("Projeto não encontrado.")
      );

      await projetoControlador.buscarPorId(req, res);

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({
        erro: "Projeto não encontrado.",
      });
    });
  });

  describe("Atualizacao de projetos", () => {
    test("Deve atualizar um projeto com sucesso", async () => {
      await projetoControlador.atualizar(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        mensagem: "Projeto atualizado com sucesso!",
        projeto: {
          ...projeto,
          nome: "Projeto Atualizado",
        },
      });
    });

    test("Deve enviar os dados de atualizacao ao servico", async () => {
      req.body = {
        nome: "Projeto Atualizado",
        bdi: 15,
      };

      await projetoControlador.atualizar(req, res);

      expect(projetoServico.atualizarProjeto).toHaveBeenCalledWith(
        "7",
        {
          nome: "Projeto Atualizado",
          bdi: 15,
        },
        99
      );
    });

    test("Deve retornar erro 400 quando a atualizacao falhar", async () => {
      projetoServico.atualizarProjeto.mockRejectedValue(
        new Error("Já existe outro projeto com este código.")
      );

      await projetoControlador.atualizar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        erro: "Já existe outro projeto com este código.",
      });
    });
  });

  describe("Exclusao de projetos", () => {
    test("Deve excluir um projeto com sucesso", async () => {
      await projetoControlador.excluir(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        mensagem: "Projeto excluído com sucesso!",
      });
    });

    test("Deve excluir somente o projeto do usuario informado", async () => {
      await projetoControlador.excluir(req, res);

      expect(projetoServico.excluirProjeto).toHaveBeenCalledWith(
        "7",
        99
      );

      expect(projetoServico.excluirProjeto).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar erro 404 quando a exclusao falhar", async () => {
      projetoServico.excluirProjeto.mockRejectedValue(
        new Error("Projeto não encontrado.")
      );

      await projetoControlador.excluir(req, res);

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({
        erro: "Projeto não encontrado.",
      });
    });
  });

  describe("Reabertura de projetos", () => {
    test("Deve reabrir um projeto com sucesso", async () => {
      await projetoControlador.reabrir(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        mensagem: "Projeto reaberto com sucesso!",
        projeto: {
          id: 7,
          codigo: "EST-007",
          nome: "Projeto de Vigas",
          status: "MONTAGEM_CALCULADA",
        },
      });
    });

    test("Deve retornar somente os campos previstos na reabertura", async () => {
      await projetoControlador.reabrir(req, res);

      const resposta = res.json.mock.calls[0][0];

      expect(Object.keys(resposta.projeto).sort()).toEqual([
        "codigo",
        "id",
        "nome",
        "status",
      ]);

      expect(resposta.projeto).not.toHaveProperty("usuario_id");
    });

    test("Deve solicitar a reabertura pelo ID e usuario", async () => {
      await projetoControlador.reabrir(req, res);

      expect(projetoServico.reabrirProjeto).toHaveBeenCalledWith(
        "7",
        99
      );

      expect(projetoServico.reabrirProjeto).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar erro 400 quando a reabertura falhar", async () => {
      projetoServico.reabrirProjeto.mockRejectedValue(
        new Error("Somente projetos finalizados podem ser reabertos.")
      );

      await projetoControlador.reabrir(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        erro: "Somente projetos finalizados podem ser reabertos.",
      });
    });
  });
});