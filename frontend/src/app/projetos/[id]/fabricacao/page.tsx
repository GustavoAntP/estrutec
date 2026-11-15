"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiAutenticada } from "@/servicos/api";
import { tema } from "@/estilos/tema";


type MaterialCalculado = {
  quantidade: number;
  unidade: string;
  precoUnitario?: number;
  custo: number;
};

type CustosFabricacao = {
  resumo: {
    volumeConcretoM3: number;
    totalPecas: number;
    totalVigas: number;
  };

  materiais: {
    cimento: MaterialCalculado;
    areia: MaterialCalculado;
    brita: MaterialCalculado;
    agua: MaterialCalculado;
    aco: MaterialCalculado;
    neoprene: MaterialCalculado;
  };

  custoTotalFabricacao: number;
};

type ElementoProjeto = {
  id: number;
  nome_aplicacao: string;
  tipo: string;
  secao: string;
  largura: string | number;
  altura: string | number;
  comprimento: string | number;
  quantidade: number;
  area_secao?: string | number | null;
};

type ConfiguracaoFabricacao = {
  fck_mpa?: number | string;
  taxa_armadura_kg_m3?: number | string;
  desperdicio_percentual?: number | string;
  consumo_cimento_kg_m3?: number | string;
  consumo_areia_m3_m3?: number | string;
  consumo_brita_m3_m3?: number | string;
  consumo_agua_l_m3?: number | string;
  neoprene_m2_por_viga?: number | string;

  origem?: "PROJETO" | "PADRAO";

  precos_padrao?: {
    cimento?: number | string;
    areia?: number | string;
    brita?: number | string;
    agua?: number | string;
    aco?: number | string;
    neoprene?: number | string;
  } | null;
};

export default function FabricacaoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [fck, setFck] = useState("");
  const [taxaArmadura, setTaxaArmadura] = useState("");
  const [desperdicio, setDesperdicio] = useState("");
  const [cimento, setCimento] = useState("");
  const [areia, setAreia] = useState("");
  const [brita, setBrita] = useState("");
  const [agua, setAgua] = useState("");
  const [neoprene, setNeoprene] = useState("");
  const [precoCimento, setPrecoCimento] = useState("");
  const [precoAreia, setPrecoAreia] = useState("");
  const [precoBrita, setPrecoBrita] = useState("");
  const [precoAgua, setPrecoAgua] = useState("");
  const [precoAco, setPrecoAco] = useState("");
  const [precoNeoprene, setPrecoNeoprene] = useState("");
  const [salvandoPrecos, setSalvandoPrecos] = useState(false);
  const [sucessoPrecos, setSucessoPrecos] = useState("");
  const [custos, setCustos] = useState<CustosFabricacao | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [erroCalculo, setErroCalculo] = useState("");  
  const [elementos, setElementos] = useState<ElementoProjeto[]>([]);
  const [confirmandoFabricacao, setConfirmandoFabricacao] = useState(false);
  const [fabricacaoConfirmada, setFabricacaoConfirmada] = useState(false);
  const [sucessoConfirmacao, setSucessoConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    carregarDadosFabricacao();
    carregarElementos();
  }, [id]);

  async function carregarDadosFabricacao() {
    await carregarConfiguracao();
    await carregarPrecos();
  }

  async function carregarPrecos() {
    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/fabricacao/precos`
        );

        if (resposta.status === 401) {
        localStorage.removeItem(
            "estrutec_token"
        );

        router.push("/login");
        return;
        }

        if (resposta.status === 404) {
        return;
        }

        const dados = await resposta.json();

        if (!resposta.ok) {
        return;
        }

        const precos =
        dados.precos || dados;

        setPrecoCimento(
        String(
            precos.preco_cimento_kg ?? ""
        )
        );

        setPrecoAreia(
        String(
            precos.preco_areia_m3 ?? ""
        )
        );

        setPrecoBrita(
        String(
            precos.preco_brita_m3 ?? ""
        )
        );

        setPrecoAgua(
        String(
            precos.preco_agua_l ?? ""
        )
        );

        setPrecoAco(
        String(
            precos.preco_aco_kg ?? ""
        )
        );

        setPrecoNeoprene(
        String(
            precos.preco_neoprene_m2 ?? ""
        )
        );
    } catch {
        // A configuração principal continua funcionando
        // mesmo se ainda não houver preços.
    }
    }

  async function carregarCustos() {
    setCalculando(true);
    setErroCalculo("");

    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/fabricacao/custos`
        );

        if (resposta.status === 401) {
        localStorage.removeItem(
            "estrutec_token"
        );

        router.push("/login");
        return;
        }

        const dados = await resposta.json();

        if (!resposta.ok) {
        setCustos(null);

        setErroCalculo(
            dados.erro ||
            "Não foi possível calcular a fabricação."
        );

        return;
        }

        setCustos(dados);
    } catch {
        setErroCalculo(
        "Não foi possível conectar ao servidor."
        );
    } finally {
        setCalculando(false);
    }
    }

  function formatarNumero(
    valor: number,
    casas = 2
    ) {
    return Number(valor || 0).toLocaleString(
        "pt-BR",
        {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas,
        }
    );
    }

    function formatarMoeda(valor: number) {
    return Number(valor || 0).toLocaleString(
        "pt-BR",
        {
        style: "currency",
        currency: "BRL",
        }
    );
    }

  async function salvarPrecos(
    evento: FormEvent<HTMLFormElement>
    ) {
    evento.preventDefault();

    setErro("");
    setSucessoPrecos("");
    setSalvandoPrecos(true);

    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/fabricacao/precos`,
        {
            method: "PUT",

            body: JSON.stringify({
            precoCimentoKg:
                Number(precoCimento),

            precoAreiaM3:
                Number(precoAreia),

            precoBritaM3:
                Number(precoBrita),

            precoAguaL:
                Number(precoAgua),

            precoAcoKg:
                Number(precoAco),

            precoNeopreneM2:
                Number(precoNeoprene),
            }),
        }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
        setErro(
            dados.erro ||
            "Não foi possível salvar os preços."
        );

        return;
        }

        setSucessoPrecos(
        dados.mensagem ||
            "Preços salvos com sucesso!"
        );
    } catch {
        setErro(
        "Não foi possível conectar ao servidor."
        );
    } finally {
        setSalvandoPrecos(false);
    }
    }

async function carregarElementos() {
  try {
    const resposta =
      await apiAutenticada(
        `/projetos/${id}/elementos`
      );

    if (!resposta.ok) {
      return;
    }

    const dados =
      await resposta.json();

    const lista: ElementoProjeto[] =
      dados.elementos || [];

    setElementos(lista);
  } catch {
    // O restante da página continua funcionando.
  }
}

    async function carregarConfiguracao() {
    try {
      setCarregando(true);
      setErro("");

      const resposta =
        await apiAutenticada(
          `/projetos/${id}/fabricacao/configuracao`
        );

      if (resposta.status === 401) {
        localStorage.removeItem(
          "estrutec_token"
        );

        router.push("/login");
        return;
      }

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        setErro(
          dados.erro ||
            "Não foi possível carregar a configuração."
        );

        return;
      }

      const config: ConfiguracaoFabricacao =
        dados.configuracao || dados;

      setFck(
        String(
          config.fck_mpa ?? ""
        )
      );

      setTaxaArmadura(
        String(
          config.taxa_armadura_kg_m3 ??
            ""
        )
      );

      setDesperdicio(
        String(
          config.desperdicio_percentual ??
            0
        )
      );

      setCimento(
        String(
          config.consumo_cimento_kg_m3 ??
            ""
        )
      );

      setAreia(
        String(
          config.consumo_areia_m3_m3 ??
            ""
        )
      );

      setBrita(
        String(
          config.consumo_brita_m3_m3 ??
            ""
        )
      );

      setAgua(
        String(
          config.consumo_agua_l_m3 ??
            ""
        )
      );

      setNeoprene(
        String(
          config.neoprene_m2_por_viga ??
            ""
        )
      );

      /*
        Se vierem preços padrão,
        eles entram inicialmente na tela.

        Depois carregarPrecos() roda.
        Se o projeto possuir preços próprios,
        eles substituem estes valores.
      */
      if (config.precos_padrao) {
        setPrecoCimento(
          String(
            config.precos_padrao.cimento ??
              ""
          )
        );

        setPrecoAreia(
          String(
            config.precos_padrao.areia ??
              ""
          )
        );

        setPrecoBrita(
          String(
            config.precos_padrao.brita ??
              ""
          )
        );

        setPrecoAgua(
          String(
            config.precos_padrao.agua ??
              ""
          )
        );

        setPrecoAco(
          String(
            config.precos_padrao.aco ??
              ""
          )
        );

        setPrecoNeoprene(
          String(
            config.precos_padrao.neoprene ??
              ""
          )
        );
      }
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function salvarConfiguracao(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    setErro("");
    setSucesso("");
    setSalvando(true);

    try {
      const resposta =
        await apiAutenticada(
          `/projetos/${id}/fabricacao/configuracao`,
          {
            method: "PUT",

            body: JSON.stringify({
              fckMpa: Number(fck),

              taxaArmaduraKgM3:
                Number(taxaArmadura),

              desperdicioPercentual:
                Number(desperdicio),

              consumoCimentoKgM3:
                Number(cimento),

              consumoAreiaM3M3:
                Number(areia),

              consumoBritaM3M3:
                Number(brita),

              consumoAguaLM3:
                Number(agua),

              neopreneM2PorViga:
                Number(neoprene || 0),
            }),
          }
        );

      if (resposta.status === 401) {
        localStorage.removeItem(
          "estrutec_token"
        );

        router.push("/login");
        return;
      }

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(
          dados.erro ||
            "Não foi possível salvar a configuração."
        );

        return;
      }

      setSucesso(
        dados.mensagem ||
          "Configuração salva com sucesso!"
      );
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setSalvando(false);
    }
  }
 
  async function confirmarFabricacao() {
    if (!custos) {
        setErroCalculo(
        "Calcule a fabricação antes de confirmar."
        );

        return;
    }

    setErroCalculo("");
    setSucessoConfirmacao("");
    setConfirmandoFabricacao(true);

    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/fabricacao/confirmar`,
        {
            method: "POST",
        }
        );

        if (resposta.status === 401) {
        localStorage.removeItem(
            "estrutec_token"
        );

        router.push("/login");
        return;
        }

        const dados = await resposta.json();

        if (!resposta.ok) {
        setErroCalculo(
            dados.erro ||
            "Não foi possível confirmar a fabricação."
        );

        return;
        }

        setFabricacaoConfirmada(true);

        setSucessoConfirmacao(
        dados.mensagem ||
            "Fabricação confirmada com sucesso!"
        );
    } catch {
        setErroCalculo(
        "Não foi possível conectar ao servidor."
        );
    } finally {
        setConfirmandoFabricacao(false);
    }
    }


  if (carregando) {
    return (
      <main style={estilos.centralizado}>
        Carregando fabricação...
      </main>
    );
  }

  return (
    <main style={estilos.pagina}>
    <header style={estilos.cabecalho}>
      <div style={estilos.cabecalhoConteudo}>
        <div style={estilos.identidade}>
          <Image
            src="/estrutec-logo.png"
            alt="Estrutec"
            width={150}
            height={70}
            priority
            style={estilos.logo}
          />

          <div style={estilos.divisor} />

          <div>
            <span
              style={estilos.rotuloCabecalho}
            >
              Projetos
            </span>

            <strong
              style={estilos.tituloCabecalho}
            >
              Fabricação
            </strong>
          </div>
        </div>

        <button
          type="button"
          style={estilos.botaoVoltar}
          onClick={() =>
            router.push(
              `/projetos/${id}`
            )
          }
        >
          Voltar ao projeto
        </button>
      </div>
    </header>

      <section style={estilos.conteudo}>
      <div style={estilos.topoPagina}>
        <span style={estilos.sobretitulo}>
          FABRICAÇÃO
        </span>

        <h1 style={estilos.tituloPagina}>
          Custos de fabricação
        </h1>

        <p style={estilos.descricaoPagina}>
          Configure os parâmetros técnicos,
          informe os preços dos materiais e
          calcule os custos de fabricação do
          projeto.
        </p>
      </div>
        <div style={estilos.card}>
          <div style={estilos.tituloArea}>
            <h2 style={estilos.titulo}>
              Configuração da Fabricação
            </h2>

            <p style={estilos.descricao}>
              Informe os parâmetros utilizados
              no cálculo dos materiais.
            </p>
          </div>

          <form
            onSubmit={salvarConfiguracao}
            style={estilos.formulario}
          >
            <div style={estilos.grid}>
              <CampoNumero
                titulo="FCK (MPa)"
                valor={fck}
                alterar={setFck}
                exemplo="40"
              />

              <CampoNumero
                titulo="Taxa de armadura (kg/m³)"
                valor={taxaArmadura}
                alterar={setTaxaArmadura}
                exemplo="120"
              />

              <CampoNumero
                titulo="Desperdício (%)"
                valor={desperdicio}
                alterar={setDesperdicio}
                exemplo="5"
              />

              <CampoNumero
                titulo="Cimento (kg/m³)"
                valor={cimento}
                alterar={setCimento}
                exemplo="400"
              />

              <CampoNumero
                titulo="Areia (m³/m³)"
                valor={areia}
                alterar={setAreia}
                exemplo="0.55"
                step="0.001"
              />

              <CampoNumero
                titulo="Brita (m³/m³)"
                valor={brita}
                alterar={setBrita}
                exemplo="0.70"
                step="0.001"
              />

              <CampoNumero
                titulo="Água (L/m³)"
                valor={agua}
                alterar={setAgua}
                exemplo="180"
              />

              <CampoNumero
                titulo="Neoprene por viga (m²)"
                valor={neoprene}
                alterar={setNeoprene}
                exemplo="0.30"
                step="0.01"
              />
            </div>

            {erro && (
              <div style={estilos.erro}>
                {erro}
              </div>
            )}

            {sucesso && (
              <div style={estilos.sucesso}>
                {sucesso}
              </div>
            )}

            <div style={estilos.acoes}>
              <button
                type="submit"
                disabled={salvando}
                style={estilos.botaoSalvar}
              >
                {salvando
                  ? "Salvando..."
                  : "Salvar configuração"}
              </button>
            </div>
          </form>
        </div>
        <div style={estilos.cardSecundario}>
        <div style={estilos.tituloArea}>
            <h2 style={estilos.titulo}>
            Preços dos Materiais
            </h2>

            <p style={estilos.descricao}>
            Informe os preços unitários usados no
            cálculo da fabricação.
            </p>
        </div>

        <form
            onSubmit={salvarPrecos}
            style={estilos.formulario}
        >
            <div style={estilos.grid}>
            <CampoNumero
                titulo="Cimento (R$/kg)"
                valor={precoCimento}
                alterar={setPrecoCimento}
                exemplo="0.85"
            />

            <CampoNumero
                titulo="Areia (R$/m³)"
                valor={precoAreia}
                alterar={setPrecoAreia}
                exemplo="150"
            />

            <CampoNumero
                titulo="Brita (R$/m³)"
                valor={precoBrita}
                alterar={setPrecoBrita}
                exemplo="180"
            />

            <CampoNumero
                titulo="Água (R$/L)"
                valor={precoAgua}
                alterar={setPrecoAgua}
                exemplo="0.01"
                step="0.001"
            />

            <CampoNumero
                titulo="Aço (R$/kg)"
                valor={precoAco}
                alterar={setPrecoAco}
                exemplo="7.50"
            />

            <CampoNumero
                titulo="Neoprene (R$/m²)"
                valor={precoNeoprene}
                alterar={setPrecoNeoprene}
                exemplo="95"
            />
            </div>

            {sucessoPrecos && (
            <div style={estilos.sucesso}>
                {sucessoPrecos}
            </div>
            )}

            <div style={estilos.acoes}>
            <button
                type="submit"
                disabled={salvandoPrecos}
                style={estilos.botaoSalvar}
            >
                {salvandoPrecos
                ? "Salvando..."
                : "Salvar preços"}
            </button>
            </div>
        </form>
        </div>
        
        <div style={estilos.cardSecundario}>
            <div style={estilos.cabecalhoCalculo}>
                <div>
                <h2 style={estilos.titulo}>
                    Cálculo da Fabricação
                </h2>

                <p style={estilos.descricao}>
                    Calcule os quantitativos e custos
                    usando os elementos, parâmetros e
                    preços cadastrados.
                </p>
                </div>

                <button
                type="button"
                onClick={carregarCustos}
                disabled={calculando}
                style={estilos.botaoCalcular}
                >
                {calculando
                    ? "Calculando..."
                    : custos
                    ? "Recalcular"
                    : "Calcular fabricação"}
                </button>
            </div>

            {erroCalculo && (
                <div style={estilos.erroCalculo}>
                <strong>
                    Não foi possível realizar o cálculo.
                </strong>

                <p style={{ marginBottom: 0 }}>
                    {erroCalculo}
                </p>
                </div>
            )}

            {custos && (
                <>
                <div style={estilos.resumoCalculo}>
                    <div style={estilos.indicador}>
                    <span>Volume de concreto</span>

                    <strong>
                        {formatarNumero(
                        custos.resumo.volumeConcretoM3,
                        3
                        )}{" "}
                        m³
                    </strong>
                    </div>

                    <div style={estilos.indicador}>
                    <span>Total de peças</span>

                    <strong>
                        {custos.resumo.totalPecas}
                    </strong>
                    </div>

                    <div style={estilos.indicador}>
                    <span>Total de vigas</span>

                    <strong>
                        {custos.resumo.totalVigas}
                    </strong>
                    </div>
                </div>

                <h3 style={estilos.subtituloTabela}>
                    Materiais calculados
                </h3>

                <div style={estilos.tabelaContainer}>
                    <table style={estilos.tabela}>
                    <thead>
                        <tr>
                        <th style={estilos.th}>
                            Material
                        </th>

                        <th style={estilos.th}>
                            Quantidade
                        </th>

                        <th style={estilos.th}>
                            Preço unitário
                        </th>

                        <th style={estilos.th}>
                            Custo
                        </th>
                        </tr>
                    </thead>

                    <tbody>
                        {Object.entries(
                        custos.materiais
                        ).map(([nome, material]) => (
                        <tr key={nome}>
                            <td style={estilos.td}>
                            {nome.charAt(0).toUpperCase() +
                                nome.slice(1)}
                            </td>

                            <td style={estilos.td}>
                            {formatarNumero(
                                material.quantidade
                            )}{" "}
                            {material.unidade || ""}
                            </td>

                            <td style={estilos.td}>
                            {material.precoUnitario !==
                            undefined
                                ? formatarMoeda(
                                    material.precoUnitario
                                )
                                : "-"}
                            </td>

                            <td style={estilos.td}>
                            {formatarMoeda(
                                material.custo
                            )}
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>

                <div style={estilos.totalFabricacao}>
                    <span>
                    CUSTO TOTAL DA FABRICAÇÃO
                    </span>

                    <strong>
                    {formatarMoeda(
                        custos.custoTotalFabricacao
                    )}
                    </strong>
                </div>
                <div style={estilos.confirmacaoFabricacao}>
                {fabricacaoConfirmada ? (
                    <>
                    <div style={estilos.sucessoConfirmacao}>
                        {sucessoConfirmacao}
                    </div>

                    <button
                        type="button"
                        style={estilos.botaoContinuar}
                        onClick={() =>
                        router.push(
                            `/projetos/${id}/logistica`
                        )
                        }
                    >
                        Continuar para logística →
                    </button>
                    </>
                ) : (
                    <button
                    type="button"
                    onClick={confirmarFabricacao}
                    disabled={confirmandoFabricacao}
                    style={estilos.botaoConfirmar}
                    >
                    {confirmandoFabricacao
                        ? "Confirmando..."
                        : "Confirmar fabricação"}
                    </button>
                )}
                </div>
                </>
            )}
            </div>
      </section>
    </main>
  );
}

type CampoNumeroProps = {
  titulo: string;
  valor: string;
  alterar: (valor: string) => void;
  exemplo?: string;
  step?: string;
};

function CampoNumero({
  titulo,
  valor,
  alterar,
  exemplo,
  step = "0.01",
}: CampoNumeroProps) {
  return (
    <div style={estilos.campo}>
      <label>
        {titulo}
      </label>

      <input
        type="number"
        min="0"
        step={step}
        value={valor}
        onChange={(evento) =>
          alterar(evento.target.value)
        }
        placeholder={exemplo}
        required
        style={estilos.input}
      />
    </div>
  );
}

const estilos = {
  pagina: {
    minHeight: "100vh",

    background:
      tema.cores.fundo,

    color:
      tema.cores.grafite,

    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  centralizado: {
    minHeight: "100vh",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    background:
      tema.cores.fundo,

    color:
      tema.cores.textoSecundario,

    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  cabecalho: {
    background:
      tema.cores.branco,

    borderBottom:
      `1px solid ${tema.cores.borda}`,
  },

  cabecalhoConteudo: {
    maxWidth: "1600px",

    margin: "0 auto",

    padding: "14px 24px",

    display: "flex",

    alignItems: "center",

    justifyContent:
      "space-between",

    gap: "20px",
  },

  identidade: {
    display: "flex",

    alignItems: "center",

    gap: "18px",
  },

  logo: {
    width: "125px",

    height: "auto",

    objectFit:
      "contain" as const,
  },

  divisor: {
    width: "1px",

    height: "38px",

    background:
      tema.cores.borda,
  },

  rotuloCabecalho: {
    display: "block",

    marginBottom: "3px",

    color:
      tema.cores.textoSecundario,

    fontSize: "11px",

    fontWeight: 700,

    letterSpacing: "1px",

    textTransform:
      "uppercase" as const,
  },

  tituloCabecalho: {
    display: "block",

    color:
      tema.cores.grafite,

    fontSize: "15px",
  },

  botaoVoltar: {
    height: "40px",

    padding: "0 16px",

    background:
      tema.cores.branco,

    color:
      tema.cores.grafite,

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.pequena,

    fontSize: "13px",

    fontWeight: 600,

    cursor: "pointer",
  },

  conteudo: {
    width: "100%",

    maxWidth: "1250px",

    margin: "0 auto",

    padding:
      "42px 24px 60px",
  },

  topoPagina: {
    marginBottom: "28px",
  },

  sobretitulo: {
    display: "block",

    marginBottom: "8px",

    color:
      tema.cores.laranja,

    fontSize: "11px",

    fontWeight: 800,

    letterSpacing: "1.4px",
  },

  tituloPagina: {
    margin: 0,

    color:
      tema.cores.grafite,

    fontSize: "30px",

    fontWeight: 750,
  },

  descricaoPagina: {
    maxWidth: "760px",

    margin: "8px 0 0",

    color:
      tema.cores.textoSecundario,

    fontSize: "14px",

    lineHeight: 1.55,
  },

  card: {
    overflow: "hidden",

    background:
      tema.cores.branco,

    border:
      `1px solid ${tema.cores.borda}`,

    borderTop:
      `3px solid ${tema.cores.laranja}`,

    borderRadius:
      tema.bordas.grande,

    padding: "26px",

    boxShadow:
      tema.sombras.card,
  },

  cardSecundario: {
    marginTop: "24px",

    overflow: "hidden",

    background:
      tema.cores.branco,

    border:
      `1px solid ${tema.cores.borda}`,

    borderTop:
      `3px solid ${tema.cores.laranja}`,

    borderRadius:
      tema.bordas.grande,

    padding: "26px",

    boxShadow:
      tema.sombras.card,
  },

  tituloArea: {
    marginBottom: "25px",
  },

  titulo: {
    margin: 0,

    color:
      tema.cores.grafite,

    fontSize: "19px",

    fontWeight: 700,
  },

  descricao: {
    margin: "7px 0 0",

    color:
      tema.cores.textoSecundario,

    fontSize: "13px",

    lineHeight: 1.5,
  },

  formulario: {
    display: "flex",

    flexDirection:
      "column" as const,

    gap: "22px",
  },

  grid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",

    gap: "18px",
  },

  campo: {
    display: "flex",

    flexDirection:
      "column" as const,

    gap: "7px",

    color:
      tema.cores.grafite,

    fontSize: "12px",

    fontWeight: 700,
  },

  input: {
    width: "100%",

    height: "44px",

    boxSizing:
      "border-box" as const,

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.pequena,

    padding: "0 12px",

    background:
      tema.cores.branco,

    color:
      tema.cores.grafite,

    fontSize: "13px",

    outline: "none",
  },

  aviso: {
    padding: "12px 14px",

    background: "#FFF7ED",

    color: "#9A3412",

    border:
      "1px solid #FED7AA",

    borderRadius:
      tema.bordas.pequena,

    fontSize: "12px",

    lineHeight: 1.5,
  },

  erro: {
    padding: "12px 14px",

    background:
      tema.cores.erroFundo,

    color:
      tema.cores.erro,

    border:
      "1px solid #FECACA",

    borderRadius:
      tema.bordas.pequena,

    fontSize: "12px",
  },

  sucesso: {
    padding: "12px 14px",

    background: "#F0FDF4",

    color: "#15803D",

    border:
      "1px solid #BBF7D0",

    borderRadius:
      tema.bordas.pequena,

    fontSize: "12px",
  },

  acoes: {
    display: "flex",

    justifyContent:
      "flex-end",

    paddingTop: "20px",

    borderTop:
      `1px solid ${tema.cores.borda}`,
  },

  botaoSalvar: {
    height: "44px",

    padding: "0 20px",

    minWidth: "150px",

    background:
      tema.cores.laranja,

    color:
      tema.cores.branco,

    border: "none",

    borderRadius:
      tema.bordas.pequena,

    fontSize: "13px",

    fontWeight: 700,

    cursor: "pointer",
  },

  cabecalhoCalculo: {
    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "center",

    gap: "20px",
  },

  botaoCalcular: {
    height: "44px",

    padding: "0 20px",

    minWidth: "170px",

    background:
      tema.cores.laranja,

    color:
      tema.cores.branco,

    border: "none",

    borderRadius:
      tema.bordas.pequena,

    fontSize: "13px",

    fontWeight: 700,

    cursor: "pointer",

    whiteSpace:
      "nowrap" as const,
  },

  erroCalculo: {
    marginTop: "20px",

    padding: "14px",

    background: "#FFF7ED",

    color: "#9A3412",

    border:
      "1px solid #FED7AA",

    borderRadius:
      tema.bordas.pequena,

    fontSize: "12px",
  },

  resumoCalculo: {
    marginTop: "25px",

    display: "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",

    gap: "12px",
  },

  indicador: {
    minHeight: "82px",

    padding: "15px",

    display: "flex",

    flexDirection:
      "column" as const,

    justifyContent:
      "space-between",

    gap: "6px",

    background: "#FAFAF9",

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.pequena,
  },

  subtituloTabela: {
    margin: "28px 0 12px",

    color:
      tema.cores.grafite,

    fontSize: "16px",
  },

  tabelaContainer: {
    width: "100%",

    overflowX:
      "auto" as const,

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.pequena,
  },

  tabela: {
    width: "100%",

    borderCollapse:
      "collapse" as const,
  },

  th: {
    padding: "12px 14px",

    background: "#FAFAF9",

    color:
      tema.cores.textoSecundario,

    textAlign:
      "left" as const,

    fontSize: "11px",

    fontWeight: 700,

    textTransform:
      "uppercase" as const,

    letterSpacing: "0.35px",

    borderBottom:
      `1px solid ${tema.cores.borda}`,
  },

  td: {
    padding: "12px 14px",

    color:
      tema.cores.grafite,

    borderBottom:
      `1px solid ${tema.cores.borda}`,

    fontSize: "12px",
  },

  totalFabricacao: {
    marginTop: "22px",

    padding: "18px",

    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "center",

    gap: "20px",

    background: "#FFF7ED",

    border:
      `2px solid ${tema.cores.laranja}`,

    borderRadius:
      tema.bordas.pequena,

    color:
      tema.cores.grafite,

    fontSize: "14px",
  },

  listaAreas: {
    display: "flex",

    flexDirection:
      "column" as const,

    gap: "12px",
  },

  linhaArea: {
    padding: "15px",

    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "center",

    gap: "20px",

    background: "#FAFAF9",

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.pequena,
  },

  detalheArea: {
    marginTop: "5px",

    color:
      tema.cores.textoSecundario,

    fontSize: "12px",
  },

  campoArea: {
    display: "flex",

    gap: "8px",

    alignItems: "center",
  },

  inputArea: {
    width: "130px",

    height: "40px",

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.pequena,

    padding: "0 10px",

    outline: "none",
  },

  botaoSalvarArea: {
    height: "40px",

    padding: "0 14px",

    background:
      tema.cores.laranja,

    color:
      tema.cores.branco,

    border: "none",

    borderRadius:
      tema.bordas.pequena,

    cursor: "pointer",

    fontWeight: 700,
  },

  confirmacaoFabricacao: {
    marginTop: "24px",

    paddingTop: "22px",

    display: "flex",

    alignItems: "center",

    justifyContent:
      "flex-end",

    gap: "15px",

    borderTop:
      `1px solid ${tema.cores.borda}`,
  },

  botaoConfirmar: {
    height: "44px",

    padding: "0 20px",

    minWidth: "180px",

    background:
      tema.cores.laranja,

    color:
      tema.cores.branco,

    border: "none",

    borderRadius:
      tema.bordas.pequena,

    fontSize: "13px",

    fontWeight: 700,

    cursor: "pointer",
  },

  sucessoConfirmacao: {
    marginRight: "auto",

    padding: "11px 14px",

    background: "#F0FDF4",

    color: "#15803D",

    border:
      "1px solid #BBF7D0",

    borderRadius:
      tema.bordas.pequena,

    fontSize: "12px",

    fontWeight: 600,
  },

  botaoContinuar: {
    height: "44px",

    padding: "0 20px",

    minWidth: "205px",

    background:
      tema.cores.laranja,

    color:
      tema.cores.branco,

    border: "none",

    borderRadius:
      tema.bordas.pequena,

    fontSize: "13px",

    fontWeight: 700,

    cursor: "pointer",
  },
};