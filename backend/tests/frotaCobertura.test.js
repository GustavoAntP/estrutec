jest.mock("../src/modelos/Carreta", () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByPk: jest.fn(),
}));

jest.mock("../src/modelos/CavaloMecanico", () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByPk: jest.fn(),
}));

jest.mock("../src/servicos/authServico", () => ({
  login: jest.fn(),
}));

jest.mock("../src/servicos/planilhaServico", () => ({
  processarPlanilha: jest.fn(),
}));

jest.mock("../src/modelos/Projeto", () => ({
  findOne: jest.fn(),
}));

const Carreta = require("../src/modelos/Carreta");
const CavaloMecanico = require("../src/modelos/CavaloMecanico");

const CarretaServico = require("../src/servicos/CarretaServico");
const CavaloMecanicoServico = require("../src/servicos/CavaloMecanicoServico");

const CarretaControlador = require("../src/controladores/CarretaControlador");
const CavaloMecanicoControlador = require("../src/controladores/CavaloMecanicoControlador");

const authServico = require("../src/servicos/authServico");
const authControlador = require("../src/controladores/authControlador");

const planilhaServico = require("../src/servicos/planilhaServico");
const Projeto = require("../src/modelos/Projeto");
const planilhaControlador = require("../src/controladores/planilhaControlador");

const { cpfValido } = require("../src/utilitarios/validadores");

const resposta = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const cenarios = [
  {
    nome: "Carretas",
    modelo: Carreta,
    servico: CarretaServico,
    controlador: CarretaControlador,

    metodos: {
      listar: "listarCarretas",
      criar: "criarCarreta",
      atualizar: "atualizarCarreta",
      status: "alterarStatusCarreta",
    },

    lista: "carretas",
    item: "carreta",

    mensagens: {
      criado: "Carreta cadastrada com sucesso!",
      atualizado: "Carreta atualizada com sucesso!",
      ativado: "Carreta ativada com sucesso!",
      desativado: "Carreta desativada com sucesso!",
      inexistente: "Carreta não encontrada.",
      duplicado: "Já existe uma carreta cadastrada com esta placa.",
      nome: "Informe o nome da carreta.",

      fallback: [
        "Não foi possível listar as carretas.",
        "Não foi possível cadastrar a carreta.",
        "Não foi possível atualizar a carreta.",
        "Não foi possível alterar o status da carreta.",
      ],
    },

    entrada: {
      nome: " Carreta prancha ",
      placa: " abc1d23 ",
      tipo: " Prancha ",
      capacidade_peso_kg: "28000.5",
      capacidade_pecas: "12",
      observacoes: " Transporte de vigas ",
    },

    esperado: {
      nome: "Carreta prancha",
      placa: "ABC1D23",
      tipo: "Prancha",
      capacidade_peso_kg: 28000.5,
      capacidade_pecas: 12,
      observacoes: "Transporte de vigas",
    },

    opcionais: ["tipo"],

    numericos: [
      "capacidade_peso_kg",
      "capacidade_pecas",
    ],

    validacoes: [
      ["capacidade_peso_kg", 0, "Informe uma capacidade de peso válida."],
      ["capacidade_peso_kg", -1, "Informe uma capacidade de peso válida."],
      ["capacidade_peso_kg", "texto", "Informe uma capacidade de peso válida."],
      ["capacidade_peso_kg", Infinity, "Informe uma capacidade de peso válida."],
      ["capacidade_peso_kg", undefined, "Informe uma capacidade de peso válida."],

      ["capacidade_pecas", 0, "Informe uma capacidade de peças válida."],
      ["capacidade_pecas", -2, "Informe uma capacidade de peças válida."],
      ["capacidade_pecas", 2.5, "Informe uma capacidade de peças válida."],
      ["capacidade_pecas", "texto", "Informe uma capacidade de peças válida."],
      ["capacidade_pecas", Infinity, "Informe uma capacidade de peças válida."],
      ["capacidade_pecas", undefined, "Informe uma capacidade de peças válida."],
    ],
  },
  {
    nome: "Cavalos mecânicos",
    modelo: CavaloMecanico,
    servico: CavaloMecanicoServico,
    controlador: CavaloMecanicoControlador,

    metodos: {
      listar: "listarCavalosMecanicos",
      criar: "criarCavaloMecanico",
      atualizar: "atualizarCavaloMecanico",
      status: "alterarStatusCavaloMecanico",
    },

    lista: "cavalos",
    item: "cavalo",

    mensagens: {
      criado: "Cavalo mecânico cadastrado com sucesso!",
      atualizado: "Cavalo mecânico atualizado com sucesso!",
      ativado: "Cavalo mecânico ativado com sucesso!",
      desativado: "Cavalo mecânico desativado com sucesso!",
      inexistente: "Cavalo mecânico não encontrado.",
      duplicado: "Já existe um cavalo mecânico cadastrado com esta placa.",
      nome: "Informe o nome do cavalo mecânico.",

      fallback: [
        "Não foi possível listar os cavalos mecânicos.",
        "Não foi possível cadastrar o cavalo mecânico.",
        "Não foi possível atualizar o cavalo mecânico.",
        "Não foi possível alterar o status do cavalo mecânico.",
      ],
    },

    entrada: {
      nome: " Scania R450 ",
      placa: " abc1d23 ",
      marca: " Scania ",
      modelo: " R450 ",
      consumo_carregado_km_l: "2.1",
      consumo_vazio_km_l: "3.7",
      observacoes: " Frota própria ",
    },

    esperado: {
      nome: "Scania R450",
      placa: "ABC1D23",
      marca: "Scania",
      modelo: "R450",
      consumo_carregado_km_l: 2.1,
      consumo_vazio_km_l: 3.7,
      observacoes: "Frota própria",
    },

    opcionais: ["marca", "modelo"],

    numericos: [
      "consumo_carregado_km_l",
      "consumo_vazio_km_l",
    ],

    validacoes: [
      ["consumo_carregado_km_l", 0, "Informe um consumo carregado válido."],
      ["consumo_carregado_km_l", -1, "Informe um consumo carregado válido."],
      ["consumo_carregado_km_l", "texto", "Informe um consumo carregado válido."],
      ["consumo_carregado_km_l", Infinity, "Informe um consumo carregado válido."],
      ["consumo_carregado_km_l", undefined, "Informe um consumo carregado válido."],

      ["consumo_vazio_km_l", 0, "Informe um consumo vazio válido."],
      ["consumo_vazio_km_l", -1, "Informe um consumo vazio válido."],
      ["consumo_vazio_km_l", "texto", "Informe um consumo vazio válido."],
      ["consumo_vazio_km_l", Infinity, "Informe um consumo vazio válido."],
      ["consumo_vazio_km_l", undefined, "Informe um consumo vazio válido."],
    ],
  },
];

describe.each(cenarios)(
  "Serviço e controlador de $nome - Estrutec",
  (c) => {
    let registro;

    beforeEach(() => {
      jest.restoreAllMocks();
      jest.resetAllMocks();

      registro = {
        id: 7,
        ...c.esperado,
        ativo: true,

        update: jest.fn().mockImplementation(async function (dados) {
          Object.assign(registro, dados);
          return registro;
        }),
      };

      c.modelo.findByPk.mockResolvedValue(registro);
      c.modelo.findOne.mockResolvedValue(null);
      c.modelo.findAll.mockResolvedValue([registro]);

      c.modelo.create.mockImplementation(async (dados) => ({
        id: 10,
        ...dados,
      }));
    });

    describe("Serviço - listagem", () => {
      test("Deve ordenar ativos primeiro e depois por nome", async () => {
        await expect(
          c.servico[c.metodos.listar]()
        ).resolves.toEqual([registro]);

        expect(c.modelo.findAll).toHaveBeenCalledWith({
          order: [
            ["ativo", "DESC"],
            ["nome", "ASC"],
          ],
        });
      });

      test("Deve retornar lista vazia", async () => {
        c.modelo.findAll.mockResolvedValue([]);

        await expect(
          c.servico[c.metodos.listar]()
        ).resolves.toEqual([]);
      });

      test("Deve propagar falha na listagem", async () => {
        c.modelo.findAll.mockRejectedValue(
          new Error("Erro ao listar")
        );

        await expect(
          c.servico[c.metodos.listar]()
        ).rejects.toThrow("Erro ao listar");
      });
    });

    describe("Serviço - cadastro", () => {
      test("Deve normalizar e persistir todos os dados", async () => {
        const resultado = await c.servico[c.metodos.criar](
          c.entrada
        );

        expect(c.modelo.findOne).toHaveBeenCalledWith({
          where: {
            placa: "ABC1D23",
          },
        });

        expect(c.modelo.create).toHaveBeenCalledWith({
          ...c.esperado,
          ativo: true,
        });

        expect(resultado).toEqual({
          id: 10,
          ...c.esperado,
          ativo: true,
        });
      });

      test.each([
        undefined,
        null,
        "",
      ])(
        "Deve permitir placa opcional %p",
        async (placa) => {
          await c.servico[c.metodos.criar]({
            ...c.entrada,
            placa,
          });

          expect(c.modelo.create).toHaveBeenCalledWith(
            expect.objectContaining({
              placa: null,
            })
          );

          expect(
            c.modelo.findOne
          ).not.toHaveBeenCalled();
        }
      );

      test("Deve converter campos opcionais ausentes em null", async () => {
        const dados = {
          ...c.entrada,
          placa: undefined,
          observacoes: undefined,
        };

        c.opcionais.forEach((campo) => {
          delete dados[campo];
        });

        await c.servico[c.metodos.criar](dados);

        const salvo = c.modelo.create.mock.calls[0][0];

        expect(salvo.placa).toBeNull();
        expect(salvo.observacoes).toBeNull();

        c.opcionais.forEach((campo) => {
          expect(salvo[campo]).toBeNull();
        });
      });

      test("Deve impedir alteração de ID e status por entrada adicional", async () => {
        await c.servico[c.metodos.criar]({
          ...c.entrada,
          id: 999,
          ativo: false,
        });

        const salvo = c.modelo.create.mock.calls[0][0];

        expect(salvo.id).toBeUndefined();
        expect(salvo.ativo).toBe(true);
      });

      test.each([
        undefined,
        null,
        "",
        "   ",
      ])(
        "Deve rejeitar nome obrigatório %p",
        async (nome) => {
          await expect(
            c.servico[c.metodos.criar]({
              ...c.entrada,
              nome,
            })
          ).rejects.toThrow(c.mensagens.nome);

          expect(
            c.modelo.create
          ).not.toHaveBeenCalled();
        }
      );

      test.each(c.validacoes)(
        "Deve rejeitar %s inválido: %p",
        async (campo, valor, mensagem) => {
          await expect(
            c.servico[c.metodos.criar]({
              ...c.entrada,
              [campo]: valor,
            })
          ).rejects.toThrow(mensagem);

          expect(
            c.modelo.create
          ).not.toHaveBeenCalled();
        }
      );

      test("Deve impedir placa duplicada", async () => {
        c.modelo.findOne.mockResolvedValue({
          id: 99,
        });

        await expect(
          c.servico[c.metodos.criar](c.entrada)
        ).rejects.toThrow(c.mensagens.duplicado);

        expect(
          c.modelo.create
        ).not.toHaveBeenCalled();
      });

      test("Deve propagar erro na consulta de duplicidade", async () => {
        c.modelo.findOne.mockRejectedValue(
          new Error("Erro na busca de placa")
        );

        await expect(
          c.servico[c.metodos.criar](c.entrada)
        ).rejects.toThrow("Erro na busca de placa");
      });

      test("Deve propagar erro no cadastro", async () => {
        c.modelo.create.mockRejectedValue(
          new Error("Erro no cadastro")
        );

        await expect(
          c.servico[c.metodos.criar](c.entrada)
        ).rejects.toThrow("Erro no cadastro");
      });
    });

    describe("Serviço - edição", () => {
      test("Deve atualizar e normalizar todos os campos", async () => {
        const resultado = await c.servico[c.metodos.atualizar](
          7,
          c.entrada
        );

        expect(
          c.modelo.findByPk
        ).toHaveBeenCalledWith(7);

        expect(
          registro.update
        ).toHaveBeenCalledWith(c.esperado);

        expect(resultado).toBe(registro);
      });

      test("Deve preservar todos os valores quando o corpo estiver vazio", async () => {
        await c.servico[c.metodos.atualizar](7, {});

        expect(
          registro.update
        ).toHaveBeenCalledWith(c.esperado);

        expect(
          c.modelo.findOne
        ).not.toHaveBeenCalled();
      });

      test("Deve atualizar apenas o nome informado", async () => {
        await c.servico[c.metodos.atualizar](7, {
          nome: " Nome novo ",
        });

        expect(
          registro.update
        ).toHaveBeenCalledWith({
          ...c.esperado,
          nome: "Nome novo",
        });
      });

      test.each([
        undefined,
        null,
        "",
      ])(
        "Deve permitir limpar a placa com %p",
        async (placa) => {
          await c.servico[c.metodos.atualizar](7, {
            placa,
          });

          expect(registro.placa).toBe(
            placa === undefined ? "ABC1D23" : null
          );

          expect(
            c.modelo.findOne
          ).not.toHaveBeenCalled();
        }
      );

      test("Deve limpar observações e demais campos opcionais", async () => {
        const dados = {
          observacoes: null,
        };

        c.opcionais.forEach((campo) => {
          dados[campo] = null;
        });

        await c.servico[c.metodos.atualizar](7, dados);

        expect(
          registro.observacoes
        ).toBeNull();

        c.opcionais.forEach((campo) => {
          expect(registro[campo]).toBeNull();
        });
      });

      test.each(c.numericos)(
        "Deve converter %s recebido como texto",
        async (campo) => {
          const novoValor =
            campo === "capacidade_pecas" ? "15" : "8.5";

          await c.servico[c.metodos.atualizar](7, {
            [campo]: novoValor,
          });

          expect(registro[campo]).toBe(
            Number(novoValor)
          );
        }
      );

      test("Deve pesquisar a placa quando for modificada", async () => {
        await c.servico[c.metodos.atualizar](7, {
          placa: " xyz9z99 ",
        });

        expect(
          c.modelo.findOne
        ).toHaveBeenCalledWith({
          where: {
            placa: "XYZ9Z99",
          },
        });

        expect(
          registro.placa
        ).toBe("XYZ9Z99");
      });

      test("Deve impedir troca para placa duplicada", async () => {
        c.modelo.findOne.mockResolvedValue({
          id: 80,
        });

        await expect(
          c.servico[c.metodos.atualizar](7, {
            placa: " xyz9z99 ",
          })
        ).rejects.toThrow(c.mensagens.duplicado);

        expect(
          registro.update
        ).not.toHaveBeenCalled();
      });

      test("Deve ignorar identificador e status enviados na edição", async () => {
        await c.servico[c.metodos.atualizar](7, {
          id: 200,
          ativo: false,
        });

        const dados = registro.update.mock.calls[0][0];

        expect(dados).not.toHaveProperty("id");
        expect(dados).not.toHaveProperty("ativo");

        expect(registro.id).toBe(7);
        expect(registro.ativo).toBe(true);
      });

      test("Deve rejeitar registro inexistente", async () => {
        c.modelo.findByPk.mockResolvedValue(null);

        await expect(
          c.servico[c.metodos.atualizar](
            99,
            c.entrada
          )
        ).rejects.toThrow(c.mensagens.inexistente);
      });

      test.each([
        "",
        "   ",
      ])(
        "Deve rejeitar nome vazio durante edição: %p",
        async (nome) => {
          await expect(
            c.servico[c.metodos.atualizar](7, {
              nome,
            })
          ).rejects.toThrow(c.mensagens.nome);

          expect(
            registro.update
          ).not.toHaveBeenCalled();
        }
      );

      test.each(
        c.validacoes.filter(([, valor]) => valor !== undefined)
      )(
        "Deve rejeitar alteração inválida em %s: %p",
        async (campo, valor, mensagem) => {
          await expect(
            c.servico[c.metodos.atualizar](7, {
              [campo]: valor,
            })
          ).rejects.toThrow(mensagem);

          expect(
            registro.update
          ).not.toHaveBeenCalled();
        }
      );

      test("Deve propagar erro na consulta do registro", async () => {
        c.modelo.findByPk.mockRejectedValue(
          new Error("Erro ao buscar registro")
        );

        await expect(
          c.servico[c.metodos.atualizar](7, {})
        ).rejects.toThrow("Erro ao buscar registro");
      });

      test("Deve propagar erro na atualização", async () => {
        registro.update.mockRejectedValue(
          new Error("Erro ao atualizar registro")
        );

        await expect(
          c.servico[c.metodos.atualizar](7, {})
        ).rejects.toThrow("Erro ao atualizar registro");
      });
    });

    describe("Serviço - ativação e desativação", () => {
      test.each([
        true,
        false,
      ])(
        "Deve gravar status booleano %p",
        async (ativo) => {
          const resultado = await c.servico[c.metodos.status](
            7,
            ativo
          );

          expect(
            c.modelo.findByPk
          ).toHaveBeenCalledWith(7);

          expect(
            registro.update
          ).toHaveBeenCalledWith({
            ativo,
          });

          expect(resultado.ativo).toBe(ativo);
        }
      );

      test.each([
        "true",
        "false",
        0,
        1,
        null,
        undefined,
      ])(
        "Deve rejeitar status não booleano %p",
        async (ativo) => {
          await expect(
            c.servico[c.metodos.status](7, ativo)
          ).rejects.toThrow("Status inválido.");

          expect(
            registro.update
          ).not.toHaveBeenCalled();
        }
      );

      test("Deve rejeitar registro inexistente", async () => {
        c.modelo.findByPk.mockResolvedValue(null);

        await expect(
          c.servico[c.metodos.status](99, true)
        ).rejects.toThrow(c.mensagens.inexistente);
      });

      test("Deve propagar falha ao buscar o registro", async () => {
        c.modelo.findByPk.mockRejectedValue(
          new Error("Erro de consulta")
        );

        await expect(
          c.servico[c.metodos.status](7, true)
        ).rejects.toThrow("Erro de consulta");
      });

      test("Deve propagar falha ao atualizar o status", async () => {
        registro.update.mockRejectedValue(
          new Error("Erro de gravação")
        );

        await expect(
          c.servico[c.metodos.status](7, true)
        ).rejects.toThrow("Erro de gravação");
      });
    });

    describe("Controlador HTTP", () => {
      const operacoes = [
        "listar",
        "criar",
        "atualizar",
        "status",
      ];

      test("Deve listar registros com resposta HTTP 200", async () => {
        jest.spyOn(
          c.servico,
          c.metodos.listar
        ).mockResolvedValue([registro]);

        const res = resposta();

        const retorno = await c.controlador[c.metodos.listar](
          {},
          res
        );

        expect(
          res.status
        ).not.toHaveBeenCalled();

        expect(res.json).toHaveBeenCalledWith({
          [c.lista]: [registro],
        });

        expect(retorno).toBe(res);
      });

      test("Deve cadastrar com HTTP 201 e repassar o corpo", async () => {
        jest.spyOn(
          c.servico,
          c.metodos.criar
        ).mockResolvedValue(registro);

        const req = {
          body: c.entrada,
        };

        const res = resposta();

        await c.controlador[c.metodos.criar](
          req,
          res
        );

        expect(
          c.servico[c.metodos.criar]
        ).toHaveBeenCalledWith(c.entrada);

        expect(
          res.status
        ).toHaveBeenCalledWith(201);

        expect(res.json).toHaveBeenCalledWith({
          mensagem: c.mensagens.criado,
          [c.item]: registro,
        });
      });

      test("Deve atualizar usando parâmetro de rota e corpo", async () => {
        jest.spyOn(
          c.servico,
          c.metodos.atualizar
        ).mockResolvedValue(registro);

        const req = {
          params: {
            id: "7",
          },
          body: {
            nome: "Novo",
          },
        };

        const res = resposta();

        await c.controlador[c.metodos.atualizar](
          req,
          res
        );

        expect(
          c.servico[c.metodos.atualizar]
        ).toHaveBeenCalledWith(
          "7",
          req.body
        );

        expect(res.json).toHaveBeenCalledWith({
          mensagem: c.mensagens.atualizado,
          [c.item]: registro,
        });

        expect(
          res.status
        ).not.toHaveBeenCalled();
      });

      test.each([
        [true, "ativado"],
        [false, "desativado"],
      ])(
        "Deve responder alteração de status %p",
        async (ativo, mensagem) => {
          const alterado = {
            ...registro,
            ativo,
          };

          jest.spyOn(
            c.servico,
            c.metodos.status
          ).mockResolvedValue(alterado);

          const req = {
            params: {
              id: "7",
            },
            body: {
              ativo,
            },
          };

          const res = resposta();

          await c.controlador[c.metodos.status](
            req,
            res
          );

          expect(
            c.servico[c.metodos.status]
          ).toHaveBeenCalledWith(
            "7",
            ativo
          );

          expect(res.json).toHaveBeenCalledWith({
            mensagem: c.mensagens[mensagem],
            [c.item]: alterado,
          });

          expect(
            res.status
          ).not.toHaveBeenCalled();
        }
      );

      test.each(operacoes)(
        "Deve responder HTTP 400 para erro em %s",
        async (acao) => {
          jest.spyOn(
            c.servico,
            c.metodos[acao]
          ).mockRejectedValue(
            new Error("Falha simulada")
          );

          const req = {
            params: {
              id: "7",
            },
            body: {
              ativo: false,
            },
          };

          const res = resposta();

          await c.controlador[c.metodos[acao]](
            req,
            res
          );

          expect(
            res.status
          ).toHaveBeenCalledWith(400);

          expect(res.json).toHaveBeenCalledWith({
            erro: "Falha simulada",
          });
        }
      );

      test.each(
        operacoes.map((acao, i) => [acao, i])
      )(
        "Deve usar mensagem padrão quando erro em %s não tiver texto",
        async (acao, i) => {
          jest.spyOn(
            c.servico,
            c.metodos[acao]
          ).mockRejectedValue(
            new Error("")
          );

          const req = {
            params: {
              id: "7",
            },
            body: {
              ativo: false,
            },
          };

          const res = resposta();

          await c.controlador[c.metodos[acao]](
            req,
            res
          );

          expect(
            res.status
          ).toHaveBeenCalledWith(400);

          expect(res.json).toHaveBeenCalledWith({
            erro: c.mensagens.fallback[i],
          });
        }
      );
    });
  }
);

describe("Controlador de autenticação", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("Deve responder 200 e retornar os dados do login", async () => {
    const req = {
      body: {
        identificador: "usuario@teste.com",
        senha: "abc",
      },
    };

    const res = resposta();

    authServico.login.mockResolvedValue({
      token: "token-teste",
      usuario: {
        id: 9,
      },
    });

    await authControlador.login(
      req,
      res
    );

    expect(
      authServico.login
    ).toHaveBeenCalledWith(
      "usuario@teste.com",
      "abc"
    );

    expect(
      res.status
    ).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      mensagem: "Login realizado com sucesso!",
      token: "token-teste",
      usuario: {
        id: 9,
      },
    });
  });

  test("Deve responder 401 quando login falhar", async () => {
    authServico.login.mockRejectedValue(
      new Error("Credenciais inválidas")
    );

    const res = resposta();

    await authControlador.login(
      {
        body: {
          identificador: "x",
          senha: "y",
        },
      },
      res
    );

    expect(
      res.status
    ).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      erro: "Credenciais inválidas",
    });
  });
});

describe("Controlador de importação de planilhas", () => {
  const req = () => ({
    params: {
      id: "21",
    },

    usuario: {
      id: 5,
    },

    file: {
      originalname: "vigas.xlsx",
    },
  });

  beforeEach(() => {
    jest.resetAllMocks();

    Projeto.findOne.mockResolvedValue({
      id: 21,
      codigo: "PR-021",
      nome: "Obra teste",
    });

    planilhaServico.processarPlanilha.mockResolvedValue({
      nomeArquivo: "vigas.xlsx",
      tamanho: 100,
      nomePlanilha: "Elementos",
      resumo: {
        total: 2,
      },
      elementos: [
        {
          nome: "Viga",
        },
      ],
      erros: [],
    });
  });

  test("Deve validar o dono do projeto e retornar o resultado da planilha", async () => {
    const requisicao = req();
    const res = resposta();

    await planilhaControlador.importar(
      requisicao,
      res
    );

    expect(Projeto.findOne).toHaveBeenCalledWith({
      where: {
        id: "21",
        usuario_id: 5,
      },
    });

    expect(
      planilhaServico.processarPlanilha
    ).toHaveBeenCalledWith(
      requisicao.file
    );

    expect(
      res.status
    ).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      mensagem: "Planilha importada e validada com sucesso!",

      projeto: {
        id: 21,
        codigo: "PR-021",
        nome: "Obra teste",
      },

      arquivo: {
        nome: "vigas.xlsx",
        tamanho: 100,
        planilha: "Elementos",
      },

      resumo: {
        total: 2,
      },

      elementos: [
        {
          nome: "Viga",
        },
      ],

      erros: [],
    });
  });

  test("Deve retornar 404 se o projeto não pertencer ao usuário", async () => {
    Projeto.findOne.mockResolvedValue(null);

    const res = resposta();

    await planilhaControlador.importar(
      req(),
      res
    );

    expect(
      res.status
    ).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      erro: "Projeto não encontrado.",
    });

    expect(
      planilhaServico.processarPlanilha
    ).not.toHaveBeenCalled();
  });

  test("Deve retornar 400 em falha da importação", async () => {
    planilhaServico.processarPlanilha.mockRejectedValue(
      new Error("Planilha inválida")
    );

    const res = resposta();

    await planilhaControlador.importar(
      req(),
      res
    );

    expect(
      res.status
    ).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      erro: "Planilha inválida",
    });
  });

  test("Deve retornar 400 em falha na consulta do projeto", async () => {
    Projeto.findOne.mockRejectedValue(
      new Error("Erro de banco")
    );

    const res = resposta();

    await planilhaControlador.importar(
      req(),
      res
    );

    expect(
      res.status
    ).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      erro: "Erro de banco",
    });

    expect(
      planilhaServico.processarPlanilha
    ).not.toHaveBeenCalled();
  });
});

describe("Validação matemática de CPF", () => {
  test.each([
    "52998224725",
    "529.982.247-25",
    "12345678909",
    "11144477735",
  ])(
    "Deve reconhecer CPF válido %s",
    (cpf) => {
      expect(cpfValido(cpf)).toBe(true);
    }
  );

  test.each([
    "",
    "123",
    "123456789012",
    "00000000000",
    "11111111111",
    "52998224726",
    "52998224715",
    "abcdefg",
    null,
  ])(
    "Deve rejeitar CPF inválido %p",
    (cpf) => {
      expect(cpfValido(cpf)).toBe(false);
    }
  );
});

const express = require("express");
const request = require("supertest");

const uploadPlanilha = require(
  "../src/middlewares/uploadPlanilhaMiddleware"
);

const appUpload = express();

appUpload.post(
  "/upload",
  uploadPlanilha.single("arquivo"),
  (req, res) => {
    res.status(200).json({
      recebido: Boolean(req.file),
      nome: req.file?.originalname || null,
      tamanho: req.file?.size || 0,
      memoria: Boolean(req.file?.buffer),
    });
  }
);

appUpload.use((erro, req, res, next) => {
  res.status(erro.status || 500).json({
    erro: erro.message,
  });
});

describe("Middleware de upload de planilhas", () => {
  test.each([
    "vigas.xlsx",
    "VIGAS.XLSX",
  ])(
    "Deve aceitar %s em memória",
    async (nome) => {
      const res = await request(appUpload)
        .post("/upload")
        .attach(
          "arquivo",
          Buffer.from("teste"),
          nome
        );

      expect(res.status).toBe(200);

      expect(res.body).toEqual({
        recebido: true,
        nome,
        tamanho: 5,
        memoria: true,
      });
    }
  );

  test.each([
    "vigas.xls",
    "vigas.csv",
    "vigas.pdf",
  ])(
    "Deve bloquear arquivo %s",
    async (nome) => {
      const res = await request(appUpload)
        .post("/upload")
        .attach(
          "arquivo",
          Buffer.from("teste"),
          nome
        );

      expect(res.status).toBe(400);

      expect(res.body).toEqual({
        erro: "Apenas arquivos Excel no formato .xlsx são permitidos.",
      });
    }
  );

  test("Deve lidar com requisição sem arquivo", async () => {
    const res = await request(appUpload)
      .post("/upload");

    expect(res.status).toBe(200);

    expect(res.body).toEqual({
      recebido: false,
      nome: null,
      tamanho: 0,
      memoria: false,
    });
  });
});