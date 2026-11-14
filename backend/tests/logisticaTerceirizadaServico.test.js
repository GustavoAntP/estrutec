jest.mock("../src/modelos/Projeto", () => ({
  findOne: jest.fn()
}));

jest.mock("../src/modelos/LogisticaProjeto", () => ({
  findOne: jest.fn()
}));

jest.mock("../src/modelos/LogisticaTerceirizada", () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));

const Projeto = require("../src/modelos/Projeto");

const LogisticaProjeto = require(
  "../src/modelos/LogisticaProjeto"
);

const LogisticaTerceirizada = require(
  "../src/modelos/LogisticaTerceirizada"
);

const {
  salvarLogisticaTerceirizada,
  buscarLogisticaTerceirizada
} = require(
  "../src/servicos/logisticaTerceirizadaServico"
);

const dadosValidos = {
  empresa: "Transportadora Teste",
  numeroCotacao: "COT-001",
  validadeCotacao: "2026-12-31",
  valorTotal: 1500,
  observacoes: "Transporte de vigas"
};

describe("Logística terceirizada - Estrutec", () => {

  beforeEach(() => {
    jest.resetAllMocks();

    Projeto.findOne.mockResolvedValue({
      id: 1,
      usuario_id: 1,
      nome: "Projeto Teste"
    });

    LogisticaProjeto.findOne.mockResolvedValue({
      id: 10,
      projeto_id: 1,
      tipo_frete: "TERCEIRIZADO"
    });

    LogisticaTerceirizada.findOne.mockResolvedValue(null);

    LogisticaTerceirizada.create.mockImplementation(
      async (dados) => ({
        id: 20,
        ...dados
      })
    );
  });

  // TESTE 1
  test("Deve cadastrar uma cotação válida", async () => {

    const resultado = await salvarLogisticaTerceirizada(
      1,
      1,
      dadosValidos
    );

    expect(resultado.empresa).toBe("Transportadora Teste");

    expect(resultado.valor_total).toBe(1500);

    expect(LogisticaTerceirizada.create)
      .toHaveBeenCalledWith({
        logistica_id: 10,
        empresa: "Transportadora Teste",
        numero_cotacao: "COT-001",
        validade_cotacao: "2026-12-31",
        valor_total: 1500,
        observacoes: "Transporte de vigas"
      });
  });

  // TESTE 2
  test("Deve normalizar campos opcionais", async () => {

    const resultado = await salvarLogisticaTerceirizada(
      1,
      1,
      {
        empresa: "  Transportadora ABC  ",
        valorTotal: "2500.50"
      }
    );

    expect(resultado).toMatchObject({
      empresa: "Transportadora ABC",
      numero_cotacao: null,
      validade_cotacao: null,
      valor_total: 2500.50,
      observacoes: null
    });
  });

  // TESTE 3
  test("Deve atualizar uma cotação existente", async () => {

    const cotacao = {
      id: 20,
      empresa: "Transportadora Antiga",
      valor_total: 1000,

      update: jest.fn().mockImplementation(async function(dados) {
        Object.assign(this, dados);
      })
    };

    LogisticaTerceirizada.findOne.mockResolvedValue(
      cotacao
    );

    const resultado = await salvarLogisticaTerceirizada(
      1,
      1,
      dadosValidos
    );

    expect(cotacao.update).toHaveBeenCalledWith(
      expect.objectContaining({
        empresa: "Transportadora Teste",
        valor_total: 1500
      })
    );

    expect(resultado.valor_total).toBe(1500);

    expect(LogisticaTerceirizada.create)
      .not.toHaveBeenCalled();
  });

  // TESTE 4
  test("Deve rejeitar projeto inexistente", async () => {

    Projeto.findOne.mockResolvedValue(null);

    await expect(
      salvarLogisticaTerceirizada(
        999,
        1,
        dadosValidos
      )
    ).rejects.toThrow("Projeto não encontrado.");

    expect(Projeto.findOne).toHaveBeenCalledWith({
      where: {
        id: 999,
        usuario_id: 1
      }
    });

    expect(LogisticaTerceirizada.create)
      .not.toHaveBeenCalled();
  });

  // TESTE 5
  test("Deve rejeitar logística não configurada", async () => {

    LogisticaProjeto.findOne.mockResolvedValue(null);

    await expect(
      salvarLogisticaTerceirizada(
        1,
        1,
        dadosValidos
      )
    ).rejects.toThrow(
      "Configure primeiro o tipo de logística."
    );
  });

  // TESTE 6
  test("Deve impedir cadastro em frete próprio", async () => {

    LogisticaProjeto.findOne.mockResolvedValue({
      id: 10,
      tipo_frete: "PROPRIO"
    });

    await expect(
      salvarLogisticaTerceirizada(
        1,
        1,
        dadosValidos
      )
    ).rejects.toThrow(
      "O projeto deve estar configurado como TERCEIRIZADO."
    );
  });

  // TESTES 7 A 9
  test.each([
    ["empresa ausente", undefined],
    ["empresa vazia", ""],
    ["empresa apenas com espaços", "   "]
  ])("Deve rejeitar %s", async (_, empresa) => {

    await expect(
      salvarLogisticaTerceirizada(
        1,
        1,
        {
          ...dadosValidos,
          empresa
        }
      )
    ).rejects.toThrow(
      "Empresa transportadora é obrigatória."
    );

    expect(LogisticaTerceirizada.create)
      .not.toHaveBeenCalled();
  });

  // TESTES 10 A 12
  test.each([
    ["valor negativo", -100],
    ["valor não numérico", "abc"],
    ["valor infinito", Infinity]
  ])("Deve rejeitar %s", async (_, valorTotal) => {

    await expect(
      salvarLogisticaTerceirizada(
        1,
        1,
        {
          ...dadosValidos,
          valorTotal
        }
      )
    ).rejects.toThrow(
      "Valor total da cotação inválido."
    );

    expect(LogisticaTerceirizada.create)
      .not.toHaveBeenCalled();
  });

  // TESTE 13
  test("Deve aceitar cotação com valor zero", async () => {

    const resultado = await salvarLogisticaTerceirizada(
      1,
      1,
      {
        ...dadosValidos,
        valorTotal: 0
      }
    );

    expect(resultado.valor_total).toBe(0);
  });

  // TESTE 14
  test("Deve consultar cotação cadastrada", async () => {

    LogisticaTerceirizada.findOne.mockResolvedValue({
      id: 20,
      empresa: "Transportadora Teste",
      valor_total: 1500
    });

    const resultado = await buscarLogisticaTerceirizada(
      1,
      1
    );

    expect(resultado.empresa).toBe(
      "Transportadora Teste"
    );

    expect(resultado.valor_total).toBe(1500);

    expect(LogisticaTerceirizada.findOne)
      .toHaveBeenCalledWith({
        where: {
          logistica_id: 10
        }
      });
  });

  // TESTE 15
  test("Deve impedir consulta de projeto não autorizado", async () => {

    Projeto.findOne.mockResolvedValue(null);

    await expect(
      buscarLogisticaTerceirizada(1, 999)
    ).rejects.toThrow("Projeto não encontrado.");

    expect(Projeto.findOne).toHaveBeenCalledWith({
      where: {
        id: 1,
        usuario_id: 999
      }
    });

    expect(LogisticaTerceirizada.findOne)
      .not.toHaveBeenCalled();
  });

  // TESTE 16
  test("Deve rejeitar consulta sem logística", async () => {

    LogisticaProjeto.findOne.mockResolvedValue(null);

    await expect(
      buscarLogisticaTerceirizada(1, 1)
    ).rejects.toThrow(
      "Logística ainda não configurada."
    );
  });

  // TESTE 17
  test("Deve impedir consulta em modalidade própria", async () => {

    LogisticaProjeto.findOne.mockResolvedValue({
      id: 10,
      tipo_frete: "PROPRIO"
    });

    await expect(
      buscarLogisticaTerceirizada(1, 1)
    ).rejects.toThrow(
      "O projeto não está configurado para frete terceirizado."
    );
  });

  // TESTE 18
  test("Deve rejeitar consulta sem cotação", async () => {

    LogisticaTerceirizada.findOne.mockResolvedValue(null);

    await expect(
      buscarLogisticaTerceirizada(1, 1)
    ).rejects.toThrow(
      "Dados do frete terceirizado ainda não cadastrados."
    );
  });

});