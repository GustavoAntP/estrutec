import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import FabricacaoPage from "@/app/projetos/[id]/fabricacao/page";

import { useParams, useRouter } from "next/navigation";
import { apiAutenticada } from "@/servicos/api";

// =====================================================
// MOCKS
// =====================================================

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock("@/servicos/api", () => ({
  apiAutenticada: jest.fn(),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    priority,
    ...props
  }: Record<string, unknown>) =>
    require("react").createElement("img", props),
}));

const pushMock = jest.fn();
const apiMock = apiAutenticada as jest.Mock;

// =====================================================
// ENDPOINTS
// =====================================================

const BASE = "/projetos/7";

const CONFIG = `${BASE}/fabricacao/configuracao`;
const PRECOS = `${BASE}/fabricacao/precos`;
const ELEMENTOS = `${BASE}/elementos`;
const CUSTOS = `${BASE}/fabricacao/custos`;
const CONFIRMAR = `${BASE}/fabricacao/confirmar`;

// =====================================================
// RESPOSTAS SIMULADAS
// =====================================================

function criarResposta(dados: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => dados,
  };
}

type RespostaMock = ReturnType<typeof criarResposta>;

const rotas = new Map<
  string,
  () => Promise<RespostaMock>
>();

function registrar(
  endpoint: string,
  dados: unknown,
  status = 200,
  metodo = "GET"
) {
  rotas.set(
    `${metodo} ${endpoint}`,
    jest.fn().mockResolvedValue(
      criarResposta(dados, status)
    )
  );
}

function registrarErro(
  endpoint: string,
  metodo = "GET"
) {
  rotas.set(
    `${metodo} ${endpoint}`,
    jest.fn().mockRejectedValue(
      new Error("Servidor indisponível")
    )
  );
}

function registrarPendente(
  endpoint: string,
  metodo = "GET"
) {
  let resolver!: (resposta: RespostaMock) => void;

  rotas.set(
    `${metodo} ${endpoint}`,
    () =>
      new Promise<RespostaMock>((resolve) => {
        resolver = resolve;
      })
  );

  return (resposta: RespostaMock) => resolver(resposta);
}

// =====================================================
// DADOS SIMULADOS
// =====================================================

const configuracaoBase = {
  fck_mpa: 40,
  taxa_armadura_kg_m3: 120,
  desperdicio_percentual: 5,
  consumo_cimento_kg_m3: 400,
  consumo_areia_m3_m3: 0.55,
  consumo_brita_m3_m3: 0.7,
  consumo_agua_l_m3: 180,
  neoprene_m2_por_viga: 0.3,

  origem: "PROJETO",

  precos_padrao: {
    cimento: 0.8,
    areia: 140,
    brita: 170,
    agua: 0.01,
    aco: 7,
    neoprene: 90,
  },
};

const precosBase = {
  preco_cimento_kg: 0.85,
  preco_areia_m3: 150,
  preco_brita_m3: 180,
  preco_agua_l: 0.01,
  preco_aco_kg: 7.5,
  preco_neoprene_m2: 95,
};

const elementosBase = [
  {
    id: 1,
    nome_aplicacao: "V-01",
    tipo: "VIGA",
    secao: "RETANGULAR",
    largura: 0.25,
    altura: 0.5,
    comprimento: 6,
    quantidade: 2,
  },
  {
    id: 2,
    nome_aplicacao: "V-02",
    tipo: "VIGA",
    secao: "RETANGULAR",
    largura: 0.3,
    altura: 0.6,
    comprimento: 8,
    quantidade: 1,
  },
];

const custosBase = {
  resumo: {
    volumeConcretoM3: 2.94,
    totalPecas: 3,
    totalVigas: 3,
  },

  materiais: {
    cimento: {
      quantidade: 1176,
      unidade: "kg",
      precoUnitario: 0.85,
      custo: 999.6,
    },
    areia: {
      quantidade: 1.617,
      unidade: "m³",
      precoUnitario: 150,
      custo: 242.55,
    },
    brita: {
      quantidade: 2.058,
      unidade: "m³",
      precoUnitario: 180,
      custo: 370.44,
    },
    agua: {
      quantidade: 529.2,
      unidade: "L",
      precoUnitario: 0.01,
      custo: 5.29,
    },
    aco: {
      quantidade: 352.8,
      unidade: "kg",
      precoUnitario: 7.5,
      custo: 2646,
    },
    neoprene: {
      quantidade: 0.9,
      unidade: "m²",
      precoUnitario: 95,
      custo: 85.5,
    },
  },

  custoTotalFabricacao: 4349.38,
};

// =====================================================
// CONFIGURAÇÃO DOS TESTES
// =====================================================

beforeEach(() => {
  jest.resetAllMocks();

  rotas.clear();

  localStorage.clear();

  localStorage.setItem(
    "estrutec_token",
    "token-teste"
  );

  (useRouter as jest.Mock).mockReturnValue({
    push: pushMock,
  });

  (useParams as jest.Mock).mockReturnValue({
    id: "7",
  });

  registrar(CONFIG, {
    configuracao: configuracaoBase,
  });

  registrar(PRECOS, {
    precos: precosBase,
  });

  registrar(ELEMENTOS, {
    elementos: elementosBase,
  });

  apiMock.mockImplementation(
    (
      endpoint: string,
      opcoes?: { method?: string }
    ) => {
      const metodo = opcoes?.method || "GET";

      const chave = `${metodo} ${endpoint}`;

      const executar = rotas.get(chave);

      if (!executar) {
        return Promise.reject(
          new Error(
            `Endpoint não simulado: ${chave}`
          )
        );
      }

      return executar();
    }
  );
});

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

async function renderizarPagina() {
  await act(async () => {
    render(<FabricacaoPage />);
  });
}

async function abrirPagina() {
  await renderizarPagina();

  await screen.findByRole("heading", {
    name: "Custos de fabricação",
  });
}

function obterFormulario(
  nomeBotao: string
): HTMLFormElement {
  const botao = screen.getByRole("button", {
    name: nomeBotao,
  });

  const formulario = botao.closest("form");

  if (!formulario) {
    throw new Error(
      `Formulário não encontrado: ${nomeBotao}`
    );
  }

  return formulario;
}

function obterInputs(
  nomeBotao: string
): HTMLInputElement[] {
  return Array.from(
    obterFormulario(nomeBotao).querySelectorAll(
      "input"
    )
  );
}

function enviarFormulario(nomeBotao: string) {
  fireEvent.submit(obterFormulario(nomeBotao));
}

function obterChamada(
  endpoint: string,
  metodo: string
) {
  const chamada = apiMock.mock.calls.find(
    ([rota, opcoes]) =>
      rota === endpoint &&
      opcoes?.method === metodo
  );

  expect(chamada).toBeDefined();

  return chamada![1];
}

async function calcularFabricacao(
  dados: unknown = custosBase
) {
  registrar(CUSTOS, dados);

  await abrirPagina();

  fireEvent.click(
    screen.getByRole("button", {
      name: "Calcular fabricação",
    })
  );

  await screen.findByText(
    "Materiais calculados"
  );
}

function confirmarFabricacao() {
  fireEvent.click(
    screen.getByRole("button", {
      name: "Confirmar fabricação",
    })
  );
}

// =====================================================
// TESTES
// =====================================================

describe("Fabricação - ESTRUTEC", () => {

  // ===================================================
  // 1. CARREGAMENTO E NAVEGAÇÃO
  // ===================================================

test("deve apresentar carregamento inicial", async () => {
  registrarPendente(CONFIG);

  await renderizarPagina();

  expect(
    screen.getByText(
      "Carregando fabricação..."
    )
  ).toBeInTheDocument();
});

  test("deve carregar a página de fabricação", async () => {
    await abrirPagina();

    expect(
      screen.getByRole("heading", {
        name: "Configuração da Fabricação",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Preços dos Materiais",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Cálculo da Fabricação",
      })
    ).toBeInTheDocument();
  });

  test("deve consultar configuração, preços e elementos", async () => {
    await abrirPagina();

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(CONFIG);
      expect(apiMock).toHaveBeenCalledWith(PRECOS);
      expect(apiMock).toHaveBeenCalledWith(ELEMENTOS);
    });
  });

  test("deve permitir voltar ao projeto", async () => {
    await abrirPagina();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Voltar ao projeto",
      })
    );

    expect(pushMock).toHaveBeenCalledWith(
      "/projetos/7"
    );
  });

  // ===================================================
  // 2. CONFIGURAÇÃO DA FABRICAÇÃO
  // ===================================================

  test("deve carregar parâmetros técnicos cadastrados", async () => {
    await abrirPagina();

    const inputs = obterInputs(
      "Salvar configuração"
    );

    expect(inputs).toHaveLength(8);

    expect(inputs[0]).toHaveValue(40);
    expect(inputs[1]).toHaveValue(120);
    expect(inputs[2]).toHaveValue(5);
    expect(inputs[3]).toHaveValue(400);
    expect(inputs[4]).toHaveValue(0.55);
    expect(inputs[5]).toHaveValue(0.7);
    expect(inputs[6]).toHaveValue(180);
    expect(inputs[7]).toHaveValue(0.3);
  });

  test("deve aceitar configuração retornada diretamente pela API", async () => {
    registrar(CONFIG, configuracaoBase);

    await abrirPagina();

    expect(
      obterInputs("Salvar configuração")[0]
    ).toHaveValue(40);
  });

  test("deve aplicar zero como desperdício padrão", async () => {
    registrar(CONFIG, {
      configuracao: {
        fck_mpa: 35,
      },
    });

    await abrirPagina();

    const inputs = obterInputs(
      "Salvar configuração"
    );

    expect(inputs[0]).toHaveValue(35);
    expect(inputs[2]).toHaveValue(0);
  });

  test("deve salvar configuração técnica com valores numéricos", async () => {
    registrar(
      CONFIG,
      {
        mensagem: "Configuração atualizada!",
      },
      200,
      "PUT"
    );

    await abrirPagina();

    const inputs = obterInputs(
      "Salvar configuração"
    );

    fireEvent.change(inputs[0], {
      target: { value: "45" },
    });

    fireEvent.change(inputs[1], {
      target: { value: "130" },
    });

    enviarFormulario("Salvar configuração");

    await screen.findByText(
      "Configuração atualizada!"
    );

    const opcoes = obterChamada(
      CONFIG,
      "PUT"
    );

    expect(JSON.parse(opcoes.body)).toEqual({
      fckMpa: 45,
      taxaArmaduraKgM3: 130,
      desperdicioPercentual: 5,
      consumoCimentoKgM3: 400,
      consumoAreiaM3M3: 0.55,
      consumoBritaM3M3: 0.7,
      consumoAguaLM3: 180,
      neopreneM2PorViga: 0.3,
    });
  });

  test("deve apresentar mensagem padrão após salvar configuração", async () => {
    registrar(CONFIG, {}, 200, "PUT");

    await abrirPagina();

    enviarFormulario("Salvar configuração");

    expect(
      await screen.findByText(
        "Configuração salva com sucesso!"
      )
    ).toBeInTheDocument();
  });

  test("deve apresentar erro retornado ao salvar configuração", async () => {
    registrar(
      CONFIG,
      {
        erro: "FCK inválido.",
      },
      400,
      "PUT"
    );

    await abrirPagina();

    enviarFormulario("Salvar configuração");

    expect(
      await screen.findByText(
        "FCK inválido."
      )
    ).toBeInTheDocument();
  });

  test("deve apresentar erro de conexão ao salvar configuração", async () => {
    registrarErro(CONFIG, "PUT");

    await abrirPagina();

    enviarFormulario("Salvar configuração");

    expect(
      await screen.findByText(
        "Não foi possível conectar ao servidor."
      )
    ).toBeInTheDocument();
  });

  test("deve impedir acesso quando sessão expirar ao salvar configuração", async () => {
    registrar(CONFIG, {}, 401, "PUT");

    await abrirPagina();

    enviarFormulario("Salvar configuração");

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        "/login"
      );
    });

    expect(
      localStorage.getItem("estrutec_token")
    ).toBeNull();
  });

  // ===================================================
  // 3. ERROS NO CARREGAMENTO
  // ===================================================

  test("deve apresentar erro ao carregar configuração", async () => {
    registrar(
      CONFIG,
      {
        erro: "Configuração indisponível.",
      },
      500
    );

    await abrirPagina();

    expect(
      screen.getByText(
        "Configuração indisponível."
      )
    ).toBeInTheDocument();
  });

  test("deve apresentar erro padrão ao carregar configuração", async () => {
    registrar(CONFIG, {}, 500);

    await abrirPagina();

    expect(
      screen.getByText(
        "Não foi possível carregar a configuração."
      )
    ).toBeInTheDocument();
  });

  test("deve apresentar erro de conexão no carregamento", async () => {
    registrarErro(CONFIG);

    await abrirPagina();

    expect(
      screen.getByText(
        "Não foi possível conectar ao servidor."
      )
    ).toBeInTheDocument();
  });

test("deve redirecionar quando sessão expirar no carregamento", async () => {
  registrar(CONFIG, {}, 401);

  await renderizarPagina();

  await waitFor(() => {
    expect(pushMock).toHaveBeenCalledWith(
      "/login"
    );
  });

  expect(
    localStorage.getItem("estrutec_token")
  ).toBeNull();
});

  test("deve continuar funcionando quando elementos falharem", async () => {
    registrarErro(ELEMENTOS);

    await abrirPagina();

    expect(
      screen.getByRole("button", {
        name: "Salvar configuração",
      })
    ).toBeEnabled();

    expect(
      screen.getByRole("button", {
        name: "Calcular fabricação",
      })
    ).toBeEnabled();
  });

  // ===================================================
  // 4. PREÇOS DOS MATERIAIS
  // ===================================================

  test("deve carregar preços cadastrados no projeto", async () => {
    await abrirPagina();

    await waitFor(() => {
      expect(
        obterInputs("Salvar preços")[0]
      ).toHaveValue(0.85);
    });

    const inputs = obterInputs("Salvar preços");

    expect(inputs).toHaveLength(6);

    expect(inputs[1]).toHaveValue(150);
    expect(inputs[2]).toHaveValue(180);
    expect(inputs[3]).toHaveValue(0.01);
    expect(inputs[4]).toHaveValue(7.5);
    expect(inputs[5]).toHaveValue(95);
  });

  test("deve utilizar preços padrão quando não houver preços próprios", async () => {
    registrar(PRECOS, {}, 404);

    await abrirPagina();

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        PRECOS
      );
    });

    const inputs = obterInputs("Salvar preços");

    expect(inputs[0]).toHaveValue(0.8);
    expect(inputs[1]).toHaveValue(140);
    expect(inputs[4]).toHaveValue(7);
    expect(inputs[5]).toHaveValue(90);
  });

  test("deve salvar preços dos materiais", async () => {
    registrar(
      PRECOS,
      {
        mensagem: "Preços atualizados!",
      },
      200,
      "PUT"
    );

    await abrirPagina();

    await waitFor(() => {
      expect(
        obterInputs("Salvar preços")[4]
      ).toHaveValue(7.5);
    });

    const inputs = obterInputs("Salvar preços");

    fireEvent.change(inputs[4], {
      target: { value: "8.25" },
    });

    enviarFormulario("Salvar preços");

    expect(
      await screen.findByText(
        "Preços atualizados!"
      )
    ).toBeInTheDocument();

    const opcoes = obterChamada(
      PRECOS,
      "PUT"
    );

    expect(JSON.parse(opcoes.body)).toEqual({
      precoCimentoKg: 0.85,
      precoAreiaM3: 150,
      precoBritaM3: 180,
      precoAguaL: 0.01,
      precoAcoKg: 8.25,
      precoNeopreneM2: 95,
    });
  });

  test("deve apresentar mensagem padrão ao salvar preços", async () => {
    registrar(PRECOS, {}, 200, "PUT");

    await abrirPagina();

    enviarFormulario("Salvar preços");

    expect(
      await screen.findByText(
        "Preços salvos com sucesso!"
      )
    ).toBeInTheDocument();
  });

  test("deve apresentar erro ao salvar preços", async () => {
    registrar(
      PRECOS,
      {
        erro: "Preço do aço inválido.",
      },
      400,
      "PUT"
    );

    await abrirPagina();

    enviarFormulario("Salvar preços");

    expect(
      await screen.findByText(
        "Preço do aço inválido."
      )
    ).toBeInTheDocument();
  });

  test("deve apresentar erro de conexão ao salvar preços", async () => {
    registrarErro(PRECOS, "PUT");

    await abrirPagina();

    enviarFormulario("Salvar preços");

    expect(
      await screen.findByText(
        "Não foi possível conectar ao servidor."
      )
    ).toBeInTheDocument();
  });

test("deve redirecionar quando sessão expirar ao carregar preços", async () => {
  registrar(PRECOS, {}, 401);

  await renderizarPagina();

  await waitFor(() => {
    expect(pushMock).toHaveBeenCalledWith(
      "/login"
    );
  });

  expect(
    localStorage.getItem("estrutec_token")
  ).toBeNull();
});

  // ===================================================
  // 5. CÁLCULO DA FABRICAÇÃO
  // ===================================================

  test("não deve apresentar confirmação antes do cálculo", async () => {
    await abrirPagina();

    expect(
      screen.queryByRole("button", {
        name: "Confirmar fabricação",
      })
    ).not.toBeInTheDocument();
  });

  test("deve solicitar cálculo da fabricação", async () => {
    await calcularFabricacao();

    expect(apiMock).toHaveBeenCalledWith(
      CUSTOS
    );
  });

  test("deve apresentar resumo do cálculo", async () => {
    await calcularFabricacao();

    const indicadorVolume = screen
      .getByText("Volume de concreto")
      .parentElement;

    const indicadorPecas = screen
      .getByText("Total de peças")
      .parentElement;

    const indicadorVigas = screen
      .getByText("Total de vigas")
      .parentElement;

    expect(indicadorVolume).toHaveTextContent(
      "2,940"
    );

    expect(indicadorPecas).toHaveTextContent(
      "3"
    );

    expect(indicadorVigas).toHaveTextContent(
      "3"
    );
  });

  test("deve apresentar materiais calculados", async () => {
    await calcularFabricacao();

    const materiais = [
      "Cimento",
      "Areia",
      "Brita",
      "Agua",
      "Aco",
      "Neoprene",
    ];

    materiais.forEach((material) => {
      expect(
        screen.getByRole("row", {
          name: new RegExp(material, "i"),
        })
      ).toBeInTheDocument();
    });

    const linhaCimento = screen.getByRole(
      "row",
      {
        name: /Cimento/,
      }
    );

    expect(
      within(linhaCimento).getByText(
        /1\.176,00/
      )
    ).toBeInTheDocument();
  });

  test("deve apresentar custo total da fabricação", async () => {
    await calcularFabricacao();

    const total = screen
      .getByText("CUSTO TOTAL DA FABRICAÇÃO")
      .parentElement;

    expect(total).toHaveTextContent(
      "4.349,38"
    );
  });

  test("deve apresentar processamento durante cálculo", async () => {
    const resolver = registrarPendente(CUSTOS);

    await abrirPagina();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Calcular fabricação",
      })
    );

    expect(
      screen.getByRole("button", {
        name: "Calculando...",
      })
    ).toBeDisabled();

    await act(async () => {
      resolver(criarResposta(custosBase));
    });

    expect(
      await screen.findByText(
        "Materiais calculados"
      )
    ).toBeInTheDocument();
  });

  test("deve permitir recalcular fabricação", async () => {
    await calcularFabricacao();

    registrar(CUSTOS, {
      ...custosBase,
      custoTotalFabricacao: 5000,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Recalcular",
      })
    );

    await waitFor(() => {
      const total = screen
        .getByText("CUSTO TOTAL DA FABRICAÇÃO")
        .parentElement;

      expect(total).toHaveTextContent(
        "5.000,00"
      );
    });
  });

  test("deve apresentar erro retornado pelo cálculo", async () => {
    registrar(
      CUSTOS,
      {
        erro: "Não existem elementos importados.",
      },
      400
    );

    await abrirPagina();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Calcular fabricação",
      })
    );

    expect(
      await screen.findByText(
        "Não existem elementos importados."
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Confirmar fabricação",
      })
    ).not.toBeInTheDocument();
  });

  test("deve apresentar erro padrão quando cálculo falhar", async () => {
    registrar(CUSTOS, {}, 500);

    await abrirPagina();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Calcular fabricação",
      })
    );

    expect(
      await screen.findByText(
        "Não foi possível calcular a fabricação."
      )
    ).toBeInTheDocument();
  });

  test("deve apresentar erro de conexão no cálculo", async () => {
    registrarErro(CUSTOS);

    await abrirPagina();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Calcular fabricação",
      })
    );

    expect(
      await screen.findByText(
        "Não foi possível conectar ao servidor."
      )
    ).toBeInTheDocument();
  });

  test("deve redirecionar quando sessão expirar durante cálculo", async () => {
    registrar(CUSTOS, {}, 401);

    await abrirPagina();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Calcular fabricação",
      })
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        "/login"
      );
    });

    expect(
      localStorage.getItem("estrutec_token")
    ).toBeNull();
  });

  // ===================================================
  // 6. CONFIRMAÇÃO DA FABRICAÇÃO
  // ===================================================

  test("deve permitir confirmar fabricação após cálculo", async () => {
    await calcularFabricacao();

    expect(
      screen.getByRole("button", {
        name: "Confirmar fabricação",
      })
    ).toBeEnabled();
  });

  test("deve confirmar fabricação com sucesso", async () => {
    await calcularFabricacao();

    registrar(
      CONFIRMAR,
      {
        mensagem:
          "Fabricação confirmada com sucesso!",
      },
      200,
      "POST"
    );

    confirmarFabricacao();

    expect(
      await screen.findByText(
        "Fabricação confirmada com sucesso!"
      )
    ).toBeInTheDocument();

    expect(apiMock).toHaveBeenCalledWith(
      CONFIRMAR,
      {
        method: "POST",
      }
    );

    expect(
      screen.getByRole("button", {
        name: /Continuar para logística/,
      })
    ).toBeEnabled();
  });

  test("deve liberar navegação para logística após confirmação", async () => {
    await calcularFabricacao();

    registrar(CONFIRMAR, {}, 200, "POST");

    confirmarFabricacao();

    const botao = await screen.findByRole(
      "button",
      {
        name: /Continuar para logística/,
      }
    );

    fireEvent.click(botao);

    expect(pushMock).toHaveBeenCalledWith(
      "/projetos/7/logistica"
    );
  });

  test("deve apresentar mensagem padrão de confirmação", async () => {
    await calcularFabricacao();

    registrar(CONFIRMAR, {}, 200, "POST");

    confirmarFabricacao();

    expect(
      await screen.findByText(
        "Fabricação confirmada com sucesso!"
      )
    ).toBeInTheDocument();
  });

  test("deve apresentar confirmação em andamento", async () => {
    await calcularFabricacao();

    const resolver = registrarPendente(
      CONFIRMAR,
      "POST"
    );

    confirmarFabricacao();

    expect(
      screen.getByRole("button", {
        name: "Confirmando...",
      })
    ).toBeDisabled();

    await act(async () => {
      resolver(
        criarResposta({
          mensagem: "Fabricação confirmada!",
        })
      );
    });

    expect(
      await screen.findByText(
        "Fabricação confirmada!"
      )
    ).toBeInTheDocument();
  });

  test("deve apresentar erro retornado na confirmação", async () => {
    await calcularFabricacao();

    registrar(
      CONFIRMAR,
      {
        erro: "Fabricação não pode ser confirmada.",
      },
      400,
      "POST"
    );

    confirmarFabricacao();

    expect(
      await screen.findByText(
        "Fabricação não pode ser confirmada."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Confirmar fabricação",
      })
    ).toBeEnabled();
  });

  test("deve apresentar erro padrão na confirmação", async () => {
    await calcularFabricacao();

    registrar(CONFIRMAR, {}, 500, "POST");

    confirmarFabricacao();

    expect(
      await screen.findByText(
        "Não foi possível confirmar a fabricação."
      )
    ).toBeInTheDocument();
  });

  test("deve apresentar erro de conexão na confirmação", async () => {
    await calcularFabricacao();

    registrarErro(CONFIRMAR, "POST");

    confirmarFabricacao();

    expect(
      await screen.findByText(
        "Não foi possível conectar ao servidor."
      )
    ).toBeInTheDocument();
  });

  test("deve redirecionar quando sessão expirar na confirmação", async () => {
    await calcularFabricacao();

    registrar(CONFIRMAR, {}, 401, "POST");

    confirmarFabricacao();

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        "/login"
      );
    });

    expect(
      localStorage.getItem("estrutec_token")
    ).toBeNull();
  });
});