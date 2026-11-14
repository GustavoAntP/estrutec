jest.mock("../src/configuracoes/banco", () => ({
  transaction: jest.fn(),
}));

jest.mock("../src/modelos/Projeto", () => ({
  findOne: jest.fn(),
}));

jest.mock("../src/modelos/ElementoProjeto", () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  destroy: jest.fn(),
  bulkCreate: jest.fn(),
}));

const sequelize = require("../src/configuracoes/banco");
const Projeto = require("../src/modelos/Projeto");
const ElementoProjeto = require("../src/modelos/ElementoProjeto");

const {
  confirmarImportacao,
  listarElementos,
  atualizarElemento,
} = require("../src/servicos/elementoProjetoServico");

const novoElemento = (alteracoes = {}) => ({
  linhaOrigem: 2,
  nomeAplicacao: " V01 ",
  tipo: " VIGA ",
  secao: " RETANGULAR ",
  aplicacao: " VÃO CENTRAL ",
  largura: "0.20",
  altura: "0.50",
  comprimento: "5",
  quantidade: "2",
  ...alteracoes,
});

const novoRegistro = (alteracoes = {}) => {
  const registro = {
    id: 10,
    projeto_id: 7,
    linha_origem: 2,
    nome_aplicacao: "V01",
    tipo: "VIGA",
    secao: "RETANGULAR",
    aplicacao: "VÃO CENTRAL",
    largura: 0.2,
    altura: 0.5,
    comprimento: 5,
    quantidade: 2,
    area_secao: 1,
    peso_unitario_kg: 1250,
    ...alteracoes,
  };

  registro.update = jest.fn(async (dados) => {
    Object.assign(registro, dados);
    return registro;
  });

  return registro;
};

describe("Serviço de elementos estruturais - Estrutec", () => {
  let projeto;
  let registro;
  let transacao;

  beforeEach(() => {
    jest.resetAllMocks();

    projeto = { id: 7, usuario_id: 99, status: "EM_ANDAMENTO" };
    registro = novoRegistro();
    transacao = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };

    Projeto.findOne.mockResolvedValue(projeto);
    ElementoProjeto.findOne.mockResolvedValue(registro);
    ElementoProjeto.findAll.mockResolvedValue([registro]);
    ElementoProjeto.destroy.mockResolvedValue(1);
    ElementoProjeto.bulkCreate.mockImplementation(async (dados) =>
      dados.map((item, indice) => ({ id: indice + 1, ...item }))
    );
    sequelize.transaction.mockResolvedValue(transacao);
  });

  describe("Confirmação da importação", () => {
    test.each([
      ["undefined", undefined],
      ["null", null],
      ["objeto", {}],
      ["lista vazia", []],
    ])("Deve rejeitar importação com %s", async (_, elementos) => {
      await expect(
        confirmarImportacao(7, 99, elementos)
      ).rejects.toThrow("Nenhum elemento foi enviado para importação.");

      expect(Projeto.findOne).not.toHaveBeenCalled();
      expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    test("Deve bloquear importação para projeto não encontrado", async () => {
      Projeto.findOne.mockResolvedValue(null);

      await expect(
        confirmarImportacao(7, 99, [novoElemento()])
      ).rejects.toThrow("Projeto não encontrado.");

      expect(ElementoProjeto.destroy).not.toHaveBeenCalled();
      expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    test("Deve consultar o projeto do usuário autenticado", async () => {
      await confirmarImportacao("7", 99, [novoElemento()]);

      expect(Projeto.findOne).toHaveBeenCalledWith({
        where: { id: "7", usuario_id: 99 },
      });

      expect(ElementoProjeto.destroy).toHaveBeenCalledWith({
        where: { projeto_id: 7 },
        transaction: transacao,
      });
    });

    test("Deve normalizar os campos e calcular volume e peso", async () => {
      const resultado = await confirmarImportacao(7, 99, [novoElemento()]);

      expect(ElementoProjeto.bulkCreate).toHaveBeenCalledWith(
        [
          {
            projeto_id: 7,
            linha_origem: 2,
            nome_aplicacao: "V01",
            tipo: "VIGA",
            secao: "RETANGULAR",
            aplicacao: "VÃO CENTRAL",
            largura: 0.2,
            altura: 0.5,
            area_secao: 1,
            peso_unitario_kg: 1250,
            comprimento: 5,
            quantidade: 2,
          },
        ],
        { transaction: transacao }
      );

      expect(resultado).toEqual({
        totalElementos: 1,
        totalPecas: 2,
      });
    });

    test("Deve aceitar campos opcionais ausentes", async () => {
      await confirmarImportacao(7, 99, [
        novoElemento({
          linhaOrigem: undefined,
          secao: undefined,
          aplicacao: undefined,
        }),
      ]);

      expect(ElementoProjeto.bulkCreate).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            linha_origem: null,
            secao: null,
            aplicacao: null,
          }),
        ],
        { transaction: transacao }
      );
    });

    test("Deve aceitar dimensões e quantidade numéricas", async () => {
      await confirmarImportacao(7, 99, [
        novoElemento({
          largura: 0.2,
          altura: 0.5,
          comprimento: 5,
          quantidade: 2,
        }),
      ]);

      expect(ElementoProjeto.bulkCreate.mock.calls[0][0][0]).toEqual(
        expect.objectContaining({
          largura: 0.2,
          altura: 0.5,
          comprimento: 5,
          quantidade: 2,
        })
      );
    });

    test("Deve somar as quantidades de vários elementos", async () => {
      const resultado = await confirmarImportacao(7, 99, [
        novoElemento({ nomeAplicacao: "V01", quantidade: 2 }),
        novoElemento({ nomeAplicacao: "V02", quantidade: 3 }),
        novoElemento({ nomeAplicacao: "V03", quantidade: 4 }),
      ]);

      expect(resultado).toEqual({
        totalElementos: 3,
        totalPecas: 9,
      });

      expect(ElementoProjeto.bulkCreate.mock.calls[0][0]).toHaveLength(3);
    });

    test("Deve arredondar os cálculos antes de salvar", async () => {
      const largura = 0.333333;
      const altura = 0.457;
      const comprimento = 4.789;
      const quantidade = 3;

      await confirmarImportacao(7, 99, [
        novoElemento({ largura, altura, comprimento, quantidade }),
      ]);

      const salvo = ElementoProjeto.bulkCreate.mock.calls[0][0][0];
      const volume = largura * altura * comprimento;

      expect(salvo.area_secao).toBe(
        Number((volume * quantidade).toFixed(4))
      );

      expect(salvo.peso_unitario_kg).toBe(
        Number((volume * 2500).toFixed(2))
      );
    });

    test("Deve excluir os registros antigos antes de inserir os novos", async () => {
      await confirmarImportacao(7, 99, [novoElemento()]);

      expect(ElementoProjeto.destroy).toHaveBeenCalledTimes(1);
      expect(ElementoProjeto.bulkCreate).toHaveBeenCalledTimes(1);

      expect(
        ElementoProjeto.destroy.mock.invocationCallOrder[0]
      ).toBeLessThan(
        ElementoProjeto.bulkCreate.mock.invocationCallOrder[0]
      );

      expect(transacao.commit).toHaveBeenCalledTimes(1);
      expect(transacao.rollback).not.toHaveBeenCalled();
    });

    test("Deve propagar falhas ao buscar o projeto", async () => {
      Projeto.findOne.mockRejectedValue(
        new Error("Falha na consulta do projeto")
      );

      await expect(
        confirmarImportacao(7, 99, [novoElemento()])
      ).rejects.toThrow("Falha na consulta do projeto");

      expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    test("Deve propagar falha ao iniciar uma transação", async () => {
      sequelize.transaction.mockRejectedValue(
        new Error("Falha na transação")
      );

      await expect(
        confirmarImportacao(7, 99, [novoElemento()])
      ).rejects.toThrow("Falha na transação");

      expect(ElementoProjeto.destroy).not.toHaveBeenCalled();
    });

    test.each([
      ["exclusão anterior", "destroy"],
      ["inserção", "bulkCreate"],
    ])("Deve desfazer a transação quando falhar a %s", async (_, metodo) => {
      ElementoProjeto[metodo].mockRejectedValue(
        new Error("Falha na importação")
      );

      await expect(
        confirmarImportacao(7, 99, [novoElemento()])
      ).rejects.toThrow("Falha na importação");

      expect(transacao.rollback).toHaveBeenCalledTimes(1);
      expect(transacao.commit).not.toHaveBeenCalled();
    });

    test("Deve executar rollback quando o commit falhar", async () => {
      transacao.commit.mockRejectedValue(
        new Error("Falha no commit")
      );

      await expect(
        confirmarImportacao(7, 99, [novoElemento()])
      ).rejects.toThrow("Falha no commit");

      expect(transacao.rollback).toHaveBeenCalledTimes(1);
    });
  });

  describe("Validação da importação", () => {
    test.each([
      ["nome ausente", { nomeAplicacao: undefined }],
      ["nome vazio", { nomeAplicacao: "" }],
      ["tipo ausente", { tipo: undefined }],
      ["tipo vazio", { tipo: "" }],
      ["largura zero", { largura: 0 }],
      ["largura negativa", { largura: -1 }],
      ["largura inválida", { largura: "abc" }],
      ["largura infinita", { largura: Infinity }],
      ["altura zero", { altura: 0 }],
      ["altura negativa", { altura: -1 }],
      ["altura inválida", { altura: "abc" }],
      ["comprimento zero", { comprimento: 0 }],
      ["comprimento negativo", { comprimento: -2 }],
      ["comprimento inválido", { comprimento: "abc" }],
      ["comprimento infinito", { comprimento: Infinity }],
      ["quantidade zero", { quantidade: 0 }],
      ["quantidade negativa", { quantidade: -1 }],
      ["quantidade decimal", { quantidade: 1.5 }],
      ["quantidade inválida", { quantidade: "abc" }],
      ["quantidade infinita", { quantidade: Infinity }],
    ])("Deve rejeitar elemento com %s", async (_, alteracoes) => {
      await expect(
        confirmarImportacao(7, 99, [
          novoElemento({
            ...alteracoes,
            linhaOrigem: 17,
          }),
        ])
      ).rejects.toThrow("Elemento inválido na linha 17.");

      expect(sequelize.transaction).not.toHaveBeenCalled();
      expect(ElementoProjeto.destroy).not.toHaveBeenCalled();
      expect(ElementoProjeto.bulkCreate).not.toHaveBeenCalled();
    });

    test("Deve informar linha desconhecida quando não houver origem", async () => {
      await expect(
        confirmarImportacao(7, 99, [
          novoElemento({
            linhaOrigem: undefined,
            quantidade: 0,
          }),
        ])
      ).rejects.toThrow("Elemento inválido na linha desconhecida.");
    });

    test("Deve impedir escrita se um elemento posterior estiver inválido", async () => {
      await expect(
        confirmarImportacao(7, 99, [
          novoElemento(),
          novoElemento({
            linhaOrigem: 18,
            altura: 0,
          }),
        ])
      ).rejects.toThrow("Elemento inválido na linha 18.");

      expect(sequelize.transaction).not.toHaveBeenCalled();
      expect(ElementoProjeto.destroy).not.toHaveBeenCalled();
    });
  });

  describe("Listagem de elementos", () => {
    test("Deve listar elementos do projeto informado em ordem crescente", async () => {
      const resultado = await listarElementos(7, 99);

      expect(resultado).toEqual([registro]);

      expect(Projeto.findOne).toHaveBeenCalledWith({
        where: {
          id: 7,
          usuario_id: 99,
        },
      });

      expect(ElementoProjeto.findAll).toHaveBeenCalledWith({
        where: {
          projeto_id: 7,
        },
        order: [["id", "ASC"]],
      });
    });

    test("Deve retornar lista vazia quando não houver elementos", async () => {
      ElementoProjeto.findAll.mockResolvedValue([]);

      await expect(
        listarElementos(7, 99)
      ).resolves.toEqual([]);
    });

    test("Deve bloquear listagem de projeto inexistente", async () => {
      Projeto.findOne.mockResolvedValue(null);

      await expect(
        listarElementos(7, 99)
      ).rejects.toThrow("Projeto não encontrado.");

      expect(ElementoProjeto.findAll).not.toHaveBeenCalled();
    });

    test("Deve propagar erro ao consultar projeto", async () => {
      Projeto.findOne.mockRejectedValue(
        new Error("Erro ao buscar projeto")
      );

      await expect(
        listarElementos(7, 99)
      ).rejects.toThrow("Erro ao buscar projeto");
    });

    test("Deve propagar erro ao consultar os elementos", async () => {
      ElementoProjeto.findAll.mockRejectedValue(
        new Error("Erro na listagem")
      );

      await expect(
        listarElementos(7, 99)
      ).rejects.toThrow("Erro na listagem");
    });
  });

  describe("Atualização de elementos", () => {
    test("Deve atualizar todos os campos e preservar a identificação", async () => {
      const resultado = await atualizarElemento(7, 10, 99, {
        nomeAplicacao: " V02 ",
        tipo: " pilar ",
        secao: " circular ",
        aplicacao: " apoio lateral ",
        largura: 0.2,
        altura: 0.5,
        comprimento: 5,
        quantidade: 3,
        pesoUnitarioKg: 1500,
      });

      expect(ElementoProjeto.findOne).toHaveBeenCalledWith({
        where: {
          id: 10,
          projeto_id: 7,
        },
      });

      expect(registro.update).toHaveBeenCalledWith({
        nome_aplicacao: "V02",
        tipo: "PILAR",
        secao: "CIRCULAR",
        aplicacao: "APOIO LATERAL",
        largura: 0.2,
        altura: 0.5,
        area_secao: 1.5,
        peso_unitario_kg: 1500,
        comprimento: 5,
        quantidade: 3,
      });

      expect(resultado).toBe(registro);
      expect(resultado.id).toBe(10);
    });

    test("Deve preservar campos ausentes e recalcular os valores derivados", async () => {
      const resultado = await atualizarElemento(7, 10, 99, {});

      expect(registro.update).toHaveBeenCalledWith({
        nome_aplicacao: "V01",
        tipo: "VIGA",
        secao: "RETANGULAR",
        aplicacao: "VÃO CENTRAL",
        largura: 0.2,
        altura: 0.5,
        area_secao: 1,
        peso_unitario_kg: 1250,
        comprimento: 5,
        quantidade: 2,
      });

      expect(resultado).toBe(registro);
    });

    test("Deve recalcular área agregada e peso ao alterar a largura", async () => {
      await atualizarElemento(7, 10, 99, {
        largura: 0.3,
      });

      expect(registro.update).toHaveBeenCalledWith(
        expect.objectContaining({
          largura: 0.3,
          area_secao: 1.5,
          peso_unitario_kg: 1875,
        })
      );
    });

    test("Deve aceitar dimensões e quantidade recebidas como texto", async () => {
      await atualizarElemento(7, 10, 99, {
        largura: "0.3",
        altura: "0.4",
        comprimento: "6",
        quantidade: "3",
      });

      expect(registro.update).toHaveBeenCalledWith(
        expect.objectContaining({
          largura: 0.3,
          altura: 0.4,
          comprimento: 6,
          quantidade: 3,
          area_secao: 2.16,
          peso_unitario_kg: 1800,
        })
      );
    });

    test("Deve arredondar valores calculados na atualização", async () => {
      const largura = 0.333333;
      const altura = 0.457;
      const comprimento = 4.789;
      const quantidade = 3;

      await atualizarElemento(7, 10, 99, {
        largura,
        altura,
        comprimento,
        quantidade,
      });

      const dados = registro.update.mock.calls[0][0];
      const volume = largura * altura * comprimento;

      expect(dados.area_secao).toBe(
        Number((volume * quantidade).toFixed(4))
      );

      expect(dados.peso_unitario_kg).toBe(
        Number((volume * 2500).toFixed(2))
      );
    });

    test("Deve aceitar peso manual numérico em texto", async () => {
      await atualizarElemento(7, 10, 99, {
        pesoUnitarioKg: "1350.5",
      });

      expect(registro.update).toHaveBeenCalledWith(
        expect.objectContaining({
          peso_unitario_kg: 1350.5,
        })
      );
    });

    test.each([null, ""])(
      "Deve permitir limpar o peso unitário com %p",
      async (valor) => {
        await atualizarElemento(7, 10, 99, {
          pesoUnitarioKg: valor,
        });

        expect(registro.update).toHaveBeenCalledWith(
          expect.objectContaining({
            peso_unitario_kg: null,
          })
        );
      }
    );

    test("Deve recalcular o peso quando não houver substituição manual", async () => {
      registro.peso_unitario_kg = 8000;

      await atualizarElemento(7, 10, 99, {
        quantidade: 4,
      });

      expect(registro.update).toHaveBeenCalledWith(
        expect.objectContaining({
          area_secao: 2,
          peso_unitario_kg: 1250,
        })
      );
    });

    test("Deve normalizar tipo, seção e aplicação para letras maiúsculas", async () => {
      await atualizarElemento(7, 10, 99, {
        nomeAplicacao: " Viga da entrada ",
        tipo: " viga ",
        secao: " retangular ",
        aplicacao: " entrada principal ",
      });

      expect(registro.update).toHaveBeenCalledWith(
        expect.objectContaining({
          nome_aplicacao: "Viga da entrada",
          tipo: "VIGA",
          secao: "RETANGULAR",
          aplicacao: "ENTRADA PRINCIPAL",
        })
      );
    });

    test.each(["", "   ", null])(
      "Deve limpar seção e aplicação ao receber %p",
      async (valor) => {
        await atualizarElemento(7, 10, 99, {
          secao: valor,
          aplicacao: valor,
        });

        expect(registro.update).toHaveBeenCalledWith(
          expect.objectContaining({
            secao: null,
            aplicacao: null,
          })
        );
      }
    );

    test("Deve verificar o usuário e o projeto antes de atualizar", async () => {
      await atualizarElemento("7", "10", 99, {
        altura: 0.7,
      });

      expect(Projeto.findOne).toHaveBeenCalledWith({
        where: {
          id: "7",
          usuario_id: 99,
        },
      });

      expect(ElementoProjeto.findOne).toHaveBeenCalledWith({
        where: {
          id: "10",
          projeto_id: "7",
        },
      });
    });

    test("Deve rejeitar atualização de projeto inexistente", async () => {
      Projeto.findOne.mockResolvedValue(null);

      await expect(
        atualizarElemento(7, 10, 99, {})
      ).rejects.toThrow("Projeto não encontrado.");

      expect(ElementoProjeto.findOne).not.toHaveBeenCalled();
      expect(registro.update).not.toHaveBeenCalled();
    });

    test("Deve rejeitar atualização de elemento inexistente", async () => {
      ElementoProjeto.findOne.mockResolvedValue(null);

      await expect(
        atualizarElemento(7, 999, 99, {})
      ).rejects.toThrow("Elemento não encontrado.");

      expect(registro.update).not.toHaveBeenCalled();
    });

    test("Deve propagar falha ao consultar projeto", async () => {
      Projeto.findOne.mockRejectedValue(
        new Error("Falha ao buscar projeto")
      );

      await expect(
        atualizarElemento(7, 10, 99, {})
      ).rejects.toThrow("Falha ao buscar projeto");
    });

    test("Deve propagar falha ao consultar elemento", async () => {
      ElementoProjeto.findOne.mockRejectedValue(
        new Error("Falha ao buscar elemento")
      );

      await expect(
        atualizarElemento(7, 10, 99, {})
      ).rejects.toThrow("Falha ao buscar elemento");
    });

    test("Deve propagar falha durante a atualização", async () => {
      registro.update.mockRejectedValue(
        new Error("Falha ao salvar elemento")
      );

      await expect(
        atualizarElemento(7, 10, 99, {})
      ).rejects.toThrow("Falha ao salvar elemento");
    });
  });

  describe("Validação da atualização", () => {
    test.each([
      ["largura zero", { largura: 0 }, "Largura inválida."],
      ["largura negativa", { largura: -1 }, "Largura inválida."],
      ["largura inválida", { largura: "abc" }, "Largura inválida."],
      ["largura infinita", { largura: Infinity }, "Largura inválida."],
      ["altura zero", { altura: 0 }, "Altura inválida."],
      ["altura negativa", { altura: -1 }, "Altura inválida."],
      ["altura inválida", { altura: "abc" }, "Altura inválida."],
      ["altura infinita", { altura: Infinity }, "Altura inválida."],
      ["comprimento zero", { comprimento: 0 }, "Comprimento inválido."],
      ["comprimento negativo", { comprimento: -1 }, "Comprimento inválido."],
      ["comprimento inválido", { comprimento: "abc" }, "Comprimento inválido."],
      ["comprimento infinito", { comprimento: Infinity }, "Comprimento inválido."],
      ["quantidade zero", { quantidade: 0 }, "Quantidade inválida."],
      ["quantidade negativa", { quantidade: -2 }, "Quantidade inválida."],
      ["quantidade decimal", { quantidade: 2.5 }, "Quantidade inválida."],
      ["quantidade inválida", { quantidade: "abc" }, "Quantidade inválida."],
      ["quantidade infinita", { quantidade: Infinity }, "Quantidade inválida."],
    ])("Deve rejeitar %s", async (_, dados, mensagem) => {
      await expect(
        atualizarElemento(7, 10, 99, dados)
      ).rejects.toThrow(mensagem);

      expect(registro.update).not.toHaveBeenCalled();
    });

    test.each([
      ["zero", 0],
      ["negativo", -1],
      ["texto inválido", "abc"],
      ["infinito", Infinity],
      ["menos infinito", -Infinity],
    ])("Deve rejeitar peso unitário %s", async (_, pesoUnitarioKg) => {
      await expect(
        atualizarElemento(7, 10, 99, {
          pesoUnitarioKg,
        })
      ).rejects.toThrow("Peso unitário inválido.");

      expect(registro.update).not.toHaveBeenCalled();
    });
  });
});