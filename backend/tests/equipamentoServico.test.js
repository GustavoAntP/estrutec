jest.mock("../src/modelos/Equipamento", () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
}));

const Equipamento = require("../src/modelos/Equipamento");

const {
  cadastrarEquipamento,
  listarEquipamentos,
  editarEquipamento,
  alterarStatusEquipamento,
} = require("../src/servicos/equipamentoServico");

const dadosValidos = {
  nome: " Guindaste telescópico ",
  descricao: " Equipamento de montagem ",
  tipo_cobranca: "HORA",
  valor_padrao: "250.50",
  mobilizacao_padrao: "500",
  desmobilizacao_padrao: "300.25",
};

const dadosNormalizados = {
  nome: "Guindaste telescópico",
  descricao: "Equipamento de montagem",
  tipo_cobranca: "HORA",
  valor_padrao: 250.5,
  mobilizacao_padrao: 500,
  desmobilizacao_padrao: 300.25,
};

describe("Serviço de equipamentos - Estrutec", () => {
  let equipamento;

  beforeEach(() => {
    jest.resetAllMocks();

    equipamento = {
      id: 7,
      nome: "Guindaste original",
      descricao: "Descrição anterior",
      tipo_cobranca: "DIA",
      valor_padrao: 1200,
      mobilizacao_padrao: 400,
      desmobilizacao_padrao: 200,
      ativo: true,
      update: jest.fn(),
    };

    equipamento.update.mockImplementation(async (dados) => {
      Object.assign(equipamento, dados);
      return equipamento;
    });

    Equipamento.create.mockImplementation(async (dados) => ({
      id: 10,
      ...dados,
    }));

    Equipamento.findAll.mockResolvedValue([equipamento]);

    Equipamento.findByPk.mockResolvedValue(equipamento);
  });

  describe("Cadastro de equipamentos", () => {
    test("Deve cadastrar com dados normalizados", async () => {
      const resultado = await cadastrarEquipamento(dadosValidos);

      expect(Equipamento.create).toHaveBeenCalledWith(
        dadosNormalizados
      );

      expect(resultado).toEqual({
        id: 10,
        ...dadosNormalizados,
      });

      expect(Equipamento.create).toHaveBeenCalledTimes(1);
    });

    test("Deve usar cobrança DIA quando o tipo não for informado", async () => {
      await cadastrarEquipamento({
        nome: "Munck",
      });

      expect(Equipamento.create).toHaveBeenCalledWith({
        nome: "Munck",
        descricao: null,
        tipo_cobranca: "DIA",
        valor_padrao: 0,
        mobilizacao_padrao: 0,
        desmobilizacao_padrao: 0,
      });
    });

    test("Deve aceitar cobrança HORA", async () => {
      await cadastrarEquipamento(dadosValidos);

      expect(
        Equipamento.create.mock.calls[0][0].tipo_cobranca
      ).toBe("HORA");
    });

    test("Deve aceitar cobrança DIA explícita", async () => {
      await cadastrarEquipamento({
        ...dadosValidos,
        tipo_cobranca: "DIA",
      });

      expect(
        Equipamento.create.mock.calls[0][0].tipo_cobranca
      ).toBe("DIA");
    });

    test.each([undefined, null, ""])(
      "Deve aplicar cobrança DIA para valor padrão %p",
      async (tipo_cobranca) => {
        await cadastrarEquipamento({
          ...dadosValidos,
          tipo_cobranca,
        });

        expect(
          Equipamento.create.mock.calls[0][0].tipo_cobranca
        ).toBe("DIA");
      }
    );

    test.each([undefined, null, "", "   "])(
      "Deve transformar descrição opcional %p em null",
      async (descricao) => {
        await cadastrarEquipamento({
          ...dadosValidos,
          descricao,
        });

        expect(
          Equipamento.create.mock.calls[0][0].descricao
        ).toBeNull();
      }
    );

    test("Deve converter preços numéricos em texto", async () => {
      await cadastrarEquipamento(dadosValidos);

      expect(Equipamento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          valor_padrao: 250.5,
          mobilizacao_padrao: 500,
          desmobilizacao_padrao: 300.25,
        })
      );
    });

    test("Deve preservar valores numéricos e decimais", async () => {
      await cadastrarEquipamento({
        ...dadosValidos,
        valor_padrao: 175.75,
        mobilizacao_padrao: 55.25,
        desmobilizacao_padrao: 12.5,
      });

      expect(Equipamento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          valor_padrao: 175.75,
          mobilizacao_padrao: 55.25,
          desmobilizacao_padrao: 12.5,
        })
      );
    });

    test("Deve converter campos numéricos opcionais null em zero", async () => {
      await cadastrarEquipamento({
        ...dadosValidos,
        valor_padrao: null,
        mobilizacao_padrao: null,
        desmobilizacao_padrao: null,
      });

      expect(Equipamento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          valor_padrao: 0,
          mobilizacao_padrao: 0,
          desmobilizacao_padrao: 0,
        })
      );
    });

    test("Deve ignorar campos extras recebidos no cadastro", async () => {
      await cadastrarEquipamento({
        ...dadosValidos,
        id: 999,
        ativo: false,
        campoDesconhecido: "teste",
      });

      expect(Equipamento.create).toHaveBeenCalledWith(
        dadosNormalizados
      );

      expect(
        Equipamento.create.mock.calls[0][0]
      ).not.toHaveProperty("ativo");
    });

    test.each([undefined, null, "", "   "])(
      "Deve rejeitar nome obrigatório %p",
      async (nome) => {
        await expect(
          cadastrarEquipamento({
            ...dadosValidos,
            nome,
          })
        ).rejects.toThrow(
          "Informe o nome do equipamento."
        );

        expect(Equipamento.create).not.toHaveBeenCalled();
      }
    );

    test.each([
      "hora",
      "dia",
      "SEMANA",
      " DIA ",
      "MÊS",
      1,
    ])(
      "Deve rejeitar tipo de cobrança inválido %p",
      async (tipo_cobranca) => {
        await expect(
          cadastrarEquipamento({
            ...dadosValidos,
            tipo_cobranca,
          })
        ).rejects.toThrow(
          "Tipo de cobrança inválido."
        );

        expect(Equipamento.create).not.toHaveBeenCalled();
      }
    );

    test("Deve propagar falha do banco ao cadastrar", async () => {
      Equipamento.create.mockRejectedValue(
        new Error("Falha no cadastro")
      );

      await expect(
        cadastrarEquipamento(dadosValidos)
      ).rejects.toThrow("Falha no cadastro");
    });
  });

  describe("Listagem de equipamentos", () => {
    test("Deve listar equipamentos em ordem alfabética", async () => {
      const resultado = await listarEquipamentos();

      expect(resultado).toEqual([equipamento]);

      expect(Equipamento.findAll).toHaveBeenCalledWith({
        order: [["nome", "ASC"]],
      });
    });

    test("Deve retornar lista vazia quando não houver equipamentos", async () => {
      Equipamento.findAll.mockResolvedValue([]);

      await expect(
        listarEquipamentos()
      ).resolves.toEqual([]);
    });

    test("Deve propagar erro de consulta", async () => {
      Equipamento.findAll.mockRejectedValue(
        new Error("Erro de listagem")
      );

      await expect(
        listarEquipamentos()
      ).rejects.toThrow("Erro de listagem");
    });
  });

  describe("Edição de equipamentos", () => {
    test("Deve atualizar todos os campos com normalização", async () => {
      const resultado = await editarEquipamento(
        7,
        dadosValidos
      );

      expect(Equipamento.findByPk).toHaveBeenCalledWith(7);

      expect(equipamento.update).toHaveBeenCalledWith(
        dadosNormalizados
      );

      expect(resultado).toBe(equipamento);
    });

    test("Deve manter o tipo anterior quando não for informado", async () => {
      await editarEquipamento(7, {
        nome: "Guindaste novo",
      });

      expect(equipamento.update).toHaveBeenCalledWith({
        nome: "Guindaste novo",
        descricao: null,
        tipo_cobranca: "DIA",
        valor_padrao: 0,
        mobilizacao_padrao: 0,
        desmobilizacao_padrao: 0,
      });
    });

    test.each([null, "", undefined])(
      "Deve preservar o tipo anterior com valor %p",
      async (tipo_cobranca) => {
        await editarEquipamento(7, {
          ...dadosValidos,
          tipo_cobranca,
        });

        expect(
          equipamento.update.mock.calls[0][0].tipo_cobranca
        ).toBe("DIA");
      }
    );

    test("Deve permitir mudar o tipo de DIA para HORA", async () => {
      await editarEquipamento(7, {
        ...dadosValidos,
        tipo_cobranca: "HORA",
      });

      expect(equipamento.tipo_cobranca).toBe("HORA");
    });

    test("Deve permitir mudar o tipo de HORA para DIA", async () => {
      equipamento.tipo_cobranca = "HORA";

      await editarEquipamento(7, {
        ...dadosValidos,
        tipo_cobranca: "DIA",
      });

      expect(equipamento.tipo_cobranca).toBe("DIA");
    });

    test.each([undefined, null, "", "   "])(
      "Deve transformar descrição de edição %p em null",
      async (descricao) => {
        await editarEquipamento(7, {
          ...dadosValidos,
          descricao,
        });

        expect(
          equipamento.update.mock.calls[0][0].descricao
        ).toBeNull();
      }
    );

    test("Deve converter valores informados como texto", async () => {
      await editarEquipamento(7, dadosValidos);

      expect(equipamento).toEqual(
        expect.objectContaining({
          valor_padrao: 250.5,
          mobilizacao_padrao: 500,
          desmobilizacao_padrao: 300.25,
        })
      );
    });

    test("Deve definir os custos como zero quando forem omitidos", async () => {
      await editarEquipamento(7, {
        nome: "Guindaste novo",
      });

      expect(equipamento.valor_padrao).toBe(0);
      expect(equipamento.mobilizacao_padrao).toBe(0);
      expect(equipamento.desmobilizacao_padrao).toBe(0);
    });

    test("Deve ignorar alterações de id e ativo", async () => {
      await editarEquipamento(7, {
        ...dadosValidos,
        id: 999,
        ativo: false,
        campoDesconhecido: "teste",
      });

      expect(equipamento.update).toHaveBeenCalledWith(
        dadosNormalizados
      );

      expect(equipamento.id).toBe(7);
      expect(equipamento.ativo).toBe(true);
    });

    test("Deve rejeitar edição de equipamento inexistente", async () => {
      Equipamento.findByPk.mockResolvedValue(null);

      await expect(
        editarEquipamento(999, dadosValidos)
      ).rejects.toThrow(
        "Equipamento não encontrado."
      );

      expect(equipamento.update).not.toHaveBeenCalled();
    });

    test.each([undefined, null, "", "   "])(
      "Deve rejeitar nome inválido na edição %p",
      async (nome) => {
        await expect(
          editarEquipamento(7, {
            ...dadosValidos,
            nome,
          })
        ).rejects.toThrow(
          "Informe o nome do equipamento."
        );

        expect(equipamento.update).not.toHaveBeenCalled();
      }
    );

    test.each([
      "hora",
      "dia",
      "SEMANA",
      " DIA ",
      "MÊS",
      1,
    ])(
      "Deve rejeitar cobrança inválida na edição %p",
      async (tipo_cobranca) => {
        await expect(
          editarEquipamento(7, {
            ...dadosValidos,
            tipo_cobranca,
          })
        ).rejects.toThrow(
          "Tipo de cobrança inválido."
        );

        expect(equipamento.update).not.toHaveBeenCalled();
      }
    );

    test("Deve propagar erro ao localizar equipamento", async () => {
      Equipamento.findByPk.mockRejectedValue(
        new Error("Erro na consulta")
      );

      await expect(
        editarEquipamento(7, dadosValidos)
      ).rejects.toThrow("Erro na consulta");
    });

    test("Deve propagar erro durante a atualização", async () => {
      equipamento.update.mockRejectedValue(
        new Error("Falha na atualização")
      );

      await expect(
        editarEquipamento(7, dadosValidos)
      ).rejects.toThrow("Falha na atualização");
    });
  });

  describe("Alteração do status de equipamentos", () => {
    test("Deve ativar equipamento", async () => {
      equipamento.ativo = false;

      const resultado = await alterarStatusEquipamento(
        7,
        true
      );

      expect(Equipamento.findByPk).toHaveBeenCalledWith(7);

      expect(equipamento.update).toHaveBeenCalledWith({
        ativo: true,
      });

      expect(resultado).toBe(equipamento);
      expect(resultado.ativo).toBe(true);
    });

    test("Deve desativar equipamento", async () => {
      const resultado = await alterarStatusEquipamento(
        7,
        false
      );

      expect(equipamento.update).toHaveBeenCalledWith({
        ativo: false,
      });

      expect(resultado.ativo).toBe(false);
    });

    test.each([0, null, undefined, ""])(
      "Deve converter status falso ou vazio %p em false",
      async (ativo) => {
        await alterarStatusEquipamento(7, ativo);

        expect(equipamento.update).toHaveBeenCalledWith({
          ativo: false,
        });
      }
    );

    test.each([
      1,
      "true",
      "false",
      "qualquer valor",
    ])(
      "Deve converter valor truthy %p em true",
      async (ativo) => {
        await alterarStatusEquipamento(7, ativo);

        expect(equipamento.update).toHaveBeenCalledWith({
          ativo: true,
        });
      }
    );

    test("Deve rejeitar alteração de status de equipamento inexistente", async () => {
      Equipamento.findByPk.mockResolvedValue(null);

      await expect(
        alterarStatusEquipamento(999, false)
      ).rejects.toThrow(
        "Equipamento não encontrado."
      );

      expect(equipamento.update).not.toHaveBeenCalled();
    });

    test("Deve propagar falha na busca do equipamento", async () => {
      Equipamento.findByPk.mockRejectedValue(
        new Error("Falha na consulta")
      );

      await expect(
        alterarStatusEquipamento(7, false)
      ).rejects.toThrow("Falha na consulta");
    });

    test("Deve propagar falha ao alterar status", async () => {
      equipamento.update.mockRejectedValue(
        new Error("Falha ao salvar status")
      );

      await expect(
        alterarStatusEquipamento(7, false)
      ).rejects.toThrow("Falha ao salvar status");
    });
  });
});