jest.mock("nodemailer", () => ({
  createTransport: jest.fn(),
}));

const nodemailer = require("nodemailer");

const {
  enviarEmailRecuperacao,
} = require("../src/servicos/emailServico");

const VARIAVEIS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
];

const ambienteOriginal = {};

let enviarEmailMock;

beforeAll(() => {
  for (const variavel of VARIAVEIS) {
    ambienteOriginal[variavel] = process.env[variavel];
  }
});

beforeEach(() => {
  jest.clearAllMocks();

  process.env.SMTP_HOST = "smtp.gmail.com";
  process.env.SMTP_PORT = "587";
  process.env.SMTP_SECURE = "false";

  process.env.SMTP_USER = "teste@exemplo.com";
  process.env.SMTP_PASS = "senha-ficticia";

  process.env.SMTP_FROM =
    "ESTRUTEC <teste@exemplo.com>";

  enviarEmailMock = jest.fn().mockResolvedValue({
    messageId: "mensagem-teste",
  });

  nodemailer.createTransport.mockReturnValue({
    sendMail: enviarEmailMock,
  });
});

afterAll(() => {
  for (const variavel of VARIAVEIS) {
    if (ambienteOriginal[variavel] === undefined) {
      delete process.env[variavel];
    } else {
      process.env[variavel] = ambienteOriginal[variavel];
    }
  }
});

const DADOS_EMAIL = {
  destinatario: "usuario@exemplo.com",
  nome: "Usuario Teste",
  link: "https://estrutec.app.br/redefinir-senha?token=abc123",
};

describe("Servico de envio de e-mail do ESTRUTEC", () => {
  test("deve configurar corretamente o servidor SMTP", async () => {
    await enviarEmailRecuperacao(DADOS_EMAIL);

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "teste@exemplo.com",
        pass: "senha-ficticia",
      },
    });
  });

  test("deve utilizar a porta padrao 587", async () => {
    delete process.env.SMTP_PORT;

    await enviarEmailRecuperacao(DADOS_EMAIL);

    const configuracao =
      nodemailer.createTransport.mock.calls[0][0];

    expect(configuracao.port).toBe(587);
  });

  test("deve permitir configurar outra porta SMTP", async () => {
    process.env.SMTP_PORT = "465";

    await enviarEmailRecuperacao(DADOS_EMAIL);

    const configuracao =
      nodemailer.createTransport.mock.calls[0][0];

    expect(configuracao.port).toBe(465);
  });

  test("deve ativar conexao segura quando configurada", async () => {
    process.env.SMTP_SECURE = "true";

    await enviarEmailRecuperacao(DADOS_EMAIL);

    const configuracao =
      nodemailer.createTransport.mock.calls[0][0];

    expect(configuracao.secure).toBe(true);
  });

  test("deve utilizar o remetente configurado", async () => {
    await enviarEmailRecuperacao(DADOS_EMAIL);

    expect(enviarEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "ESTRUTEC <teste@exemplo.com>",
        to: "usuario@exemplo.com",
      })
    );
  });

  test("deve utilizar SMTP_USER quando SMTP_FROM nao existir", async () => {
    delete process.env.SMTP_FROM;

    await enviarEmailRecuperacao(DADOS_EMAIL);

    expect(enviarEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "teste@exemplo.com",
      })
    );
  });

  test("deve enviar mensagem de recuperacao com o assunto correto", async () => {
    await enviarEmailRecuperacao(DADOS_EMAIL);

    const mensagem = enviarEmailMock.mock.calls[0][0];

    expect(mensagem.subject).toContain("Estrutec");
    expect(mensagem.to).toBe("usuario@exemplo.com");
  });

  test("deve incluir o nome do usuario no email", async () => {
    await enviarEmailRecuperacao(DADOS_EMAIL);

    const mensagem = enviarEmailMock.mock.calls[0][0];

    expect(mensagem.html).toContain("Usuario Teste");
  });

  test("deve incluir o link de redefinicao de senha", async () => {
    await enviarEmailRecuperacao(DADOS_EMAIL);

    const mensagem = enviarEmailMock.mock.calls[0][0];

    expect(mensagem.html).toContain(DADOS_EMAIL.link);
    expect(mensagem.html).toContain("Redefinir senha");
  });

  test("deve informar a validade de 30 minutos", async () => {
    await enviarEmailRecuperacao(DADOS_EMAIL);

    const mensagem = enviarEmailMock.mock.calls[0][0];

    expect(mensagem.html).toContain("30 minutos");
  });

  test("deve propagar erros de envio SMTP", async () => {
    enviarEmailMock.mockRejectedValue(
      new Error("Falha na conexao SMTP")
    );

    await expect(
      enviarEmailRecuperacao(DADOS_EMAIL)
    ).rejects.toThrow("Falha na conexao SMTP");
  });
});