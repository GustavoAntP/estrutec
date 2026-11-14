jest.mock("puppeteer", () => ({
  launch: jest.fn(),
}));

jest.mock("../src/modelos/Projeto", () => ({
  findOne: jest.fn(),
}));

jest.mock("../src/modelos/ElementoProjeto", () => ({
  findAll: jest.fn(),
}));

jest.mock("../src/modelos/LogisticaProjeto", () => ({
  findOne: jest.fn(),
}));

jest.mock("../src/modelos/LogisticaPropria", () => ({
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

jest.mock("../src/servicos/resumoFinanceiroServico", () => ({
  calcularResumoFinanceiro: jest.fn(),
}));

const puppeteer = require("puppeteer");

const Projeto = require("../src/modelos/Projeto");
const ElementoProjeto = require("../src/modelos/ElementoProjeto");
const LogisticaProjeto = require("../src/modelos/LogisticaProjeto");
const LogisticaPropria = require("../src/modelos/LogisticaPropria");

const fabricacaoServico = require("../src/servicos/fabricacaoServico");
const logisticaServico = require("../src/servicos/logisticaServico");
const montagemServico = require("../src/servicos/montagemServico");
const resumoFinanceiroServico = require("../src/servicos/resumoFinanceiroServico");

const {
  gerarRelatorioFinal,
} = require("../src/servicos/relatorioServico");

describe("Relatório final em PDF - Estrutec", () => {
  let pagina;
  let navegador;
  let projeto;

  const obterHtml = () => pagina.setContent.mock.calls[0][0];

  beforeEach(() => {
    jest.resetAllMocks();

    projeto = {
      id: 1,
      codigo: "EST-001",
      nome: "Projeto de Vigas",
      cliente: "Cliente Exemplo",
      responsavel: "Engenheiro Responsável",
      origem: "Joinville",
      destino: "Florianópolis",
      status: "FINALIZADO",
      prazo: "2026-12-15",
      observacoes: null,
    };

    Projeto.findOne.mockResolvedValue(projeto);

    ElementoProjeto.findAll.mockResolvedValue([
      {
        id: 10,
        nome_aplicacao: "V01",
        tipo: "VIGA",
        secao: "RETANGULAR",
        largura: 0.2,
        altura: 0.5,
        comprimento: 5,
        quantidade: 2,
        area_secao: null,
        peso_unitario_kg: 1000,
      },
    ]);

    resumoFinanceiroServico.calcularResumoFinanceiro.mockResolvedValue({
      custos: {
        fabricacao: 1000,
        logistica: 500,
        montagem: 250,
        custoDireto: 1750,
      },
      bdi: {
        percentual: 10,
        valor: 175,
      },
      valorFinal: 1925,
    });

    fabricacaoServico.calcularCustos.mockResolvedValue({
      custoTotalFabricacao: 1000,
      resumo: {
        volumeConcretoM3: 1,
        totalPecas: 2,
        totalVigas: 2,
      },
      materiais: {
        cimento: {
          quantidade: 300,
          unidade: "kg",
          precoUnitario: 1.5,
          custo: 450,
        },
      },
    });

    logisticaServico.calcularCustoLogistica.mockResolvedValue({
      tipoFrete: "TERCEIRIZADO",
      custoLogistica: 500,
      detalhes: {
        empresa: "Transportadora Teste",
        numeroCotacao: "COT-001",
        validadeCotacao: null,
        observacoes: null,
      },
    });

    montagemServico.calcularCustos.mockResolvedValue({
      custoTotalMontagem: 250,
      equipamentos: {
        quantidade: 0,
        custoTotal: 0,
        detalhes: [],
      },
      equipes: {
        quantidade: 0,
        custoTotal: 0,
        detalhes: [],
      },
      custosGerais: {
        hospedagem: 100,
        alimentacao: 50,
        transporteEquipe: 50,
        outrosCustos: 50,
      },
    });

    pagina = {
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(
        Buffer.from("%PDF-1.4\nrelatorio-teste")
      ),
    };

    navegador = {
      newPage: jest.fn().mockResolvedValue(pagina),
      close: jest.fn().mockResolvedValue(undefined),
    };

    puppeteer.launch.mockResolvedValue(navegador);
  });

  test("Deve rejeitar projeto inexistente", async () => {
    Projeto.findOne.mockResolvedValue(null);

    await expect(
      gerarRelatorioFinal(999, 1)
    ).rejects.toThrow("Projeto não encontrado.");

    expect(puppeteer.launch).not.toHaveBeenCalled();
    expect(ElementoProjeto.findAll).not.toHaveBeenCalled();
  });

  test.each([
    "EM_ANDAMENTO",
    "MONTAGEM_CALCULADA",
  ])("Deve impedir relatório no status %s", async (status) => {
    projeto.status = status;

    await expect(
      gerarRelatorioFinal(1, 1)
    ).rejects.toThrow(
      "O projeto deve estar finalizado antes de gerar o relatório."
    );

    expect(puppeteer.launch).not.toHaveBeenCalled();
  });

  test("Deve retornar um Buffer com os dados do PDF", async () => {
    const resultado = await gerarRelatorioFinal(1, 1);

    expect(Buffer.isBuffer(resultado)).toBe(true);
    expect(resultado.toString()).toBe("%PDF-1.4\nrelatorio-teste");

    expect(pagina.pdf).toHaveBeenCalledTimes(1);
    expect(navegador.close).toHaveBeenCalledTimes(1);
  });

  test("Deve consultar somente o projeto do usuário", async () => {
    await gerarRelatorioFinal(7, 99);

    expect(Projeto.findOne).toHaveBeenCalledWith({
      where: {
        id: 7,
        usuario_id: 99,
      },
    });

    expect(ElementoProjeto.findAll).toHaveBeenCalledWith({
      where: {
        projeto_id: 7,
      },
      order: [
        ["tipo", "ASC"],
        ["id", "ASC"],
      ],
    });
  });

  test("Deve solicitar os cálculos financeiros e operacionais", async () => {
    await gerarRelatorioFinal(7, 99);

    expect(
      resumoFinanceiroServico.calcularResumoFinanceiro
    ).toHaveBeenCalledWith(7, 99);

    expect(
      fabricacaoServico.calcularCustos
    ).toHaveBeenCalledWith(7, 99);

    expect(
      logisticaServico.calcularCustoLogistica
    ).toHaveBeenCalledWith(7, 99);

    expect(
      montagemServico.calcularCustos
    ).toHaveBeenCalledWith(7, 99);
  });

  test("Deve configurar o navegador e o PDF em formato A4", async () => {
    await gerarRelatorioFinal(1, 1);

    expect(puppeteer.launch).toHaveBeenCalledWith({
      headless: true,
    });

    expect(navegador.newPage).toHaveBeenCalledTimes(1);

    expect(pagina.setContent).toHaveBeenCalledWith(
      expect.any(String),
      {
        waitUntil: "networkidle0",
      }
    );

    expect(pagina.pdf).toHaveBeenCalledWith(
      expect.objectContaining({
        format: "A4",
        printBackground: true,
        displayHeaderFooter: true,
        margin: {
          top: "24mm",
          right: "15mm",
          bottom: "22mm",
          left: "15mm",
        },
      })
    );
  });

  test("Deve incluir as seções principais do relatório", async () => {
    await gerarRelatorioFinal(1, 1);

    const html = obterHtml();

    expect(html).toContain("Relatório Final do Orçamento");
    expect(html).toContain("1. Dados do Projeto");
    expect(html).toContain("2. Elementos Pré-Moldados");
    expect(html).toContain("3. Fabricação");
    expect(html).toContain("4. Logística");
    expect(html).toContain("5. Montagem");
    expect(html).toContain("6. Resumo Financeiro");
  });

  test("Deve incluir os dados de identificação do projeto", async () => {
    await gerarRelatorioFinal(1, 1);

    const html = obterHtml();

    expect(html).toContain("EST-001");
    expect(html).toContain("Projeto de Vigas");
    expect(html).toContain("Cliente Exemplo");
    expect(html).toContain("Engenheiro Responsável");
    expect(html).toContain("Joinville");
    expect(html).toContain("Florianópolis");
  });

  test("Deve escapar caracteres HTML nos dados do projeto", async () => {
    projeto.nome = "<script>alert('teste')</script>";
    projeto.cliente = "Empresa & Construção";

    await gerarRelatorioFinal(1, 1);

    const html = obterHtml();

    expect(html).not.toContain("<script>alert('teste')</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Empresa &amp; Construção");
  });

  test("Deve incluir a identificação dos elementos estruturais", async () => {
    await gerarRelatorioFinal(1, 1);

    const html = obterHtml();

    expect(html).toContain("V01");
    expect(html).toContain("VIGA");
    expect(html).toContain("RETANGULAR");
    expect(html).toContain("Volume total (m³)");
    expect(html).toContain("Peso total (kg)");
  });

  test("Deve calcular o volume e o peso dos elementos", async () => {
    await gerarRelatorioFinal(1, 1);

    const html = obterHtml();

    expect(html).toContain("1,0000");
    expect(html).toContain("2.000,00");
  });

  test("Deve utilizar o volume total armazenado quando disponível", async () => {
    ElementoProjeto.findAll.mockResolvedValue([
      {
        id: 10,
        nome_aplicacao: "V02",
        tipo: "VIGA",
        secao: "RETANGULAR",
        largura: 0.2,
        altura: 0.5,
        comprimento: 5,
        quantidade: 2,
        area_secao: 8.75,
        peso_unitario_kg: 1000,
      },
    ]);

    await gerarRelatorioFinal(1, 1);

    const html = obterHtml();

    expect(html).toContain("V02");
    expect(html).toContain("8,7500");
  });

  test("Deve apresentar os materiais e custos de fabricação", async () => {
    await gerarRelatorioFinal(1, 1);

    const html = obterHtml();

    expect(html).toContain("Cimento");
    expect(html).toContain("300,00");
    expect(html).toContain("450,00");
    expect(html).toContain("1.000,00");
  });

  test("Deve apresentar os dados do frete terceirizado", async () => {
    await gerarRelatorioFinal(1, 1);

    const html = obterHtml();

    expect(html).toContain("Frete terceirizado");
    expect(html).toContain("Transportadora Teste");
    expect(html).toContain("COT-001");

    expect(LogisticaProjeto.findOne).not.toHaveBeenCalled();
    expect(LogisticaPropria.findOne).not.toHaveBeenCalled();
  });

  test("Deve apresentar os dados do frete próprio", async () => {
    logisticaServico.calcularCustoLogistica.mockResolvedValue({
      tipoFrete: "PROPRIO",
      custoLogistica: 500,
      detalhes: {
        transporte: {
          quantidadeViagens: 2,
          distanciaIdaKm: 100,
          considerarIdaVolta: true,
          kmCarregado: 200,
          kmVazio: 200,
          kmTotal: 400,
        },
        combustivel: {
          litrosTotal: 150,
        },
        custos: {
          combustivel: 900,
          manutencao: 200,
        },
        custoPorViagem: 250,
      },
    });

    LogisticaProjeto.findOne.mockResolvedValue({
      id: 10,
      tipo_frete: "PROPRIO",
    });

    LogisticaPropria.findOne.mockResolvedValue({
      cavalo_mecanico: "Volvo FH",
      carreta: "Carreta Prancha",
      capacidade_pecas: 5,
      capacidade_peso_kg: 15000,
      observacoes: null,
    });

    await gerarRelatorioFinal(1, 1);

    const html = obterHtml();

    expect(html).toContain("Frota própria");
    expect(html).toContain("Volvo FH");
    expect(html).toContain("Carreta Prancha");

    expect(LogisticaProjeto.findOne).toHaveBeenCalledWith({
      where: {
        projeto_id: 1,
      },
    });

    expect(LogisticaPropria.findOne).toHaveBeenCalledWith({
      where: {
        logistica_id: 10,
      },
    });
  });

  test("Deve permitir frete próprio sem configuração de frota encontrada", async () => {
    logisticaServico.calcularCustoLogistica.mockResolvedValue({
      tipoFrete: "PROPRIO",
      custoLogistica: 500,
      detalhes: {},
    });

    LogisticaProjeto.findOne.mockResolvedValue(null);

    await gerarRelatorioFinal(1, 1);

    expect(pagina.pdf).toHaveBeenCalledTimes(1);
    expect(LogisticaPropria.findOne).not.toHaveBeenCalled();
  });

  test("Deve apresentar os equipamentos e as equipes de montagem", async () => {
    montagemServico.calcularCustos.mockResolvedValue({
      custoTotalMontagem: 1200,
      equipamentos: {
        quantidade: 1,
        custoTotal: 700,
        detalhes: [
          {
            nome: "Guindaste",
            quantidade: 1,
            tipoCobranca: "DIARIA",
            tempoUso: 2,
            valorUnitario: 350,
            custoTotal: 700,
          },
        ],
      },
      equipes: {
        quantidade: 1,
        custoTotal: 500,
        detalhes: [
          {
            funcao: "Montador",
            quantidadeTrabalhadores: 2,
            quantidadeDias: 5,
            custoDiarioPorTrabalhador: 50,
            custoTotal: 500,
          },
        ],
      },
      custosGerais: {
        hospedagem: 0,
        alimentacao: 0,
        transporteEquipe: 0,
        outrosCustos: 0,
      },
    });

    await gerarRelatorioFinal(1, 1);

    const html = obterHtml();

    expect(html).toContain("Guindaste");
    expect(html).toContain("Montador");
    expect(html).toContain("Total de Equipamentos");
    expect(html).toContain("Total da Equipe");
  });

  test("Deve apresentar mensagens quando não houver registros", async () => {
    ElementoProjeto.findAll.mockResolvedValue([]);

    fabricacaoServico.calcularCustos.mockResolvedValue({
      custoTotalFabricacao: 0,
      resumo: {},
      materiais: {},
    });

    await gerarRelatorioFinal(1, 1);

    const html = obterHtml();

    expect(html).toContain("Nenhum elemento pré-moldado cadastrado.");
    expect(html).toContain("Nenhum material calculado.");
    expect(html).toContain("Nenhum equipamento informado.");
    expect(html).toContain("Nenhuma equipe informada.");
  });

  test("Deve apresentar o BDI e o valor final do projeto", async () => {
    await gerarRelatorioFinal(1, 1);

    const html = obterHtml();

    expect(html).toContain("Resumo Financeiro");
    expect(html).toContain("Custo Direto");
    expect(html).toContain("VALOR FINAL DO PROJETO");
    expect(html).toContain("1.925,00");
    expect(html).toContain("175,00");
  });

  test("Deve propagar falhas dos serviços de cálculo", async () => {
    fabricacaoServico.calcularCustos.mockRejectedValue(
      new Error("Falha no cálculo da fabricação.")
    );

    await expect(
      gerarRelatorioFinal(1, 1)
    ).rejects.toThrow("Falha no cálculo da fabricação.");

    expect(puppeteer.launch).not.toHaveBeenCalled();
  });

  test("Deve fechar o navegador quando a geração do PDF falhar", async () => {
    pagina.pdf.mockRejectedValue(
      new Error("Falha ao gerar PDF.")
    );

    await expect(
      gerarRelatorioFinal(1, 1)
    ).rejects.toThrow("Falha ao gerar PDF.");

    expect(navegador.close).toHaveBeenCalledTimes(1);
  });

  test("Deve fechar o navegador quando o HTML não carregar", async () => {
    pagina.setContent.mockRejectedValue(
      new Error("Falha ao carregar HTML.")
    );

    await expect(
      gerarRelatorioFinal(1, 1)
    ).rejects.toThrow("Falha ao carregar HTML.");

    expect(pagina.pdf).not.toHaveBeenCalled();
    expect(navegador.close).toHaveBeenCalledTimes(1);
  });
});