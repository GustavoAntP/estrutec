jest.mock("../src/modelos/Projeto", () => ({
  findOne: jest.fn(),
}));

jest.mock("../src/modelos/MontagemProjeto", () => ({
  findOne: jest.fn(),
}));

jest.mock("../src/modelos/EquipamentoMontagem", () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
}));

const Projeto = require("../src/modelos/Projeto");
const MontagemProjeto = require("../src/modelos/MontagemProjeto");
const EquipamentoMontagem = require("../src/modelos/EquipamentoMontagem");

const {
  cadastrar,
  listar,
  atualizar,
  excluir,
} = require("../src/servicos/equipamentoMontagemServico");

const dadosValidos = {
  nome: " Guindaste telescópico ",
  quantidade: "2",
  tipoCobranca: "hora",
  tempoUso: "5.5",
  valorUnitario: "150",
  custoMobilizacao: "250",
  custoDesmobilizacao: "100",
  observacoes: " Equipamento para montagem de vigas ",
};

const dadosEsperados = {
  nome: "Guindaste telescópico",
  quantidade: 2,
  tipo_cobranca: "HORA",
  tempo_uso: 5.5,
  valor_unitario: 150,
  custo_mobilizacao: 250,
  custo_desmobilizacao: 100,
  observacoes: "Equipamento para montagem de vigas",
};

const operacoes = [
  ["cadastro", () => cadastrar(7, 99, dadosValidos)],
  ["listagem", () => listar(7, 99)],
  ["atualização", () => atualizar(7, 31, 99, {})],
  ["exclusão", () => excluir(7, 31, 99)],
];

describe("Serviço de equipamentos de montagem - Estrutec", () => {
  let projeto;
  let montagem;
  let equipamento;

  beforeEach(() => {
    jest.resetAllMocks();

    projeto = {
      id: 7,
      usuario_id: 99,
      codigo: "EST-007",
      nome: "Projeto de Vigas",
    };

    montagem = {
      id: 21,
      projeto_id: 7,
    };

    equipamento = {
      id: 31,
      montagem_id: 21,
      nome: "Guindaste",
      quantidade: 2,
      tipo_cobranca: "HORA",
      tempo_uso: 5,
      valor_unitario: 100,
      custo_mobilizacao: 250,
      custo_desmobilizacao: 60,
      observacoes: "Equipamento existente",
      update: jest.fn(),
      destroy: jest.fn(),
    };

    equipamento.update.mockImplementation(async (dados) => {
      Object.assign(equipamento, dados);
      return equipamento;
    });

    equipamento.destroy.mockResolvedValue(undefined);

    Projeto.findOne.mockResolvedValue(projeto);
    MontagemProjeto.findOne.mockResolvedValue(montagem);

    EquipamentoMontagem.findOne.mockResolvedValue(equipamento);
    EquipamentoMontagem.findAll.mockResolvedValue([equipamento]);

    EquipamentoMontagem.create.mockImplementation(async (dados) => ({
      id: 32,
      ...dados,
    }));
  });

  describe("Controle de acesso e pré-requisitos", () => {
    test.each(operacoes)(
      "Deve impedir %s em projeto inexistente",
      async (_, executar) => {
        Projeto.findOne.mockResolvedValue(null);

        await expect(executar()).rejects.toThrow(
          "Projeto não encontrado."
        );

        expect(MontagemProjeto.findOne).not.toHaveBeenCalled();
        expect(EquipamentoMontagem.create).not.toHaveBeenCalled();
      }
    );

    test.each(operacoes)(
      "Deve impedir %s sem configuração de montagem",
      async (_, executar) => {
        MontagemProjeto.findOne.mockResolvedValue(null);

        await expect(executar()).rejects.toThrow(
          "Configure primeiro os dados gerais da montagem."
        );

        expect(EquipamentoMontagem.create).not.toHaveBeenCalled();
        expect(EquipamentoMontagem.findAll).not.toHaveBeenCalled();
      }
    );

    test.each(operacoes)(
      "Deve propagar falha na consulta do projeto durante %s",
      async (_, executar) => {
        Projeto.findOne.mockRejectedValue(
          new Error("Falha ao consultar projeto")
        );

        await expect(executar()).rejects.toThrow(
          "Falha ao consultar projeto"
        );

        expect(MontagemProjeto.findOne).not.toHaveBeenCalled();
      }
    );

    test.each(operacoes)(
      "Deve propagar falha na consulta da montagem durante %s",
      async (_, executar) => {
        MontagemProjeto.findOne.mockRejectedValue(
          new Error("Falha ao consultar montagem")
        );

        await expect(executar()).rejects.toThrow(
          "Falha ao consultar montagem"
        );

        expect(EquipamentoMontagem.create).not.toHaveBeenCalled();
      }
    );

    test.each(operacoes)(
      "Deve verificar o proprietário antes de executar %s",
      async (_, executar) => {
        await executar();

        expect(Projeto.findOne).toHaveBeenCalledWith({
          where: {
            id: 7,
            usuario_id: 99,
          },
        });

        expect(MontagemProjeto.findOne).toHaveBeenCalledWith({
          where: {
            projeto_id: 7,
          },
        });

        expect(Projeto.findOne).toHaveBeenCalledTimes(1);
        expect(MontagemProjeto.findOne).toHaveBeenCalledTimes(1);
      }
    );
  });

  describe("Cadastro de equipamentos", () => {
    test("Deve cadastrar equipamento com dados normalizados", async () => {
      const resultado = await cadastrar(7, 99, dadosValidos);

      expect(EquipamentoMontagem.create).toHaveBeenCalledWith({
        montagem_id: 21,
        ...dadosEsperados,
      });

      expect(resultado).toEqual({
        id: 32,
        montagem_id: 21,
        ...dadosEsperados,
      });

      expect(EquipamentoMontagem.create).toHaveBeenCalledTimes(1);
    });

    test("Deve permitir cobrança diária", async () => {
      await cadastrar(7, 99, {
        ...dadosValidos,
        tipoCobranca: "dia",
        tempoUso: 3,
      });

      expect(EquipamentoMontagem.create).toHaveBeenCalledWith({
        montagem_id: 21,
        ...dadosEsperados,
        tipo_cobranca: "DIA",
        tempo_uso: 3,
      });
    });

    test("Deve aceitar valores numéricos sem conversão de texto", async () => {
      await cadastrar(7, 99, {
        ...dadosValidos,
        quantidade: 3,
        tempoUso: 2.5,
        valorUnitario: 125.75,
        custoMobilizacao: 80.5,
        custoDesmobilizacao: 45.25,
      });

      expect(EquipamentoMontagem.create).toHaveBeenCalledWith({
        montagem_id: 21,
        ...dadosEsperados,
        quantidade: 3,
        tempo_uso: 2.5,
        valor_unitario: 125.75,
        custo_mobilizacao: 80.5,
        custo_desmobilizacao: 45.25,
      });
    });

    test("Deve utilizar zero para custos opcionais ausentes", async () => {
      await cadastrar(7, 99, {
        nome: "Munck",
        quantidade: 1,
        tipoCobranca: "HORA",
        tempoUso: 5,
        valorUnitario: 200,
      });

      expect(EquipamentoMontagem.create).toHaveBeenCalledWith({
        montagem_id: 21,
        nome: "Munck",
        quantidade: 1,
        tipo_cobranca: "HORA",
        tempo_uso: 5,
        valor_unitario: 200,
        custo_mobilizacao: 0,
        custo_desmobilizacao: 0,
        observacoes: null,
      });
    });

    test("Deve converter custos opcionais null para zero", async () => {
      await cadastrar(7, 99, {
        ...dadosValidos,
        custoMobilizacao: null,
        custoDesmobilizacao: null,
      });

      expect(EquipamentoMontagem.create).toHaveBeenCalledWith({
        montagem_id: 21,
        ...dadosEsperados,
        custo_mobilizacao: 0,
        custo_desmobilizacao: 0,
      });
    });

    test.each([
      ["ausentes", undefined],
      ["null", null],
      ["texto vazio", ""],
      ["apenas espaços", "   "],
    ])(
      "Deve aceitar observações %s",
      async (_, observacoes) => {
        await cadastrar(7, 99, {
          ...dadosValidos,
          observacoes,
        });

        expect(EquipamentoMontagem.create).toHaveBeenCalledWith({
          montagem_id: 21,
          ...dadosEsperados,
          observacoes: null,
        });
      }
    );

    test("Deve aceitar valor unitário igual a zero", async () => {
      await cadastrar(7, 99, {
        ...dadosValidos,
        valorUnitario: 0,
      });

      expect(EquipamentoMontagem.create).toHaveBeenCalledWith({
        montagem_id: 21,
        ...dadosEsperados,
        valor_unitario: 0,
      });
    });

    test("Deve propagar falha ao cadastrar equipamento", async () => {
      EquipamentoMontagem.create.mockRejectedValue(
        new Error("Falha ao cadastrar equipamento")
      );

      await expect(
        cadastrar(7, 99, dadosValidos)
      ).rejects.toThrow("Falha ao cadastrar equipamento");

      expect(EquipamentoMontagem.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("Validação dos equipamentos", () => {
    const casosInvalidos = [
      ["nome ausente", { nome: undefined }, "Nome do equipamento é obrigatório."],
      ["nome null", { nome: null }, "Nome do equipamento é obrigatório."],
      ["nome vazio", { nome: "" }, "Nome do equipamento é obrigatório."],
      ["nome com espaços", { nome: "   " }, "Nome do equipamento é obrigatório."],

      ["quantidade zero", { quantidade: 0 }, "Quantidade inválida."],
      ["quantidade negativa", { quantidade: -1 }, "Quantidade inválida."],
      ["quantidade decimal", { quantidade: 1.5 }, "Quantidade inválida."],
      ["quantidade não numérica", { quantidade: "abc" }, "Quantidade inválida."],
      ["quantidade infinita", { quantidade: Infinity }, "Quantidade inválida."],
      ["quantidade ausente", { quantidade: undefined }, "Quantidade inválida."],
      ["quantidade null", { quantidade: null }, "Quantidade inválida."],
      ["quantidade vazia", { quantidade: "" }, "Quantidade inválida."],

      ["tipo de cobrança ausente", { tipoCobranca: undefined }, "Tipo de cobrança deve ser HORA ou DIA."],
      ["tipo de cobrança null", { tipoCobranca: null }, "Tipo de cobrança deve ser HORA ou DIA."],
      ["tipo de cobrança vazio", { tipoCobranca: "" }, "Tipo de cobrança deve ser HORA ou DIA."],
      ["cobrança semanal", { tipoCobranca: "SEMANA" }, "Tipo de cobrança deve ser HORA ou DIA."],
      ["tipo de cobrança com espaços", { tipoCobranca: " dia " }, "Tipo de cobrança deve ser HORA ou DIA."],

      ["tempo de uso zero", { tempoUso: 0 }, "Tempo de uso inválido."],
      ["tempo de uso negativo", { tempoUso: -1 }, "Tempo de uso inválido."],
      ["tempo de uso não numérico", { tempoUso: "abc" }, "Tempo de uso inválido."],
      ["tempo de uso infinito", { tempoUso: Infinity }, "Tempo de uso inválido."],
      ["tempo de uso menos infinito", { tempoUso: -Infinity }, "Tempo de uso inválido."],
      ["tempo de uso ausente", { tempoUso: undefined }, "Tempo de uso inválido."],
      ["tempo de uso vazio", { tempoUso: "" }, "Tempo de uso inválido."],

      ["valor unitário negativo", { valorUnitario: -1 }, "Valor unitário inválido."],
      ["valor unitário não numérico", { valorUnitario: "abc" }, "Valor unitário inválido."],
      ["valor unitário infinito", { valorUnitario: Infinity }, "Valor unitário inválido."],
      ["valor unitário menos infinito", { valorUnitario: -Infinity }, "Valor unitário inválido."],
      ["valor unitário ausente", { valorUnitario: undefined }, "Valor unitário inválido."],

      ["mobilização negativa", { custoMobilizacao: -1 }, "Custos de mobilização ou desmobilização inválidos."],
      ["mobilização não numérica", { custoMobilizacao: "abc" }, "Custos de mobilização ou desmobilização inválidos."],
      ["mobilização infinita", { custoMobilizacao: Infinity }, "Custos de mobilização ou desmobilização inválidos."],
      ["mobilização menos infinita", { custoMobilizacao: -Infinity }, "Custos de mobilização ou desmobilização inválidos."],

      ["desmobilização negativa", { custoDesmobilizacao: -1 }, "Custos de mobilização ou desmobilização inválidos."],
      ["desmobilização não numérica", { custoDesmobilizacao: "abc" }, "Custos de mobilização ou desmobilização inválidos."],
      ["desmobilização infinita", { custoDesmobilizacao: Infinity }, "Custos de mobilização ou desmobilização inválidos."],
      ["desmobilização menos infinita", { custoDesmobilizacao: -Infinity }, "Custos de mobilização ou desmobilização inválidos."],
    ];

    test.each(casosInvalidos)(
      "Deve rejeitar %s",
      async (_, alteracoes, mensagem) => {
        await expect(
          cadastrar(7, 99, {
            ...dadosValidos,
            ...alteracoes,
          })
        ).rejects.toThrow(mensagem);

        expect(EquipamentoMontagem.create).not.toHaveBeenCalled();
      }
    );
  });

  describe("Listagem de equipamentos", () => {
    test("Deve listar equipamentos da montagem em ordem crescente", async () => {
      const resultado = await listar(7, 99);

      expect(resultado).toEqual([equipamento]);

      expect(EquipamentoMontagem.findAll).toHaveBeenCalledWith({
        where: {
          montagem_id: 21,
        },
        order: [["id", "ASC"]],
      });

      expect(EquipamentoMontagem.findAll).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar lista vazia quando não houver equipamentos", async () => {
      EquipamentoMontagem.findAll.mockResolvedValue([]);

      await expect(listar(7, 99)).resolves.toEqual([]);
    });

    test("Deve propagar falhas durante a listagem", async () => {
      EquipamentoMontagem.findAll.mockRejectedValue(
        new Error("Falha ao listar equipamentos")
      );

      await expect(
        listar(7, 99)
      ).rejects.toThrow("Falha ao listar equipamentos");
    });
  });

  describe("Atualização de equipamentos", () => {
    test("Deve atualizar todos os campos do equipamento", async () => {
      const dados = {
        nome: " Guindaste atualizado ",
        quantidade: "4",
        tipoCobranca: "dia",
        tempoUso: "3.5",
        valorUnitario: "200.25",
        custoMobilizacao: "120",
        custoDesmobilizacao: "70",
        observacoes: " Revisado ",
      };

      const resultado = await atualizar(7, 31, 99, dados);

      expect(EquipamentoMontagem.findOne).toHaveBeenCalledWith({
        where: {
          id: 31,
          montagem_id: 21,
        },
      });

      expect(equipamento.update).toHaveBeenCalledWith({
        nome: "Guindaste atualizado",
        quantidade: 4,
        tipo_cobranca: "DIA",
        tempo_uso: 3.5,
        valor_unitario: 200.25,
        custo_mobilizacao: 120,
        custo_desmobilizacao: 70,
        observacoes: "Revisado",
      });

      expect(resultado).toBe(equipamento);
    });

    test("Deve preservar todos os campos quando o corpo estiver vazio", async () => {
      await atualizar(7, 31, 99, {});

      expect(equipamento.update).toHaveBeenCalledWith({
        nome: "Guindaste",
        quantidade: 2,
        tipo_cobranca: "HORA",
        tempo_uso: 5,
        valor_unitario: 100,
        custo_mobilizacao: 250,
        custo_desmobilizacao: 60,
        observacoes: "Equipamento existente",
      });
    });

    test("Deve atualizar somente a quantidade informada", async () => {
      await atualizar(7, 31, 99, {
        quantidade: 3,
      });

      expect(equipamento.update).toHaveBeenCalledWith({
        nome: "Guindaste",
        quantidade: 3,
        tipo_cobranca: "HORA",
        tempo_uso: 5,
        valor_unitario: 100,
        custo_mobilizacao: 250,
        custo_desmobilizacao: 60,
        observacoes: "Equipamento existente",
      });
    });

    test.each([
      ["null", null],
      ["texto vazio", ""],
      ["apenas espaços", "   "],
    ])(
      "Deve permitir limpar observações utilizando %s",
      async (_, observacoes) => {
        await atualizar(7, 31, 99, {
          observacoes,
        });

        expect(equipamento.update).toHaveBeenCalledWith(
          expect.objectContaining({
            observacoes: null,
          })
        );
      }
    );

    test("Deve preservar observações quando receber undefined", async () => {
      await atualizar(7, 31, 99, {
        observacoes: undefined,
      });

      expect(equipamento.update).toHaveBeenCalledWith(
        expect.objectContaining({
          observacoes: "Equipamento existente",
        })
      );
    });

    test.each([
      ["nome vazio", { nome: "" }, "Nome do equipamento é obrigatório."],
      ["quantidade zero", { quantidade: 0 }, "Quantidade inválida."],
      ["cobrança inválida", { tipoCobranca: "MES" }, "Tipo de cobrança deve ser HORA ou DIA."],
      ["valor negativo", { valorUnitario: -1 }, "Valor unitário inválido."],
      ["mobilização negativa", { custoMobilizacao: -1 }, "Custos de mobilização ou desmobilização inválidos."],
    ])(
      "Deve rejeitar atualização com %s",
      async (_, dados, mensagem) => {
        await expect(
          atualizar(7, 31, 99, dados)
        ).rejects.toThrow(mensagem);

        expect(equipamento.update).not.toHaveBeenCalled();
      }
    );

    test("Deve rejeitar atualização de equipamento inexistente", async () => {
      EquipamentoMontagem.findOne.mockResolvedValue(null);

      await expect(
        atualizar(7, 999, 99, {
          nome: "Equipamento novo",
        })
      ).rejects.toThrow("Equipamento não encontrado.");

      expect(equipamento.update).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas ao consultar equipamento", async () => {
      EquipamentoMontagem.findOne.mockRejectedValue(
        new Error("Falha ao consultar equipamento")
      );

      await expect(
        atualizar(7, 31, 99, {})
      ).rejects.toThrow("Falha ao consultar equipamento");

      expect(equipamento.update).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas ao salvar alterações", async () => {
      equipamento.update.mockRejectedValue(
        new Error("Falha ao atualizar equipamento")
      );

      await expect(
        atualizar(7, 31, 99, {})
      ).rejects.toThrow("Falha ao atualizar equipamento");
    });

    test("Deve ignorar campos não permitidos na atualização", async () => {
      await atualizar(7, 31, 99, {
        nome: "Equipamento atualizado",
        id: 999,
        montagem_id: 999,
        campoInexistente: "teste",
      });

      const dadosAtualizados = equipamento.update.mock.calls[0][0];

      expect(dadosAtualizados.nome).toBe("Equipamento atualizado");
      expect(dadosAtualizados).not.toHaveProperty("id");
      expect(dadosAtualizados).not.toHaveProperty("montagem_id");
      expect(dadosAtualizados).not.toHaveProperty("campoInexistente");

      expect(equipamento.id).toBe(31);
      expect(equipamento.montagem_id).toBe(21);
    });
  });

  describe("Exclusão de equipamentos", () => {
    test("Deve excluir equipamento da montagem informada", async () => {
      const resultado = await excluir(7, 31, 99);

      expect(EquipamentoMontagem.findOne).toHaveBeenCalledWith({
        where: {
          id: 31,
          montagem_id: 21,
        },
      });

      expect(equipamento.destroy).toHaveBeenCalledTimes(1);
      expect(resultado).toBeUndefined();
    });

    test("Deve rejeitar exclusão de equipamento inexistente", async () => {
      EquipamentoMontagem.findOne.mockResolvedValue(null);

      await expect(
        excluir(7, 999, 99)
      ).rejects.toThrow("Equipamento não encontrado.");

      expect(equipamento.destroy).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas durante a busca do equipamento", async () => {
      EquipamentoMontagem.findOne.mockRejectedValue(
        new Error("Falha ao buscar equipamento")
      );

      await expect(
        excluir(7, 31, 99)
      ).rejects.toThrow("Falha ao buscar equipamento");

      expect(equipamento.destroy).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas durante a exclusão", async () => {
      equipamento.destroy.mockRejectedValue(
        new Error("Falha ao excluir equipamento")
      );

      await expect(
        excluir(7, 31, 99)
      ).rejects.toThrow("Falha ao excluir equipamento");
    });
  });
});