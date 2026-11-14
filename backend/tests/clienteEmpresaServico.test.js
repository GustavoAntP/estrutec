jest.mock("../src/modelos/ClienteEmpresa", () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
}));

const { Op } = require("sequelize");

const ClienteEmpresa = require("../src/modelos/ClienteEmpresa");

const {
  cadastrarClienteEmpresa,
  listarClientesEmpresas,
  editarClienteEmpresa,
  excluirClienteEmpresa,
} = require("../src/servicos/clienteEmpresaServico");

const dadosValidos = {
  razao_social: " Construtora Alfa Ltda. ",
  nome_fantasia: " Construtora Alfa ",
  cnpj: "12.345.678/0001-95",
  email: " CONTATO@ALFA.COM.BR ",
  telefone: " (47) 99999-9999 ",
  cidade: " Joinville ",
  estado: " sc ",
};

const criarCliente = (alteracoes = {}) => ({
  id: 7,
  razao_social: "Empresa Original Ltda.",
  nome_fantasia: "Empresa Original",
  cnpj: "12345678000195",
  email: "contato@original.com.br",
  telefone: "(47) 3333-3333",
  cidade: "Joinville",
  estado: "SC",
  save: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn().mockResolvedValue(undefined),
  ...alteracoes,
});

describe("Serviço de empresas clientes - Estrutec", () => {
  let cliente;

  beforeEach(() => {
    jest.resetAllMocks();

    cliente = criarCliente();

    ClienteEmpresa.findOne.mockResolvedValue(null);
    ClienteEmpresa.findByPk.mockResolvedValue(cliente);
    ClienteEmpresa.findAll.mockResolvedValue([cliente]);

    ClienteEmpresa.create.mockImplementation(async (dados) => ({
      id: 8,
      ...dados,
    }));
  });

  describe("Cadastro de empresas clientes", () => {
    test("Deve cadastrar empresa com dados normalizados", async () => {
      const resultado = await cadastrarClienteEmpresa(dadosValidos);

      expect(ClienteEmpresa.create).toHaveBeenCalledWith({
        razao_social: "Construtora Alfa Ltda.",
        nome_fantasia: "Construtora Alfa",
        cnpj: "12345678000195",
        email: "contato@alfa.com.br",
        telefone: "(47) 99999-9999",
        cidade: "Joinville",
        estado: "SC",
      });

      expect(resultado.id).toBe(8);
      expect(resultado.cnpj).toBe("12345678000195");
    });

    test("Deve cadastrar empresa sem campos opcionais", async () => {
      const resultado = await cadastrarClienteEmpresa({
        razao_social: "Empresa Teste Ltda.",
      });

      expect(resultado).toEqual({
        id: 8,
        razao_social: "Empresa Teste Ltda.",
        nome_fantasia: null,
        cnpj: null,
        email: null,
        telefone: null,
        cidade: null,
        estado: null,
      });
    });

    test("Deve converter campos opcionais vazios para null", async () => {
      await cadastrarClienteEmpresa({
        razao_social: "Empresa Teste",
        nome_fantasia: "   ",
        email: "   ",
        telefone: "   ",
        cidade: "   ",
      });

      expect(ClienteEmpresa.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nome_fantasia: null,
          email: null,
          telefone: null,
          cidade: null,
          estado: null,
        })
      );
    });

    test.each([
      ["undefined", undefined],
      ["null", null],
      ["string vazia", ""],
    ])("Deve rejeitar razão social %s", async (_, razao_social) => {
      await expect(
        cadastrarClienteEmpresa({
          ...dadosValidos,
          razao_social,
        })
      ).rejects.toThrow("A razão social é obrigatória.");

      expect(ClienteEmpresa.create).not.toHaveBeenCalled();
    });

    test("Deve rejeitar CNPJ com menos de 14 dígitos", async () => {
      await expect(
        cadastrarClienteEmpresa({
          ...dadosValidos,
          cnpj: "123456789",
        })
      ).rejects.toThrow("CNPJ deve conter 14 números.");

      expect(ClienteEmpresa.create).not.toHaveBeenCalled();
    });

    test("Deve rejeitar CNPJ com mais de 14 dígitos", async () => {
      await expect(
        cadastrarClienteEmpresa({
          ...dadosValidos,
          cnpj: "123456789012345",
        })
      ).rejects.toThrow("CNPJ deve conter 14 números.");

      expect(ClienteEmpresa.create).not.toHaveBeenCalled();
    });

    test("Deve impedir cadastro com CNPJ duplicado", async () => {
      ClienteEmpresa.findOne.mockResolvedValue(cliente);

      await expect(
        cadastrarClienteEmpresa(dadosValidos)
      ).rejects.toThrow(
        "Já existe uma empresa cadastrada com este CNPJ."
      );

      expect(ClienteEmpresa.create).not.toHaveBeenCalled();
    });

    test("Não deve consultar duplicidade quando não houver CNPJ", async () => {
      await cadastrarClienteEmpresa({
        razao_social: "Empresa Sem CNPJ",
      });

      expect(ClienteEmpresa.findOne).not.toHaveBeenCalled();

      expect(ClienteEmpresa.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cnpj: null,
        })
      );
    });

    test("Deve verificar duplicidade utilizando o CNPJ sem máscara", async () => {
      await cadastrarClienteEmpresa(dadosValidos);

      expect(ClienteEmpresa.findOne).toHaveBeenCalledWith({
        where: {
          cnpj: "12345678000195",
        },
      });

      expect(ClienteEmpresa.findOne).toHaveBeenCalledTimes(1);
    });

    test("Deve propagar falhas ao cadastrar empresa", async () => {
      ClienteEmpresa.create.mockRejectedValue(
        new Error("Falha ao salvar empresa")
      );

      await expect(
        cadastrarClienteEmpresa(dadosValidos)
      ).rejects.toThrow("Falha ao salvar empresa");
    });
  });

  describe("Listagem de empresas clientes", () => {
    test("Deve listar empresas em ordem alfabética", async () => {
      const resultado = await listarClientesEmpresas();

      expect(resultado).toEqual([cliente]);

      expect(ClienteEmpresa.findAll).toHaveBeenCalledWith({
        order: [["razao_social", "ASC"]],
      });
    });

    test("Deve retornar lista vazia quando não houver empresas", async () => {
      ClienteEmpresa.findAll.mockResolvedValue([]);

      const resultado = await listarClientesEmpresas();

      expect(resultado).toEqual([]);
    });

    test("Deve propagar falhas na listagem", async () => {
      ClienteEmpresa.findAll.mockRejectedValue(
        new Error("Falha na consulta")
      );

      await expect(
        listarClientesEmpresas()
      ).rejects.toThrow("Falha na consulta");
    });
  });

  describe("Edição de empresas clientes", () => {
    test("Deve atualizar empresa com dados normalizados", async () => {
      const resultado = await editarClienteEmpresa(7, dadosValidos);

      expect(ClienteEmpresa.findByPk).toHaveBeenCalledWith(7);

      expect(cliente.razao_social).toBe("Construtora Alfa Ltda.");
      expect(cliente.nome_fantasia).toBe("Construtora Alfa");
      expect(cliente.cnpj).toBe("12345678000195");
      expect(cliente.email).toBe("contato@alfa.com.br");
      expect(cliente.telefone).toBe("(47) 99999-9999");
      expect(cliente.cidade).toBe("Joinville");
      expect(cliente.estado).toBe("SC");

      expect(cliente.save).toHaveBeenCalledTimes(1);
      expect(resultado).toBe(cliente);
    });

    test("Deve limpar campos opcionais durante a edição", async () => {
      await editarClienteEmpresa(7, {
        razao_social: "Empresa Atualizada",
        nome_fantasia: "   ",
        email: "",
        telefone: null,
        cidade: "   ",
      });

      expect(cliente.razao_social).toBe("Empresa Atualizada");
      expect(cliente.nome_fantasia).toBeNull();
      expect(cliente.email).toBeNull();
      expect(cliente.telefone).toBeNull();
      expect(cliente.cidade).toBeNull();
      expect(cliente.estado).toBeNull();

      expect(cliente.save).toHaveBeenCalledTimes(1);
    });

    test("Deve rejeitar edição de empresa inexistente", async () => {
      ClienteEmpresa.findByPk.mockResolvedValue(null);

      await expect(
        editarClienteEmpresa(999, dadosValidos)
      ).rejects.toThrow("Empresa cliente não encontrada.");

      expect(cliente.save).not.toHaveBeenCalled();
    });

    test.each([
      ["undefined", undefined],
      ["null", null],
      ["string vazia", ""],
    ])("Deve rejeitar edição com razão social %s", async (_, razao_social) => {
      await expect(
        editarClienteEmpresa(7, {
          ...dadosValidos,
          razao_social,
        })
      ).rejects.toThrow("A razão social é obrigatória.");

      expect(cliente.save).not.toHaveBeenCalled();
    });

    test("Deve rejeitar CNPJ inválido durante a edição", async () => {
      await expect(
        editarClienteEmpresa(7, {
          ...dadosValidos,
          cnpj: "123456",
        })
      ).rejects.toThrow("CNPJ deve conter 14 números.");

      expect(cliente.save).not.toHaveBeenCalled();
    });

    test("Deve impedir atualização com CNPJ de outra empresa", async () => {
      ClienteEmpresa.findOne.mockResolvedValue({
        id: 15,
        cnpj: "12345678000195",
      });

      await expect(
        editarClienteEmpresa(7, dadosValidos)
      ).rejects.toThrow(
        "Já existe outra empresa cadastrada com este CNPJ."
      );

      expect(cliente.save).not.toHaveBeenCalled();
    });

    test("Deve verificar duplicidade excluindo a própria empresa", async () => {
      await editarClienteEmpresa(7, dadosValidos);

      expect(ClienteEmpresa.findOne).toHaveBeenCalledWith({
        where: {
          id: {
            [Op.ne]: 7,
          },
          cnpj: "12345678000195",
        },
      });
    });

    test("Deve permitir manter o CNPJ da própria empresa", async () => {
      const resultado = await editarClienteEmpresa(7, {
        razao_social: "Empresa Original Ltda.",
        cnpj: "12.345.678/0001-95",
      });

      expect(resultado.cnpj).toBe("12345678000195");

      expect(cliente.save).toHaveBeenCalledTimes(1);

      expect(ClienteEmpresa.findOne).toHaveBeenCalledWith({
        where: {
          id: {
            [Op.ne]: 7,
          },
          cnpj: "12345678000195",
        },
      });
    });

    test("Deve limpar o CNPJ quando ele não for informado", async () => {
      await editarClienteEmpresa(7, {
        razao_social: "Empresa Atualizada",
      });

      expect(cliente.cnpj).toBeNull();

      expect(ClienteEmpresa.findOne).not.toHaveBeenCalled();

      expect(cliente.save).toHaveBeenCalledTimes(1);
    });

    test("Deve propagar falhas ao salvar alterações", async () => {
      cliente.save.mockRejectedValue(
        new Error("Falha ao atualizar empresa")
      );

      await expect(
        editarClienteEmpresa(7, dadosValidos)
      ).rejects.toThrow("Falha ao atualizar empresa");
    });
  });

  describe("Exclusão de empresas clientes", () => {
    test("Deve excluir uma empresa cadastrada", async () => {
      const resultado = await excluirClienteEmpresa(7);

      expect(ClienteEmpresa.findByPk).toHaveBeenCalledWith(7);

      expect(cliente.destroy).toHaveBeenCalledTimes(1);

      expect(resultado).toEqual({
        mensagem: "Empresa cliente excluída com sucesso!",
      });
    });

    test("Deve rejeitar exclusão de empresa inexistente", async () => {
      ClienteEmpresa.findByPk.mockResolvedValue(null);

      await expect(
        excluirClienteEmpresa(999)
      ).rejects.toThrow("Empresa cliente não encontrada.");

      expect(cliente.destroy).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas durante a exclusão", async () => {
      cliente.destroy.mockRejectedValue(
        new Error("Falha ao excluir empresa")
      );

      await expect(
        excluirClienteEmpresa(7)
      ).rejects.toThrow("Falha ao excluir empresa");
    });
  });
});