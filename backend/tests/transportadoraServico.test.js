jest.mock("../src/modelos/Transportadora", () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
}));

const { Op } = require("sequelize");

const Transportadora = require("../src/modelos/Transportadora");

const {
  cadastrarTransportadora,
  listarTransportadoras,
  editarTransportadora,
  alterarStatusTransportadora,
} = require("../src/servicos/transportadoraServico");

const dadosValidos = {
  razao_social: " Transportadora Alfa Ltda. ",
  nome_fantasia: " Transportes Alfa ",
  cnpj: "12.345.678/0001-95",
  email: " CONTATO@ALFA.COM.BR ",
  telefone: " (47) 99999-9999 ",
  cidade: " Joinville ",
  estado: " sc ",
  observacoes: " Transporte de estruturas pré-moldadas ",
};

const criarTransportadora = (alteracoes = {}) => ({
  id: 7,
  razao_social: "Transportadora Original Ltda.",
  nome_fantasia: "Transportadora Original",
  cnpj: "12345678000195",
  email: "contato@original.com.br",
  telefone: "(47) 3333-3333",
  cidade: "Joinville",
  estado: "SC",
  observacoes: "Transporte de vigas",
  ativo: true,
  update: jest.fn().mockImplementation(async function (dados) {
    Object.assign(this, dados);
    return this;
  }),
  ...alteracoes,
});

describe("Serviço de transportadoras - Estrutec", () => {
  let transportadora;

  beforeEach(() => {
    jest.resetAllMocks();

    transportadora = criarTransportadora();

    Transportadora.findOne.mockResolvedValue(null);
    Transportadora.findAll.mockResolvedValue([transportadora]);
    Transportadora.findByPk.mockResolvedValue(transportadora);

    Transportadora.create.mockImplementation(async (dados) => ({
      id: 8,
      ...dados,
    }));
  });

  describe("Cadastro de transportadoras", () => {
    test("Deve cadastrar transportadora com dados normalizados", async () => {
      const resultado = await cadastrarTransportadora(dadosValidos);

      expect(Transportadora.create).toHaveBeenCalledWith({
        razao_social: "Transportadora Alfa Ltda.",
        nome_fantasia: "Transportes Alfa",
        cnpj: "12345678000195",
        email: "contato@alfa.com.br",
        telefone: "(47) 99999-9999",
        cidade: "Joinville",
        estado: "SC",
        observacoes: "Transporte de estruturas pré-moldadas",
      });

      expect(resultado.id).toBe(8);
      expect(resultado.cnpj).toBe("12345678000195");
    });

    test("Deve cadastrar transportadora sem campos opcionais", async () => {
      const resultado = await cadastrarTransportadora({
        razao_social: "Transportadora Teste Ltda.",
      });

      expect(resultado).toEqual({
        id: 8,
        razao_social: "Transportadora Teste Ltda.",
        nome_fantasia: null,
        cnpj: null,
        email: null,
        telefone: null,
        cidade: null,
        estado: null,
        observacoes: null,
      });
    });

    test("Deve converter campos opcionais vazios para null", async () => {
      await cadastrarTransportadora({
        razao_social: "Transportadora Teste",
        nome_fantasia: "   ",
        cnpj: "",
        email: "   ",
        telefone: "   ",
        cidade: "   ",
        estado: "   ",
        observacoes: "   ",
      });

      expect(Transportadora.create).toHaveBeenCalledWith({
        razao_social: "Transportadora Teste",
        nome_fantasia: null,
        cnpj: null,
        email: null,
        telefone: null,
        cidade: null,
        estado: null,
        observacoes: null,
      });
    });

    test("Deve pesquisar duplicidade utilizando o CNPJ sem máscara", async () => {
      await cadastrarTransportadora(dadosValidos);

      expect(Transportadora.findOne).toHaveBeenCalledWith({
        where: {
          cnpj: "12345678000195",
        },
      });

      expect(Transportadora.findOne).toHaveBeenCalledTimes(1);
    });

    test("Não deve consultar duplicidade quando não houver CNPJ", async () => {
      await cadastrarTransportadora({
        razao_social: "Transportadora Sem CNPJ",
      });

      expect(Transportadora.findOne).not.toHaveBeenCalled();

      expect(Transportadora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cnpj: null,
        })
      );
    });

    test.each([
      ["menos de 14 dígitos", "123456789"],
      ["mais de 14 dígitos", "123456789012345"],
    ])("Deve rejeitar CNPJ com %s", async (_, cnpj) => {
      await expect(
        cadastrarTransportadora({
          ...dadosValidos,
          cnpj,
        })
      ).rejects.toThrow("O CNPJ deve possuir 14 dígitos.");

      expect(Transportadora.create).not.toHaveBeenCalled();
    });

    test("Deve impedir cadastro com CNPJ duplicado", async () => {
      Transportadora.findOne.mockResolvedValue(transportadora);

      await expect(
        cadastrarTransportadora(dadosValidos)
      ).rejects.toThrow(
        "Já existe uma transportadora com este CNPJ."
      );

      expect(Transportadora.create).not.toHaveBeenCalled();
    });

    test.each([
      ["undefined", undefined],
      ["null", null],
      ["string vazia", ""],
      ["apenas espaços", "   "],
    ])("Deve rejeitar razão social %s", async (_, razao_social) => {
      await expect(
        cadastrarTransportadora({
          ...dadosValidos,
          razao_social,
        })
      ).rejects.toThrow(
        "Informe a razão social da transportadora."
      );

      expect(Transportadora.create).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas durante o cadastro", async () => {
      Transportadora.create.mockRejectedValue(
        new Error("Falha ao cadastrar transportadora")
      );

      await expect(
        cadastrarTransportadora(dadosValidos)
      ).rejects.toThrow("Falha ao cadastrar transportadora");
    });

    test("Deve propagar falhas na consulta de CNPJ", async () => {
      Transportadora.findOne.mockRejectedValue(
        new Error("Falha ao consultar CNPJ")
      );

      await expect(
        cadastrarTransportadora(dadosValidos)
      ).rejects.toThrow("Falha ao consultar CNPJ");

      expect(Transportadora.create).not.toHaveBeenCalled();
    });
  });

  describe("Listagem de transportadoras", () => {
    test("Deve listar transportadoras em ordem alfabética", async () => {
      const resultado = await listarTransportadoras();

      expect(resultado).toEqual([transportadora]);

      expect(Transportadora.findAll).toHaveBeenCalledWith({
        order: [["razao_social", "ASC"]],
      });

      expect(Transportadora.findAll).toHaveBeenCalledTimes(1);
    });

    test("Deve retornar lista vazia quando não houver transportadoras", async () => {
      Transportadora.findAll.mockResolvedValue([]);

      const resultado = await listarTransportadoras();

      expect(resultado).toEqual([]);
    });

    test("Deve propagar falhas durante a listagem", async () => {
      Transportadora.findAll.mockRejectedValue(
        new Error("Falha ao listar transportadoras")
      );

      await expect(
        listarTransportadoras()
      ).rejects.toThrow("Falha ao listar transportadoras");
    });
  });

  describe("Edição de transportadoras", () => {
    test("Deve atualizar transportadora com dados normalizados", async () => {
      const resultado = await editarTransportadora(7, dadosValidos);

      expect(Transportadora.findByPk).toHaveBeenCalledWith(7);

      expect(transportadora.update).toHaveBeenCalledWith({
        razao_social: "Transportadora Alfa Ltda.",
        nome_fantasia: "Transportes Alfa",
        cnpj: "12345678000195",
        email: "contato@alfa.com.br",
        telefone: "(47) 99999-9999",
        cidade: "Joinville",
        estado: "SC",
        observacoes: "Transporte de estruturas pré-moldadas",
      });

      expect(resultado).toBe(transportadora);
      expect(transportadora.razao_social).toBe("Transportadora Alfa Ltda.");
    });

    test("Deve limpar campos opcionais durante a edição", async () => {
      await editarTransportadora(7, {
        razao_social: "Transportadora Atualizada",
        nome_fantasia: "   ",
        cnpj: "",
        email: "   ",
        telefone: "   ",
        cidade: "   ",
        estado: "   ",
        observacoes: "   ",
      });

      expect(transportadora.update).toHaveBeenCalledWith({
        razao_social: "Transportadora Atualizada",
        nome_fantasia: null,
        cnpj: null,
        email: null,
        telefone: null,
        cidade: null,
        estado: null,
        observacoes: null,
      });

      expect(transportadora.cnpj).toBeNull();
    });

    test("Deve permitir edição sem CNPJ", async () => {
      await editarTransportadora(7, {
        razao_social: "Transportadora Sem CNPJ",
      });

      expect(Transportadora.findOne).not.toHaveBeenCalled();

      expect(transportadora.update).toHaveBeenCalledWith(
        expect.objectContaining({
          razao_social: "Transportadora Sem CNPJ",
          cnpj: null,
        })
      );
    });

    test("Deve verificar duplicidade excluindo a própria transportadora", async () => {
      await editarTransportadora(7, dadosValidos);

      expect(Transportadora.findOne).toHaveBeenCalledWith({
        where: {
          cnpj: "12345678000195",
          id: {
            [Op.ne]: 7,
          },
        },
      });
    });

    test("Deve impedir atualização com CNPJ de outra transportadora", async () => {
      Transportadora.findOne.mockResolvedValue({
        id: 15,
        cnpj: "12345678000195",
      });

      await expect(
        editarTransportadora(7, dadosValidos)
      ).rejects.toThrow(
        "Já existe uma transportadora com este CNPJ."
      );

      expect(transportadora.update).not.toHaveBeenCalled();
    });

    test.each([
      ["menos de 14 dígitos", "123456"],
      ["mais de 14 dígitos", "123456789012345"],
    ])("Deve rejeitar edição com CNPJ de %s", async (_, cnpj) => {
      await expect(
        editarTransportadora(7, {
          ...dadosValidos,
          cnpj,
        })
      ).rejects.toThrow("O CNPJ deve possuir 14 dígitos.");

      expect(transportadora.update).not.toHaveBeenCalled();
    });

    test.each([
      ["undefined", undefined],
      ["null", null],
      ["string vazia", ""],
      ["apenas espaços", "   "],
    ])("Deve rejeitar edição com razão social %s", async (_, razao_social) => {
      await expect(
        editarTransportadora(7, {
          ...dadosValidos,
          razao_social,
        })
      ).rejects.toThrow(
        "Informe a razão social da transportadora."
      );

      expect(transportadora.update).not.toHaveBeenCalled();
    });

    test("Deve rejeitar edição de transportadora inexistente", async () => {
      Transportadora.findByPk.mockResolvedValue(null);

      await expect(
        editarTransportadora(999, dadosValidos)
      ).rejects.toThrow("Transportadora não encontrada.");

      expect(transportadora.update).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas ao salvar alterações", async () => {
      transportadora.update.mockRejectedValue(
        new Error("Falha ao atualizar transportadora")
      );

      await expect(
        editarTransportadora(7, dadosValidos)
      ).rejects.toThrow("Falha ao atualizar transportadora");
    });

    test("Deve propagar falhas na busca da transportadora", async () => {
      Transportadora.findByPk.mockRejectedValue(
        new Error("Falha ao consultar transportadora")
      );

      await expect(
        editarTransportadora(7, dadosValidos)
      ).rejects.toThrow("Falha ao consultar transportadora");
    });
  });

  describe("Alteração de status", () => {
    test("Deve ativar uma transportadora", async () => {
      transportadora.ativo = false;

      const resultado = await alterarStatusTransportadora(7, true);

      expect(Transportadora.findByPk).toHaveBeenCalledWith(7);

      expect(transportadora.update).toHaveBeenCalledWith({
        ativo: true,
      });

      expect(resultado.ativo).toBe(true);
    });

    test("Deve desativar uma transportadora", async () => {
      const resultado = await alterarStatusTransportadora(7, false);

      expect(transportadora.update).toHaveBeenCalledWith({
        ativo: false,
      });

      expect(resultado.ativo).toBe(false);
    });

    test("Deve converter valor verdadeiro para booleano", async () => {
      const resultado = await alterarStatusTransportadora(7, "sim");

      expect(transportadora.update).toHaveBeenCalledWith({
        ativo: true,
      });

      expect(resultado.ativo).toBe(true);
    });

    test("Deve converter valor zero para falso", async () => {
      const resultado = await alterarStatusTransportadora(7, 0);

      expect(transportadora.update).toHaveBeenCalledWith({
        ativo: false,
      });

      expect(resultado.ativo).toBe(false);
    });

    test("Deve rejeitar alteração de status de transportadora inexistente", async () => {
      Transportadora.findByPk.mockResolvedValue(null);

      await expect(
        alterarStatusTransportadora(999, false)
      ).rejects.toThrow("Transportadora não encontrada.");

      expect(transportadora.update).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas ao alterar status", async () => {
      transportadora.update.mockRejectedValue(
        new Error("Falha ao alterar status")
      );

      await expect(
        alterarStatusTransportadora(7, false)
      ).rejects.toThrow("Falha ao alterar status");
    });
  });
});