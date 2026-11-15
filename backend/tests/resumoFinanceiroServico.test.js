jest.mock("../src/modelos/Projeto", () => ({
  findOne: jest.fn(),
}));

jest.mock("../src/servicos/fabricacaoServico", () => ({
  calcularCustos: jest.fn(),
}));

jest.mock("../src/servicos/logisticaServico", () => ({
  calcularCustoLogistica: jest.fn(),
}));

jest.mock("../src/servicos/montagemServico", () => ({
  calcularCustos: jest.fn(),
}));

const Projeto = require("../src/modelos/Projeto");
const fabricacaoServico = require("../src/servicos/fabricacaoServico");
const logisticaServico = require("../src/servicos/logisticaServico");
const montagemServico = require("../src/servicos/montagemServico");

const {
  calcularResumoFinanceiro,
  finalizarProjeto,
} = require("../src/servicos/resumoFinanceiroServico");

describe("Resumo financeiro e BDI - Estrutec", () => {
  let projeto;

  beforeEach(() => {
    jest.resetAllMocks();

    projeto = {
      id: 1,
      codigo: "EST-001",
      nome: "Projeto de Vigas",
      cliente: "Cliente Exemplo",
      status: "MONTAGEM_CALCULADA",
      bdi: 20,
      update: jest.fn().mockImplementation(async (dados) => {
        Object.assign(projeto, dados);
        return projeto;
      }),
    };

    Projeto.findOne.mockResolvedValue(projeto);

    fabricacaoServico.calcularCustos.mockResolvedValue({
      custoTotalFabricacao: 1000,
    });

    logisticaServico.calcularCustoLogistica.mockResolvedValue({
      custoLogistica: 500,
    });

    montagemServico.calcularCustos.mockResolvedValue({
      custoTotalMontagem: 250,
    });
  });

  test("Deve somar os custos e aplicar BDI de 20%", async () => {
    const resultado = await calcularResumoFinanceiro(1, 1);

    expect(resultado.custos).toEqual({
      fabricacao: 1000,
      logistica: 500,
      montagem: 250,
      custoDireto: 1750,
    });

    expect(resultado.bdi).toEqual({
      percentual: 20,
      valor: 350,
    });

    expect(resultado.valorFinal).toBe(2100);
  });

  test("Deve incluir os dados do projeto no resumo", async () => {
    const resultado = await calcularResumoFinanceiro(1, 1);

    expect(resultado.projeto).toEqual({
      id: 1,
      codigo: "EST-001",
      nome: "Projeto de Vigas",
      cliente: "Cliente Exemplo",
      status: "MONTAGEM_CALCULADA",
    });
  });

  test("Deve consultar o projeto pelo ID e usuario proprietario", async () => {
    await calcularResumoFinanceiro(7, 99);

    expect(Projeto.findOne).toHaveBeenCalledWith({
      where: {
        id: 7,
        usuario_id: 99,
      },
    });

    expect(fabricacaoServico.calcularCustos).toHaveBeenCalledWith(7, 99);
    expect(logisticaServico.calcularCustoLogistica).toHaveBeenCalledWith(7, 99);
    expect(montagemServico.calcularCustos).toHaveBeenCalledWith(7, 99);
  });

  test.each([undefined, null])(
    "Deve usar BDI zero quando o campo for %p",
    async (bdi) => {
      projeto.bdi = bdi;

      const resultado = await calcularResumoFinanceiro(1, 1);

      expect(resultado.bdi).toEqual({
        percentual: 0,
        valor: 0,
      });

      expect(resultado.valorFinal).toBe(1750);
    }
  );

  test("Deve aceitar BDI numerico recebido como texto", async () => {
    projeto.bdi = "15";

    const resultado = await calcularResumoFinanceiro(1, 1);

    expect(resultado.bdi).toEqual({
      percentual: 15,
      valor: 262.5,
    });

    expect(resultado.valorFinal).toBe(2012.5);
  });

  test("Deve arredondar os valores monetarios a duas casas", async () => {
    projeto.bdi = 10;

    fabricacaoServico.calcularCustos.mockResolvedValue({
      custoTotalFabricacao: 1000.126,
    });

    logisticaServico.calcularCustoLogistica.mockResolvedValue({
      custoLogistica: 500.226,
    });

    montagemServico.calcularCustos.mockResolvedValue({
      custoTotalMontagem: 250.226,
    });

    const resultado = await calcularResumoFinanceiro(1, 1);

    expect(resultado.custos).toEqual({
      fabricacao: 1000.13,
      logistica: 500.23,
      montagem: 250.23,
      custoDireto: 1750.58,
    });

    expect(resultado.bdi.valor).toBe(175.06);
    expect(resultado.valorFinal).toBe(1925.64);
  });

  test("Deve tratar custos zerados sem criar cobrancas", async () => {
    fabricacaoServico.calcularCustos.mockResolvedValue({
      custoTotalFabricacao: 0,
    });

    logisticaServico.calcularCustoLogistica.mockResolvedValue({
      custoLogistica: 0,
    });

    montagemServico.calcularCustos.mockResolvedValue({
      custoTotalMontagem: 0,
    });

    const resultado = await calcularResumoFinanceiro(1, 1);

    expect(resultado.custos.custoDireto).toBe(0);
    expect(resultado.bdi.valor).toBe(0);
    expect(resultado.valorFinal).toBe(0);
  });

  test("Deve bloquear resumo de projeto inexistente ou de outro usuario", async () => {
    Projeto.findOne.mockResolvedValue(null);

    await expect(
      calcularResumoFinanceiro(1, 2)
    ).rejects.toThrow("Projeto não encontrado.");

    expect(fabricacaoServico.calcularCustos).not.toHaveBeenCalled();
    expect(logisticaServico.calcularCustoLogistica).not.toHaveBeenCalled();
    expect(montagemServico.calcularCustos).not.toHaveBeenCalled();
  });

  test.each([
    [
      "fabricacao",
      () => fabricacaoServico.calcularCustos,
      "Falha na fabricação",
    ],
    [
      "logistica",
      () => logisticaServico.calcularCustoLogistica,
      "Falha na logística",
    ],
    [
      "montagem",
      () => montagemServico.calcularCustos,
      "Falha na montagem",
    ],
  ])("Deve propagar falhas de %s", async (_, obterMock, mensagem) => {
    obterMock().mockRejectedValue(new Error(mensagem));

    await expect(
      calcularResumoFinanceiro(1, 1)
    ).rejects.toThrow(mensagem);
  });

  test("Deve finalizar projeto com montagem confirmada e valores validos", async () => {
    const resultado = await finalizarProjeto(1, 1);

    expect(projeto.update).toHaveBeenCalledTimes(1);

    expect(projeto.update).toHaveBeenCalledWith({
      status: "FINALIZADO",
    });

    expect(resultado.projeto.status).toBe("FINALIZADO");
    expect(resultado.custos.custoDireto).toBe(1750);
    expect(resultado.bdi.valor).toBe(350);
    expect(resultado.valorFinal).toBe(2100);

    expect(fabricacaoServico.calcularCustos).toHaveBeenCalledWith(1, 1);
    expect(logisticaServico.calcularCustoLogistica).toHaveBeenCalledWith(1, 1);
    expect(montagemServico.calcularCustos).toHaveBeenCalledWith(1, 1);
  });

  test("Nao deve finalizar projeto ja finalizado", async () => {
    projeto.status = "FINALIZADO";

    await expect(
      finalizarProjeto(1, 1)
    ).rejects.toThrow("Este projeto já está finalizado.");

    expect(projeto.update).not.toHaveBeenCalled();
    expect(fabricacaoServico.calcularCustos).not.toHaveBeenCalled();
  });

  test.each([
    "EM_ANDAMENTO",
    "FABRICACAO_CALCULADA",
    "LOGISTICA_CALCULADA",
  ])("Nao deve finalizar projeto no status %s", async (status) => {
    projeto.status = status;

    await expect(
      finalizarProjeto(1, 1)
    ).rejects.toThrow(
      "A montagem deve estar confirmada antes de finalizar o projeto."
    );

    expect(projeto.update).not.toHaveBeenCalled();
    expect(fabricacaoServico.calcularCustos).not.toHaveBeenCalled();
  });

  test("Nao deve finalizar projeto de outro usuario", async () => {
    Projeto.findOne.mockResolvedValue(null);

    await expect(
      finalizarProjeto(1, 999)
    ).rejects.toThrow("Projeto não encontrado.");

    expect(Projeto.findOne).toHaveBeenCalledWith({
      where: {
        id: 1,
        usuario_id: 999,
      },
    });
  });

  test("Nao deve finalizar se houver falha no calculo financeiro", async () => {
    logisticaServico.calcularCustoLogistica.mockRejectedValue(
      new Error("Não foi possível calcular a logística.")
    );

    await expect(
      finalizarProjeto(1, 1)
    ).rejects.toThrow("Não foi possível calcular a logística.");

    expect(projeto.update).not.toHaveBeenCalled();
  });

  test.each([
    ["nao finito", Infinity],
    ["negativo", -5000],
  ])("Nao deve finalizar projeto com valor final %s", async (_, custo) => {
    fabricacaoServico.calcularCustos.mockResolvedValue({
      custoTotalFabricacao: custo,
    });

    await expect(
      finalizarProjeto(1, 1)
    ).rejects.toThrow(
      "Não foi possível calcular o valor final do projeto."
    );

    expect(projeto.update).not.toHaveBeenCalled();
  });

  test("Nao deve finalizar quando o BDI produz valor nao finito", async () => {
    projeto.bdi = Infinity;

    await expect(
      finalizarProjeto(1, 1)
    ).rejects.toThrow(
      "Não foi possível calcular o valor final do projeto."
    );

    expect(projeto.update).not.toHaveBeenCalled();
  });
});