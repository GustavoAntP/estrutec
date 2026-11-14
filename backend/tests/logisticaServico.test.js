jest.mock("../src/modelos/Projeto", () => ({
  findOne: jest.fn()
}));

jest.mock("../src/modelos/LogisticaProjeto", () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock("../src/modelos/LogisticaTerceirizada", () => ({
  findOne: jest.fn()
}));

jest.mock("../src/servicos/logisticaPropriaServico", () => ({
  calcularCustoFreteProprio: jest.fn()
}));

const Projeto = require("../src/modelos/Projeto");

const LogisticaProjeto = require(
  "../src/modelos/LogisticaProjeto"
);

const LogisticaTerceirizada = require(
  "../src/modelos/LogisticaTerceirizada"
);

const logisticaPropriaServico = require(
  "../src/servicos/logisticaPropriaServico"
);

const {
  salvarLogistica,
  buscarLogistica,
  calcularCustoLogistica,
  confirmarLogistica
} = require("../src/servicos/logisticaServico");

describe("Testes de logística - Estrutec", () => {

  let projeto;

  beforeEach(() => {
    jest.resetAllMocks();

    projeto = {
      id: 1,
      codigo: "EST-001",
      nome: "Projeto de Vigas",
      status: "EM_ANDAMENTO",

      update: jest.fn(async (dados) => {
        Object.assign(projeto, dados);
      })
    };

    Projeto.findOne.mockResolvedValue(projeto);

    LogisticaProjeto.findOne.mockResolvedValue({
      id: 10,
      tipo_frete: "TERCEIRIZADO",
      observacoes: null
    });

    LogisticaTerceirizada.findOne.mockResolvedValue({
      empresa: "Transportadora Teste",
      numero_cotacao: "COT-001",
      validade_cotacao: null,
      valor_total: "1234.567",
      observacoes: null
    });

    logisticaPropriaServico.calcularCustoFreteProprio
      .mockResolvedValue({
        custoTotalFreteProprio: 500
      });
  });

  // TESTE 1
  test("Deve rejeitar tipo de frete inválido", async () => {
    await expect(
      salvarLogistica(1, 1, {
        tipoFrete: "AVIAO"
      })
    ).rejects.toThrow(
      "Tipo de frete inválido. Utilize PROPRIO ou TERCEIRIZADO."
    );
  });

  // TESTE 2
  test("Deve rejeitar projeto inexistente", async () => {
    Projeto.findOne.mockResolvedValue(null);

    await expect(
      salvarLogistica(999, 1, {
        tipoFrete: "PROPRIO"
      })
    ).rejects.toThrow("Projeto não encontrado.");
  });

  // TESTE 3
  test("Deve cadastrar logística própria", async () => {
    LogisticaProjeto.findOne.mockResolvedValue(null);

    LogisticaProjeto.create.mockImplementation(
      async (dados) => ({
        id: 10,
        ...dados
      })
    );

    const resultado = await salvarLogistica(
      1,
      1,
      {
        tipoFrete: "proprio"
      }
    );

    expect(resultado.tipo_frete).toBe("PROPRIO");

    expect(LogisticaProjeto.create).toHaveBeenCalledWith(
      expect.objectContaining({
        projeto_id: 1,
        tipo_frete: "PROPRIO"
      })
    );
  });

  // TESTE 4
  test("Deve atualizar uma logística existente", async () => {
    const logistica = {
      id: 10,
      tipo_frete: "PROPRIO",
      observacoes: "Observação anterior",
      update: jest.fn()
    };

    LogisticaProjeto.findOne.mockResolvedValue(logistica);

    await salvarLogistica(1, 1, {
      tipoFrete: "TERCEIRIZADO"
    });

    expect(logistica.update).toHaveBeenCalledWith({
      tipo_frete: "TERCEIRIZADO",
      observacoes: "Observação anterior"
    });
  });

  // TESTE 5
  test("Deve consultar a logística cadastrada", async () => {
    const resultado = await buscarLogistica(1, 1);

    expect(resultado.tipo_frete).toBe("TERCEIRIZADO");

    expect(LogisticaProjeto.findOne).toHaveBeenCalledWith({
      where: {
        projeto_id: 1
      }
    });
  });

  // TESTE 6
  test("Deve rejeitar consulta sem logística cadastrada", async () => {
    LogisticaProjeto.findOne.mockResolvedValue(null);

    await expect(
      buscarLogistica(1, 1)
    ).rejects.toThrow(
      "Logística ainda não configurada para este projeto."
    );
  });

  // TESTE 7
  test("Deve calcular o custo do frete próprio", async () => {
    LogisticaProjeto.findOne.mockResolvedValue({
      id: 10,
      tipo_frete: "PROPRIO"
    });

    const resultado = await calcularCustoLogistica(1, 1);

    expect(resultado.tipoFrete).toBe("PROPRIO");
    expect(resultado.custoLogistica).toBe(500);

    expect(
      logisticaPropriaServico.calcularCustoFreteProprio
    ).toHaveBeenCalledWith(1, 1);
  });

  // TESTE 8
  test("Deve calcular o custo do frete terceirizado", async () => {
    const resultado = await calcularCustoLogistica(1, 1);

    expect(resultado.tipoFrete).toBe("TERCEIRIZADO");

    expect(resultado.custoLogistica).toBe(1234.57);

    expect(resultado.detalhes.empresa).toBe(
      "Transportadora Teste"
    );
  });

  // TESTE 9
  test("Deve rejeitar frete terceirizado sem cotação", async () => {
    LogisticaTerceirizada.findOne.mockResolvedValue(null);

    await expect(
      calcularCustoLogistica(1, 1)
    ).rejects.toThrow(
      "Dados do frete terceirizado ainda não cadastrados."
    );
  });

  // TESTE 10
  test("Deve rejeitar tipo de frete desconhecido", async () => {
    LogisticaProjeto.findOne.mockResolvedValue({
      id: 10,
      tipo_frete: "DESCONHECIDO"
    });

    await expect(
      calcularCustoLogistica(1, 1)
    ).rejects.toThrow(
      "Tipo de frete não reconhecido."
    );
  });

  // TESTE 11
  test("Deve confirmar a logística calculada", async () => {
    const resultado = await confirmarLogistica(1, 1);

    expect(projeto.update).toHaveBeenCalledWith({
      status: "LOGISTICA_CALCULADA"
    });

    expect(resultado.projeto.status).toBe(
      "LOGISTICA_CALCULADA"
    );

    expect(resultado.custoLogistica).toBe(1234.57);
  });

  // TESTE 12
  test("Não deve confirmar logística sem cotação", async () => {
    LogisticaTerceirizada.findOne.mockResolvedValue(null);

    await expect(
      confirmarLogistica(1, 1)
    ).rejects.toThrow(
      "Dados do frete terceirizado ainda não cadastrados."
    );

    expect(projeto.update).not.toHaveBeenCalled();
  });

  // TESTE 13
  test("Deve rejeitar cálculo sem logística configurada", async () => {
    LogisticaProjeto.findOne.mockResolvedValue(null);

    await expect(
      calcularCustoLogistica(1, 1)
    ).rejects.toThrow(
      "Logística ainda não configurada para este projeto."
    );
  });

});