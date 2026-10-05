"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiAutenticada } from "@/servicos/api";

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
  const [areas, setAreas] = useState<Record<number, string>>({});
  const [salvandoArea, setSalvandoArea] = useState<number | null>(null);
  const [sucessoArea, setSucessoArea] = useState("");
  const [confirmandoFabricacao, setConfirmandoFabricacao] = useState(false);
  const [fabricacaoConfirmada, setFabricacaoConfirmada] = useState(false);
  const [sucessoConfirmacao, setSucessoConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    carregarConfiguracao();
    carregarPrecos();
    carregarElementos();
  }, [id]);

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
        const resposta = await apiAutenticada(
        `/projetos/${id}/elementos`
        );

        if (!resposta.ok) {
        return;
        }

        const dados = await resposta.json();

        const lista: ElementoProjeto[] =
        dados.elementos || [];

        setElementos(lista);

        const areasIniciais:
        Record<number, string> = {};

        lista.forEach((elemento) => {
        if (elemento.area_secao) {
            areasIniciais[elemento.id] =
            String(elemento.area_secao);
        }
        });

        setAreas(areasIniciais);
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

      if (resposta.status === 404) {
        return;
      }

      const dados = await resposta.json();

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
        String(config.fck_mpa ?? "")
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
            ""
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

  async function salvarArea(
    elementoId: number
    ) {
    const valor = Number(
        areas[elementoId]
    );

    if (
        !Number.isFinite(valor) ||
        valor <= 0
    ) {
        setErro(
        "Informe uma área de seção válida."
        );

        return;
    }

    setErro("");
    setSucessoArea("");
    setSalvandoArea(elementoId);

    try {
        const resposta =
        await apiAutenticada(
            `/projetos/${id}/elementos/${elementoId}`,
            {
            method: "PUT",

            body: JSON.stringify({
                areaSecao: valor,
            }),
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
        setErro(
            dados.erro ||
            "Não foi possível salvar a área da seção."
        );

        return;
        }

        setSucessoArea(
        "Área da seção salva com sucesso!"
        );

        await carregarElementos();
    } catch {
        setErro(
        "Não foi possível conectar ao servidor."
        );
    } finally {
        setSalvandoArea(null);
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

  const elementosSemArea =
  elementos.filter((elemento) => {
    const secao =
      elemento.secao?.toUpperCase();

    return (
      secao !== "RETANGULAR" &&
      !elemento.area_secao
    );
  });

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
        <div>
          <h1 style={estilos.logo}>
            ESTRUTEC
          </h1>

          <p style={estilos.subtitulo}>
            Fabricação
          </p>
        </div>

        <button
          style={estilos.botaoVoltar}
          onClick={() =>
            router.push(
              `/projetos/${id}`
            )
          }
        >
          ← Voltar ao projeto
        </button>
      </header>

      <section style={estilos.conteudo}>
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
        {elementosSemArea.length > 0 && (
        <div style={estilos.cardSecundario}>
            <div style={estilos.tituloArea}>
            <h2 style={estilos.titulo}>
                Áreas de Seções Especiais
            </h2>

            <p style={estilos.descricao}>
                Alguns elementos não possuem seção
                retangular. Informe a área real da
                seção para continuar o cálculo.
            </p>
            </div>

            <div style={estilos.listaAreas}>
            {elementosSemArea.map(
                (elemento) => (
                <div
                    key={elemento.id}
                    style={estilos.linhaArea}
                >
                    <div>
                    <strong>
                        {elemento.nome_aplicacao}
                    </strong>

                    <div style={estilos.detalheArea}>
                        Seção: {elemento.secao}
                        {" | "}
                        Comprimento:{" "}
                        {elemento.comprimento} m
                        {" | "}
                        Quantidade:{" "}
                        {elemento.quantidade}
                    </div>
                    </div>

                    <div style={estilos.campoArea}>
                    <input
                        type="number"
                        min="0"
                        step="0.0001"
                        placeholder="Área em m²"
                        value={
                        areas[elemento.id] || ""
                        }
                        onChange={(evento) =>
                        setAreas({
                            ...areas,
                            [elemento.id]:
                            evento.target.value,
                        })
                        }
                        style={estilos.inputArea}
                    />

                    <button
                        type="button"
                        onClick={() =>
                        salvarArea(elemento.id)
                        }
                        disabled={
                        salvandoArea ===
                        elemento.id
                        }
                        style={estilos.botaoSalvarArea}
                    >
                        {salvandoArea === elemento.id
                        ? "Salvando..."
                        : "Salvar"}
                    </button>
                    </div>
                </div>
                )
            )}
            </div>

            {sucessoArea && (
            <div style={estilos.sucesso}>
                {sucessoArea}
            </div>
            )}
        </div>
        )}
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
    background: "#f4f6f8",
    fontFamily: "Arial, sans-serif",
  },

  centralizado: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
  },

  cabecalho: {
    minHeight: "80px",
    background: "#ffffff",
    borderBottom:
      "1px solid #e5e7eb",
    padding: "16px 40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logo: {
    margin: 0,
    fontSize: "24px",
  },

  subtitulo: {
    margin: "4px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  botaoVoltar: {
    background: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    padding: "10px 15px",
    cursor: "pointer",
  },

  conteudo: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "35px 40px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "30px",
  },

  tituloArea: {
    marginBottom: "25px",
  },

  titulo: {
    margin: 0,
    fontSize: "22px",
  },

  descricao: {
    margin: "7px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },

  formulario: {
    display: "flex",
    flexDirection: "column" as const,
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
    flexDirection: "column" as const,
    gap: "7px",
    fontSize: "13px",
    fontWeight: 600,
  },

  input: {
    height: "43px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    padding: "0 11px",
    fontSize: "14px",
  },

  aviso: {
    padding: "12px",
    borderRadius: "6px",
    background: "#fef3c7",
    color: "#92400e",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  erro: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "11px",
    borderRadius: "6px",
    fontSize: "13px",
  },

  sucesso: {
    background: "#dcfce7",
    color: "#166534",
    padding: "11px",
    borderRadius: "6px",
    fontSize: "13px",
  },

  acoes: {
    display: "flex",
    justifyContent: "flex-end",
  },

  botaoSalvar: {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "12px 18px",
    fontWeight: 600,
    cursor: "pointer",
  },
  cardSecundario: {
    marginTop: "20px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "30px",
  },
  cabecalhoCalculo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    },

    botaoCalcular: {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "12px 18px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    },

    erroCalculo: {
    marginTop: "20px",
    padding: "14px",
    background: "#fff7ed",
    color: "#9a3412",
    border: "1px solid #fed7aa",
    borderRadius: "7px",
    fontSize: "13px",
    },

    resumoCalculo: {
    marginTop: "25px",
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    },

    subtituloTabela: {
    margin: "28px 0 12px",
    fontSize: "16px",
    },

    tabelaContainer: {
    width: "100%",
    overflowX: "auto" as const,
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    },

    tabela: {
    width: "100%",
    borderCollapse: "collapse" as const,
    },

    th: {
    background: "#f9fafb",
    textAlign: "left" as const,
    padding: "12px",
    fontSize: "12px",
    color: "#4b5563",
    borderBottom: "1px solid #e5e7eb",
    },

    td: {
    padding: "12px",
    borderBottom: "1px solid #f0f0f0",
    fontSize: "13px",
    },

    totalFabricacao: {
    marginTop: "20px",
    padding: "18px",
    border: "2px solid #111827",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    },
    listaAreas: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    },

    linhaArea: {
    border: "1px solid #e5e7eb",
    borderRadius: "7px",
    padding: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    },

    detalheArea: {
    marginTop: "5px",
    color: "#6b7280",
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
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    padding: "0 10px",
    },

    botaoSalvarArea: {
    height: "40px",
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "0 14px",
    cursor: "pointer",
    fontWeight: 600,
    },
    confirmacaoFabricacao: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "15px",
    },

    botaoConfirmar: {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "12px 18px",
    fontWeight: 600,
    cursor: "pointer",
    },

    sucessoConfirmacao: {
    marginRight: "auto",
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "6px",
    padding: "11px 14px",
    fontSize: "13px",
    fontWeight: 600,
    },

    botaoContinuar: {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "12px 18px",
    fontWeight: 600,
    cursor: "pointer",
    },
};