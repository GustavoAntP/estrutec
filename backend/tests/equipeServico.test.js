jest.mock("../src/modelos/Equipe", () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
}));

const Equipe = require("../src/modelos/Equipe");

const {
  cadastrarEquipe,
  listarEquipes,
  editarEquipe,
  alterarStatusEquipe,
} = require("../src/servicos/equipeServico");

const dadosValidos = {
  nome: " Equipe de montagem ",
  descricao: " Profissionais especializados ",
  quantidade_padrao: "3",
  custo_diario_padrao: "180.75",
};

const dadosNormalizados = {
  nome: "Equipe de montagem",
  descricao: "Profissionais especializados",
  quantidade_padrao: 3,
  custo_diario_padrao: 180.75,
};

describe("Serviço de equipes - Estrutec", () => {
  let equipe;

  beforeEach(() => {
    jest.resetAllMocks();

    equipe = {
      id: 7,
      nome: "Equipe original",
      descricao: "Descrição original",
      quantidade_padrao: 4,
      custo_diario_padrao: 250,
      ativo: true,
      update: jest.fn(),
    };

    equipe.update.mockImplementation(async (dados) => {
      Object.assign(equipe, dados);
      return equipe;
    });

    Equipe.create.mockImplementation(async (dados) => ({
      id: 10,
      ativo: true,
      ...dados,
    }));

    Equipe.findAll.mockResolvedValue([equipe]);
    Equipe.findByPk.mockResolvedValue(equipe);
  });

  describe("Cadastro de equipes", () => {
    test("Deve cadastrar uma equipe com dados normalizados", async () => {
      const resultado = await cadastrarEquipe(dadosValidos);

      expect(Equipe.create).toHaveBeenCalledWith(dadosNormalizados);
      expect(Equipe.create).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual({
        id: 10,
        ativo: true,
        ...dadosNormalizados,
      });
    });

    test("Deve aplicar valores padrão quando somente o nome for informado", async () => {
      await cadastrarEquipe({ nome: " Equipe básica " });

      expect(Equipe.create).toHaveBeenCalledWith({
        nome: "Equipe básica",
        descricao: null,
        quantidade_padrao: 1,
        custo_diario_padrao: 0,
      });
    });

    test("Deve converter quantidade e custo informados como texto", async () => {
      await cadastrarEquipe(dadosValidos);

      expect(Equipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          quantidade_padrao: 3,
          custo_diario_padrao: 180.75,
        })
      );
    });

    test("Deve aceitar quantidade e custo numéricos", async () => {
      await cadastrarEquipe({
        ...dadosValidos,
        quantidade_padrao: 5,
        custo_diario_padrao: 320.5,
      });

      expect(Equipe.create).toHaveBeenCalledWith({
        ...dadosNormalizados,
        quantidade_padrao: 5,
        custo_diario_padrao: 320.5,
      });
    });

    test("Deve aceitar quantidade mínima igual a um", async () => {
      await cadastrarEquipe({
        ...dadosValidos,
        quantidade_padrao: 1,
      });

      expect(
        Equipe.create.mock.calls[0][0].quantidade_padrao
      ).toBe(1);
    });

    test.each([
      ["undefined", undefined],
      ["null", null],
      ["zero numérico", 0],
      ["texto vazio", ""],
      ["false", false],
    ])(
      "Deve usar quantidade padrão um quando receber %s",
      async (_, valor) => {
        await cadastrarEquipe({
          ...dadosValidos,
          quantidade_padrao: valor,
        });

        expect(
          Equipe.create.mock.calls[0][0].quantidade_padrao
        ).toBe(1);
      }
    );

    test.each([
      ["undefined", undefined],
      ["null", null],
      ["zero numérico", 0],
      ["texto vazio", ""],
      ["false", false],
    ])(
      "Deve usar custo zero quando receber %s",
      async (_, valor) => {
        await cadastrarEquipe({
          ...dadosValidos,
          custo_diario_padrao: valor,
        });

        expect(
          Equipe.create.mock.calls[0][0].custo_diario_padrao
        ).toBe(0);
      }
    );

    test.each([
      ["undefined", undefined],
      ["null", null],
      ["texto vazio", ""],
      ["somente espaços", "   "],
    ])(
      "Deve transformar descrição %s em null",
      async (_, descricao) => {
        await cadastrarEquipe({
          ...dadosValidos,
          descricao,
        });

        expect(
          Equipe.create.mock.calls[0][0].descricao
        ).toBeNull();
      }
    );

    test("Deve preservar espaços internos da descrição", async () => {
      await cadastrarEquipe({
        ...dadosValidos,
        descricao: " Equipe  especializada ",
      });

      expect(
        Equipe.create.mock.calls[0][0].descricao
      ).toBe("Equipe  especializada");
    });

    test("Deve aceitar custo diário negativo conforme a implementação atual", async () => {
      await cadastrarEquipe({
        ...dadosValidos,
        custo_diario_padrao: -100,
      });

      expect(
        Equipe.create.mock.calls[0][0].custo_diario_padrao
      ).toBe(-100);
    });

    test("Deve aceitar quantidade decimal conforme a implementação atual", async () => {
      await cadastrarEquipe({
        ...dadosValidos,
        quantidade_padrao: 2.5,
      });

      expect(
        Equipe.create.mock.calls[0][0].quantidade_padrao
      ).toBe(2.5);
    });

    test("Deve encaminhar NaN para quantidade não numérica no comportamento atual", async () => {
      await cadastrarEquipe({
        ...dadosValidos,
        quantidade_padrao: "inválido",
      });

      expect(
        Number.isNaN(
          Equipe.create.mock.calls[0][0].quantidade_padrao
        )
      ).toBe(true);
    });

    test("Deve encaminhar NaN para custo não numérico no comportamento atual", async () => {
      await cadastrarEquipe({
        ...dadosValidos,
        custo_diario_padrao: "inválido",
      });

      expect(
        Number.isNaN(
          Equipe.create.mock.calls[0][0].custo_diario_padrao
        )
      ).toBe(true);
    });

    test("Deve ignorar identificadores e campos adicionais no cadastro", async () => {
      await cadastrarEquipe({
        ...dadosValidos,
        id: 999,
        ativo: false,
        campoAdicional: "não autorizado",
      });

      expect(Equipe.create).toHaveBeenCalledWith(
        dadosNormalizados
      );

      expect(
        Equipe.create.mock.calls[0][0]
      ).not.toHaveProperty("id");

      expect(
        Equipe.create.mock.calls[0][0]
      ).not.toHaveProperty("ativo");
    });

    test.each([
      ["ausente", undefined],
      ["null", null],
      ["vazio", ""],
      ["somente espaços", "   "],
      ["false", false],
    ])(
      "Deve rejeitar nome %s",
      async (_, nome) => {
        await expect(
          cadastrarEquipe({
            ...dadosValidos,
            nome,
          })
        ).rejects.toThrow(
          "Informe o nome da equipe."
        );

        expect(
          Equipe.create
        ).not.toHaveBeenCalled();
      }
    );

    test.each([
      ["negativa", -1],
      ["texto negativo", "-2"],
      ["zero em texto", "0"],
      ["fração abaixo de um", "0.5"],
      ["infinito negativo", -Infinity],
    ])(
      "Deve rejeitar quantidade %s",
      async (_, quantidade_padrao) => {
        await expect(
          cadastrarEquipe({
            ...dadosValidos,
            quantidade_padrao,
          })
        ).rejects.toThrow(
          "A quantidade padrão deve ser maior que zero."
        );

        expect(
          Equipe.create
        ).not.toHaveBeenCalled();
      }
    );

    test("Deve propagar falha de banco de dados no cadastro", async () => {
      Equipe.create.mockRejectedValue(
        new Error("Falha ao cadastrar equipe")
      );

      await expect(
        cadastrarEquipe(dadosValidos)
      ).rejects.toThrow(
        "Falha ao cadastrar equipe"
      );
    });
  });

  describe("Listagem de equipes", () => {
    test("Deve listar equipes em ordem alfabética", async () => {
      const resultado = await listarEquipes();

      expect(resultado).toEqual([equipe]);

      expect(Equipe.findAll).toHaveBeenCalledWith({
        order: [["nome", "ASC"]],
      });

      expect(Equipe.findAll).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar lista vazia quando não existirem equipes", async () => {
      Equipe.findAll.mockResolvedValue([]);

      await expect(
        listarEquipes()
      ).resolves.toEqual([]);
    });

    test("Deve propagar falha ao listar equipes", async () => {
      Equipe.findAll.mockRejectedValue(
        new Error("Falha ao listar equipes")
      );

      await expect(
        listarEquipes()
      ).rejects.toThrow(
        "Falha ao listar equipes"
      );
    });
  });

  describe("Edição de equipes", () => {
    test("Deve editar todos os campos e retornar a equipe original atualizada", async () => {
      const resultado = await editarEquipe(
        7,
        dadosValidos
      );

      expect(Equipe.findByPk).toHaveBeenCalledWith(7);

      expect(equipe.update).toHaveBeenCalledWith(
        dadosNormalizados
      );

      expect(equipe.update).toHaveBeenCalledTimes(1);

      expect(resultado).toBe(equipe);
      expect(resultado.nome).toBe("Equipe de montagem");
    });

    test("Deve aplicar valores padrão quando os campos opcionais não forem informados", async () => {
      await editarEquipe(7, {
        nome: " Equipe revisada ",
      });

      expect(equipe.update).toHaveBeenCalledWith({
        nome: "Equipe revisada",
        descricao: null,
        quantidade_padrao: 1,
        custo_diario_padrao: 0,
      });
    });

    test("Deve aceitar quantidade e custo informados como números", async () => {
      await editarEquipe(7, {
        ...dadosValidos,
        quantidade_padrao: 8,
        custo_diario_padrao: 420.25,
      });

      expect(equipe.update).toHaveBeenCalledWith({
        ...dadosNormalizados,
        quantidade_padrao: 8,
        custo_diario_padrao: 420.25,
      });
    });

    test.each([
      ["undefined", undefined],
      ["null", null],
      ["zero", 0],
      ["texto vazio", ""],
    ])(
      "Deve usar quantidade um na edição com %s",
      async (_, valor) => {
        await editarEquipe(7, {
          ...dadosValidos,
          quantidade_padrao: valor,
        });

        expect(
          equipe.update.mock.calls[0][0].quantidade_padrao
        ).toBe(1);
      }
    );

    test.each([
      ["undefined", undefined],
      ["null", null],
      ["zero", 0],
      ["texto vazio", ""],
    ])(
      "Deve usar custo zero na edição com %s",
      async (_, valor) => {
        await editarEquipe(7, {
          ...dadosValidos,
          custo_diario_padrao: valor,
        });

        expect(
          equipe.update.mock.calls[0][0].custo_diario_padrao
        ).toBe(0);
      }
    );

    test.each([
      ["undefined", undefined],
      ["null", null],
      ["texto vazio", ""],
      ["somente espaços", "   "],
    ])(
      "Deve limpar descrição na edição com %s",
      async (_, descricao) => {
        await editarEquipe(7, {
          ...dadosValidos,
          descricao,
        });

        expect(
          equipe.update.mock.calls[0][0].descricao
        ).toBeNull();
      }
    );

    test("Deve aceitar quantidade decimal conforme a implementação atual", async () => {
      await editarEquipe(7, {
        ...dadosValidos,
        quantidade_padrao: 1.5,
      });

      expect(
        equipe.update.mock.calls[0][0].quantidade_padrao
      ).toBe(1.5);
    });

    test("Deve aceitar custo negativo conforme a implementação atual", async () => {
      await editarEquipe(7, {
        ...dadosValidos,
        custo_diario_padrao: -40,
      });

      expect(
        equipe.update.mock.calls[0][0].custo_diario_padrao
      ).toBe(-40);
    });

    test("Deve ignorar alterações de id e status", async () => {
      await editarEquipe(7, {
        ...dadosValidos,
        id: 999,
        ativo: false,
        campoAdicional: "teste",
      });

      expect(equipe.update).toHaveBeenCalledWith(
        dadosNormalizados
      );

      expect(equipe.id).toBe(7);
      expect(equipe.ativo).toBe(true);
    });

    test("Deve rejeitar edição de equipe inexistente", async () => {
      Equipe.findByPk.mockResolvedValue(null);

      await expect(
        editarEquipe(999, dadosValidos)
      ).rejects.toThrow(
        "Equipe não encontrada."
      );

      expect(
        equipe.update
      ).not.toHaveBeenCalled();
    });

    test.each([
      ["ausente", undefined],
      ["null", null],
      ["vazio", ""],
      ["somente espaços", "   "],
    ])(
      "Deve rejeitar nome %s durante a edição",
      async (_, nome) => {
        await expect(
          editarEquipe(7, {
            ...dadosValidos,
            nome,
          })
        ).rejects.toThrow(
          "Informe o nome da equipe."
        );

        expect(
          equipe.update
        ).not.toHaveBeenCalled();
      }
    );

    test.each([
      ["negativa", -1],
      ["zero em texto", "0"],
      ["fração abaixo de um", 0.5],
      ["infinito negativo", -Infinity],
    ])(
      "Deve rejeitar quantidade %s durante a edição",
      async (_, quantidade_padrao) => {
        await expect(
          editarEquipe(7, {
            ...dadosValidos,
            quantidade_padrao,
          })
        ).rejects.toThrow(
          "A quantidade padrão deve ser maior que zero."
        );

        expect(
          equipe.update
        ).not.toHaveBeenCalled();
      }
    );

    test("Deve propagar erro na busca da equipe para edição", async () => {
      Equipe.findByPk.mockRejectedValue(
        new Error("Falha ao buscar equipe")
      );

      await expect(
        editarEquipe(7, dadosValidos)
      ).rejects.toThrow(
        "Falha ao buscar equipe"
      );
    });

    test("Deve propagar erro ao salvar edição", async () => {
      equipe.update.mockRejectedValue(
        new Error("Falha ao atualizar equipe")
      );

      await expect(
        editarEquipe(7, dadosValidos)
      ).rejects.toThrow(
        "Falha ao atualizar equipe"
      );
    });
  });

  describe("Alteração de status das equipes", () => {
    test("Deve ativar uma equipe", async () => {
      equipe.ativo = false;

      const resultado = await alterarStatusEquipe(
        7,
        true
      );

      expect(Equipe.findByPk).toHaveBeenCalledWith(7);

      expect(equipe.update).toHaveBeenCalledWith({
        ativo: true,
      });

      expect(resultado).toBe(equipe);
      expect(resultado.ativo).toBe(true);
    });

    test("Deve desativar uma equipe", async () => {
      const resultado = await alterarStatusEquipe(
        7,
        false
      );

      expect(equipe.update).toHaveBeenCalledWith({
        ativo: false,
      });

      expect(resultado.ativo).toBe(false);
    });

    test.each([
      ["zero", 0],
      ["null", null],
      ["undefined", undefined],
      ["texto vazio", ""],
      ["false", false],
    ])(
      "Deve converter status %s em false",
      async (_, ativo) => {
        await alterarStatusEquipe(7, ativo);

        expect(equipe.update).toHaveBeenCalledWith({
          ativo: false,
        });
      }
    );

    test.each([
      ["um", 1],
      ["texto true", "true"],
      ["texto false", "false"],
      ["texto genérico", "qualquer valor"],
      ["true", true],
    ])(
      "Deve converter status %s em true",
      async (_, ativo) => {
        await alterarStatusEquipe(7, ativo);

        expect(equipe.update).toHaveBeenCalledWith({
          ativo: true,
        });
      }
    );

    test("Deve rejeitar alteração de status para equipe inexistente", async () => {
      Equipe.findByPk.mockResolvedValue(null);

      await expect(
        alterarStatusEquipe(999, false)
      ).rejects.toThrow(
        "Equipe não encontrada."
      );

      expect(
        equipe.update
      ).not.toHaveBeenCalled();
    });

    test("Deve propagar erro ao buscar equipe para alteração de status", async () => {
      Equipe.findByPk.mockRejectedValue(
        new Error("Falha ao buscar equipe")
      );

      await expect(
        alterarStatusEquipe(7, false)
      ).rejects.toThrow(
        "Falha ao buscar equipe"
      );
    });

    test("Deve propagar erro ao salvar alteração de status", async () => {
      equipe.update.mockRejectedValue(
        new Error("Falha ao alterar status")
      );

      await expect(
        alterarStatusEquipe(7, false)
      ).rejects.toThrow(
        "Falha ao alterar status"
      );
    });
  });
});