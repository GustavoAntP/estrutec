jest.mock("../src/modelos/Usuario", () => ({
  findOne: jest.fn(),
}));

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

const Usuario = require("../src/modelos/Usuario");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { login } = require("../src/servicos/authServico");

describe("Testes de autenticação - Estrutec", () => {
  const usuarioTeste = {
    id: 1,
    nome: "Usuário Teste",
    email: "teste@estrutec.com",
    perfil: "ADMIN",
    ativo: true,
    senha_hash: "hash_teste",
  };

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.JWT_SECRET = "segredo_exclusivo_para_testes";
    jwt.sign.mockReturnValue("token_teste");
  });

  test("Deve impedir login sem credenciais", async () => {
    await expect(login("", "")).rejects.toThrow(
      "CPF/e-mail e senha são obrigatórios."
    );
  });

  test("Deve rejeitar usuário inexistente", async () => {
    Usuario.findOne.mockResolvedValue(null);

    await expect(
      login("inexistente@estrutec.com", "123456")
    ).rejects.toThrow("CPF/e-mail ou senha inválidos.");
  });

  test("Deve impedir login de usuário desativado", async () => {
    Usuario.findOne.mockResolvedValue({
      ...usuarioTeste,
      ativo: false,
    });

    await expect(
      login("teste@estrutec.com", "123456")
    ).rejects.toThrow(
      "Usuário desativado. Entre em contato com o administrador."
    );
  });

  test("Deve rejeitar senha incorreta", async () => {
    Usuario.findOne.mockResolvedValue(usuarioTeste);
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      login("teste@estrutec.com", "senha_errada")
    ).rejects.toThrow("CPF/e-mail ou senha inválidos.");
  });

  test("Deve autenticar usuário com credenciais corretas", async () => {
    Usuario.findOne.mockResolvedValue(usuarioTeste);
    bcrypt.compare.mockResolvedValue(true);

    const resultado = await login(
      "teste@estrutec.com",
      "senha_correta"
    );

    expect(resultado).toHaveProperty("token", "token_teste");

    expect(resultado.usuario).toEqual({
      id: 1,
      nome: "Usuário Teste",
      email: "teste@estrutec.com",
      perfil: "ADMIN",
    });

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        perfil: "ADMIN",
      }),
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
  });
    test("Deve normalizar o e-mail informado", async () => {
    Usuario.findOne.mockResolvedValue(null);

    await expect(
      login("  TESTE@ESTRUTEC.COM  ", "123456")
    ).rejects.toThrow("CPF/e-mail ou senha inválidos.");

    expect(Usuario.findOne).toHaveBeenCalledWith({
      where: {
        [require("sequelize").Op.or]: [
          { cpf: "" },
          { email: "teste@estrutec.com" }
        ]
      }
    });
  });

  test("Deve remover a formatação do CPF", async () => {
    Usuario.findOne.mockResolvedValue(null);

    await expect(
      login("123.456.789-00", "123456")
    ).rejects.toThrow("CPF/e-mail ou senha inválidos.");

    expect(Usuario.findOne).toHaveBeenCalledWith({
      where: {
        [require("sequelize").Op.or]: [
          { cpf: "12345678900" },
          { email: "123.456.789-00" }
        ]
      }
    });
});
});