jest.mock("../src/modelos/Projeto", () => ({ findOne: jest.fn() }));
jest.mock("../src/modelos/MontagemProjeto", () => ({ findOne: jest.fn() }));
jest.mock("../src/modelos/EquipeMontagem", () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
}));

const Projeto = require("../src/modelos/Projeto");
const MontagemProjeto = require("../src/modelos/MontagemProjeto");
const EquipeMontagem = require("../src/modelos/EquipeMontagem");
const { cadastrar, listar, atualizar, excluir } = require("../src/servicos/equipeMontagemServico");

const dadosValidos = {
  funcao: " Montador de estruturas ",
  quantidadeTrabalhadores: "3",
  quantidadeDias: "4.5",
  custoDiarioPorTrabalhador: "210.75",
  observacoes: " Equipe especializada ",
};

const dadosEsperados = {
  funcao: "Montador de estruturas",
  quantidade_trabalhadores: 3,
  quantidade_dias: 4.5,
  custo_diario_por_trabalhador: 210.75,
  observacoes: "Equipe especializada",
};

const operacoes = [
  ["cadastro", () => cadastrar(7, 99, dadosValidos)],
  ["listagem", () => listar(7, 99)],
  ["atualização", () => atualizar(7, 31, 99, {})],
  ["exclusão", () => excluir(7, 31, 99)],
];

describe("Serviço de equipes de montagem - Estrutec", () => {
  let projeto;
  let montagem;
  let equipe;

  beforeEach(() => {
    jest.resetAllMocks();

    projeto = { id: 7, usuario_id: 99, status: "EM_ANDAMENTO" };
    montagem = { id: 21, projeto_id: 7 };
    equipe = {
      id: 31,
      montagem_id: 21,
      funcao: "Montador",
      quantidade_trabalhadores: 2,
      quantidade_dias: 5,
      custo_diario_por_trabalhador: 200,
      observacoes: "Equipe original",
      update: jest.fn(),
      destroy: jest.fn(),
    };

    equipe.update.mockImplementation(async (dados) => {
      Object.assign(equipe, dados);
      return equipe;
    });
    equipe.destroy.mockResolvedValue(undefined);

    Projeto.findOne.mockResolvedValue(projeto);
    MontagemProjeto.findOne.mockResolvedValue(montagem);
    EquipeMontagem.findOne.mockResolvedValue(equipe);
    EquipeMontagem.findAll.mockResolvedValue([equipe]);
    EquipeMontagem.create.mockImplementation(async (dados) => ({ id: 32, ...dados }));
  });

  describe("Controle de acesso e pré-requisitos", () => {
    test.each(operacoes)("Deve bloquear %s em projeto inexistente", async (_, executar) => {
      Projeto.findOne.mockResolvedValue(null);
      await expect(executar()).rejects.toThrow("Projeto não encontrado.");
      expect(MontagemProjeto.findOne).not.toHaveBeenCalled();
      expect(EquipeMontagem.create).not.toHaveBeenCalled();
    });

    test.each(operacoes)("Deve bloquear %s sem montagem cadastrada", async (_, executar) => {
      MontagemProjeto.findOne.mockResolvedValue(null);
      await expect(executar()).rejects.toThrow("Configure primeiro os dados gerais da montagem.");
      expect(EquipeMontagem.create).not.toHaveBeenCalled();
      expect(EquipeMontagem.findAll).not.toHaveBeenCalled();
    });

    test.each(operacoes)("Deve propagar erro na consulta do projeto durante %s", async (_, executar) => {
      Projeto.findOne.mockRejectedValue(new Error("Falha ao consultar projeto"));
      await expect(executar()).rejects.toThrow("Falha ao consultar projeto");
      expect(MontagemProjeto.findOne).not.toHaveBeenCalled();
    });

    test.each(operacoes)("Deve propagar erro na consulta da montagem durante %s", async (_, executar) => {
      MontagemProjeto.findOne.mockRejectedValue(new Error("Falha ao consultar montagem"));
      await expect(executar()).rejects.toThrow("Falha ao consultar montagem");
      expect(EquipeMontagem.create).not.toHaveBeenCalled();
    });

    test.each(operacoes)("Deve verificar usuário e projeto durante %s", async (_, executar) => {
      await executar();
      expect(Projeto.findOne).toHaveBeenCalledWith({ where: { id: 7, usuario_id: 99 } });
      expect(MontagemProjeto.findOne).toHaveBeenCalledWith({ where: { projeto_id: 7 } });
      expect(Projeto.findOne).toHaveBeenCalledTimes(1);
      expect(MontagemProjeto.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe("Cadastro de equipes", () => {
    test("Deve cadastrar equipe com dados normalizados", async () => {
      const resultado = await cadastrar(7, 99, dadosValidos);
      expect(EquipeMontagem.create).toHaveBeenCalledWith({ montagem_id: 21, ...dadosEsperados });
      expect(resultado).toEqual({ id: 32, montagem_id: 21, ...dadosEsperados });
    });

    test("Deve aceitar números sem conversão de texto", async () => {
      await cadastrar(7, 99, {
        ...dadosValidos,
        quantidadeTrabalhadores: 4,
        quantidadeDias: 3.25,
        custoDiarioPorTrabalhador: 180.5,
      });
      expect(EquipeMontagem.create).toHaveBeenCalledWith({
        montagem_id: 21,
        ...dadosEsperados,
        quantidade_trabalhadores: 4,
        quantidade_dias: 3.25,
        custo_diario_por_trabalhador: 180.5,
      });
    });

    test("Deve aceitar custo diário igual a zero", async () => {
      await cadastrar(7, 99, { ...dadosValidos, custoDiarioPorTrabalhador: 0 });
      expect(EquipeMontagem.create).toHaveBeenCalledWith({
        montagem_id: 21,
        ...dadosEsperados,
        custo_diario_por_trabalhador: 0,
      });
    });

    test.each([
      ["null", null],
      ["texto vazio", ""],
      ["espaços", "   "],
    ])("Deve interpretar custo diário %s como zero", async (_, valor) => {
      await cadastrar(7, 99, { ...dadosValidos, custoDiarioPorTrabalhador: valor });
      expect(EquipeMontagem.create).toHaveBeenCalledWith({
        montagem_id: 21,
        ...dadosEsperados,
        custo_diario_por_trabalhador: 0,
      });
    });

    test.each([
      ["ausentes", undefined],
      ["null", null],
      ["vazias", ""],
      ["com espaços", "   "],
    ])("Deve permitir observações %s", async (_, observacoes) => {
      await cadastrar(7, 99, { ...dadosValidos, observacoes });
      expect(EquipeMontagem.create).toHaveBeenCalledWith({
        montagem_id: 21,
        ...dadosEsperados,
        observacoes: null,
      });
    });

    test("Deve ignorar propriedades não autorizadas", async () => {
      await cadastrar(7, 99, {
        ...dadosValidos,
        montagem_id: 999,
        id: 999,
        campoInexistente: "teste",
      });
      expect(EquipeMontagem.create).toHaveBeenCalledWith({ montagem_id: 21, ...dadosEsperados });
    });

    test("Deve propagar falha ao cadastrar equipe", async () => {
      EquipeMontagem.create.mockRejectedValue(new Error("Falha no cadastro da equipe"));
      await expect(cadastrar(7, 99, dadosValidos)).rejects.toThrow("Falha no cadastro da equipe");
    });
  });

  describe("Validação dos dados", () => {
    test.each([
      ["ausente", undefined],
      ["null", null],
      ["vazia", ""],
      ["apenas espaços", "   "],
    ])("Deve rejeitar função %s", async (_, funcao) => {
      await expect(cadastrar(7, 99, { ...dadosValidos, funcao }))
        .rejects.toThrow("Função da equipe é obrigatória.");
      expect(EquipeMontagem.create).not.toHaveBeenCalled();
    });

    test.each([
      0, -1, 1.5, "abc", Infinity, -Infinity, undefined, null, "",
    ])("Deve rejeitar quantidade de trabalhadores inválida: %p", async (quantidadeTrabalhadores) => {
      await expect(cadastrar(7, 99, { ...dadosValidos, quantidadeTrabalhadores }))
        .rejects.toThrow("Quantidade de trabalhadores inválida.");
      expect(EquipeMontagem.create).not.toHaveBeenCalled();
    });

    test.each([
      0, -1, "abc", Infinity, -Infinity, undefined, null, "",
    ])("Deve rejeitar quantidade de dias inválida: %p", async (quantidadeDias) => {
      await expect(cadastrar(7, 99, { ...dadosValidos, quantidadeDias }))
        .rejects.toThrow("Quantidade de dias inválida.");
      expect(EquipeMontagem.create).not.toHaveBeenCalled();
    });

    test.each([
      -1, "abc", Infinity, -Infinity, undefined, NaN,
    ])("Deve rejeitar custo diário inválido: %p", async (custoDiarioPorTrabalhador) => {
      await expect(cadastrar(7, 99, { ...dadosValidos, custoDiarioPorTrabalhador }))
        .rejects.toThrow("Custo diário por trabalhador inválido.");
      expect(EquipeMontagem.create).not.toHaveBeenCalled();
    });
  });

  describe("Listagem de equipes", () => {
    test("Deve listar equipes da montagem em ordem de ID", async () => {
      const resultado = await listar(7, 99);
      expect(resultado).toEqual([equipe]);
      expect(EquipeMontagem.findAll).toHaveBeenCalledWith({
        where: { montagem_id: 21 },
        order: [["id", "ASC"]],
      });
    });

    test("Deve retornar lista vazia quando não houver equipes", async () => {
      EquipeMontagem.findAll.mockResolvedValue([]);
      await expect(listar(7, 99)).resolves.toEqual([]);
    });

    test("Deve propagar falha na listagem", async () => {
      EquipeMontagem.findAll.mockRejectedValue(new Error("Falha ao listar equipes"));
      await expect(listar(7, 99)).rejects.toThrow("Falha ao listar equipes");
    });
  });

  describe("Atualização de equipes", () => {
    test("Deve atualizar todos os campos informados", async () => {
      const resultado = await atualizar(7, 31, 99, dadosValidos);
      expect(EquipeMontagem.findOne).toHaveBeenCalledWith({
        where: { id: 31, montagem_id: 21 },
      });
      expect(equipe.update).toHaveBeenCalledWith(dadosEsperados);
      expect(resultado).toBe(equipe);
    });

    test("Deve preservar todos os campos quando não houver alterações", async () => {
      await atualizar(7, 31, 99, {});
      expect(equipe.update).toHaveBeenCalledWith({
        funcao: "Montador",
        quantidade_trabalhadores: 2,
        quantidade_dias: 5,
        custo_diario_por_trabalhador: 200,
        observacoes: "Equipe original",
      });
    });

    test("Deve atualizar somente a quantidade de trabalhadores", async () => {
      await atualizar(7, 31, 99, { quantidadeTrabalhadores: 4 });
      expect(equipe.update).toHaveBeenCalledWith({
        funcao: "Montador",
        quantidade_trabalhadores: 4,
        quantidade_dias: 5,
        custo_diario_por_trabalhador: 200,
        observacoes: "Equipe original",
      });
    });

    test("Deve manter valores existentes quando receber null em campos obrigatórios", async () => {
      await atualizar(7, 31, 99, {
        funcao: null,
        quantidadeTrabalhadores: null,
        quantidadeDias: null,
        custoDiarioPorTrabalhador: null,
      });
      expect(equipe.update).toHaveBeenCalledWith({
        funcao: "Montador",
        quantidade_trabalhadores: 2,
        quantidade_dias: 5,
        custo_diario_por_trabalhador: 200,
        observacoes: "Equipe original",
      });
    });

    test("Deve permitir dias decimais e custo diário zero", async () => {
      await atualizar(7, 31, 99, { quantidadeDias: "2.5", custoDiarioPorTrabalhador: 0 });
      expect(equipe.update).toHaveBeenCalledWith(expect.objectContaining({
        quantidade_dias: 2.5,
        custo_diario_por_trabalhador: 0,
      }));
    });

    test.each([
      ["null", null],
      ["texto vazio", ""],
      ["apenas espaços", "   "],
    ])("Deve limpar observações usando %s", async (_, observacoes) => {
      await atualizar(7, 31, 99, { observacoes });
      expect(equipe.update).toHaveBeenCalledWith(expect.objectContaining({ observacoes: null }));
    });

    test("Deve preservar observações quando receber undefined", async () => {
      await atualizar(7, 31, 99, { observacoes: undefined });
      expect(equipe.update).toHaveBeenCalledWith(expect.objectContaining({
        observacoes: "Equipe original",
      }));
    });

    test("Deve permitir alterar somente a função", async () => {
      await atualizar(7, 31, 99, { funcao: " Operador de guindaste " });
      expect(equipe.update).toHaveBeenCalledWith(expect.objectContaining({
        funcao: "Operador de guindaste",
        quantidade_trabalhadores: 2,
      }));
    });

    test("Deve impedir alteração de identificadores e campos desconhecidos", async () => {
      await atualizar(7, 31, 99, { funcao: "Montagem", id: 999, montagem_id: 999 });
      expect(equipe.update).toHaveBeenCalledWith(expect.objectContaining({ funcao: "Montagem" }));
      expect(equipe.update.mock.calls[0][0]).not.toHaveProperty("id");
      expect(equipe.update.mock.calls[0][0]).not.toHaveProperty("montagem_id");
      expect(equipe.id).toBe(31);
      expect(equipe.montagem_id).toBe(21);
    });

    test.each([
      ["função vazia", { funcao: "   " }, "Função da equipe é obrigatória."],
      ["trabalhadores negativos", { quantidadeTrabalhadores: -1 }, "Quantidade de trabalhadores inválida."],
      ["dias iguais a zero", { quantidadeDias: 0 }, "Quantidade de dias inválida."],
      ["custo negativo", { custoDiarioPorTrabalhador: -10 }, "Custo diário por trabalhador inválido."],
    ])("Deve rejeitar atualização com %s", async (_, dados, mensagem) => {
      await expect(atualizar(7, 31, 99, dados)).rejects.toThrow(mensagem);
      expect(equipe.update).not.toHaveBeenCalled();
    });

    test("Deve rejeitar atualização de equipe inexistente", async () => {
      EquipeMontagem.findOne.mockResolvedValue(null);
      await expect(atualizar(7, 999, 99, {})).rejects.toThrow("Registro de equipe não encontrado.");
      expect(equipe.update).not.toHaveBeenCalled();
    });

    test("Deve propagar falha ao consultar equipe", async () => {
      EquipeMontagem.findOne.mockRejectedValue(new Error("Falha ao consultar equipe"));
      await expect(atualizar(7, 31, 99, {})).rejects.toThrow("Falha ao consultar equipe");
    });

    test("Deve propagar falha ao salvar equipe", async () => {
      equipe.update.mockRejectedValue(new Error("Falha ao salvar equipe"));
      await expect(atualizar(7, 31, 99, {})).rejects.toThrow("Falha ao salvar equipe");
    });
  });

  describe("Exclusão de equipes", () => {
    test("Deve excluir somente a equipe vinculada à montagem", async () => {
      const resultado = await excluir(7, 31, 99);
      expect(EquipeMontagem.findOne).toHaveBeenCalledWith({
        where: { id: 31, montagem_id: 21 },
      });
      expect(equipe.destroy).toHaveBeenCalledTimes(1);
      expect(resultado).toBeUndefined();
    });

    test("Deve rejeitar exclusão de equipe inexistente", async () => {
      EquipeMontagem.findOne.mockResolvedValue(null);
      await expect(excluir(7, 999, 99)).rejects.toThrow("Registro de equipe não encontrado.");
      expect(equipe.destroy).not.toHaveBeenCalled();
    });

    test("Deve propagar falha ao buscar a equipe", async () => {
      EquipeMontagem.findOne.mockRejectedValue(new Error("Falha ao buscar equipe"));
      await expect(excluir(7, 31, 99)).rejects.toThrow("Falha ao buscar equipe");
      expect(equipe.destroy).not.toHaveBeenCalled();
    });

    test("Deve propagar falha ao excluir a equipe", async () => {
      equipe.destroy.mockRejectedValue(new Error("Falha ao excluir equipe"));
      await expect(excluir(7, 31, 99)).rejects.toThrow("Falha ao excluir equipe");
    });
  });
});