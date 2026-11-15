jest.mock("../src/modelos/Projeto", () => ({
  findOne: jest.fn(),
}));

jest.mock("../src/modelos/PrecoFabricacao", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

const Projeto = require("../src/modelos/Projeto");
const PrecoFabricacao = require("../src/modelos/PrecoFabricacao");

const {
  salvarPrecos,
  buscarPrecos,
} = require("../src/servicos/precoFabricacaoServico");

const campos = [
  ["precoCimentoKg", "preco_cimento_kg", 0.85],
  ["precoAreiaM3", "preco_areia_m3", 125],
  ["precoBritaM3", "preco_brita_m3", 160],
  ["precoAguaL", "preco_agua_l", 0.02],
  ["precoAcoKg", "preco_aco_kg", 7.8],
  ["precoNeopreneM2", "preco_neoprene_m2", 220],
];

const dadosValidos = Object.fromEntries(
  campos.map(([entrada, , valor]) => [entrada, valor])
);

const camposEsperados = Object.fromEntries(
  campos.map(([, saida, valor]) => [saida, valor])
);

const camposZerados = Object.fromEntries(
  campos.map(([, saida]) => [saida, 0])
);

describe("Serviço de preços de fabricação - Estrutec", () => {
  let projeto;
  let registro;

  beforeEach(() => {
    jest.resetAllMocks();

    projeto = {
      id: 7,
      codigo: "EST-007",
      nome: "Projeto de Vigas",
      usuario_id: 99,
      status: "EM_ANDAMENTO",
    };

    registro = {
      id: 15,
      projeto_id: 7,
      ...camposEsperados,
      update: jest.fn().mockImplementation(async (dados) => {
        Object.assign(registro, dados);
        return registro;
      }),
    };

    Projeto.findOne.mockResolvedValue(projeto);

    PrecoFabricacao.findOne.mockResolvedValue(null);

    PrecoFabricacao.create.mockImplementation(async (dados) => ({
      id: 16,
      ...dados,
    }));
  });

  describe("Controle de acesso aos projetos", () => {
    test("Deve impedir salvamento em projeto inexistente", async () => {
      Projeto.findOne.mockResolvedValue(null);

      await expect(
        salvarPrecos(999, 99, dadosValidos)
      ).rejects.toThrow("Projeto não encontrado.");

      expect(PrecoFabricacao.findOne).not.toHaveBeenCalled();
      expect(PrecoFabricacao.create).not.toHaveBeenCalled();
    });

    test("Deve impedir consulta de projeto inexistente", async () => {
      Projeto.findOne.mockResolvedValue(null);

      await expect(
        buscarPrecos(999, 99)
      ).rejects.toThrow("Projeto não encontrado.");

      expect(PrecoFabricacao.findOne).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas na verificação do projeto durante o salvamento", async () => {
      Projeto.findOne.mockRejectedValue(
        new Error("Falha ao consultar projeto")
      );

      await expect(
        salvarPrecos(7, 99, dadosValidos)
      ).rejects.toThrow("Falha ao consultar projeto");

      expect(PrecoFabricacao.findOne).not.toHaveBeenCalled();
      expect(PrecoFabricacao.create).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas na verificação do projeto durante a consulta", async () => {
      Projeto.findOne.mockRejectedValue(
        new Error("Erro de conexão com o banco")
      );

      await expect(
        buscarPrecos(7, 99)
      ).rejects.toThrow("Erro de conexão com o banco");

      expect(PrecoFabricacao.findOne).not.toHaveBeenCalled();
    });
  });

  describe("Cadastro e atualização dos preços", () => {
    test("Deve cadastrar os seis preços de fabricação", async () => {
      const resultado = await salvarPrecos(
        7,
        99,
        dadosValidos
      );

      expect(PrecoFabricacao.create).toHaveBeenCalledWith({
        projeto_id: 7,
        ...camposEsperados,
      });

      expect(resultado).toEqual({
        id: 16,
        projeto_id: 7,
        ...camposEsperados,
      });

      expect(registro.update).not.toHaveBeenCalled();
    });

    test("Deve atualizar os preços quando já existir um registro", async () => {
      PrecoFabricacao.findOne.mockResolvedValue(registro);

      const resultado = await salvarPrecos(
        7,
        99,
        dadosValidos
      );

      expect(registro.update).toHaveBeenCalledWith(
        camposEsperados
      );

      expect(registro.update).toHaveBeenCalledTimes(1);

      expect(PrecoFabricacao.create).not.toHaveBeenCalled();

      expect(resultado).toBe(registro);
    });

    test("Deve consultar os preços pelo identificador do projeto", async () => {
      await salvarPrecos(7, 99, dadosValidos);

      expect(PrecoFabricacao.findOne).toHaveBeenCalledWith({
        where: {
          projeto_id: 7,
        },
      });

      expect(PrecoFabricacao.findOne).toHaveBeenCalledTimes(1);
    });

    test("Deve vincular os preços ao projeto informado", async () => {
      await salvarPrecos(42, 99, dadosValidos);

      expect(Projeto.findOne).toHaveBeenCalledWith({
        where: {
          id: 42,
          usuario_id: 99,
        },
      });

      expect(PrecoFabricacao.create).toHaveBeenCalledWith({
        projeto_id: 42,
        ...camposEsperados,
      });
    });

    test("Deve converter preços numéricos recebidos como texto", async () => {
      const dados = Object.fromEntries(
        Object.entries(dadosValidos).map(([campo, valor]) => [
          campo,
          String(valor),
        ])
      );

      await salvarPrecos(7, 99, dados);

      expect(PrecoFabricacao.create).toHaveBeenCalledWith({
        projeto_id: 7,
        ...camposEsperados,
      });
    });

    test("Deve aceitar todos os preços iguais a zero", async () => {
      const dados = Object.fromEntries(
        campos.map(([entrada]) => [entrada, 0])
      );

      const resultado = await salvarPrecos(7, 99, dados);

      expect(PrecoFabricacao.create).toHaveBeenCalledWith({
        projeto_id: 7,
        ...camposZerados,
      });

      expect(resultado.preco_cimento_kg).toBe(0);
      expect(resultado.preco_aco_kg).toBe(0);
    });

    test("Deve preservar preços decimais válidos", async () => {
      const dados = {
        ...dadosValidos,
        precoCimentoKg: 0.875,
        precoAreiaM3: 125.75,
        precoBritaM3: 160.5,
        precoAguaL: 0.025,
        precoAcoKg: 7.85,
        precoNeopreneM2: 220.99,
      };

      await salvarPrecos(7, 99, dados);

      expect(PrecoFabricacao.create).toHaveBeenCalledWith({
        projeto_id: 7,
        preco_cimento_kg: 0.875,
        preco_areia_m3: 125.75,
        preco_brita_m3: 160.5,
        preco_agua_l: 0.025,
        preco_aco_kg: 7.85,
        preco_neoprene_m2: 220.99,
      });
    });

    test("Deve converter valores null para zero", async () => {
      const dados = Object.fromEntries(
        campos.map(([entrada]) => [entrada, null])
      );

      await salvarPrecos(7, 99, dados);

      expect(PrecoFabricacao.create).toHaveBeenCalledWith({
        projeto_id: 7,
        ...camposZerados,
      });
    });

    test("Deve converter textos vazios para zero", async () => {
      const dados = Object.fromEntries(
        campos.map(([entrada]) => [entrada, ""])
      );

      await salvarPrecos(7, 99, dados);

      expect(PrecoFabricacao.create).toHaveBeenCalledWith({
        projeto_id: 7,
        ...camposZerados,
      });
    });

    test("Deve ignorar campos não pertencentes aos preços", async () => {
      await salvarPrecos(7, 99, {
        ...dadosValidos,
        projeto_id: 999,
        usuario_id: 500,
        status: "FINALIZADO",
        campoInexistente: "teste",
      });

      expect(PrecoFabricacao.create).toHaveBeenCalledWith({
        projeto_id: 7,
        ...camposEsperados,
      });

      const dadosEnviados =
        PrecoFabricacao.create.mock.calls[0][0];

      expect(dadosEnviados).not.toHaveProperty("usuario_id");
      expect(dadosEnviados).not.toHaveProperty("status");
      expect(dadosEnviados).not.toHaveProperty(
        "campoInexistente"
      );
    });

    test("Não deve consultar preços quando houver valor inválido", async () => {
      await expect(
        salvarPrecos(7, 99, {
          ...dadosValidos,
          precoCimentoKg: -10,
        })
      ).rejects.toThrow(
        "Todos os preços devem possuir valores válidos."
      );

      expect(Projeto.findOne).toHaveBeenCalledTimes(1);
      expect(PrecoFabricacao.findOne).not.toHaveBeenCalled();
      expect(PrecoFabricacao.create).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas durante a busca dos preços existentes", async () => {
      PrecoFabricacao.findOne.mockRejectedValue(
        new Error("Falha ao consultar preços")
      );

      await expect(
        salvarPrecos(7, 99, dadosValidos)
      ).rejects.toThrow("Falha ao consultar preços");

      expect(PrecoFabricacao.create).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas durante o cadastro dos preços", async () => {
      PrecoFabricacao.create.mockRejectedValue(
        new Error("Falha ao cadastrar preços")
      );

      await expect(
        salvarPrecos(7, 99, dadosValidos)
      ).rejects.toThrow("Falha ao cadastrar preços");
    });

    test("Deve propagar falhas durante a atualização dos preços", async () => {
      PrecoFabricacao.findOne.mockResolvedValue(registro);

      registro.update.mockRejectedValue(
        new Error("Falha ao atualizar preços")
      );

      await expect(
        salvarPrecos(7, 99, dadosValidos)
      ).rejects.toThrow("Falha ao atualizar preços");

      expect(PrecoFabricacao.create).not.toHaveBeenCalled();
    });
  });

  describe("Validação dos preços", () => {
    test.each(campos)(
      "Deve rejeitar preço negativo no campo %s",
      async (campoEntrada) => {
        await expect(
          salvarPrecos(7, 99, {
            ...dadosValidos,
            [campoEntrada]: -1,
          })
        ).rejects.toThrow(
          "Todos os preços devem possuir valores válidos."
        );

        expect(PrecoFabricacao.findOne).not.toHaveBeenCalled();
        expect(PrecoFabricacao.create).not.toHaveBeenCalled();
      }
    );

    test.each(campos)(
      "Deve rejeitar valor não numérico no campo %s",
      async (campoEntrada) => {
        await expect(
          salvarPrecos(7, 99, {
            ...dadosValidos,
            [campoEntrada]: "valor-invalido",
          })
        ).rejects.toThrow(
          "Todos os preços devem possuir valores válidos."
        );

        expect(PrecoFabricacao.findOne).not.toHaveBeenCalled();
        expect(PrecoFabricacao.create).not.toHaveBeenCalled();
      }
    );

    test.each(campos)(
      "Deve rejeitar campo obrigatório ausente: %s",
      async (campoEntrada) => {
        await expect(
          salvarPrecos(7, 99, {
            ...dadosValidos,
            [campoEntrada]: undefined,
          })
        ).rejects.toThrow(
          "Todos os preços devem possuir valores válidos."
        );

        expect(PrecoFabricacao.findOne).not.toHaveBeenCalled();
        expect(PrecoFabricacao.create).not.toHaveBeenCalled();
      }
    );

    test.each([Infinity, -Infinity])(
      "Deve rejeitar preços infinitos: %p",
      async (valor) => {
        await expect(
          salvarPrecos(7, 99, {
            ...dadosValidos,
            precoCimentoKg: valor,
          })
        ).rejects.toThrow(
          "Todos os preços devem possuir valores válidos."
        );

        expect(PrecoFabricacao.findOne).not.toHaveBeenCalled();
      }
    );

    test("Deve rejeitar NaN", async () => {
      await expect(
        salvarPrecos(7, 99, {
          ...dadosValidos,
          precoAcoKg: NaN,
        })
      ).rejects.toThrow(
        "Todos os preços devem possuir valores válidos."
      );

      expect(PrecoFabricacao.create).not.toHaveBeenCalled();
    });

    test("Deve rejeitar números decimais com vírgula", async () => {
      await expect(
        salvarPrecos(7, 99, {
          ...dadosValidos,
          precoCimentoKg: "1,5",
        })
      ).rejects.toThrow(
        "Todos os preços devem possuir valores válidos."
      );

      expect(PrecoFabricacao.findOne).not.toHaveBeenCalled();
    });
  });

  describe("Consulta dos preços cadastrados", () => {
    test("Deve retornar os preços existentes", async () => {
      PrecoFabricacao.findOne.mockResolvedValue(registro);

      const resultado = await buscarPrecos(7, 99);

      expect(resultado).toBe(registro);

      expect(resultado).toEqual(
        expect.objectContaining({
          projeto_id: 7,
          ...camposEsperados,
        })
      );
    });

    test("Deve consultar preços somente após verificar o proprietário", async () => {
      PrecoFabricacao.findOne.mockResolvedValue(registro);

      await buscarPrecos(7, 99);

      expect(Projeto.findOne).toHaveBeenCalledWith({
        where: {
          id: 7,
          usuario_id: 99,
        },
      });

      expect(PrecoFabricacao.findOne).toHaveBeenCalledWith({
        where: {
          projeto_id: 7,
        },
      });

      expect(Projeto.findOne).toHaveBeenCalledTimes(1);
      expect(PrecoFabricacao.findOne).toHaveBeenCalledTimes(1);
    });

    test("Deve rejeitar consulta quando os preços não estiverem cadastrados", async () => {
      PrecoFabricacao.findOne.mockResolvedValue(null);

      await expect(
        buscarPrecos(7, 99)
      ).rejects.toThrow(
        "Preços de fabricação ainda não cadastrados."
      );

      expect(PrecoFabricacao.create).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas durante a consulta dos preços", async () => {
      PrecoFabricacao.findOne.mockRejectedValue(
        new Error("Falha ao buscar preços de fabricação")
      );

      await expect(
        buscarPrecos(7, 99)
      ).rejects.toThrow(
        "Falha ao buscar preços de fabricação"
      );

      expect(PrecoFabricacao.create).not.toHaveBeenCalled();
    });
  });
});