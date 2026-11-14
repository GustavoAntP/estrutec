jest.mock("../src/modelos/ConfiguracaoFabricacaoPadrao", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

const ConfiguracaoFabricacaoPadrao = require(
  "../src/modelos/ConfiguracaoFabricacaoPadrao"
);

const {
  buscarConfiguracaoPadrao,
  salvarConfiguracaoPadrao,
} = require("../src/servicos/configuracaoFabricacaoPadraoServico");

const camposConfiguracao = [
  ["fckMpa", "fck_mpa", 30],
  ["taxaArmaduraKgM3", "taxa_armadura_kg_m3", 120],
  ["consumoCimentoKgM3", "consumo_cimento_kg_m3", 380],
  ["consumoAreiaM3M3", "consumo_areia_m3_m3", 0.65],
  ["consumoBritaM3M3", "consumo_brita_m3_m3", 0.85],
  ["consumoAguaLM3", "consumo_agua_l_m3", 180],
  ["neopreneM2PorViga", "neoprene_m2_por_viga", 0.3],
  ["precoCimentoRsKg", "preco_cimento_rs_kg", 0.85],
  ["precoAreiaRsM3", "preco_areia_rs_m3", 125],
  ["precoBritaRsM3", "preco_brita_rs_m3", 160],
  ["precoAguaRsL", "preco_agua_rs_l", 0.02],
  ["precoAcoRsKg", "preco_aco_rs_kg", 7.8],
  ["precoNeopreneRsM2", "preco_neoprene_rs_m2", 220],
];

const dadosValidos = Object.fromEntries(
  camposConfiguracao.map(([entrada, , valor]) => [entrada, valor])
);

const camposEsperados = Object.fromEntries(
  camposConfiguracao.map(([, saida, valor]) => [saida, valor])
);

const camposZerados = Object.fromEntries(
  camposConfiguracao.map(([, saida]) => [saida, 0])
);

describe("Configuração padrão de fabricação - Estrutec", () => {
  let configuracao;

  beforeEach(() => {
    jest.resetAllMocks();

    configuracao = {
      id: 1,
      ...camposEsperados,
      update: jest.fn().mockImplementation(async (dados) => {
        Object.assign(configuracao, dados);
        return configuracao;
      }),
    };

    ConfiguracaoFabricacaoPadrao.findOne.mockResolvedValue(
      configuracao
    );

    ConfiguracaoFabricacaoPadrao.create.mockImplementation(
      async (dados) => ({
        id: 2,
        ...dados,
      })
    );
  });

  describe("Consulta das configurações", () => {
    test("Deve retornar a configuração existente", async () => {
      const resultado = await buscarConfiguracaoPadrao();

      expect(resultado).toBe(configuracao);

      expect(
        ConfiguracaoFabricacaoPadrao.findOne
      ).toHaveBeenCalledWith({
        order: [["id", "ASC"]],
      });

      expect(
        ConfiguracaoFabricacaoPadrao.create
      ).not.toHaveBeenCalled();
    });

    test("Deve criar configuração padrão quando não existir", async () => {
      ConfiguracaoFabricacaoPadrao.findOne.mockResolvedValue(
        null
      );

      const resultado = await buscarConfiguracaoPadrao();

      expect(
        ConfiguracaoFabricacaoPadrao.create
      ).toHaveBeenCalledWith({});

      expect(resultado).toEqual({
        id: 2,
      });
    });

    test("Deve propagar falhas durante a consulta", async () => {
      ConfiguracaoFabricacaoPadrao.findOne.mockRejectedValue(
        new Error("Falha ao consultar configurações")
      );

      await expect(
        buscarConfiguracaoPadrao()
      ).rejects.toThrow("Falha ao consultar configurações");

      expect(
        ConfiguracaoFabricacaoPadrao.create
      ).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas na criação automática", async () => {
      ConfiguracaoFabricacaoPadrao.findOne.mockResolvedValue(
        null
      );

      ConfiguracaoFabricacaoPadrao.create.mockRejectedValue(
        new Error("Falha ao criar configuração")
      );

      await expect(
        buscarConfiguracaoPadrao()
      ).rejects.toThrow("Falha ao criar configuração");
    });
  });

  describe("Salvamento das configurações", () => {
    test("Deve cadastrar todos os parâmetros de fabricação", async () => {
      ConfiguracaoFabricacaoPadrao.findOne.mockResolvedValue(
        null
      );

      const resultado = await salvarConfiguracaoPadrao(
        dadosValidos
      );

      expect(
        ConfiguracaoFabricacaoPadrao.create
      ).toHaveBeenCalledWith(camposEsperados);

      expect(resultado).toEqual({
        id: 2,
        ...camposEsperados,
      });

      expect(configuracao.update).not.toHaveBeenCalled();
    });

    test("Deve atualizar uma configuração existente", async () => {
      const resultado = await salvarConfiguracaoPadrao(
        dadosValidos
      );

      expect(
        ConfiguracaoFabricacaoPadrao.findOne
      ).toHaveBeenCalledWith({
        order: [["id", "ASC"]],
      });

      expect(configuracao.update).toHaveBeenCalledWith(
        camposEsperados
      );

      expect(resultado).toBe(configuracao);

      expect(
        ConfiguracaoFabricacaoPadrao.create
      ).not.toHaveBeenCalled();
    });

    test("Deve converter valores numéricos em formato de texto", async () => {
      const dados = Object.fromEntries(
        Object.entries(dadosValidos).map(([campo, valor]) => [
          campo,
          String(valor),
        ])
      );

      await salvarConfiguracaoPadrao(dados);

      expect(configuracao.update).toHaveBeenCalledWith(
        camposEsperados
      );
    });

    test("Deve utilizar zero quando nenhum parâmetro for informado", async () => {
      await salvarConfiguracaoPadrao({});

      expect(configuracao.update).toHaveBeenCalledWith(
        camposZerados
      );
    });

    test("Deve converter valores null para zero", async () => {
      const dados = Object.fromEntries(
        camposConfiguracao.map(([entrada]) => [
          entrada,
          null,
        ])
      );

      await salvarConfiguracaoPadrao(dados);

      expect(configuracao.update).toHaveBeenCalledWith(
        camposZerados
      );
    });

    test("Deve aceitar todos os parâmetros iguais a zero", async () => {
      const dados = Object.fromEntries(
        camposConfiguracao.map(([entrada]) => [
          entrada,
          0,
        ])
      );

      const resultado = await salvarConfiguracaoPadrao(
        dados
      );

      expect(configuracao.update).toHaveBeenCalledWith(
        camposZerados
      );

      expect(resultado.fck_mpa).toBe(0);
      expect(resultado.taxa_armadura_kg_m3).toBe(0);
    });

    test("Deve preservar valores decimais positivos", async () => {
      const dados = {
        ...dadosValidos,
        fckMpa: 32.5,
        taxaArmaduraKgM3: 115.75,
        consumoAreiaM3M3: 0.625,
        precoCimentoRsKg: 0.875,
      };

      await salvarConfiguracaoPadrao(dados);

      expect(configuracao.update).toHaveBeenCalledWith({
        ...camposEsperados,
        fck_mpa: 32.5,
        taxa_armadura_kg_m3: 115.75,
        consumo_areia_m3_m3: 0.625,
        preco_cimento_rs_kg: 0.875,
      });
    });

    test("Deve ignorar campos não pertencentes à configuração", async () => {
      await salvarConfiguracaoPadrao({
        ...dadosValidos,
        id: 999,
        usuarioId: 500,
        campoInexistente: "teste",
      });

      expect(configuracao.update).toHaveBeenCalledWith(
        camposEsperados
      );

      const dadosEnviados = configuracao.update.mock.calls[0][0];

      expect(dadosEnviados).not.toHaveProperty("id");
      expect(dadosEnviados).not.toHaveProperty("usuarioId");
      expect(dadosEnviados).not.toHaveProperty(
        "campoInexistente"
      );
    });

    test("Deve preencher parâmetros ausentes com zero", async () => {
      await salvarConfiguracaoPadrao({
        fckMpa: 40,
        taxaArmaduraKgM3: 150,
      });

      expect(configuracao.update).toHaveBeenCalledWith({
        ...camposZerados,
        fck_mpa: 40,
        taxa_armadura_kg_m3: 150,
      });
    });

    test("Deve propagar falhas ao consultar a configuração", async () => {
      ConfiguracaoFabricacaoPadrao.findOne.mockRejectedValue(
        new Error("Erro ao consultar configurações")
      );

      await expect(
        salvarConfiguracaoPadrao(dadosValidos)
      ).rejects.toThrow("Erro ao consultar configurações");

      expect(configuracao.update).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas na criação da configuração", async () => {
      ConfiguracaoFabricacaoPadrao.findOne.mockResolvedValue(
        null
      );

      ConfiguracaoFabricacaoPadrao.create.mockRejectedValue(
        new Error("Erro ao salvar configuração")
      );

      await expect(
        salvarConfiguracaoPadrao(dadosValidos)
      ).rejects.toThrow("Erro ao salvar configuração");
    });

    test("Deve propagar falhas na atualização da configuração", async () => {
      configuracao.update.mockRejectedValue(
        new Error("Erro ao atualizar configuração")
      );

      await expect(
        salvarConfiguracaoPadrao(dadosValidos)
      ).rejects.toThrow("Erro ao atualizar configuração");

      expect(
        ConfiguracaoFabricacaoPadrao.create
      ).not.toHaveBeenCalled();
    });
  });

  describe("Validação dos parâmetros", () => {
    test.each(camposConfiguracao)(
      "Deve rejeitar valor negativo no campo %s",
      async (campoEntrada) => {
        await expect(
          salvarConfiguracaoPadrao({
            ...dadosValidos,
            [campoEntrada]: -1,
          })
        ).rejects.toThrow(
          "Os valores informados devem ser números válidos e não negativos."
        );

        expect(
          ConfiguracaoFabricacaoPadrao.findOne
        ).not.toHaveBeenCalled();

        expect(configuracao.update).not.toHaveBeenCalled();
      }
    );

    test.each(camposConfiguracao)(
      "Deve rejeitar valor não numérico no campo %s",
      async (campoEntrada) => {
        await expect(
          salvarConfiguracaoPadrao({
            ...dadosValidos,
            [campoEntrada]: "valor-invalido",
          })
        ).rejects.toThrow(
          "Os valores informados devem ser números válidos e não negativos."
        );

        expect(
          ConfiguracaoFabricacaoPadrao.findOne
        ).not.toHaveBeenCalled();

        expect(
          ConfiguracaoFabricacaoPadrao.create
        ).not.toHaveBeenCalled();
      }
    );

    test.each([
      Infinity,
      -Infinity,
    ])(
      "Deve rejeitar valores infinitos: %p",
      async (valor) => {
        await expect(
          salvarConfiguracaoPadrao({
            ...dadosValidos,
            fckMpa: valor,
          })
        ).rejects.toThrow(
          "Os valores informados devem ser números válidos e não negativos."
        );

        expect(
          ConfiguracaoFabricacaoPadrao.findOne
        ).not.toHaveBeenCalled();

        expect(configuracao.update).not.toHaveBeenCalled();
      }
    );
  });
});