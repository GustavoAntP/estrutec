jest.mock("../src/modelos/Projeto", () => ({
  findOne: jest.fn(),
}));

jest.mock("../src/modelos/ConfiguracaoFabricacao", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock("../src/modelos/ConfiguracaoFabricacaoPadrao", () => ({
  findOne: jest.fn(),
}));

const Projeto = require("../src/modelos/Projeto");

const ConfiguracaoFabricacao = require(
  "../src/modelos/ConfiguracaoFabricacao"
);

const ConfiguracaoFabricacaoPadrao = require(
  "../src/modelos/ConfiguracaoFabricacaoPadrao"
);

const {
  salvarConfiguracao,
  buscarConfiguracao,
} = require("../src/servicos/configuracaoFabricacaoServico");

const dadosValidos = {
  fckMpa: 30,
  taxaArmaduraKgM3: 110,
  desperdicioPercentual: 8,
  consumoCimentoKgM3: 350,
  consumoAreiaM3M3: 0.6,
  consumoBritaM3M3: 0.8,
  consumoAguaLM3: 180,
  neopreneM2PorViga: 0.3,
};

const camposEsperados = {
  projeto_id: 7,
  fck_mpa: 30,
  taxa_armadura_kg_m3: 110,
  desperdicio_percentual: 8,
  consumo_cimento_kg_m3: 350,
  consumo_areia_m3_m3: 0.6,
  consumo_brita_m3_m3: 0.8,
  consumo_agua_l_m3: 180,
  neoprene_m2_por_viga: 0.3,
};

const precosEsperados = {
  cimento: 0.9,
  areia: 140,
  brita: 175,
  agua: 0.03,
  aco: 8,
  neoprene: 230,
};

const consumosObrigatorios = [
  ["cimento", "consumoCimentoKgM3", "Consumo de cimento inválido."],
  ["areia", "consumoAreiaM3M3", "Consumo de areia inválido."],
  ["brita", "consumoBritaM3M3", "Consumo de brita inválido."],
  ["água", "consumoAguaLM3", "Consumo de água inválido."],
];

describe("Configuração de fabricação dos projetos - Estrutec", () => {
  let projeto;
  let configuracao;
  let configuracaoPadrao;

  beforeEach(() => {
    jest.resetAllMocks();

    projeto = {
      id: 7,
      codigo: "EST-007",
      nome: "Projeto de Vigas",
      usuario_id: 99,
      status: "EM_ANDAMENTO",
    };

    configuracao = {
      id: 15,
      ...camposEsperados,
      update: jest.fn(),
      toJSON: jest.fn(),
    };

    configuracao.update.mockImplementation(async (dados) => {
      Object.assign(configuracao, dados);
      return configuracao;
    });

    configuracao.toJSON.mockImplementation(() => ({
      id: configuracao.id,
      ...camposEsperados,
    }));

    configuracaoPadrao = {
      id: 1,
      fck_mpa: 35,
      taxa_armadura_kg_m3: 120,
      consumo_cimento_kg_m3: 380,
      consumo_areia_m3_m3: 0.65,
      consumo_brita_m3_m3: 0.85,
      consumo_agua_l_m3: 190,
      neoprene_m2_por_viga: 0.35,
      preco_cimento_rs_kg: 0.9,
      preco_areia_rs_m3: 140,
      preco_brita_rs_m3: 175,
      preco_agua_rs_l: 0.03,
      preco_aco_rs_kg: 8,
      preco_neoprene_rs_m2: 230,
    };

    Projeto.findOne.mockResolvedValue(projeto);

    ConfiguracaoFabricacao.findOne.mockResolvedValue(null);

    ConfiguracaoFabricacao.create.mockImplementation(async (dados) => ({
      id: 16,
      ...dados,
    }));

    ConfiguracaoFabricacaoPadrao.findOne.mockResolvedValue(
      configuracaoPadrao
    );
  });

  describe("Controle de acesso aos projetos", () => {
    test("Deve verificar o proprietário antes de salvar", async () => {
      await salvarConfiguracao(7, 99, dadosValidos);

      expect(Projeto.findOne).toHaveBeenCalledWith({
        where: {
          id: 7,
          usuario_id: 99,
        },
      });

      expect(Projeto.findOne).toHaveBeenCalledTimes(1);
    });

    test("Deve verificar o proprietário antes de consultar", async () => {
      await buscarConfiguracao(7, 99);

      expect(Projeto.findOne).toHaveBeenCalledWith({
        where: {
          id: 7,
          usuario_id: 99,
        },
      });
    });

    test("Deve impedir salvamento em projeto inexistente", async () => {
      Projeto.findOne.mockResolvedValue(null);

      await expect(
        salvarConfiguracao(999, 99, dadosValidos)
      ).rejects.toThrow("Projeto não encontrado.");

      expect(ConfiguracaoFabricacao.findOne).not.toHaveBeenCalled();
      expect(ConfiguracaoFabricacao.create).not.toHaveBeenCalled();
    });

    test("Deve impedir consulta de projeto inexistente", async () => {
      Projeto.findOne.mockResolvedValue(null);

      await expect(
        buscarConfiguracao(999, 99)
      ).rejects.toThrow("Projeto não encontrado.");

      expect(ConfiguracaoFabricacao.findOne).not.toHaveBeenCalled();

      expect(
        ConfiguracaoFabricacaoPadrao.findOne
      ).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas na verificação durante o salvamento", async () => {
      Projeto.findOne.mockRejectedValue(
        new Error("Falha ao consultar projeto")
      );

      await expect(
        salvarConfiguracao(7, 99, dadosValidos)
      ).rejects.toThrow("Falha ao consultar projeto");

      expect(ConfiguracaoFabricacao.create).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas na verificação durante a consulta", async () => {
      Projeto.findOne.mockRejectedValue(
        new Error("Erro de conexão com o banco")
      );

      await expect(
        buscarConfiguracao(7, 99)
      ).rejects.toThrow("Erro de conexão com o banco");

      expect(ConfiguracaoFabricacao.findOne).not.toHaveBeenCalled();
    });
  });

  describe("Cadastro e atualização das configurações", () => {
    test("Deve cadastrar os parâmetros de fabricação", async () => {
      const resultado = await salvarConfiguracao(
        7,
        99,
        dadosValidos
      );

      expect(ConfiguracaoFabricacao.create).toHaveBeenCalledWith(
        camposEsperados
      );

      expect(resultado).toEqual({
        id: 16,
        ...camposEsperados,
      });

      expect(configuracao.update).not.toHaveBeenCalled();
    });

    test("Deve atualizar uma configuração existente", async () => {
      ConfiguracaoFabricacao.findOne.mockResolvedValue(configuracao);

      const resultado = await salvarConfiguracao(
        7,
        99,
        dadosValidos
      );

      expect(configuracao.update).toHaveBeenCalledWith(
        camposEsperados
      );

      expect(configuracao.update).toHaveBeenCalledTimes(1);

      expect(ConfiguracaoFabricacao.create).not.toHaveBeenCalled();

      expect(resultado).toBe(configuracao);
    });

    test("Deve consultar a configuração pelo ID do projeto", async () => {
      await salvarConfiguracao(7, 99, dadosValidos);

      expect(ConfiguracaoFabricacao.findOne).toHaveBeenCalledWith({
        where: {
          projeto_id: 7,
        },
      });

      expect(ConfiguracaoFabricacao.findOne).toHaveBeenCalledTimes(1);
    });

    test("Deve converter valores numéricos recebidos como texto", async () => {
      const dados = Object.fromEntries(
        Object.entries(dadosValidos).map(([campo, valor]) => [
          campo,
          String(valor),
        ])
      );

      await salvarConfiguracao(7, 99, dados);

      expect(ConfiguracaoFabricacao.create).toHaveBeenCalledWith(
        camposEsperados
      );
    });

    test("Deve utilizar desperdício zero quando não informado", async () => {
      const dados = { ...dadosValidos };

      delete dados.desperdicioPercentual;

      await salvarConfiguracao(7, 99, dados);

      expect(ConfiguracaoFabricacao.create).toHaveBeenCalledWith({
        ...camposEsperados,
        desperdicio_percentual: 0,
      });
    });

    test("Deve converter desperdício null para zero", async () => {
      await salvarConfiguracao(7, 99, {
        ...dadosValidos,
        desperdicioPercentual: null,
      });

      expect(ConfiguracaoFabricacao.create).toHaveBeenCalledWith({
        ...camposEsperados,
        desperdicio_percentual: 0,
      });
    });

    test("Deve utilizar neoprene null quando não informado", async () => {
      const dados = { ...dadosValidos };

      delete dados.neopreneM2PorViga;

      await salvarConfiguracao(7, 99, dados);

      expect(ConfiguracaoFabricacao.create).toHaveBeenCalledWith({
        ...camposEsperados,
        neoprene_m2_por_viga: null,
      });
    });

    test("Deve aceitar neoprene explicitamente null", async () => {
      await salvarConfiguracao(7, 99, {
        ...dadosValidos,
        neopreneM2PorViga: null,
      });

      expect(ConfiguracaoFabricacao.create).toHaveBeenCalledWith({
        ...camposEsperados,
        neoprene_m2_por_viga: null,
      });
    });

    test("Deve aceitar neoprene em texto vazio", async () => {
      await salvarConfiguracao(7, 99, {
        ...dadosValidos,
        neopreneM2PorViga: "",
      });

      expect(ConfiguracaoFabricacao.create).toHaveBeenCalledWith({
        ...camposEsperados,
        neoprene_m2_por_viga: null,
      });
    });

    test("Deve aceitar valores zero nos campos permitidos", async () => {
      await salvarConfiguracao(7, 99, {
        ...dadosValidos,
        taxaArmaduraKgM3: 0,
        desperdicioPercentual: 0,
        neopreneM2PorViga: 0,
      });

      expect(ConfiguracaoFabricacao.create).toHaveBeenCalledWith({
        ...camposEsperados,
        taxa_armadura_kg_m3: 0,
        desperdicio_percentual: 0,
        neoprene_m2_por_viga: 0,
      });
    });

    test("Deve aceitar desperdício de 100%", async () => {
      await salvarConfiguracao(7, 99, {
        ...dadosValidos,
        desperdicioPercentual: 100,
      });

      expect(ConfiguracaoFabricacao.create).toHaveBeenCalledWith({
        ...camposEsperados,
        desperdicio_percentual: 100,
      });
    });

    test("Deve ignorar campos que não pertencem à configuração", async () => {
      await salvarConfiguracao(7, 99, {
        ...dadosValidos,
        projeto_id: 999,
        usuario_id: 500,
        status: "FINALIZADO",
        campoInexistente: "teste",
      });

      expect(ConfiguracaoFabricacao.create).toHaveBeenCalledWith(
        camposEsperados
      );

      const dadosEnviados =
        ConfiguracaoFabricacao.create.mock.calls[0][0];

      expect(dadosEnviados).not.toHaveProperty("usuario_id");
      expect(dadosEnviados).not.toHaveProperty("status");
      expect(dadosEnviados).not.toHaveProperty("campoInexistente");
    });

    test("Deve preservar valores decimais válidos", async () => {
      await salvarConfiguracao(7, 99, {
        ...dadosValidos,
        fckMpa: 32.5,
        taxaArmaduraKgM3: 115.75,
        desperdicioPercentual: 7.5,
        consumoAreiaM3M3: 0.625,
        neopreneM2PorViga: 0.375,
      });

      expect(ConfiguracaoFabricacao.create).toHaveBeenCalledWith({
        ...camposEsperados,
        fck_mpa: 32.5,
        taxa_armadura_kg_m3: 115.75,
        desperdicio_percentual: 7.5,
        consumo_areia_m3_m3: 0.625,
        neoprene_m2_por_viga: 0.375,
      });
    });

    test("Deve propagar falhas durante a criação", async () => {
      ConfiguracaoFabricacao.create.mockRejectedValue(
        new Error("Falha ao cadastrar configuração")
      );

      await expect(
        salvarConfiguracao(7, 99, dadosValidos)
      ).rejects.toThrow("Falha ao cadastrar configuração");
    });

    test("Deve propagar falhas durante a atualização", async () => {
      ConfiguracaoFabricacao.findOne.mockResolvedValue(configuracao);

      configuracao.update.mockRejectedValue(
        new Error("Falha ao atualizar configuração")
      );

      await expect(
        salvarConfiguracao(7, 99, dadosValidos)
      ).rejects.toThrow("Falha ao atualizar configuração");

      expect(ConfiguracaoFabricacao.create).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas na busca da configuração existente", async () => {
      ConfiguracaoFabricacao.findOne.mockRejectedValue(
        new Error("Falha ao consultar configuração")
      );

      await expect(
        salvarConfiguracao(7, 99, dadosValidos)
      ).rejects.toThrow("Falha ao consultar configuração");

      expect(ConfiguracaoFabricacao.create).not.toHaveBeenCalled();
    });

    test("Deve permitir taxa de armadura null como zero", async () => {
      await salvarConfiguracao(7, 99, {
        ...dadosValidos,
        taxaArmaduraKgM3: null,
      });

      expect(ConfiguracaoFabricacao.create).toHaveBeenCalledWith({
        ...camposEsperados,
        taxa_armadura_kg_m3: 0,
      });
    });
  });

  describe("Validação dos parâmetros", () => {
    test.each([
      0,
      -1,
      "invalido",
      Infinity,
      -Infinity,
      undefined,
    ])("Deve rejeitar FCK inválido: %p", async (valor) => {
      await expect(
        salvarConfiguracao(7, 99, {
          ...dadosValidos,
          fckMpa: valor,
        })
      ).rejects.toThrow("FCK inválido.");

      expect(ConfiguracaoFabricacao.findOne).not.toHaveBeenCalled();
      expect(ConfiguracaoFabricacao.create).not.toHaveBeenCalled();
    });

    test.each([
      -1,
      "invalido",
      Infinity,
      undefined,
    ])("Deve rejeitar taxa de armadura inválida: %p", async (valor) => {
      await expect(
        salvarConfiguracao(7, 99, {
          ...dadosValidos,
          taxaArmaduraKgM3: valor,
        })
      ).rejects.toThrow("Taxa de armadura inválida.");

      expect(ConfiguracaoFabricacao.findOne).not.toHaveBeenCalled();
      expect(ConfiguracaoFabricacao.create).not.toHaveBeenCalled();
    });

    test.each([
      -1,
      101,
      "invalido",
      Infinity,
      -Infinity,
    ])("Deve rejeitar desperdício inválido: %p", async (valor) => {
      await expect(
        salvarConfiguracao(7, 99, {
          ...dadosValidos,
          desperdicioPercentual: valor,
        })
      ).rejects.toThrow(
        "Percentual de desperdício deve estar entre 0 e 100."
      );

      expect(ConfiguracaoFabricacao.findOne).not.toHaveBeenCalled();
      expect(ConfiguracaoFabricacao.create).not.toHaveBeenCalled();
    });

    test.each(
      consumosObrigatorios.flatMap(([nome, campo, mensagem]) =>
        [0, -1, "invalido"].map((valor) => [
          nome,
          campo,
          mensagem,
          valor,
        ])
      )
    )(
      "Deve rejeitar consumo inválido de %s: %p",
      async (nome, campo, mensagem, valor) => {
        await expect(
          salvarConfiguracao(7, 99, {
            ...dadosValidos,
            [campo]: valor,
          })
        ).rejects.toThrow(mensagem);

        expect(ConfiguracaoFabricacao.findOne).not.toHaveBeenCalled();
        expect(ConfiguracaoFabricacao.create).not.toHaveBeenCalled();
      }
    );

    test.each([
      -1,
      "invalido",
      Infinity,
      -Infinity,
    ])("Deve rejeitar quantidade de neoprene inválida: %p", async (valor) => {
      await expect(
        salvarConfiguracao(7, 99, {
          ...dadosValidos,
          neopreneM2PorViga: valor,
        })
      ).rejects.toThrow("Quantidade de neoprene inválida.");

      expect(ConfiguracaoFabricacao.findOne).not.toHaveBeenCalled();
      expect(ConfiguracaoFabricacao.create).not.toHaveBeenCalled();
    });
  });

  describe("Consulta das configurações", () => {
    test("Deve retornar a configuração específica do projeto", async () => {
      ConfiguracaoFabricacao.findOne.mockResolvedValue(configuracao);

      const resultado = await buscarConfiguracao(7, 99);

      expect(configuracao.toJSON).toHaveBeenCalledTimes(1);

      expect(resultado).toEqual({
        id: 15,
        ...camposEsperados,
        origem: "PROJETO",
        precos_padrao: precosEsperados,
      });
    });

    test("Deve retornar preços null quando não existir padrão", async () => {
      ConfiguracaoFabricacao.findOne.mockResolvedValue(configuracao);

      ConfiguracaoFabricacaoPadrao.findOne.mockResolvedValue(null);

      const resultado = await buscarConfiguracao(7, 99);

      expect(resultado.origem).toBe("PROJETO");
      expect(resultado.precos_padrao).toBeNull();
      expect(resultado.fck_mpa).toBe(30);
    });

    test("Deve utilizar os parâmetros padrão quando necessário", async () => {
      const resultado = await buscarConfiguracao(7, 99);

      expect(resultado).toEqual({
        id: null,
        projeto_id: 7,
        fck_mpa: 35,
        taxa_armadura_kg_m3: 120,
        desperdicio_percentual: 0,
        consumo_cimento_kg_m3: 380,
        consumo_areia_m3_m3: 0.65,
        consumo_brita_m3_m3: 0.85,
        consumo_agua_l_m3: 190,
        neoprene_m2_por_viga: 0.35,
        origem: "PADRAO",
        precos_padrao: precosEsperados,
      });
    });

    test("Deve converter o ID do projeto para número na configuração padrão", async () => {
      const resultado = await buscarConfiguracao("42", 99);

      expect(resultado.projeto_id).toBe(42);

      expect(Projeto.findOne).toHaveBeenCalledWith({
        where: {
          id: "42",
          usuario_id: 99,
        },
      });

      expect(ConfiguracaoFabricacao.findOne).toHaveBeenCalledWith({
        where: {
          projeto_id: "42",
        },
      });
    });

    test("Deve rejeitar consulta sem configuração própria ou padrão", async () => {
      ConfiguracaoFabricacaoPadrao.findOne.mockResolvedValue(null);

      await expect(
        buscarConfiguracao(7, 99)
      ).rejects.toThrow(
        "Nenhuma configuração padrão de fabricação foi cadastrada."
      );
    });

    test("Deve consultar os registros pelos critérios corretos", async () => {
      await buscarConfiguracao(7, 99);

      expect(ConfiguracaoFabricacao.findOne).toHaveBeenCalledWith({
        where: {
          projeto_id: 7,
        },
      });

      expect(
        ConfiguracaoFabricacaoPadrao.findOne
      ).toHaveBeenCalledWith({
        order: [["id", "ASC"]],
      });

      expect(ConfiguracaoFabricacao.create).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas ao consultar a configuração do projeto", async () => {
      ConfiguracaoFabricacao.findOne.mockRejectedValue(
        new Error("Erro ao consultar configuração do projeto")
      );

      await expect(
        buscarConfiguracao(7, 99)
      ).rejects.toThrow(
        "Erro ao consultar configuração do projeto"
      );

      expect(
        ConfiguracaoFabricacaoPadrao.findOne
      ).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas ao consultar a configuração padrão", async () => {
      ConfiguracaoFabricacaoPadrao.findOne.mockRejectedValue(
        new Error("Erro ao consultar configuração padrão")
      );

      await expect(
        buscarConfiguracao(7, 99)
      ).rejects.toThrow(
        "Erro ao consultar configuração padrão"
      );
    });

    test("Deve propagar falhas ao converter o registro para JSON", async () => {
      ConfiguracaoFabricacao.findOne.mockResolvedValue(configuracao);

      configuracao.toJSON.mockImplementation(() => {
        throw new Error("Falha ao converter configuração");
      });

      await expect(
        buscarConfiguracao(7, 99)
      ).rejects.toThrow("Falha ao converter configuração");
    });
  });
});