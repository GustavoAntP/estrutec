jest.mock("../src/modelos/Projeto", () => ({
  findOne: jest.fn()
}));

jest.mock("../src/modelos/ElementoProjeto", () => ({
  findAll: jest.fn()
}));

jest.mock("../src/modelos/ConfiguracaoFabricacao", () => ({
  findOne: jest.fn()
}));

jest.mock("../src/modelos/PrecoFabricacao", () => ({
  findOne: jest.fn()
}));

const Projeto = require("../src/modelos/Projeto");
const ElementoProjeto = require("../src/modelos/ElementoProjeto");
const ConfiguracaoFabricacao = require("../src/modelos/ConfiguracaoFabricacao");
const PrecoFabricacao = require("../src/modelos/PrecoFabricacao");

const {
  calcularVolumes,
  calcularMateriais,
  calcularCustos,
  confirmarFabricacao
} = require("../src/servicos/fabricacaoServico");

describe("Testes de fabricação - Estrutec", () => {

  let projeto;

  const viga = {
    id: 10,
    nome_aplicacao: "Viga de teste",
    tipo: "VIGA",
    secao: "20x50",
    largura: 0.2,
    altura: 0.5,
    comprimento: 5,
    quantidade: 2
  };

  beforeEach(() => {
    jest.resetAllMocks();

    projeto = {
      id: 1,
      codigo: "PROJ-001",
      nome: "Projeto Teste",
      status: "EM_ANDAMENTO",

      update: jest.fn().mockImplementation(async (dados) => {
        Object.assign(projeto, dados);
      })
    };

    Projeto.findOne.mockResolvedValue(projeto);

    ElementoProjeto.findAll.mockResolvedValue([
      { ...viga }
    ]);

    ConfiguracaoFabricacao.findOne.mockResolvedValue({
      fck_mpa: 30,
      desperdicio_percentual: 10,
      consumo_cimento_kg_m3: 300,
      consumo_areia_m3_m3: 0.5,
      consumo_brita_m3_m3: 0.8,
      consumo_agua_l_m3: 180,
      taxa_armadura_kg_m3: 100,
      neoprene_m2_por_viga: 0.3
    });

    PrecoFabricacao.findOne.mockResolvedValue({
      preco_cimento_kg: 1,
      preco_areia_m3: 100,
      preco_brita_m3: 100,
      preco_agua_l: 0.02,
      preco_aco_kg: 5,
      preco_neoprene_m2: 50
    });
  });

  // TESTE 1
  test("Deve calcular corretamente o volume da viga", async () => {

    const resultado = await calcularVolumes(1, 1);

    expect(resultado.resumo.volumeTotalM3).toBeCloseTo(1);

    expect(resultado.elementos[0].volumeUnitario).toBeCloseTo(0.5);

    expect(resultado.elementos[0].volumeTotal).toBeCloseTo(1);
  });

  // TESTE 2
  test("Deve rejeitar projeto inexistente", async () => {

    Projeto.findOne.mockResolvedValue(null);

    await expect(
      calcularVolumes(999, 1)
    ).rejects.toThrow("Projeto não encontrado.");
  });

  // TESTE 3
  test("Deve rejeitar projeto sem elementos", async () => {

    ElementoProjeto.findAll.mockResolvedValue([]);

    await expect(
      calcularVolumes(1, 1)
    ).rejects.toThrow(
      "O projeto não possui elementos estruturais cadastrados."
    );
  });

  // TESTES 4 A 7
  test.each([
    ["largura zerada", { largura: 0 }],
    ["altura negativa", { altura: -1 }],
    ["comprimento inválido", { comprimento: "abc" }],
    ["quantidade zerada", { quantidade: 0 }]
  ])("Deve rejeitar %s", async (_, alteracao) => {

    ElementoProjeto.findAll.mockResolvedValue([
      { ...viga, ...alteracao }
    ]);

    await expect(
      calcularVolumes(1, 1)
    ).rejects.toThrow(/dimensões inválidas/);
  });

  // TESTE 8
  test("Deve contabilizar a quantidade total de peças", async () => {

    const resultado = await calcularVolumes(1, 1);

    expect(resultado.resumo.totalPecas).toBe(2);
  });

  // TESTE 9
  test("Deve calcular corretamente os materiais", async () => {

    const resultado = await calcularMateriais(1, 1);

    expect(resultado.materiais.cimentoKg).toBeCloseTo(330);

    expect(resultado.materiais.areiaM3).toBeCloseTo(0.55);

    expect(resultado.materiais.britaM3).toBeCloseTo(0.88);

    expect(resultado.materiais.aguaLitros).toBeCloseTo(198);

    expect(resultado.materiais.acoKg).toBeCloseTo(110);

    expect(resultado.materiais.neopreneM2).toBeCloseTo(0.6);

    expect(resultado.resumo.totalVigas).toBe(2);
  });

  // TESTE 10
  test("Deve rejeitar fabricação sem configuração", async () => {

    ConfiguracaoFabricacao.findOne.mockResolvedValue(null);

    await expect(
      calcularMateriais(1, 1)
    ).rejects.toThrow(
      "Configuração de fabricação ainda não cadastrada."
    );
  });

  // TESTE 11
  test("Deve calcular o custo total da fabricação", async () => {

    const resultado = await calcularCustos(1, 1);

    expect(resultado.custoTotalFabricacao).toBeCloseTo(1056.96);

    expect(resultado.materiais.cimento.custo).toBeCloseTo(330);

    expect(resultado.materiais.aco.custo).toBeCloseTo(550);
  });

  // TESTE 12
  test("Deve rejeitar fabricação sem preços cadastrados", async () => {

    PrecoFabricacao.findOne.mockResolvedValue(null);

    await expect(
      calcularCustos(1, 1)
    ).rejects.toThrow(
      "Preços de fabricação ainda não cadastrados."
    );
  });

  // TESTE 13
  test("Deve confirmar a fabricação do projeto", async () => {

    const resultado = await confirmarFabricacao(1, 1);

    expect(projeto.update).toHaveBeenCalledWith({
      status: "FABRICACAO_CALCULADA"
    });

    expect(resultado.projeto.status).toBe(
      "FABRICACAO_CALCULADA"
    );

    expect(resultado.custoTotalFabricacao).toBeCloseTo(1056.96);
  });

});