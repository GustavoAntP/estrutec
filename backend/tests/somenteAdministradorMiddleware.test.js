const somenteAdministrador = require(
  "../src/middlewares/somenteAdministradorMiddleware"
);

describe("Permissões de usuários - Estrutec", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  test("Deve permitir acesso ao ADMINISTRADOR", () => {
    req.usuario = {
      id: 1,
      perfil: "ADMINISTRADOR"
    };

    somenteAdministrador(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("Deve bloquear acesso do OPERADOR", () => {
    req.usuario = {
      id: 2,
      perfil: "OPERADOR"
    };

    somenteAdministrador(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("Deve bloquear usuário não autenticado", () => {
    req.usuario = undefined;

    somenteAdministrador(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("Deve bloquear perfil desconhecido", () => {
    req.usuario = {
      id: 3,
      perfil: "DESCONHECIDO"
    };

    somenteAdministrador(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});