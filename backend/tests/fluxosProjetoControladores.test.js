jest.mock("../src/servicos/fabricacaoServico", () => ({
  calcularVolumes: jest.fn(),
  calcularMateriais: jest.fn(),
  calcularCustos: jest.fn(),
  confirmarFabricacao: jest.fn(),
}));

jest.mock("../src/servicos/montagemServico", () => ({
  salvarMontagem: jest.fn(),
  buscarMontagem: jest.fn(),
  calcularCustos: jest.fn(),
  confirmarMontagem: jest.fn(),
}));

jest.mock("../src/servicos/configuracaoFabricacaoServico", () => ({
  salvarConfiguracao: jest.fn(),
  buscarConfiguracao: jest.fn(),
}));

jest.mock("../src/servicos/configuracaoFabricacaoPadraoServico", () => ({
  buscarConfiguracaoPadrao: jest.fn(),
  salvarConfiguracaoPadrao: jest.fn(),
}));

jest.mock("../src/servicos/elementoProjetoServico", () => ({
  confirmarImportacao: jest.fn(),
  listarElementos: jest.fn(),
  atualizarElemento: jest.fn(),
}));

jest.mock("../src/servicos/precoFabricacaoServico", () => ({
  salvarPrecos: jest.fn(),
  buscarPrecos: jest.fn(),
}));

jest.mock("../src/servicos/resumoFinanceiroServico", () => ({
  calcularResumoFinanceiro: jest.fn(),
  finalizarProjeto: jest.fn(),
}));

jest.mock("../src/servicos/logisticaServico", () => ({
  salvarLogistica: jest.fn(),
  buscarLogistica: jest.fn(),
  calcularCustoLogistica: jest.fn(),
  confirmarLogistica: jest.fn(),
}));

jest.mock("../src/servicos/logisticaTerceirizadaServico", () => ({
  salvarLogisticaTerceirizada: jest.fn(),
  buscarLogisticaTerceirizada: jest.fn(),
}));

jest.mock("../src/servicos/equipamentoMontagemServico", () => ({
  cadastrar: jest.fn(),
  listar: jest.fn(),
  atualizar: jest.fn(),
  excluir: jest.fn(),
}));

jest.mock("../src/servicos/equipeMontagemServico", () => ({
  cadastrar: jest.fn(),
  listar: jest.fn(),
  atualizar: jest.fn(),
  excluir: jest.fn(),
}));

jest.mock("../src/servicos/logisticaPropriaServico", () => ({
  salvarLogisticaPropria: jest.fn(),
  buscarLogisticaPropria: jest.fn(),
  calcularCustoFreteProprio: jest.fn(),
  sugerirQuantidadeViagens: jest.fn(),
  aplicarSugestaoViagens: jest.fn(),
}));

jest.mock("../src/servicos/relatorioServico", () => ({
  gerarRelatorioFinal: jest.fn(),
}));

const fabricacaoServico = require("../src/servicos/fabricacaoServico");
const montagemServico = require("../src/servicos/montagemServico");
const configuracaoFabricacaoServico = require("../src/servicos/configuracaoFabricacaoServico");
const configuracaoFabricacaoPadraoServico = require("../src/servicos/configuracaoFabricacaoPadraoServico");
const elementoProjetoServico = require("../src/servicos/elementoProjetoServico");
const precoFabricacaoServico = require("../src/servicos/precoFabricacaoServico");
const resumoFinanceiroServico = require("../src/servicos/resumoFinanceiroServico");
const logisticaServico = require("../src/servicos/logisticaServico");
const logisticaTerceirizadaServico = require("../src/servicos/logisticaTerceirizadaServico");
const equipamentoMontagemServico = require("../src/servicos/equipamentoMontagemServico");
const equipeMontagemServico = require("../src/servicos/equipeMontagemServico");
const logisticaPropriaServico = require("../src/servicos/logisticaPropriaServico");
const relatorioServico = require("../src/servicos/relatorioServico");

const fabricacaoControlador = require("../src/controladores/fabricacaoControlador");
const montagemControlador = require("../src/controladores/montagemControlador");
const configuracaoFabricacaoControlador = require("../src/controladores/configuracaoFabricacaoControlador");
const configuracaoFabricacaoPadraoControlador = require("../src/controladores/configuracaoFabricacaoPadraoControlador");
const elementoProjetoControlador = require("../src/controladores/elementoProjetoControlador");
const precoFabricacaoControlador = require("../src/controladores/precoFabricacaoControlador");
const resumoFinanceiroControlador = require("../src/controladores/resumoFinanceiroControlador");
const logisticaControlador = require("../src/controladores/logisticaControlador");
const logisticaTerceirizadaControlador = require("../src/controladores/logisticaTerceirizadaControlador");
const equipamentoMontagemControlador = require("../src/controladores/equipamentoMontagemControlador");
const equipeMontagemControlador = require("../src/controladores/equipeMontagemControlador");
const logisticaPropriaControlador = require("../src/controladores/logisticaPropriaControlador");
const relatorioControlador = require("../src/controladores/relatorioControlador");

const criarRequisicao = () => ({
  params: {
    id: "71",
    elementoId: "18",
    equipamentoId: "23",
    equipeId: "24",
  },
  usuario: {
    id: 9,
    nome: "Usuário de teste",
  },
  body: {
    elementos: [
      {
        nomeAplicacao: "V01",
        quantidade: 2,
      },
    ],
    custo: 250,
    quantidade: 2,
    observacoes: "Teste de atualização",
  },
});

const criarResposta = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  setHeader: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
});

const obterArgumentos = (tipo, req) => {
  const id = req.params.id;
  const usuarioId = req.usuario.id;

  switch (tipo) {
    case "projeto":
      return [id, usuarioId];

    case "projetoCorpo":
      return [id, usuarioId, req.body];

    case "corpo":
      return [req.body];

    case "nenhum":
      return [];

    case "importacao":
      return [id, usuarioId, req.body.elementos];

    case "elementoCorpo":
      return [
        id,
        req.params.elementoId,
        usuarioId,
        req.body,
      ];

    case "equipamentoCorpo":
      return [
        id,
        req.params.equipamentoId,
        usuarioId,
        req.body,
      ];

    case "equipamento":
      return [
        id,
        req.params.equipamentoId,
        usuarioId,
      ];

    case "equipeCorpo":
      return [
        id,
        req.params.equipeId,
        usuarioId,
        req.body,
      ];

    case "equipe":
      return [
        id,
        req.params.equipeId,
        usuarioId,
      ];

    default:
      throw new Error(`Tipo de argumento desconhecido: ${tipo}`);
  }
};

const montarResposta = (formato, chave, mensagem, resultado) => {
  switch (formato) {
    case "direto":
      return resultado;

    case "campo":
      return {
        [chave]: resultado,
      };

    case "mensagemCampo":
      return {
        mensagem,
        [chave]: resultado,
      };

    case "espalhar":
      return {
        mensagem,
        ...resultado,
      };

    case "mensagem":
      return {
        mensagem,
      };

    default:
      throw new Error(`Formato desconhecido: ${formato}`);
  }
};

const contratos = [
  [
    "Fabricação - cálculo de volumes",
    fabricacaoControlador,
    "calcularVolumes",
    fabricacaoServico,
    "calcularVolumes",
    "projeto",
    200,
    400,
    "direto",
  ],
  [
    "Fabricação - cálculo de materiais",
    fabricacaoControlador,
    "calcularMateriais",
    fabricacaoServico,
    "calcularMateriais",
    "projeto",
    200,
    400,
    "direto",
  ],
  [
    "Fabricação - cálculo de custos",
    fabricacaoControlador,
    "calcularCustos",
    fabricacaoServico,
    "calcularCustos",
    "projeto",
    200,
    400,
    "direto",
  ],
  [
    "Fabricação - confirmação",
    fabricacaoControlador,
    "confirmar",
    fabricacaoServico,
    "confirmarFabricacao",
    "projeto",
    200,
    400,
    "espalhar",
    null,
    "Fabricação confirmada com sucesso!",
  ],
  [
    "Montagem - salvar configuração",
    montagemControlador,
    "salvar",
    montagemServico,
    "salvarMontagem",
    "projetoCorpo",
    200,
    400,
    "mensagemCampo",
    "montagem",
    "Configuração de montagem salva com sucesso!",
  ],
  [
    "Montagem - buscar configuração",
    montagemControlador,
    "buscar",
    montagemServico,
    "buscarMontagem",
    "projeto",
    200,
    404,
    "campo",
    "montagem",
  ],
  [
    "Montagem - calcular custos",
    montagemControlador,
    "calcularCustos",
    montagemServico,
    "calcularCustos",
    "projeto",
    200,
    400,
    "direto",
  ],
  [
    "Montagem - confirmar",
    montagemControlador,
    "confirmar",
    montagemServico,
    "confirmarMontagem",
    "projeto",
    200,
    400,
    "espalhar",
    null,
    "Montagem confirmada com sucesso!",
  ],
  [
    "Configuração de fabricação - salvar",
    configuracaoFabricacaoControlador,
    "salvar",
    configuracaoFabricacaoServico,
    "salvarConfiguracao",
    "projetoCorpo",
    200,
    400,
    "mensagemCampo",
    "configuracao",
    "Configuração de fabricação salva com sucesso!",
  ],
  [
    "Configuração de fabricação - buscar",
    configuracaoFabricacaoControlador,
    "buscar",
    configuracaoFabricacaoServico,
    "buscarConfiguracao",
    "projeto",
    200,
    404,
    "campo",
    "configuracao",
  ],
  [
    "Configuração padrão de fabricação - buscar",
    configuracaoFabricacaoPadraoControlador,
    "buscar",
    configuracaoFabricacaoPadraoServico,
    "buscarConfiguracaoPadrao",
    "nenhum",
    200,
    400,
    "campo",
    "configuracao",
  ],
  [
    "Configuração padrão de fabricação - salvar",
    configuracaoFabricacaoPadraoControlador,
    "salvar",
    configuracaoFabricacaoPadraoServico,
    "salvarConfiguracaoPadrao",
    "corpo",
    200,
    400,
    "mensagemCampo",
    "configuracao",
    "Configuração padrão atualizada com sucesso!",
  ],
  [
    "Elementos estruturais - confirmar importação",
    elementoProjetoControlador,
    "confirmarImportacao",
    elementoProjetoServico,
    "confirmarImportacao",
    "importacao",
    201,
    400,
    "mensagemCampo",
    "resumo",
    "Importação confirmada com sucesso!",
  ],
  [
    "Elementos estruturais - listar",
    elementoProjetoControlador,
    "listar",
    elementoProjetoServico,
    "listarElementos",
    "projeto",
    200,
    404,
    "campo",
    "elementos",
  ],
  [
    "Elementos estruturais - atualizar",
    elementoProjetoControlador,
    "atualizar",
    elementoProjetoServico,
    "atualizarElemento",
    "elementoCorpo",
    200,
    400,
    "mensagemCampo",
    "elemento",
    "Elemento atualizado com sucesso!",
  ],
  [
    "Preços de fabricação - salvar",
    precoFabricacaoControlador,
    "salvar",
    precoFabricacaoServico,
    "salvarPrecos",
    "projetoCorpo",
    200,
    400,
    "mensagemCampo",
    "precos",
    "Preços de fabricação salvos com sucesso!",
  ],
  [
    "Preços de fabricação - buscar",
    precoFabricacaoControlador,
    "buscar",
    precoFabricacaoServico,
    "buscarPrecos",
    "projeto",
    200,
    404,
    "campo",
    "precos",
  ],
  [
    "Resumo financeiro - calcular",
    resumoFinanceiroControlador,
    "calcular",
    resumoFinanceiroServico,
    "calcularResumoFinanceiro",
    "projeto",
    200,
    400,
    "direto",
  ],
  [
    "Resumo financeiro - finalizar projeto",
    resumoFinanceiroControlador,
    "finalizar",
    resumoFinanceiroServico,
    "finalizarProjeto",
    "projeto",
    200,
    400,
    "espalhar",
    null,
    "Projeto finalizado com sucesso!",
  ],
  [
    "Logística - salvar",
    logisticaControlador,
    "salvar",
    logisticaServico,
    "salvarLogistica",
    "projetoCorpo",
    200,
    400,
    "mensagemCampo",
    "logistica",
    "Configuração de logística salva com sucesso!",
  ],
  [
    "Logística - buscar",
    logisticaControlador,
    "buscar",
    logisticaServico,
    "buscarLogistica",
    "projeto",
    200,
    404,
    "campo",
    "logistica",
  ],
  [
    "Logística - calcular custo",
    logisticaControlador,
    "calcularCusto",
    logisticaServico,
    "calcularCustoLogistica",
    "projeto",
    200,
    400,
    "direto",
  ],
  [
    "Logística - confirmar",
    logisticaControlador,
    "confirmar",
    logisticaServico,
    "confirmarLogistica",
    "projeto",
    200,
    400,
    "espalhar",
    null,
    "Logística confirmada com sucesso!",
  ],
  [
    "Logística terceirizada - salvar",
    logisticaTerceirizadaControlador,
    "salvar",
    logisticaTerceirizadaServico,
    "salvarLogisticaTerceirizada",
    "projetoCorpo",
    200,
    400,
    "mensagemCampo",
    "freteTerceirizado",
    "Frete terceirizado salvo com sucesso!",
  ],
  [
    "Logística terceirizada - buscar",
    logisticaTerceirizadaControlador,
    "buscar",
    logisticaTerceirizadaServico,
    "buscarLogisticaTerceirizada",
    "projeto",
    200,
    404,
    "campo",
    "freteTerceirizado",
  ],
  [
    "Equipamentos de montagem - cadastrar",
    equipamentoMontagemControlador,
    "cadastrar",
    equipamentoMontagemServico,
    "cadastrar",
    "projetoCorpo",
    201,
    400,
    "mensagemCampo",
    "equipamento",
    "Equipamento cadastrado com sucesso!",
  ],
  [
    "Equipamentos de montagem - listar",
    equipamentoMontagemControlador,
    "listar",
    equipamentoMontagemServico,
    "listar",
    "projeto",
    200,
    400,
    "campo",
    "equipamentos",
  ],
  [
    "Equipamentos de montagem - atualizar",
    equipamentoMontagemControlador,
    "atualizar",
    equipamentoMontagemServico,
    "atualizar",
    "equipamentoCorpo",
    200,
    400,
    "mensagemCampo",
    "equipamento",
    "Equipamento atualizado com sucesso!",
  ],
  [
    "Equipamentos de montagem - excluir",
    equipamentoMontagemControlador,
    "excluir",
    equipamentoMontagemServico,
    "excluir",
    "equipamento",
    200,
    404,
    "mensagem",
    null,
    "Equipamento excluído com sucesso!",
  ],
  [
    "Equipes de montagem - cadastrar",
    equipeMontagemControlador,
    "cadastrar",
    equipeMontagemServico,
    "cadastrar",
    "projetoCorpo",
    201,
    400,
    "mensagemCampo",
    "equipe",
    "Equipe cadastrada com sucesso!",
  ],
  [
    "Equipes de montagem - listar",
    equipeMontagemControlador,
    "listar",
    equipeMontagemServico,
    "listar",
    "projeto",
    200,
    400,
    "campo",
    "equipes",
  ],
  [
    "Equipes de montagem - atualizar",
    equipeMontagemControlador,
    "atualizar",
    equipeMontagemServico,
    "atualizar",
    "equipeCorpo",
    200,
    400,
    "mensagemCampo",
    "equipe",
    "Equipe atualizada com sucesso!",
  ],
  [
    "Equipes de montagem - excluir",
    equipeMontagemControlador,
    "excluir",
    equipeMontagemServico,
    "excluir",
    "equipe",
    200,
    404,
    "mensagem",
    null,
    "Equipe excluída com sucesso!",
  ],
  [
    "Logística própria - salvar",
    logisticaPropriaControlador,
    "salvar",
    logisticaPropriaServico,
    "salvarLogisticaPropria",
    "projetoCorpo",
    200,
    400,
    "mensagemCampo",
    "freteProprio",
    "Frete próprio salvo com sucesso!",
  ],
  [
    "Logística própria - buscar",
    logisticaPropriaControlador,
    "buscar",
    logisticaPropriaServico,
    "buscarLogisticaPropria",
    "projeto",
    200,
    404,
    "campo",
    "freteProprio",
  ],
  [
    "Logística própria - calcular custo",
    logisticaPropriaControlador,
    "calcularCusto",
    logisticaPropriaServico,
    "calcularCustoFreteProprio",
    "projeto",
    200,
    400,
    "direto",
  ],
  [
    "Logística própria - sugerir viagens",
    logisticaPropriaControlador,
    "sugerirViagens",
    logisticaPropriaServico,
    "sugerirQuantidadeViagens",
    "projeto",
    200,
    400,
    "direto",
  ],
  [
    "Logística própria - aplicar sugestão",
    logisticaPropriaControlador,
    "aplicarSugestao",
    logisticaPropriaServico,
    "aplicarSugestaoViagens",
    "projeto",
    200,
    400,
    "mensagemCampo",
    "resultado",
    "Sugestão de viagens aplicada com sucesso!",
  ],
];

describe("Controladores dos fluxos do projeto - Estrutec", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe.each(contratos)(
    "%s",
    (
      nome,
      controlador,
      acao,
      servico,
      metodo,
      tipoArgumentos,
      statusSucesso,
      statusErro,
      formato,
      chave,
      mensagem
    ) => {
      test("Deve chamar o serviço com os argumentos corretos e retornar sucesso", async () => {
        const req = criarRequisicao();
        const res = criarResposta();

        const resultado = {
          id: 35,
          total: 459,
          status: "CONCLUIDO",
        };

        servico[metodo].mockResolvedValue(resultado);

        const retorno = await controlador[acao](req, res);

        expect(servico[metodo]).toHaveBeenCalledTimes(1);

        expect(servico[metodo]).toHaveBeenCalledWith(
          ...obterArgumentos(tipoArgumentos, req)
        );

        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(statusSucesso);

        expect(res.json).toHaveBeenCalledTimes(1);

        expect(res.json).toHaveBeenCalledWith(
          montarResposta(
            formato,
            chave,
            mensagem,
            resultado
          )
        );

        expect(retorno).toBe(res);
      });

      test("Deve tratar falha do serviço e retornar o código HTTP correto", async () => {
        const req = criarRequisicao();
        const res = criarResposta();

        const erro = new Error(
          `Falha de teste na operação ${acao}`
        );

        servico[metodo].mockRejectedValue(erro);

        const retorno = await controlador[acao](req, res);

        expect(servico[metodo]).toHaveBeenCalledTimes(1);

        expect(servico[metodo]).toHaveBeenCalledWith(
          ...obterArgumentos(tipoArgumentos, req)
        );

        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(statusErro);

        expect(res.json).toHaveBeenCalledTimes(1);

        expect(res.json).toHaveBeenCalledWith({
          erro: erro.message,
        });

        expect(retorno).toBe(res);
      });
    }
  );

  describe("Geração do relatório PDF", () => {
    test("Deve gerar o PDF e configurar todos os cabeçalhos", async () => {
      const req = criarRequisicao();
      const res = criarResposta();

      const pdf = Buffer.from(
        "%PDF-1.4\nRelatório de teste do Estrutec"
      );

      relatorioServico.gerarRelatorioFinal.mockResolvedValue(pdf);

      const retorno = await relatorioControlador.gerarFinal(
        req,
        res
      );

      expect(
        relatorioServico.gerarRelatorioFinal
      ).toHaveBeenCalledTimes(1);

      expect(
        relatorioServico.gerarRelatorioFinal
      ).toHaveBeenCalledWith("71", 9);

      expect(res.setHeader).toHaveBeenCalledTimes(3);

      expect(res.setHeader).toHaveBeenNthCalledWith(
        1,
        "Content-Type",
        "application/pdf"
      );

      expect(res.setHeader).toHaveBeenNthCalledWith(
        2,
        "Content-Disposition",
        'attachment; filename="estrutec-projeto-71.pdf"'
      );

      expect(res.setHeader).toHaveBeenNthCalledWith(
        3,
        "Content-Length",
        pdf.length
      );

      expect(res.send).toHaveBeenCalledTimes(1);
      expect(res.send).toHaveBeenCalledWith(pdf);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();

      expect(retorno).toBe(res);
    });

    test("Deve enviar corretamente um PDF com conteúdo vazio", async () => {
      const req = criarRequisicao();
      const res = criarResposta();

      const pdf = Buffer.alloc(0);

      relatorioServico.gerarRelatorioFinal.mockResolvedValue(pdf);

      const retorno = await relatorioControlador.gerarFinal(
        req,
        res
      );

      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Length",
        0
      );

      expect(res.send).toHaveBeenCalledWith(pdf);
      expect(retorno).toBe(res);
    });

    test("Deve retornar erro 400 quando a geração do PDF falhar", async () => {
      const req = criarRequisicao();
      const res = criarResposta();

      relatorioServico.gerarRelatorioFinal.mockRejectedValue(
        new Error("Falha ao gerar relatório PDF")
      );

      const retorno = await relatorioControlador.gerarFinal(
        req,
        res
      );

      expect(
        relatorioServico.gerarRelatorioFinal
      ).toHaveBeenCalledWith("71", 9);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        erro: "Falha ao gerar relatório PDF",
      });

      expect(res.setHeader).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();

      expect(retorno).toBe(res);
    });
  });
});