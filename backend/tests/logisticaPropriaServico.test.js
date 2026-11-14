jest.mock("../src/modelos/Projeto", () => ({
  findOne: jest.fn()
}));

jest.mock("../src/modelos/LogisticaProjeto", () => ({
  findOne: jest.fn()
}));

jest.mock("../src/modelos/LogisticaPropria", () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock("../src/modelos/ElementoProjeto", () => ({
  findAll: jest.fn()
}));

const Projeto = require("../src/modelos/Projeto");
const LogisticaProjeto = require("../src/modelos/LogisticaProjeto");
const LogisticaPropria = require("../src/modelos/LogisticaPropria");
const ElementoProjeto = require("../src/modelos/ElementoProjeto");

const {
  salvarLogisticaPropria,
  buscarLogisticaPropria,
  calcularCustoFreteProprio,
  sugerirQuantidadeViagens,
  aplicarSugestaoViagens
} = require("../src/servicos/logisticaPropriaServico");

// Dados utilizados nos testes de cadastro
const dadosBase = {
  distanciaIdaKm: 100,
  quantidadeViagens: 2,
  considerarIdaVolta: true,
  consumoCarregadoKmL: 2,
  consumoVazioKmL: 4,
  precoDieselL: 6,
  capacidadePecas: 3,
  capacidadePesoKg: 4000,
  pedagios: 30,
  custoMotoristaPorViagem: 100,
  alimentacaoMotoristaPorViagem: 20,
  manutencaoPorKm: 0.5,
  custoCarregamentoPorViagem: 40,
  custoDescarregamentoPorViagem: 50,
  seguro: 60,
  outrosCustos: 70
};

// Dados simulados de transporte já cadastrado
const criarFrete = (alteracoes = {}) => ({
  distancia_ida_km: 100,
  quantidade_viagens: 2,
  considerar_ida_volta: true,
  consumo_carregado_km_l: 2,
  consumo_vazio_km_l: 4,
  preco_diesel_l: 6,
  capacidade_pecas: 3,
  capacidade_peso_kg: 4000,
  pedagios: 30,
  custo_motorista_por_viagem: 100,
  alimentacao_motorista_por_viagem: 20,
  manutencao_por_km: 0.5,
  custo_carregamento_por_viagem: 40,
  custo_descarregamento_por_viagem: 50,
  seguro: 60,
  outros_custos: 70,
  cavalo_mecanico: "Volvo FH",
  carreta: "Carreta Teste",
  update: jest.fn().mockResolvedValue(undefined),
  ...alteracoes
});

describe("Logística própria - Estrutec", () => {

  beforeEach(() => {
    jest.resetAllMocks();

    Projeto.findOne.mockResolvedValue({
      id: 1,
      usuario_id: 1
    });

    LogisticaProjeto.findOne.mockResolvedValue({
      id: 10,
      projeto_id: 1,
      tipo_frete: "PROPRIO"
    });

    LogisticaPropria.findOne.mockResolvedValue(
      criarFrete()
    );

    ElementoProjeto.findAll.mockResolvedValue([
      {
        id: 1,
        nome_aplicacao: "V01",
        quantidade: 5,
        peso_unitario_kg: 1000
      }
    ]);
  });

  // TESTE 1
  test("Deve cadastrar logística própria", async () => {
    LogisticaPropria.findOne.mockResolvedValue(null);

    LogisticaPropria.create.mockImplementation(
      async (dados) => dados
    );

    const resultado = await salvarLogisticaPropria(
      1, 1, dadosBase
    );

    expect(resultado.distancia_ida_km).toBe(100);

    expect(resultado.quantidade_viagens).toBe(2);

    expect(LogisticaPropria.create).toHaveBeenCalledWith(
      expect.objectContaining({
        logistica_id: 10,
        distancia_ida_km: 100,
        quantidade_viagens: 2
      })
    );
  });

  // TESTE 2
  test("Deve atualizar transporte existente", async () => {
    const frete = criarFrete();

    LogisticaPropria.findOne.mockResolvedValue(frete);

    await salvarLogisticaPropria(1, 1, dadosBase);

    expect(frete.update).toHaveBeenCalledWith(
      expect.objectContaining({
        distancia_ida_km: 100,
        quantidade_viagens: 2
      })
    );
  });

  // TESTES 3 A 10
  test.each([
    [
      "distância zerada",
      "distanciaIdaKm",
      0,
      "Distância inválida."
    ],
    [
      "quantidade de viagens fracionária",
      "quantidadeViagens",
      1.5,
      "Quantidade de viagens inválida."
    ],
    [
      "consumo carregado zerado",
      "consumoCarregadoKmL",
      0,
      "Consumo carregado inválido."
    ],
    [
      "consumo vazio negativo",
      "consumoVazioKmL",
      -1,
      "Consumo vazio inválido."
    ],
    [
      "diesel negativo",
      "precoDieselL",
      -5,
      "Preço do diesel inválido."
    ],
    [
      "capacidade de peças inválida",
      "capacidadePecas",
      0,
      "Capacidade de peças inválida."
    ],
    [
      "capacidade de peso negativa",
      "capacidadePesoKg",
      -100,
      "Capacidade de peso inválida."
    ],
    [
      "pedágio negativo",
      "pedagios",
      -10,
      "Pedágio inválido."
    ]
  ])(
    "Deve rejeitar %s",
    async (_, campo, valor, mensagem) => {
      const dados = {
        ...dadosBase,
        [campo]: valor
      };

      await expect(
        salvarLogisticaPropria(1, 1, dados)
      ).rejects.toThrow(mensagem);

      expect(LogisticaPropria.create)
        .not.toHaveBeenCalled();
    }
  );

  // TESTE 11
  test("Deve rejeitar projeto inexistente", async () => {
    Projeto.findOne.mockResolvedValue(null);

    await expect(
      calcularCustoFreteProprio(999, 1)
    ).rejects.toThrow("Projeto não encontrado.");
  });

  // TESTE 12
  test("Deve rejeitar logística não configurada", async () => {
    LogisticaProjeto.findOne.mockResolvedValue(null);

    await expect(
      calcularCustoFreteProprio(1, 1)
    ).rejects.toThrow(
      "Logística ainda não configurada."
    );
  });

  // TESTE 13
  test("Deve rejeitar modalidade terceirizada", async () => {
    LogisticaProjeto.findOne.mockResolvedValue({
      id: 10,
      tipo_frete: "TERCEIRIZADO"
    });

    await expect(
      calcularCustoFreteProprio(1, 1)
    ).rejects.toThrow(
      "O projeto não está configurado para frete próprio."
    );
  });

  // TESTE 14
  test("Deve consultar transporte cadastrado", async () => {
    const resultado = await buscarLogisticaPropria(1, 1);

    expect(resultado.distancia_ida_km).toBe(100);

    expect(resultado.quantidade_viagens).toBe(2);
  });

  // TESTE 15
  test("Deve rejeitar consulta sem dados de transporte", async () => {
    LogisticaPropria.findOne.mockResolvedValue(null);

    await expect(
      buscarLogisticaPropria(1, 1)
    ).rejects.toThrow(
      "Dados do frete próprio ainda não cadastrados."
    );
  });

  // TESTE 16
  test("Deve calcular custo com ida e volta", async () => {
    const resultado = await calcularCustoFreteProprio(1, 1);

    expect(resultado.transporte.kmCarregado).toBe(200);

    expect(resultado.transporte.kmVazio).toBe(200);

    expect(resultado.transporte.kmTotal).toBe(400);

    expect(resultado.combustivel.litrosTotal).toBe(150);

    expect(resultado.custos.combustivel).toBe(900);

    expect(resultado.custos.manutencao).toBe(200);

    expect(resultado.custos.motorista).toBe(200);

    expect(resultado.custoTotalFreteProprio).toBe(1710);

    expect(resultado.custoPorViagem).toBe(855);
  });

  // TESTE 17
  test("Deve calcular transporte somente de ida", async () => {
    LogisticaPropria.findOne.mockResolvedValue(
      criarFrete({
        considerar_ida_volta: false
      })
    );

    const resultado = await calcularCustoFreteProprio(1, 1);

    expect(resultado.transporte.kmCarregado).toBe(200);

    expect(resultado.transporte.kmVazio).toBe(0);

    expect(resultado.transporte.kmTotal).toBe(200);

    expect(resultado.custos.combustivel).toBe(600);

    expect(resultado.custoTotalFreteProprio).toBe(1310);
  });

  // TESTE 18
  test("Deve sugerir viagens pela quantidade de peças", async () => {
    LogisticaPropria.findOne.mockResolvedValue(
      criarFrete({
        capacidade_peso_kg: null
      })
    );

    ElementoProjeto.findAll.mockResolvedValue([
      {
        id: 1,
        quantidade: 7,
        peso_unitario_kg: 500
      }
    ]);

    const resultado = await sugerirQuantidadeViagens(1, 1);

    expect(resultado.totalPecas).toBe(7);

    expect(resultado.calculo.viagensPorPecas).toBe(3);

    expect(
      resultado.calculo.quantidadeViagensSugerida
    ).toBe(3);

    expect(resultado.calculo.criterioLimitante)
      .toBe("PECAS");
  });

  // TESTE 19
  test("Deve limitar viagens pelo peso", async () => {
    ElementoProjeto.findAll.mockResolvedValue([
      {
        id: 1,
        quantidade: 2,
        peso_unitario_kg: 3000
      }
    ]);

    const resultado = await sugerirQuantidadeViagens(1, 1);

    expect(resultado.pesoTotalKg).toBe(6000);

    expect(resultado.calculo.viagensPorPecas).toBe(1);

    expect(resultado.calculo.viagensPorPeso).toBe(2);

    expect(resultado.calculo.criterioLimitante)
      .toBe("PESO");
  });

  // TESTE 20
  test("Deve identificar empate entre peso e peças", async () => {
    ElementoProjeto.findAll.mockResolvedValue([
      {
        id: 1,
        quantidade: 4,
        peso_unitario_kg: 1500
      }
    ]);

    const resultado = await sugerirQuantidadeViagens(1, 1);

    expect(resultado.calculo.viagensPorPecas).toBe(2);

    expect(resultado.calculo.viagensPorPeso).toBe(2);

    expect(resultado.calculo.criterioLimitante)
      .toBe("EMPATE");
  });

  // TESTE 21
  test("Deve identificar elementos sem peso", async () => {
    ElementoProjeto.findAll.mockResolvedValue([
      {
        id: 1,
        nome_aplicacao: "V01",
        quantidade: 2,
        peso_unitario_kg: null
      }
    ]);

    const resultado = await sugerirQuantidadeViagens(1, 1);

    expect(resultado.calculo.criterioLimitante)
      .toBe("PESO_PENDENTE");

    expect(
      resultado.calculo.quantidadeViagensSugerida
    ).toBeNull();

    expect(resultado.elementosSemPeso).toHaveLength(1);
  });

  // TESTE 22
  test("Deve rejeitar capacidade de peças inválida", async () => {
    LogisticaPropria.findOne.mockResolvedValue(
      criarFrete({
        capacidade_pecas: 0
      })
    );

    await expect(
      sugerirQuantidadeViagens(1, 1)
    ).rejects.toThrow(
      "Informe uma capacidade de peças válida para a carreta."
    );
  });

  // TESTE 23
  test("Deve rejeitar projeto sem elementos", async () => {
    ElementoProjeto.findAll.mockResolvedValue([]);

    await expect(
      sugerirQuantidadeViagens(1, 1)
    ).rejects.toThrow(
      "O projeto não possui elementos cadastrados."
    );
  });

  // TESTE 24
  test("Deve aplicar sugestão de viagens", async () => {
    const frete = criarFrete();

    LogisticaPropria.findOne.mockResolvedValue(frete);

    ElementoProjeto.findAll.mockResolvedValue([
      {
        id: 1,
        quantidade: 7,
        peso_unitario_kg: 100
      }
    ]);

    const resultado = await aplicarSugestaoViagens(1, 1);

    expect(resultado.quantidadeAnterior).toBe(2);

    expect(resultado.quantidadeAtual).toBe(3);

    expect(frete.update).toHaveBeenCalledWith({
      quantidade_viagens: 3
    });
  });

  // TESTE 25
  test("Não deve aplicar sugestão com peso pendente", async () => {
    const frete = criarFrete();

    LogisticaPropria.findOne.mockResolvedValue(frete);

    ElementoProjeto.findAll.mockResolvedValue([
      {
        id: 1,
        quantidade: 2,
        peso_unitario_kg: null
      }
    ]);

    await expect(
      aplicarSugestaoViagens(1, 1)
    ).rejects.toThrow(
      "Não é possível aplicar a sugestão enquanto existirem elementos sem peso informado."
    );

    expect(frete.update).not.toHaveBeenCalled();
  });

});