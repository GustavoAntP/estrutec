const ExcelJS = require("exceljs");

const {
  processarPlanilha
} = require("../src/servicos/planilhaServico");

// Cria um arquivo Excel em memória para os testes
async function criarArquivoExcel(linhas, nomeAba = "Página1") {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(nomeAba);

  worksheet.addRow([
    "Nome",
    "Largura",
    "Altura",
    "Comprimento",
    "Quantidade"
  ]);

  linhas.forEach(linha => {
    worksheet.addRow(linha);
  });

  const buffer = Buffer.from(
    await workbook.xlsx.writeBuffer()
  );

  return {
    originalname: "elementos.xlsx",
    size: buffer.length,
    buffer
  };
}

describe("Importação de planilhas - Estrutec", () => {

  // TESTE 1
  test("Deve rejeitar importação sem arquivo", async () => {
    await expect(
      processarPlanilha(null)
    ).rejects.toThrow("Planilha não enviada.");
  });

  // TESTE 2
  test("Deve importar uma viga válida", async () => {
    const arquivo = await criarArquivoExcel([
      ["VIGA RETANGULAR V01", 0.2, 0.5, 5, 2]
    ]);

    const resultado = await processarPlanilha(arquivo);

    expect(resultado.elementos).toHaveLength(1);

    expect(resultado.elementos[0]).toMatchObject({
      tipo: "VIGA",
      secao: "RETANGULAR",
      largura: 0.2,
      altura: 0.5,
      comprimento: 5,
      quantidade: 2,
      valido: true
    });

    expect(resultado.resumo.totalPecas).toBe(2);
    expect(resultado.erros).toHaveLength(0);
  });

  // TESTE 3
  test("Deve identificar viga seção I com protensão", async () => {
    const arquivo = await criarArquivoExcel([
      ["VIGA SEÇÃO I COM PROTENSÃO", 0.3, 0.6, 8, 1]
    ]);

    const resultado = await processarPlanilha(arquivo);

    expect(resultado.elementos[0]).toMatchObject({
      tipo: "VIGA",
      secao: "I",
      aplicacao: "PROTENSAO",
      valido: true
    });
  });

  // TESTE 4
  test("Deve contabilizar vigas, pilares e peças", async () => {
    const arquivo = await criarArquivoExcel([
      ["VIGA RETANGULAR V01", 0.2, 0.5, 5, 3],
      ["PILAR RETANGULAR P01", 0.3, 0.3, 4, 2]
    ]);

    const resultado = await processarPlanilha(arquivo);

    expect(resultado.resumo.totalLinhas).toBe(2);
    expect(resultado.resumo.totalPecas).toBe(5);
    expect(resultado.resumo.vigas).toBe(1);
    expect(resultado.resumo.pilares).toBe(1);
  });

  // TESTE 5
  test("Deve aceitar números com vírgula decimal", async () => {
    const arquivo = await criarArquivoExcel([
      ["VIGA RETANGULAR V01", "0,20", "0,50", "5,5", "2"]
    ]);

    const resultado = await processarPlanilha(arquivo);

    expect(resultado.elementos[0]).toMatchObject({
      largura: 0.2,
      altura: 0.5,
      comprimento: 5.5,
      quantidade: 2,
      valido: true
    });
  });

  // TESTES 6 A 10
  test.each([
    ["largura zerada", 1, 0, "Largura inválida."],
    ["altura negativa", 2, -1, "Altura inválida."],
    ["comprimento zerado", 3, 0, "Comprimento inválido."],
    ["quantidade zerada", 4, 0, "Quantidade inválida."],
    ["quantidade fracionária", 4, 1.5, "Quantidade inválida."]
  ])(
    "Deve identificar %s",
    async (_, indice, valor, mensagem) => {
      const linha = [
        "VIGA RETANGULAR V01",
        0.2,
        0.5,
        5,
        2
      ];

      linha[indice] = valor;

      const arquivo = await criarArquivoExcel([linha]);

      const resultado = await processarPlanilha(arquivo);

      expect(resultado.elementos[0].valido).toBe(false);

      expect(resultado.elementos[0].erros).toContain(
        mensagem
      );

      expect(resultado.resumo.elementosComErro).toBe(1);
    }
  );

  // TESTE 11
  test("Deve identificar tipo estrutural desconhecido", async () => {
    const arquivo = await criarArquivoExcel([
      ["ELEMENTO DESCONHECIDO", 0.2, 0.5, 5, 2]
    ]);

    const resultado = await processarPlanilha(arquivo);

    expect(resultado.elementos[0].valido).toBe(false);

    expect(resultado.elementos[0].erros).toContain(
      "Tipo de elemento não reconhecido."
    );
  });

  // TESTE 12
  test("Deve ignorar linha com dimensão não numérica", async () => {
    const arquivo = await criarArquivoExcel([
      ["VIGA INVÁLIDA", "abc", 0.5, 5, 2],
      ["VIGA RETANGULAR V02", 0.2, 0.5, 5, 1]
    ]);

    const resultado = await processarPlanilha(arquivo);

    expect(resultado.elementos).toHaveLength(1);
    expect(resultado.resumo.totalPecas).toBe(1);
  });

  // TESTE 13
  test("Deve rejeitar planilha sem elementos interpretáveis", async () => {
    const arquivo = await criarArquivoExcel([
      ["VIGA INVÁLIDA", "abc", 0.5, 5, 2]
    ]);

    await expect(
      processarPlanilha(arquivo)
    ).rejects.toThrow(
      "Nenhum elemento estrutural válido foi encontrado na planilha."
    );
  });

});