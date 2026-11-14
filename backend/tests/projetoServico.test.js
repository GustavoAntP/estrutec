jest.mock("../src/modelos/Projeto", () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
}));

jest.mock("../src/modelos/ClienteEmpresa", () => ({
  findByPk: jest.fn(),
}));

const { Op } = require("sequelize");

const Projeto = require("../src/modelos/Projeto");
const ClienteEmpresa = require("../src/modelos/ClienteEmpresa");

const {
  cadastrarProjeto,
  listarProjetos,
  buscarProjetoPorId,
  atualizarProjeto,
  excluirProjeto,
  reabrirProjeto,
} = require("../src/servicos/projetoServico");

const criarProjeto = (alteracoes = {}) => ({
  id: 7,
  codigo: "EST-007",
  nome: "Projeto de Vigas",
  cliente: "Cliente Original",
  cliente_empresa_id: null,
  responsavel: "Ana",
  origem: "Araquari",
  destino: "Joinville",
  prazo: "2026-12-20",
  bdi: 15,
  observacoes: "Observação inicial",
  status: "EM_ANDAMENTO",
  usuario_id: 99,
  update: jest.fn(async function (dados) {
    Object.assign(this, dados);
    return this;
  }),
  destroy: jest.fn().mockResolvedValue(undefined),
  ...alteracoes,
});

const dadosCadastro = {
  codigo: " EST-010 ",
  nome: " Projeto de Estruturas ",
  cliente: " Cliente Manual ",
  responsavel: " Ana ",
  origem: " Araquari ",
  destino: " Joinville ",
  prazo: "2026-12-31",
  bdi: 18,
  observacoes: " Observações do projeto ",
};

describe("Serviço de projetos - Estrutec", () => {
  let projeto;
  let empresa;

  beforeEach(() => {
    jest.resetAllMocks();

    projeto = criarProjeto();

    empresa = {
      id: 5,
      ativo: true,
      nome_fantasia: "Construtora Alfa",
      razao_social: "Construtora Alfa Ltda.",
    };

    Projeto.findOne.mockResolvedValue(projeto);
    Projeto.findAll.mockResolvedValue([projeto]);

    Projeto.create.mockImplementation(async (dados) => ({
      id: 8,
      ...dados,
    }));

    ClienteEmpresa.findByPk.mockResolvedValue(empresa);
  });

  describe("Cadastro", () => {
    test("Deve cadastrar projeto com cliente manual e normalizar campos", async () => {
      Projeto.findOne.mockResolvedValue(null);

      const resultado = await cadastrarProjeto(dadosCadastro, 99);

      expect(Projeto.findOne).toHaveBeenCalledWith({
        where: {
          codigo: "EST-010",
        },
      });

      expect(Projeto.create).toHaveBeenCalledWith({
        codigo: "EST-010",
        nome: "Projeto de Estruturas",
        cliente: "Cliente Manual",
        cliente_empresa_id: null,
        responsavel: "Ana",
        origem: "Araquari",
        destino: "Joinville",
        prazo: "2026-12-31",
        bdi: 18,
        observacoes: "Observações do projeto",
        usuario_id: 99,
      });

      expect(resultado.id).toBe(8);
    });

    test("Deve preencher valores opcionais ausentes com valores padrão", async () => {
      Projeto.findOne.mockResolvedValue(null);

      await cadastrarProjeto(
        {
          codigo: "EST-011",
          nome: "Projeto",
          cliente: "Cliente",
          destino: "Joinville",
        },
        99
      );

      expect(Projeto.create).toHaveBeenCalledWith(
        expect.objectContaining({
          bdi: 0,
          responsavel: null,
          origem: null,
          prazo: null,
          observacoes: null,
          cliente_empresa_id: null,
        })
      );
    });

    test("Deve vincular empresa cliente ativa ao projeto", async () => {
      Projeto.findOne.mockResolvedValue(null);

      await cadastrarProjeto(
        {
          ...dadosCadastro,
          cliente: undefined,
          cliente_empresa_id: 5,
        },
        99
      );

      expect(ClienteEmpresa.findByPk).toHaveBeenCalledWith(5);

      expect(Projeto.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cliente: "Construtora Alfa",
          cliente_empresa_id: 5,
        })
      );
    });

    test("Deve usar razão social quando a empresa não tiver nome fantasia", async () => {
      Projeto.findOne.mockResolvedValue(null);

      ClienteEmpresa.findByPk.mockResolvedValue({
        ...empresa,
        nome_fantasia: null,
      });

      await cadastrarProjeto(
        {
          ...dadosCadastro,
          cliente_empresa_id: 5,
        },
        99
      );

      expect(Projeto.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cliente: "Construtora Alfa Ltda.",
        })
      );
    });

    test.each([
      ["código", { codigo: "" }],
      ["nome", { nome: "" }],
      ["destino", { destino: "" }],
    ])("Deve rejeitar cadastro sem %s", async (_, alteracoes) => {
      await expect(
        cadastrarProjeto(
          {
            ...dadosCadastro,
            ...alteracoes,
          },
          99
        )
      ).rejects.toThrow(
        "Código, nome do projeto e destino são obrigatórios."
      );

      expect(Projeto.create).not.toHaveBeenCalled();
    });

    test("Deve exigir cliente manual ou empresa vinculada", async () => {
      await expect(
        cadastrarProjeto(
          {
            ...dadosCadastro,
            cliente: undefined,
          },
          99
        )
      ).rejects.toThrow("Informe uma empresa cliente.");

      expect(Projeto.create).not.toHaveBeenCalled();
    });

    test("Deve impedir código duplicado", async () => {
      await expect(
        cadastrarProjeto(dadosCadastro, 99)
      ).rejects.toThrow("Já existe um projeto com este código.");

      expect(Projeto.create).not.toHaveBeenCalled();
    });

    test("Deve rejeitar empresa cliente inexistente", async () => {
      Projeto.findOne.mockResolvedValue(null);
      ClienteEmpresa.findByPk.mockResolvedValue(null);

      await expect(
        cadastrarProjeto(
          {
            ...dadosCadastro,
            cliente_empresa_id: 5,
          },
          99
        )
      ).rejects.toThrow("Empresa cliente não encontrada.");

      expect(Projeto.create).not.toHaveBeenCalled();
    });

    test("Deve rejeitar empresa cliente inativa", async () => {
      Projeto.findOne.mockResolvedValue(null);

      ClienteEmpresa.findByPk.mockResolvedValue({
        ...empresa,
        ativo: false,
      });

      await expect(
        cadastrarProjeto(
          {
            ...dadosCadastro,
            cliente_empresa_id: 5,
          },
          99
        )
      ).rejects.toThrow(
        "A empresa cliente selecionada está inativa."
      );

      expect(Projeto.create).not.toHaveBeenCalled();
    });

    test("Deve propagar falha no salvamento do projeto", async () => {
      Projeto.findOne.mockResolvedValue(null);

      Projeto.create.mockRejectedValue(
        new Error("Falha no banco")
      );

      await expect(
        cadastrarProjeto(dadosCadastro, 99)
      ).rejects.toThrow("Falha no banco");
    });
  });

  describe("Listagem", () => {
    test("Deve listar apenas os projetos do usuário autenticado", async () => {
      const resultado = await listarProjetos(99);

      expect(resultado).toEqual([projeto]);

      expect(Projeto.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            usuario_id: 99,
          },
          order: [["criado_em", "DESC"]],
          include: [
            expect.objectContaining({
              model: ClienteEmpresa,
              as: "clienteEmpresa",
              required: false,
            }),
          ],
        })
      );
    });

    test("Deve filtrar projetos pela empresa e pelo status", async () => {
      await listarProjetos(99, {
        clienteEmpresaId: "5",
        status: "FINALIZADO",
      });

      expect(Projeto.findAll.mock.calls[0][0].where).toEqual({
        usuario_id: 99,
        cliente_empresa_id: 5,
        status: "FINALIZADO",
      });
    });

    test("Deve pesquisar por código, nome ou cliente", async () => {
      await listarProjetos(99, {
        busca: " Vigas ",
      });

      const where = Projeto.findAll.mock.calls[0][0].where;

      expect(where.usuario_id).toBe(99);

      expect(where[Op.or]).toEqual([
        {
          codigo: {
            [Op.iLike]: "%Vigas%",
          },
        },
        {
          nome: {
            [Op.iLike]: "%Vigas%",
          },
        },
        {
          cliente: {
            [Op.iLike]: "%Vigas%",
          },
        },
      ]);
    });

    test("Deve ignorar busca composta apenas de espaços", async () => {
      await listarProjetos(99, {
        busca: "   ",
      });

      const where = Projeto.findAll.mock.calls[0][0].where;

      expect(where).toEqual({
        usuario_id: 99,
      });

      expect(where[Op.or]).toBeUndefined();
    });

    test("Deve retornar lista vazia quando não houver projetos", async () => {
      Projeto.findAll.mockResolvedValue([]);

      await expect(
        listarProjetos(99)
      ).resolves.toEqual([]);
    });
  });

  describe("Consulta", () => {
    test("Deve buscar projeto pelo ID e proprietário", async () => {
      const resultado = await buscarProjetoPorId(7, 99);

      expect(resultado).toBe(projeto);

      expect(Projeto.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 7,
            usuario_id: 99,
          },
          include: [
            expect.objectContaining({
              model: ClienteEmpresa,
              as: "clienteEmpresa",
              required: false,
            }),
          ],
        })
      );
    });

    test("Deve rejeitar consulta a projeto inexistente", async () => {
      Projeto.findOne.mockResolvedValue(null);

      await expect(
        buscarProjetoPorId(999, 99)
      ).rejects.toThrow("Projeto não encontrado.");
    });
  });

  describe("Atualização", () => {
    test("Deve rejeitar atualização de projeto inexistente", async () => {
      Projeto.findOne.mockResolvedValue(null);

      await expect(
        atualizarProjeto(999, { nome: "Novo" }, 99)
      ).rejects.toThrow("Projeto não encontrado.");

      expect(projeto.update).not.toHaveBeenCalled();
    });

    test("Deve preservar os campos não informados", async () => {
      const resultado = await atualizarProjeto(7, {}, 99);

      expect(projeto.update).toHaveBeenCalledWith({
        codigo: "EST-007",
        nome: "Projeto de Vigas",
        cliente: "Cliente Original",
        cliente_empresa_id: null,
        responsavel: "Ana",
        origem: "Araquari",
        destino: "Joinville",
        prazo: "2026-12-20",
        bdi: 15,
        observacoes: "Observação inicial",
      });

      expect(resultado).toBe(projeto);
    });

    test("Deve normalizar campos alterados", async () => {
      await atualizarProjeto(
        7,
        {
          nome: " Novo Projeto ",
          responsavel: " Bruno ",
          origem: " Curitiba ",
          destino: " Florianópolis ",
          observacoes: " Nova observação ",
        },
        99
      );

      expect(projeto.update).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: "Novo Projeto",
          responsavel: "Bruno",
          origem: "Curitiba",
          destino: "Florianópolis",
          observacoes: "Nova observação",
        })
      );
    });

    test("Deve impedir atualização com código utilizado por outro projeto", async () => {
      Projeto.findOne
        .mockResolvedValueOnce(projeto)
        .mockResolvedValueOnce({
          id: 8,
          codigo: "EST-008",
        });

      await expect(
        atualizarProjeto(
          7,
          {
            codigo: " EST-008 ",
          },
          99
        )
      ).rejects.toThrow(
        "Já existe outro projeto com este código."
      );

      expect(Projeto.findOne).toHaveBeenNthCalledWith(2, {
        where: {
          codigo: "EST-008",
          id: {
            [Op.ne]: 7,
          },
        },
      });

      expect(projeto.update).not.toHaveBeenCalled();
    });

    test("Deve permitir alteração para código ainda não utilizado", async () => {
      Projeto.findOne
        .mockResolvedValueOnce(projeto)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(projeto);

      await atualizarProjeto(
        7,
        {
          codigo: " EST-009 ",
        },
        99
      );

      expect(projeto.update).toHaveBeenCalledWith(
        expect.objectContaining({
          codigo: "EST-009",
        })
      );
    });

    test("Deve vincular outra empresa cliente ativa", async () => {
      await atualizarProjeto(
        7,
        {
          cliente_empresa_id: 5,
        },
        99
      );

      expect(ClienteEmpresa.findByPk).toHaveBeenCalledWith(5);

      expect(projeto.update).toHaveBeenCalledWith(
        expect.objectContaining({
          cliente_empresa_id: 5,
          cliente: "Construtora Alfa",
        })
      );
    });

    test("Deve usar razão social na atualização quando não houver nome fantasia", async () => {
      ClienteEmpresa.findByPk.mockResolvedValue({
        ...empresa,
        nome_fantasia: null,
      });

      await atualizarProjeto(
        7,
        {
          cliente_empresa_id: 5,
        },
        99
      );

      expect(projeto.update).toHaveBeenCalledWith(
        expect.objectContaining({
          cliente: "Construtora Alfa Ltda.",
        })
      );
    });

    test("Deve rejeitar atualização para empresa inexistente", async () => {
      ClienteEmpresa.findByPk.mockResolvedValue(null);

      await expect(
        atualizarProjeto(
          7,
          {
            cliente_empresa_id: 5,
          },
          99
        )
      ).rejects.toThrow("Empresa cliente não encontrada.");

      expect(projeto.update).not.toHaveBeenCalled();
    });

    test("Deve rejeitar atualização para empresa inativa", async () => {
      ClienteEmpresa.findByPk.mockResolvedValue({
        ...empresa,
        ativo: false,
      });

      await expect(
        atualizarProjeto(
          7,
          {
            cliente_empresa_id: 5,
          },
          99
        )
      ).rejects.toThrow(
        "A empresa cliente selecionada está inativa."
      );

      expect(projeto.update).not.toHaveBeenCalled();
    });

    test("Deve desvincular empresa cliente e definir cliente manual", async () => {
      projeto.cliente_empresa_id = 5;

      await atualizarProjeto(
        7,
        {
          cliente_empresa_id: null,
          cliente: " Cliente Independente ",
        },
        99
      );

      expect(projeto.update).toHaveBeenCalledWith(
        expect.objectContaining({
          cliente_empresa_id: null,
          cliente: "Cliente Independente",
        })
      );
    });

    test("Deve preservar nome do cliente ao desvincular empresa sem nome substituto", async () => {
      projeto.cliente_empresa_id = 5;

      await atualizarProjeto(
        7,
        {
          cliente_empresa_id: null,
        },
        99
      );

      expect(projeto.update).toHaveBeenCalledWith(
        expect.objectContaining({
          cliente_empresa_id: null,
          cliente: "Cliente Original",
        })
      );
    });

    test("Deve atualizar somente o nome do cliente manual", async () => {
      await atualizarProjeto(
        7,
        {
          cliente: " Novo Cliente ",
        },
        99
      );

      expect(projeto.update).toHaveBeenCalledWith(
        expect.objectContaining({
          cliente: "Novo Cliente",
          cliente_empresa_id: null,
        })
      );
    });

    test("Deve permitir limpar os campos opcionais", async () => {
      await atualizarProjeto(
        7,
        {
          responsavel: "  ",
          origem: "  ",
          prazo: "",
          observacoes: null,
        },
        99
      );

      expect(projeto.update).toHaveBeenCalledWith(
        expect.objectContaining({
          responsavel: null,
          origem: null,
          prazo: null,
          observacoes: null,
        })
      );
    });

    test("Deve permitir definir BDI igual a zero", async () => {
      await atualizarProjeto(
        7,
        {
          bdi: 0,
        },
        99
      );

      expect(projeto.update).toHaveBeenCalledWith(
        expect.objectContaining({
          bdi: 0,
        })
      );
    });
  });

  describe("Exclusão", () => {
    test("Deve excluir o projeto autorizado", async () => {
      await expect(
        excluirProjeto(7, 99)
      ).resolves.toBe(true);

      expect(Projeto.findOne).toHaveBeenCalledWith({
        where: {
          id: 7,
          usuario_id: 99,
        },
      });

      expect(projeto.destroy).toHaveBeenCalledTimes(1);
    });

    test("Deve impedir exclusão de projeto inexistente", async () => {
      Projeto.findOne.mockResolvedValue(null);

      await expect(
        excluirProjeto(999, 99)
      ).rejects.toThrow("Projeto não encontrado.");

      expect(projeto.destroy).not.toHaveBeenCalled();
    });
  });

  describe("Reabertura", () => {
    test("Deve reabrir projeto finalizado", async () => {
      projeto.status = "FINALIZADO";

      const resultado = await reabrirProjeto(7, 99);

      expect(projeto.update).toHaveBeenCalledWith({
        status: "MONTAGEM_CALCULADA",
      });

      expect(resultado.status).toBe("MONTAGEM_CALCULADA");
    });

    test("Deve impedir reabertura de projeto ainda em andamento", async () => {
      await expect(
        reabrirProjeto(7, 99)
      ).rejects.toThrow(
        "Somente projetos finalizados podem ser reabertos."
      );

      expect(projeto.update).not.toHaveBeenCalled();
    });

    test("Deve impedir reabertura de projeto inexistente", async () => {
      Projeto.findOne.mockResolvedValue(null);

      await expect(
        reabrirProjeto(999, 99)
      ).rejects.toThrow("Projeto não encontrado.");
    });
  });
});