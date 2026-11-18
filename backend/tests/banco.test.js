const VARIAVEIS_AMBIENTE = [
  "NODE_ENV",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "DB_HOST",
  "DB_PORT",
  "DB_SSL_CA_PATH",
];

const ambienteOriginal = {};

beforeAll(() => {
  for (const variavel of VARIAVEIS_AMBIENTE) {
    ambienteOriginal[variavel] = process.env[variavel];
  }
});

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();

  process.env.NODE_ENV = "test";
  process.env.DB_NAME = "estrutec_teste";
  process.env.DB_USER = "usuario_teste";
  process.env.DB_PASSWORD = "senha_ficticia";
  process.env.DB_HOST = "localhost";
  process.env.DB_PORT = "5432";
  process.env.DB_SSL_CA_PATH = "/certificados/rds-ca.pem";

  jest.doMock("dotenv", () => ({
    config: jest.fn(),
  }));

  jest.doMock("sequelize", () => ({
    Sequelize: jest.fn().mockImplementation(() => ({
      bancoSimulado: true,
    })),
  }));

  jest.doMock("node:fs", () => ({
    readFileSync: jest.fn().mockReturnValue(
      "CERTIFICADO_CA_FICTICIO"
    ),
  }));
});

afterEach(() => {
  for (const variavel of VARIAVEIS_AMBIENTE) {
    if (ambienteOriginal[variavel] === undefined) {
      delete process.env[variavel];
    } else {
      process.env[variavel] = ambienteOriginal[variavel];
    }
  }

  jest.dontMock("dotenv");
  jest.dontMock("sequelize");
  jest.dontMock("node:fs");
  jest.resetModules();
});

describe("Configuracao do banco de dados PostgreSQL", () => {
  test("deve configurar corretamente a conexao com PostgreSQL", () => {
    const banco = require("../src/configuracoes/banco");
    const { Sequelize } = require("sequelize");

    expect(Sequelize).toHaveBeenCalledTimes(1);

    expect(Sequelize).toHaveBeenCalledWith(
      "estrutec_teste",
      "usuario_teste",
      "senha_ficticia",
      {
        host: "localhost",
        port: 5432,
        dialect: "postgres",
        logging: false,
        dialectOptions: {},
      }
    );

    expect(banco).toEqual({
      bancoSimulado: true,
    });
  });

  test("nao deve ativar SSL no ambiente de testes", () => {
    process.env.NODE_ENV = "test";

    require("../src/configuracoes/banco");

    const { Sequelize } = require("sequelize");
    const fs = require("node:fs");

    const configuracao = Sequelize.mock.calls[0][3];

    expect(configuracao.dialectOptions).toEqual({});
    expect(fs.readFileSync).not.toHaveBeenCalled();
  });

  test("deve ativar SSL seguro no ambiente de producao", () => {
    process.env.NODE_ENV = "production";

    require("../src/configuracoes/banco");

    const { Sequelize } = require("sequelize");
    const fs = require("node:fs");

    expect(fs.readFileSync).toHaveBeenCalledWith(
      "/certificados/rds-ca.pem",
      "utf8"
    );

    const configuracao = Sequelize.mock.calls[0][3];

    expect(configuracao.dialectOptions).toEqual({
      ssl: {
        ca: "CERTIFICADO_CA_FICTICIO",
        rejectUnauthorized: true,
      },
    });
  });

  test("deve utilizar a porta padrao 5432 quando DB_PORT nao existir", () => {
    delete process.env.DB_PORT;

    require("../src/configuracoes/banco");

    const { Sequelize } = require("sequelize");

    const configuracao = Sequelize.mock.calls[0][3];

    expect(configuracao.port).toBe(5432);
  });

  test("deve utilizar a porta personalizada quando configurada", () => {
    process.env.DB_PORT = "6543";

    require("../src/configuracoes/banco");

    const { Sequelize } = require("sequelize");

    const configuracao = Sequelize.mock.calls[0][3];

    expect(configuracao.port).toBe(6543);
  });

  test("deve falhar se o certificado SSL nao puder ser carregado", () => {
    process.env.NODE_ENV = "production";

    const fs = require("node:fs");

    fs.readFileSync.mockImplementation(() => {
      throw new Error("Certificado SSL nao encontrado");
    });

    expect(() => {
      require("../src/configuracoes/banco");
    }).toThrow("Certificado SSL nao encontrado");
  });
});