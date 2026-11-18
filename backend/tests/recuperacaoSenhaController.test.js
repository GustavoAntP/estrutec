const crypto = require("crypto");

jest.mock("../src/modelos/Usuario", () => ({
  findOne: jest.fn(),
  findByPk: jest.fn(),
}));

jest.mock("../src/modelos/RecuperacaoSenha", () => ({
  update: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock("../src/servicos/emailServico", () => ({
  enviarEmailRecuperacao: jest.fn(),
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
}));

const Usuario = require("../src/modelos/Usuario");

const RecuperacaoSenha = require(
  "../src/modelos/RecuperacaoSenha"
);

const {
  enviarEmailRecuperacao,
} = require("../src/servicos/emailServico");

const bcrypt = require("bcrypt");

const {
  solicitarRecuperacao,
  redefinirSenha,
} = require("../src/controladores/recuperacaoSenhaController");

const frontendUrlOriginal = process.env.FRONTEND_URL;

function criarResposta() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res;
}

function criarUsuario() {
  return {
    id: 10,
    nome: "Usuario Teste",
    email: "usuario@exemplo.com",
    cpf: "12345678901",
    ativo: true,
    update: jest.fn().mockResolvedValue(undefined),
  };
}

function criarRecuperacaoValida() {
  return {
    usuario_id: 10,
    expira_em: new Date(Date.now() + 30 * 60 * 1000),
    update: jest.fn().mockResolvedValue(undefined),
  };
}

beforeEach(() => {
  jest.resetAllMocks();

  process.env.FRONTEND_URL = "https://estrutec.app.br";

  Usuario.findOne.mockResolvedValue(null);
  Usuario.findByPk.mockResolvedValue(null);

  RecuperacaoSenha.update.mockResolvedValue([1]);
  RecuperacaoSenha.create.mockResolvedValue({
    id: 1,
  });
  RecuperacaoSenha.findOne.mockResolvedValue(null);

  bcrypt.hash.mockResolvedValue("hash-seguro-ficticio");

  enviarEmailRecuperacao.mockResolvedValue(undefined);

  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(() => {
  if (frontendUrlOriginal === undefined) {
    delete process.env.FRONTEND_URL;
  } else {
    process.env.FRONTEND_URL = frontendUrlOriginal;
  }
});

describe("Solicitacao de recuperacao de senha", () => {
  test.each([
    undefined,
    "",
    "   ",
  ])(
    "deve rejeitar identificador vazio: %p",
    async (identificador) => {
      const req = {
        body: {
          identificador,
        },
      };

      const res = criarResposta();

      await solicitarRecuperacao(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          erro: expect.any(String),
        })
      );

      expect(Usuario.findOne).not.toHaveBeenCalled();
    }
  );

  test("deve normalizar emails em minusculas", async () => {
    const req = {
      body: {
        identificador: "  USUARIO@EXEMPLO.COM  ",
      },
    };

    const res = criarResposta();

    await solicitarRecuperacao(req, res);

    expect(Usuario.findOne).toHaveBeenCalledWith({
      where: {
        email: "usuario@exemplo.com",
      },
    });
  });

  test("deve remover pontuacao do CPF", async () => {
    const req = {
      body: {
        identificador: "123.456.789-01",
      },
    };

    const res = criarResposta();

    await solicitarRecuperacao(req, res);

    expect(Usuario.findOne).toHaveBeenCalledWith({
      where: {
        cpf: "12345678901",
      },
    });
  });

  test("nao deve revelar se o usuario existe", async () => {
    const req = {
      body: {
        identificador: "usuario@exemplo.com",
      },
    };

    const respostaInexistente = criarResposta();

    Usuario.findOne.mockResolvedValueOnce(null);

    await solicitarRecuperacao(
      req,
      respostaInexistente
    );

    const respostaInativo = criarResposta();

    Usuario.findOne.mockResolvedValueOnce({
      ...criarUsuario(),
      ativo: false,
    });

    await solicitarRecuperacao(
      req,
      respostaInativo
    );

    expect(
      respostaInexistente.json.mock.calls[0][0]
    ).toEqual(
      respostaInativo.json.mock.calls[0][0]
    );

    expect(enviarEmailRecuperacao).not.toHaveBeenCalled();
  });

  test("deve invalidar tokens anteriores", async () => {
    const usuario = criarUsuario();

    Usuario.findOne.mockResolvedValue(usuario);

    const req = {
      body: {
        identificador: usuario.email,
      },
    };

    const res = criarResposta();

    await solicitarRecuperacao(req, res);

    expect(RecuperacaoSenha.update).toHaveBeenCalledWith(
      {
        utilizado: true,
      },
      {
        where: {
          usuario_id: usuario.id,
          utilizado: false,
        },
      }
    );
  });

  test("deve criar token aleatorio e armazenar somente seu hash", async () => {
    const usuario = criarUsuario();

    Usuario.findOne.mockResolvedValue(usuario);

    const req = {
      body: {
        identificador: usuario.email,
      },
    };

    const res = criarResposta();

    const inicio = Date.now();

    await solicitarRecuperacao(req, res);

    const fim = Date.now();

    expect(RecuperacaoSenha.create).toHaveBeenCalledTimes(1);

    const registro =
      RecuperacaoSenha.create.mock.calls[0][0];

    const dadosEmail =
      enviarEmailRecuperacao.mock.calls[0][0];

    const url = new URL(dadosEmail.link);

    const token = url.searchParams.get("token");

    expect(token).toMatch(/^[a-f0-9]{64}$/);

    const hashEsperado = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    expect(registro.usuario_id).toBe(usuario.id);
    expect(registro.token_hash).toBe(hashEsperado);
    expect(registro.token_hash).not.toBe(token);
    expect(registro.utilizado).toBe(false);

    expect(registro.expira_em).toBeInstanceOf(Date);

    expect(registro.expira_em.getTime()).toBeGreaterThanOrEqual(
      inicio + 30 * 60 * 1000
    );

    expect(registro.expira_em.getTime()).toBeLessThanOrEqual(
      fim + 30 * 60 * 1000
    );

    expect(dadosEmail.destinatario).toBe(usuario.email);
    expect(dadosEmail.nome).toBe(usuario.nome);

    expect(url.origin).toBe("https://estrutec.app.br");
    expect(url.pathname).toBe("/redefinir-senha");

    expect(res.json).toHaveBeenCalledWith({
      mensagem: expect.any(String),
    });
  });

  test("deve utilizar localhost quando FRONTEND_URL nao existir", async () => {
    delete process.env.FRONTEND_URL;

    Usuario.findOne.mockResolvedValue(
      criarUsuario()
    );

    const req = {
      body: {
        identificador: "usuario@exemplo.com",
      },
    };

    const res = criarResposta();

    await solicitarRecuperacao(req, res);

    const dadosEmail =
      enviarEmailRecuperacao.mock.calls[0][0];

    expect(dadosEmail.link).toContain(
      "http://localhost:3000/redefinir-senha"
    );
  });

  test("deve retornar resposta generica quando o email falhar", async () => {
    Usuario.findOne.mockResolvedValue(
      criarUsuario()
    );

    enviarEmailRecuperacao.mockRejectedValue(
      new Error("Servidor SMTP indisponivel")
    );

    const req = {
      body: {
        identificador: "usuario@exemplo.com",
      },
    };

    const res = criarResposta();

    await solicitarRecuperacao(req, res);

    expect(RecuperacaoSenha.create).toHaveBeenCalled();

    expect(res.json).toHaveBeenCalledWith({
      mensagem: expect.any(String),
    });

    expect(res.status).not.toHaveBeenCalledWith(500);
    expect(console.error).toHaveBeenCalled();
  });

  test("deve tratar falhas de consulta ao banco", async () => {
    Usuario.findOne.mockRejectedValue(
      new Error("Falha no banco")
    );

    const req = {
      body: {
        identificador: "usuario@exemplo.com",
      },
    };

    const res = criarResposta();

    await solicitarRecuperacao(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      erro: expect.any(String),
    });

    expect(enviarEmailRecuperacao).not.toHaveBeenCalled();
  });
});

describe("Redefinicao de senha", () => {
  test.each([
    {
      token: "",
      novaSenha: "senha12345",
    },
    {
      token: "token-teste",
      novaSenha: "",
    },
    {
      token: undefined,
      novaSenha: undefined,
    },
  ])(
    "deve rejeitar campos obrigatorios ausentes: %p",
    async (body) => {
      const req = {
        body,
      };

      const res = criarResposta();

      await redefinirSenha(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(RecuperacaoSenha.findOne).not.toHaveBeenCalled();
    }
  );

  test("deve rejeitar senha com menos de 8 caracteres", async () => {
    const req = {
      body: {
        token: "token-teste",
        novaSenha: "1234567",
      },
    };

    const res = criarResposta();

    await redefinirSenha(req, res);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  test("deve consultar o hash do token recebido", async () => {
    const token = "token-ficticio";

    const req = {
      body: {
        token,
        novaSenha: "NovaSenha123",
      },
    };

    const res = criarResposta();

    await redefinirSenha(req, res);

    const hashEsperado = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    expect(RecuperacaoSenha.findOne).toHaveBeenCalledWith({
      where: {
        token_hash: hashEsperado,
        utilizado: false,
      },
    });
  });

  test("deve rejeitar token inexistente ou utilizado", async () => {
    RecuperacaoSenha.findOne.mockResolvedValue(null);

    const req = {
      body: {
        token: "token-invalido",
        novaSenha: "NovaSenha123",
      },
    };

    const res = criarResposta();

    await redefinirSenha(req, res);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(Usuario.findByPk).not.toHaveBeenCalled();

    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  test("deve rejeitar token expirado e marcar como utilizado", async () => {
    const recuperacao = criarRecuperacaoValida();

    recuperacao.expira_em = new Date(
      Date.now() - 60 * 1000
    );

    RecuperacaoSenha.findOne.mockResolvedValue(
      recuperacao
    );

    const req = {
      body: {
        token: "token-expirado",
        novaSenha: "NovaSenha123",
      },
    };

    const res = criarResposta();

    await redefinirSenha(req, res);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(recuperacao.update).toHaveBeenCalledWith({
      utilizado: true,
    });

    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  test("deve rejeitar recuperacao sem usuario associado", async () => {
    const recuperacao = criarRecuperacaoValida();

    RecuperacaoSenha.findOne.mockResolvedValue(
      recuperacao
    );

    Usuario.findByPk.mockResolvedValue(null);

    const req = {
      body: {
        token: "token-valido",
        novaSenha: "NovaSenha123",
      },
    };

    const res = criarResposta();

    await redefinirSenha(req, res);

    expect(Usuario.findByPk).toHaveBeenCalledWith(
      recuperacao.usuario_id
    );

    expect(res.status).toHaveBeenCalledWith(400);

    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  test("deve atualizar a senha e invalidar o token", async () => {
    const recuperacao = criarRecuperacaoValida();

    const usuario = criarUsuario();

    RecuperacaoSenha.findOne.mockResolvedValue(
      recuperacao
    );

    Usuario.findByPk.mockResolvedValue(
      usuario
    );

    const req = {
      body: {
        token: "token-valido",
        novaSenha: "NovaSenhaSegura123",
      },
    };

    const res = criarResposta();

    await redefinirSenha(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith(
      "NovaSenhaSegura123",
      10
    );

    expect(usuario.update).toHaveBeenCalledWith({
      senha_hash: "hash-seguro-ficticio",
    });

    expect(recuperacao.update).toHaveBeenCalledWith({
      utilizado: true,
    });

    expect(res.json).toHaveBeenCalledWith({
      mensagem: "Senha redefinida com sucesso.",
    });

    expect(res.status).not.toHaveBeenCalledWith(500);
  });

  test("deve tratar falhas ao gerar o hash da nova senha", async () => {
    const recuperacao = criarRecuperacaoValida();

    RecuperacaoSenha.findOne.mockResolvedValue(
      recuperacao
    );

    Usuario.findByPk.mockResolvedValue(
      criarUsuario()
    );

    bcrypt.hash.mockRejectedValue(
      new Error("Falha ao gerar hash")
    );

    const req = {
      body: {
        token: "token-valido",
        novaSenha: "NovaSenhaSegura123",
      },
    };

    const res = criarResposta();

    await redefinirSenha(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(recuperacao.update).not.toHaveBeenCalled();

    expect(console.error).toHaveBeenCalled();
  });

  test("deve tratar falhas na consulta do token", async () => {
    RecuperacaoSenha.findOne.mockRejectedValue(
      new Error("Erro de consulta")
    );

    const req = {
      body: {
        token: "token-valido",
        novaSenha: "NovaSenhaSegura123",
      },
    };

    const res = criarResposta();

    await redefinirSenha(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      erro: expect.any(String),
    });
  });
});