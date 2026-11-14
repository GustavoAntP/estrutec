jest.mock("bcrypt", () => ({
  hash: jest.fn(),
}));

jest.mock("../src/modelos/Usuario", () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
}));

const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const Usuario = require("../src/modelos/Usuario");

const {
  cadastrarUsuario,
  listarUsuarios,
  editarUsuario,
  alterarStatusUsuario,
} = require("../src/servicos/usuarioServico");

const dadosCadastro = {
  nome: " Maria da Silva ",
  cpf: "123.456.789-09",
  email: " MARIA@EXEMPLO.COM.BR ",
  senha: "Senha@123",
  perfil: "ADMINISTRADOR",
};

const dadosEdicao = {
  nome: " Maria Atualizada ",
  cpf: "123.456.789-09",
  email: " MARIA.NOVA@EXEMPLO.COM.BR ",
  perfil: "ADMINISTRADOR",
};

const criarUsuario = (alteracoes = {}) => ({
  id: 7,
  nome: "Maria da Silva",
  cpf: "12345678909",
  email: "maria@exemplo.com.br",
  senha_hash: "hash-original",
  ativo: true,
  perfil: "OPERADOR",
  save: jest.fn().mockResolvedValue(undefined),
  ...alteracoes,
});

describe("Serviço de usuários - Estrutec", () => {
  let usuario;

  beforeEach(() => {
    jest.resetAllMocks();

    usuario = criarUsuario();

    Usuario.findOne.mockResolvedValue(null);
    Usuario.findByPk.mockResolvedValue(usuario);
    Usuario.findAll.mockResolvedValue([usuario]);

    bcrypt.hash.mockResolvedValue("hash-criptografado");

    Usuario.create.mockImplementation(async (dados) => ({
      id: 12,
      ativo: true,
      ...dados,
    }));
  });

  describe("Cadastro de usuários", () => {
    test("Deve cadastrar usuário com dados normalizados", async () => {
      const resultado = await cadastrarUsuario(dadosCadastro);

      expect(Usuario.create).toHaveBeenCalledWith({
        nome: "Maria da Silva",
        cpf: "12345678909",
        email: "maria@exemplo.com.br",
        senha_hash: "hash-criptografado",
        perfil: "ADMINISTRADOR",
      });

      expect(resultado).toEqual({
        id: 12,
        nome: "Maria da Silva",
        cpf: "12345678909",
        email: "maria@exemplo.com.br",
        ativo: true,
        perfil: "ADMINISTRADOR",
      });
    });

    test("Deve criptografar a senha antes do cadastro", async () => {
      await cadastrarUsuario(dadosCadastro);

      expect(bcrypt.hash).toHaveBeenCalledWith("Senha@123", 10);
      expect(bcrypt.hash).toHaveBeenCalledTimes(1);

      expect(Usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          senha_hash: "hash-criptografado",
        })
      );
    });

    test("Deve criar usuário OPERADOR quando o perfil não for informado", async () => {
      const dados = { ...dadosCadastro };

      delete dados.perfil;

      const resultado = await cadastrarUsuario(dados);

      expect(Usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          perfil: "OPERADOR",
        })
      );

      expect(resultado.perfil).toBe("OPERADOR");
    });

    test("Deve aceitar perfil OPERADOR explicitamente", async () => {
      const resultado = await cadastrarUsuario({
        ...dadosCadastro,
        perfil: "OPERADOR",
      });

      expect(resultado.perfil).toBe("OPERADOR");
    });

    test("Deve aceitar perfil ADMINISTRADOR", async () => {
      const resultado = await cadastrarUsuario(dadosCadastro);

      expect(resultado.perfil).toBe("ADMINISTRADOR");
    });

    test("Deve utilizar perfil OPERADOR quando receber string vazia", async () => {
      await cadastrarUsuario({
        ...dadosCadastro,
        perfil: "",
      });

      expect(Usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          perfil: "OPERADOR",
        })
      );
    });

    test("Deve remover a máscara do CPF", async () => {
      await cadastrarUsuario(dadosCadastro);

      expect(Usuario.findOne).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { cpf: "12345678909" },
            { email: "maria@exemplo.com.br" },
          ],
        },
      });
    });

    test("Deve aceitar CPF informado sem máscara", async () => {
      await cadastrarUsuario({
        ...dadosCadastro,
        cpf: "12345678909",
      });

      expect(Usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cpf: "12345678909",
        })
      );
    });

    test("Deve normalizar e-mail para letras minúsculas", async () => {
      await cadastrarUsuario({
        ...dadosCadastro,
        email: " TESTE@EMPRESA.COM ",
      });

      expect(Usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "teste@empresa.com",
        })
      );
    });

    test("Deve remover espaços nas extremidades do nome", async () => {
      await cadastrarUsuario({
        ...dadosCadastro,
        nome: "  Operador de Montagem  ",
      });

      expect(Usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: "Operador de Montagem",
        })
      );
    });

    test.each([
      ["nome", "Nome, CPF, e-mail e senha são obrigatórios."],
      ["cpf", "Nome, CPF, e-mail e senha são obrigatórios."],
      ["email", "Nome, CPF, e-mail e senha são obrigatórios."],
      ["senha", "Nome, CPF, e-mail e senha são obrigatórios."],
    ])("Deve rejeitar cadastro sem %s", async (campo, mensagem) => {
      const dados = { ...dadosCadastro };

      delete dados[campo];

      await expect(
        cadastrarUsuario(dados)
      ).rejects.toThrow(mensagem);

      expect(Usuario.create).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    test.each([
      ["nome", ""],
      ["cpf", ""],
      ["email", ""],
      ["senha", ""],
    ])("Deve rejeitar cadastro com %s vazio", async (campo, valor) => {
      await expect(
        cadastrarUsuario({
          ...dadosCadastro,
          [campo]: valor,
        })
      ).rejects.toThrow(
        "Nome, CPF, e-mail e senha são obrigatórios."
      );

      expect(Usuario.create).not.toHaveBeenCalled();
    });

    test.each([
      ["menos de 11 números", "123456789"],
      ["mais de 11 números", "123456789012"],
      ["somente letras", "abcdefghijk"],
    ])("Deve rejeitar CPF com %s", async (_, cpf) => {
      await expect(
        cadastrarUsuario({
          ...dadosCadastro,
          cpf,
        })
      ).rejects.toThrow("CPF deve conter 11 números.");

      expect(Usuario.findOne).not.toHaveBeenCalled();
      expect(Usuario.create).not.toHaveBeenCalled();
    });

    test.each([
      "USUARIO",
      "ADMIN",
      "administrador",
      "OPERADOR_COMUM",
    ])("Deve rejeitar perfil inválido: %s", async (perfil) => {
      await expect(
        cadastrarUsuario({
          ...dadosCadastro,
          perfil,
        })
      ).rejects.toThrow("Perfil de usuário inválido.");

      expect(Usuario.findOne).not.toHaveBeenCalled();
      expect(Usuario.create).not.toHaveBeenCalled();
    });

    test("Deve impedir cadastro com CPF ou e-mail duplicado", async () => {
      Usuario.findOne.mockResolvedValue(usuario);

      await expect(
        cadastrarUsuario(dadosCadastro)
      ).rejects.toThrow("CPF ou e-mail já cadastrado.");

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(Usuario.create).not.toHaveBeenCalled();
    });

    test("Deve consultar duplicidade utilizando CPF e e-mail", async () => {
      await cadastrarUsuario(dadosCadastro);

      expect(Usuario.findOne).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { cpf: "12345678909" },
            { email: "maria@exemplo.com.br" },
          ],
        },
      });

      expect(Usuario.findOne).toHaveBeenCalledTimes(1);
    });

    test("Não deve retornar senha criptografada na resposta", async () => {
      const resultado = await cadastrarUsuario(dadosCadastro);

      expect(resultado).not.toHaveProperty("senha");
      expect(resultado).not.toHaveProperty("senha_hash");

      expect(resultado).toHaveProperty("id", 12);
      expect(resultado).toHaveProperty("email");
    });

    test("Não deve enviar senha original para o modelo", async () => {
      await cadastrarUsuario(dadosCadastro);

      const dadosSalvos = Usuario.create.mock.calls[0][0];

      expect(dadosSalvos).not.toHaveProperty("senha");
      expect(dadosSalvos.senha_hash).toBe("hash-criptografado");
    });

    test("Deve propagar falhas na consulta de duplicidade", async () => {
      Usuario.findOne.mockRejectedValue(
        new Error("Falha ao consultar usuários")
      );

      await expect(
        cadastrarUsuario(dadosCadastro)
      ).rejects.toThrow("Falha ao consultar usuários");

      expect(Usuario.create).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas durante a criptografia", async () => {
      bcrypt.hash.mockRejectedValue(
        new Error("Falha ao criptografar senha")
      );

      await expect(
        cadastrarUsuario(dadosCadastro)
      ).rejects.toThrow("Falha ao criptografar senha");

      expect(Usuario.create).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas durante o cadastro", async () => {
      Usuario.create.mockRejectedValue(
        new Error("Falha ao salvar usuário")
      );

      await expect(
        cadastrarUsuario(dadosCadastro)
      ).rejects.toThrow("Falha ao salvar usuário");
    });
  });

  describe("Listagem de usuários", () => {
    test("Deve listar usuários em ordem alfabética", async () => {
      const resultado = await listarUsuarios();

      expect(resultado).toEqual([usuario]);

      expect(Usuario.findAll).toHaveBeenCalledWith({
        attributes: [
          "id",
          "nome",
          "cpf",
          "email",
          "ativo",
          "perfil",
        ],
        order: [["nome", "ASC"]],
      });
    });

    test("Deve retornar lista vazia quando não houver usuários", async () => {
      Usuario.findAll.mockResolvedValue([]);

      await expect(
        listarUsuarios()
      ).resolves.toEqual([]);
    });

    test("Deve propagar falhas na listagem", async () => {
      Usuario.findAll.mockRejectedValue(
        new Error("Falha ao listar usuários")
      );

      await expect(
        listarUsuarios()
      ).rejects.toThrow("Falha ao listar usuários");
    });

    test("Não deve solicitar senhas na consulta", async () => {
      await listarUsuarios();

      const consulta = Usuario.findAll.mock.calls[0][0];

      expect(consulta.attributes).not.toContain("senha");
      expect(consulta.attributes).not.toContain("senha_hash");
    });
  });

  describe("Edição de usuários", () => {
    test("Deve atualizar os dados do usuário", async () => {
      const resultado = await editarUsuario(7, dadosEdicao);

      expect(Usuario.findByPk).toHaveBeenCalledWith(7);

      expect(usuario.save).toHaveBeenCalledTimes(1);

      expect(resultado).toEqual({
        id: 7,
        nome: "Maria Atualizada",
        cpf: "12345678909",
        email: "maria.nova@exemplo.com.br",
        ativo: true,
        perfil: "ADMINISTRADOR",
      });
    });

    test("Deve normalizar os dados durante a edição", async () => {
      await editarUsuario(7, dadosEdicao);

      expect(usuario.nome).toBe("Maria Atualizada");
      expect(usuario.cpf).toBe("12345678909");
      expect(usuario.email).toBe("maria.nova@exemplo.com.br");
      expect(usuario.perfil).toBe("ADMINISTRADOR");
    });

    test("Deve permitir alterar perfil para OPERADOR", async () => {
      await editarUsuario(7, {
        ...dadosEdicao,
        perfil: "OPERADOR",
      });

      expect(usuario.perfil).toBe("OPERADOR");
      expect(usuario.save).toHaveBeenCalledTimes(1);
    });

    test("Deve permitir alterar perfil para ADMINISTRADOR", async () => {
      await editarUsuario(7, dadosEdicao);

      expect(usuario.perfil).toBe("ADMINISTRADOR");
    });

    test("Deve permitir manter o CPF e e-mail existentes", async () => {
      await editarUsuario(7, {
        nome: "Maria da Silva",
        cpf: "123.456.789-09",
        email: "MARIA@EXEMPLO.COM.BR",
        perfil: "OPERADOR",
      });

      expect(usuario.save).toHaveBeenCalledTimes(1);

      expect(usuario.cpf).toBe("12345678909");
      expect(usuario.email).toBe("maria@exemplo.com.br");
    });

    test("Deve impedir edição de usuário inexistente", async () => {
      Usuario.findByPk.mockResolvedValue(null);

      await expect(
        editarUsuario(999, dadosEdicao)
      ).rejects.toThrow("Usuário não encontrado.");

      expect(Usuario.findOne).not.toHaveBeenCalled();
      expect(usuario.save).not.toHaveBeenCalled();
    });

    test.each([
      "nome",
      "cpf",
      "email",
      "perfil",
    ])("Deve rejeitar edição sem %s", async (campo) => {
      const dados = { ...dadosEdicao };

      delete dados[campo];

      await expect(
        editarUsuario(7, dados)
      ).rejects.toThrow(
        "Nome, CPF, e-mail e perfil são obrigatórios."
      );

      expect(usuario.save).not.toHaveBeenCalled();
    });

    test.each([
      "nome",
      "cpf",
      "email",
      "perfil",
    ])("Deve rejeitar edição com %s vazio", async (campo) => {
      await expect(
        editarUsuario(7, {
          ...dadosEdicao,
          [campo]: "",
        })
      ).rejects.toThrow(
        "Nome, CPF, e-mail e perfil são obrigatórios."
      );

      expect(usuario.save).not.toHaveBeenCalled();
    });

    test.each([
      "123456789",
      "123456789012",
      "abcdefghijk",
    ])("Deve rejeitar CPF inválido durante edição: %s", async (cpf) => {
      await expect(
        editarUsuario(7, {
          ...dadosEdicao,
          cpf,
        })
      ).rejects.toThrow("CPF deve conter 11 números.");

      expect(Usuario.findOne).not.toHaveBeenCalled();
      expect(usuario.save).not.toHaveBeenCalled();
    });

    test.each([
      "USUARIO",
      "ADMIN",
      "administrador",
    ])("Deve rejeitar perfil inválido na edição: %s", async (perfil) => {
      await expect(
        editarUsuario(7, {
          ...dadosEdicao,
          perfil,
        })
      ).rejects.toThrow("Perfil de usuário inválido.");

      expect(usuario.save).not.toHaveBeenCalled();
    });

    test("Deve impedir CPF ou e-mail duplicado durante a edição", async () => {
      Usuario.findOne.mockResolvedValue({
        id: 15,
        cpf: "12345678909",
      });

      await expect(
        editarUsuario(7, dadosEdicao)
      ).rejects.toThrow(
        "CPF ou e-mail já cadastrado para outro usuário."
      );

      expect(usuario.save).not.toHaveBeenCalled();
    });

    test("Deve excluir o próprio usuário da pesquisa de duplicidade", async () => {
      await editarUsuario(7, dadosEdicao);

      expect(Usuario.findOne).toHaveBeenCalledWith({
        where: {
          id: {
            [Op.ne]: 7,
          },
          [Op.or]: [
            { cpf: "12345678909" },
            { email: "maria.nova@exemplo.com.br" },
          ],
        },
      });
    });

    test("Deve preservar a senha existente durante a edição", async () => {
      await editarUsuario(7, {
        ...dadosEdicao,
        senha: "OutraSenha@123",
        senha_hash: "hash-falso",
      });

      expect(usuario.senha_hash).toBe("hash-original");
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    test("Não deve retornar senha criptografada após edição", async () => {
      const resultado = await editarUsuario(7, dadosEdicao);

      expect(resultado).not.toHaveProperty("senha");
      expect(resultado).not.toHaveProperty("senha_hash");
    });

    test("Deve ignorar campos não permitidos na edição", async () => {
      await editarUsuario(7, {
        ...dadosEdicao,
        id: 999,
        ativo: false,
        campoInexistente: "teste",
      });

      expect(usuario.id).toBe(7);
      expect(usuario.ativo).toBe(true);
      expect(usuario).not.toHaveProperty("campoInexistente");
    });

    test("Deve propagar falhas na busca do usuário", async () => {
      Usuario.findByPk.mockRejectedValue(
        new Error("Falha ao consultar usuário")
      );

      await expect(
        editarUsuario(7, dadosEdicao)
      ).rejects.toThrow("Falha ao consultar usuário");
    });

    test("Deve propagar falhas na consulta de duplicidade", async () => {
      Usuario.findOne.mockRejectedValue(
        new Error("Falha ao verificar CPF e e-mail")
      );

      await expect(
        editarUsuario(7, dadosEdicao)
      ).rejects.toThrow("Falha ao verificar CPF e e-mail");

      expect(usuario.save).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas durante a atualização", async () => {
      usuario.save.mockRejectedValue(
        new Error("Falha ao atualizar usuário")
      );

      await expect(
        editarUsuario(7, dadosEdicao)
      ).rejects.toThrow("Falha ao atualizar usuário");
    });
  });

  describe("Alteração do status do usuário", () => {
    test("Deve desativar outro usuário", async () => {
      const resultado = await alterarStatusUsuario(7, false, 99);

      expect(Usuario.findByPk).toHaveBeenCalledWith(7);

      expect(usuario.save).toHaveBeenCalledTimes(1);

      expect(resultado.ativo).toBe(false);
      expect(usuario.ativo).toBe(false);
    });

    test("Deve ativar um usuário", async () => {
      usuario.ativo = false;

      const resultado = await alterarStatusUsuario(7, true, 99);

      expect(usuario.save).toHaveBeenCalledTimes(1);

      expect(resultado.ativo).toBe(true);
      expect(usuario.ativo).toBe(true);
    });

    test("Deve impedir desativação da própria conta", async () => {
      await expect(
        alterarStatusUsuario(7, false, 7)
      ).rejects.toThrow(
        "Você não pode desativar sua própria conta."
      );

      expect(usuario.save).not.toHaveBeenCalled();
      expect(usuario.ativo).toBe(true);
    });

    test("Deve impedir autodesativação com IDs em formatos diferentes", async () => {
      await expect(
        alterarStatusUsuario("7", false, 7)
      ).rejects.toThrow(
        "Você não pode desativar sua própria conta."
      );

      expect(usuario.save).not.toHaveBeenCalled();
    });

    test("Deve permitir ativar a própria conta", async () => {
      usuario.ativo = false;

      const resultado = await alterarStatusUsuario(7, true, 7);

      expect(resultado.ativo).toBe(true);
      expect(usuario.save).toHaveBeenCalledTimes(1);
    });

    test("Deve impedir alteração de usuário inexistente", async () => {
      Usuario.findByPk.mockResolvedValue(null);

      await expect(
        alterarStatusUsuario(999, false, 99)
      ).rejects.toThrow("Usuário não encontrado.");

      expect(usuario.save).not.toHaveBeenCalled();
    });

    test.each([
      ["texto true", "true"],
      ["texto false", "false"],
      ["número um", 1],
      ["número zero", 0],
      ["null", null],
      ["undefined", undefined],
    ])("Deve rejeitar status inválido: %s", async (_, ativo) => {
      await expect(
        alterarStatusUsuario(7, ativo, 99)
      ).rejects.toThrow(
        "O campo ativo deve ser verdadeiro ou falso."
      );

      expect(usuario.save).not.toHaveBeenCalled();
      expect(usuario.ativo).toBe(true);
    });

    test("Deve retornar somente os dados públicos após alterar status", async () => {
      const resultado = await alterarStatusUsuario(7, false, 99);

      expect(resultado).toEqual({
        id: 7,
        nome: "Maria da Silva",
        cpf: "12345678909",
        email: "maria@exemplo.com.br",
        ativo: false,
        perfil: "OPERADOR",
      });

      expect(resultado).not.toHaveProperty("senha_hash");
    });

    test("Deve propagar falhas ao consultar usuário", async () => {
      Usuario.findByPk.mockRejectedValue(
        new Error("Falha ao buscar usuário")
      );

      await expect(
        alterarStatusUsuario(7, false, 99)
      ).rejects.toThrow("Falha ao buscar usuário");
    });

    test("Deve propagar falhas ao salvar alteração de status", async () => {
      usuario.save.mockRejectedValue(
        new Error("Falha ao alterar status")
      );

      await expect(
        alterarStatusUsuario(7, false, 99)
      ).rejects.toThrow("Falha ao alterar status");
    });
  });
});