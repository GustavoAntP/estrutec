jest.mock("jsonwebtoken", () => ({
  verify: jest.fn()
}));

const jwt = require("jsonwebtoken");

const autenticar = require(
  "../src/middlewares/autenticacaoMiddleware"
);

describe("Validação JWT - Estrutec", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.resetAllMocks();

    process.env.JWT_SECRET =
      "segredo_exclusivo_para_testes";

    req = {
      headers: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  test("Deve bloquear requisição sem token", () => {
    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("Deve bloquear token com formato inválido", () => {
    req.headers.authorization = "Token abc123";

    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("Deve bloquear token inválido", () => {
    req.headers.authorization =
      "Bearer token-invalido";

    jwt.verify.mockImplementation(() => {
      throw new Error("Token inválido");
    });

    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("Deve permitir token válido e preservar o perfil", () => {
    req.headers.authorization =
      "Bearer token-valido";

    jwt.verify.mockReturnValue({
      id: 1,
      nome: "Administrador",
      perfil: "ADMINISTRADOR"
    });

    autenticar(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(
      "token-valido",
      process.env.JWT_SECRET
    );

    expect(next).toHaveBeenCalledTimes(1);

    expect(req.usuario).toMatchObject({
      id: 1,
      nome: "Administrador",
      perfil: "ADMINISTRADOR"
    });
  });

  test("Deve bloquear Bearer sem token", () => {
    req.headers.authorization = "Bearer ";

    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});