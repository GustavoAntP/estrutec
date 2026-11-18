const MODELOS = [
  "Usuario",
  "Projeto",
  "ElementoProjeto",
  "ConfiguracaoFabricacao",
  "PrecoFabricacao",
  "LogisticaProjeto",
  "LogisticaTerceirizada",
  "LogisticaPropria",
  "MontagemProjeto",
  "EquipamentoMontagem",
  "EquipeMontagem",
  "ClienteEmpresa",
  "Transportadora",
  "Equipamento",
  "Equipe",
  "ConfiguracaoFabricacaoPadrao",
  "CavaloMecanico",
  "Carreta",
];

const ROTAS = [
  "usuarioRotas",
  "authRotas",
  "projetoRotas",
  "recuperacaoSenhaRotas",
  "clienteEmpresaRotas",
  "transportadoraRotas",
  "equipamentoRotas",
  "equipeRotas",
  "configuracaoFabricacaoPadraoRotas",
  "CavaloMecanicoRotas",
  "CarretaRotas",
];

const VARIAVEIS = [
  "JWT_SECRET",
  "PORT",
  "CORS_ORIGIN",
];

const ambienteOriginal = {};

beforeAll(() => {
  for (const variavel of VARIAVEIS) {
    ambienteOriginal[variavel] = process.env[variavel];
  }
});

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();

  process.env.JWT_SECRET = "segredo-exclusivo-para-testes";
  process.env.PORT = "3001";

  delete process.env.CORS_ORIGIN;

  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  for (const variavel of VARIAVEIS) {
    if (ambienteOriginal[variavel] === undefined) {
      delete process.env[variavel];
    } else {
      process.env[variavel] = ambienteOriginal[variavel];
    }
  }

  jest.restoreAllMocks();
  jest.resetModules();
});

function prepararMocks({
  erroAutenticacao = null,
  erroSincronizacao = null,
} = {}) {
  const middleware = (req, res, next) => {
    if (next) next();
  };

  const appMock = {
    use: jest.fn(),
    get: jest.fn(),
    listen: jest.fn((porta, callback) => {
      if (callback) callback();
    }),
  };

  const expressMock = jest.fn(() => appMock);

  expressMock.json = jest.fn(() => middleware);

  const corsMock = jest.fn(() => middleware);

  const bancoMock = {
    authenticate: jest.fn(),
    sync: jest.fn(),
  };

  if (erroAutenticacao) {
    bancoMock.authenticate.mockRejectedValue(
      erroAutenticacao
    );
  } else {
    bancoMock.authenticate.mockResolvedValue();
  }

  if (erroSincronizacao) {
    bancoMock.sync.mockRejectedValue(
      erroSincronizacao
    );
  } else {
    bancoMock.sync.mockResolvedValue();
  }

  jest.doMock("dotenv", () => ({
    config: jest.fn(),
  }));

  jest.doMock("express", () => expressMock);

  jest.doMock("cors", () => corsMock);

  jest.doMock("helmet", () =>
    jest.fn(() => middleware)
  );

  jest.doMock("express-rate-limit", () =>
    jest.fn(() => middleware)
  );

  jest.doMock("../src/configuracoes/banco", () =>
    bancoMock
  );

  jest.doMock(
    "../src/middlewares/tratamentoErrosMiddleware",
    () => middleware
  );

  for (const modelo of MODELOS) {
    jest.doMock(
      `../src/modelos/${modelo}`,
      () => ({})
    );
  }

  for (const rota of ROTAS) {
    jest.doMock(
      `../src/rotas/${rota}`,
      () => middleware
    );
  }

  return {
    appMock,
    bancoMock,
    corsMock,
  };
}

async function carregarAplicacao() {
  require("../src/app");

  // Permite concluir as operacoes assincronas
  // executadas durante a inicializacao.
  await new Promise((resolve) => {
    setImmediate(resolve);
  });
}

describe("Inicializacao do servidor ESTRUTEC", () => {
  test("deve iniciar o servidor quando o banco estiver disponivel", async () => {
    const { appMock, bancoMock } = prepararMocks();

    await carregarAplicacao();

    expect(bancoMock.authenticate).toHaveBeenCalledTimes(1);

    expect(bancoMock.sync).toHaveBeenCalledTimes(1);

    expect(appMock.listen).toHaveBeenCalledWith(
      "3001",
      expect.any(Function)
    );
  });

  test("nao deve iniciar o servidor quando a autenticacao do banco falhar", async () => {
    const erro = new Error("Banco indisponivel");

    const { appMock, bancoMock } = prepararMocks({
      erroAutenticacao: erro,
    });

    await carregarAplicacao();

    expect(bancoMock.authenticate).toHaveBeenCalledTimes(1);

    expect(bancoMock.sync).not.toHaveBeenCalled();

    expect(appMock.listen).not.toHaveBeenCalled();

    expect(console.error).toHaveBeenCalledWith(
      erro
    );
  });

  test("nao deve iniciar o servidor quando a sincronizacao falhar", async () => {
    const erro = new Error("Falha na sincronizacao");

    const { appMock, bancoMock } = prepararMocks({
      erroSincronizacao: erro,
    });

    await carregarAplicacao();

    expect(bancoMock.authenticate).toHaveBeenCalledTimes(1);

    expect(bancoMock.sync).toHaveBeenCalledTimes(1);

    expect(appMock.listen).not.toHaveBeenCalled();

    expect(console.error).toHaveBeenCalledWith(
      erro
    );
  });

  test("deve exigir JWT_SECRET configurada", () => {
    delete process.env.JWT_SECRET;

    const { appMock, bancoMock } = prepararMocks();

    expect(() => {
      require("../src/app");
    }).toThrow("JWT_SECRET nao configurada");

    expect(bancoMock.authenticate).not.toHaveBeenCalled();

    expect(appMock.listen).not.toHaveBeenCalled();
  });

  test("deve configurar corretamente o CORS", async () => {
    process.env.CORS_ORIGIN =
      "https://estrutec.app.br";

    const { corsMock } = prepararMocks();

    await carregarAplicacao();

    expect(corsMock).toHaveBeenCalledWith({
      origin: "https://estrutec.app.br",
    });
  });

  test("deve registrar a rota principal da API", async () => {
    const { appMock } = prepararMocks();

    await carregarAplicacao();

    const rotaPrincipal = appMock.get.mock.calls.find(
      ([caminho]) => caminho === "/"
    );

    expect(rotaPrincipal).toBeDefined();

    const controlador = rotaPrincipal[1];

    const resposta = {
      json: jest.fn(),
    };

    controlador({}, resposta);

    expect(resposta.json).toHaveBeenCalledWith({
      mensagem: "API do Estrutec funcionando!",
    });
  });
});