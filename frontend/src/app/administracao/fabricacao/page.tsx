"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { apiAutenticada } from "@/servicos/api";
import { tema } from "@/estilos/tema";

export default function ConfiguracaoFabricacaoPage() {
  const router = useRouter();

  const [
    verificandoAcesso,
    setVerificandoAcesso,
  ] = useState(true);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  const [fckMpa, setFckMpa] =
    useState("");

  const [
    taxaArmaduraKgM3,
    setTaxaArmaduraKgM3,
  ] = useState("");

  const [
    consumoCimentoKgM3,
    setConsumoCimentoKgM3,
  ] = useState("");

  const [
    consumoAreiaM3M3,
    setConsumoAreiaM3M3,
  ] = useState("");

  const [
    consumoBritaM3M3,
    setConsumoBritaM3M3,
  ] = useState("");

  const [
    consumoAguaLM3,
    setConsumoAguaLM3,
  ] = useState("");

  const [
    neopreneM2PorViga,
    setNeopreneM2PorViga,
  ] = useState("");

  const [
    precoCimentoRsKg,
    setPrecoCimentoRsKg,
  ] = useState("");

  const [
    precoAreiaRsM3,
    setPrecoAreiaRsM3,
  ] = useState("");

  const [
    precoBritaRsM3,
    setPrecoBritaRsM3,
  ] = useState("");

  const [
    precoAguaRsL,
    setPrecoAguaRsL,
  ] = useState("");

  const [
    precoAcoRsKg,
    setPrecoAcoRsKg,
  ] = useState("");

  const [
    precoNeopreneRsM2,
    setPrecoNeopreneRsM2,
  ] = useState("");

  useEffect(() => {
    const token =
      localStorage.getItem(
        "estrutec_token"
      );

    const usuarioSalvo =
      localStorage.getItem(
        "estrutec_usuario"
      );

    if (!token || !usuarioSalvo) {
      router.replace("/");
      return;
    }

    try {
      const usuario =
        JSON.parse(usuarioSalvo);

      if (
        usuario.perfil !==
        "ADMINISTRADOR"
      ) {
        router.replace("/painel");
        return;
      }

      setVerificandoAcesso(false);

      carregarConfiguracao();
    } catch {
      localStorage.removeItem(
        "estrutec_token"
      );

      localStorage.removeItem(
        "estrutec_usuario"
      );

      router.replace("/");
    }
  }, []);

  async function carregarConfiguracao() {
    try {
      setCarregando(true);
      setErro("");

      const resposta =
        await apiAutenticada(
          "/configuracoes/fabricacao-padrao"
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
            "Não foi possível carregar as configurações."
        );
      }

      const configuracao =
        dados.configuracao;

      setFckMpa(
        String(
          configuracao.fck_mpa ?? ""
        )
      );

      setTaxaArmaduraKgM3(
        String(
          configuracao.taxa_armadura_kg_m3 ??
            ""
        )
      );

      setConsumoCimentoKgM3(
        String(
          configuracao.consumo_cimento_kg_m3 ??
            ""
        )
      );

      setConsumoAreiaM3M3(
        String(
          configuracao.consumo_areia_m3_m3 ??
            ""
        )
      );

      setConsumoBritaM3M3(
        String(
          configuracao.consumo_brita_m3_m3 ??
            ""
        )
      );

      setConsumoAguaLM3(
        String(
          configuracao.consumo_agua_l_m3 ??
            ""
        )
      );

      setNeopreneM2PorViga(
        String(
          configuracao.neoprene_m2_por_viga ??
            ""
        )
      );

      setPrecoCimentoRsKg(
        String(
          configuracao.preco_cimento_rs_kg ??
            ""
        )
      );

      setPrecoAreiaRsM3(
        String(
          configuracao.preco_areia_rs_m3 ??
            ""
        )
      );

      setPrecoBritaRsM3(
        String(
          configuracao.preco_brita_rs_m3 ??
            ""
        )
      );

      setPrecoAguaRsL(
        String(
          configuracao.preco_agua_rs_l ??
            ""
        )
      );

      setPrecoAcoRsKg(
        String(
          configuracao.preco_aco_rs_kg ??
            ""
        )
      );

      setPrecoNeopreneRsM2(
        String(
          configuracao.preco_neoprene_rs_m2 ??
            ""
        )
      );
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível carregar as configurações."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function salvarConfiguracao(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const resposta =
        await apiAutenticada(
          "/configuracoes/fabricacao-padrao",
          {
            method: "PUT",

            body: JSON.stringify({
              fckMpa:
                Number(fckMpa || 0),

              taxaArmaduraKgM3:
                Number(
                  taxaArmaduraKgM3 || 0
                ),

              consumoCimentoKgM3:
                Number(
                  consumoCimentoKgM3 || 0
                ),

              consumoAreiaM3M3:
                Number(
                  consumoAreiaM3M3 || 0
                ),

              consumoBritaM3M3:
                Number(
                  consumoBritaM3M3 || 0
                ),

              consumoAguaLM3:
                Number(
                  consumoAguaLM3 || 0
                ),

              neopreneM2PorViga:
                Number(
                  neopreneM2PorViga || 0
                ),

              precoCimentoRsKg:
                Number(
                  precoCimentoRsKg || 0
                ),

              precoAreiaRsM3:
                Number(
                  precoAreiaRsM3 || 0
                ),

              precoBritaRsM3:
                Number(
                  precoBritaRsM3 || 0
                ),

              precoAguaRsL:
                Number(
                  precoAguaRsL || 0
                ),

              precoAcoRsKg:
                Number(
                  precoAcoRsKg || 0
                ),

              precoNeopreneRsM2:
                Number(
                  precoNeopreneRsM2 || 0
                ),
            }),
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
            "Não foi possível salvar as configurações."
        );
      }

      setSucesso(
        "Configurações de fabricação atualizadas com sucesso!"
      );

      setTimeout(
        () => setSucesso(""),
        3000
      );

      await carregarConfiguracao();
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível salvar as configurações."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (verificandoAcesso) {
    return (
      <main style={estilos.pagina}>
        <div style={estilos.estado}>
          Verificando acesso...
        </div>
      </main>
    );
  }

  return (
    <main style={estilos.pagina}>
      <header style={estilos.cabecalho}>
        <div
          style={
            estilos.cabecalhoConteudo
          }
        >
          <div
            style={estilos.identidade}
          >
            <Image
              src="/estrutec-logo.png"
              alt="Estrutec"
              width={150}
              height={70}
              priority
              style={estilos.logo}
            />

            <div
              style={estilos.divisor}
            />

            <div>
              <span
                style={
                  estilos.rotuloCabecalho
                }
              >
                Administração
              </span>

              <strong
                style={
                  estilos.tituloCabecalho
                }
              >
                Parâmetros de Fabricação
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/administracao"
              )
            }
            style={estilos.botaoVoltar}
          >
            Voltar
          </button>
        </div>
      </header>

      <section style={estilos.conteudo}>
        <div style={estilos.topo}>
          <div>
            <span
              style={estilos.sobretitulo}
            >
              ADMINISTRAÇÃO
            </span>

            <h1 style={estilos.titulo}>
              Parâmetros de Fabricação
            </h1>

            <p style={estilos.descricao}>
              Defina os valores padrão
              utilizados nos cálculos de
              fabricação dos projetos.
            </p>
          </div>
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

        {carregando ? (
          <div style={estilos.card}>
            <div style={estilos.estado}>
              Carregando configurações...
            </div>
          </div>
        ) : (
          <form
            onSubmit={salvarConfiguracao}
          >
            <div style={estilos.card}>
              <div
                style={
                  estilos.cardCabecalho
                }
              >
                <h2
                  style={
                    estilos.cardTitulo
                  }
                >
                  Parâmetros técnicos
                </h2>

                <p
                  style={
                    estilos.cardDescricao
                  }
                >
                  Valores utilizados para
                  calcular os quantitativos
                  dos materiais.
                </p>
              </div>

              <div
                style={estilos.cardCorpo}
              >
                <div
                  style={
                    estilos.gridCampos
                  }
                >
                  <CampoNumero
                    label="FCK"
                    unidade="MPa"
                    value={fckMpa}
                    onChange={setFckMpa}
                    step="0.01"
                  />

                  <CampoNumero
                    label="Taxa de armadura"
                    unidade="kg/m³"
                    value={
                      taxaArmaduraKgM3
                    }
                    onChange={
                      setTaxaArmaduraKgM3
                    }
                    step="0.01"
                  />

                  <CampoNumero
                    label="Cimento"
                    unidade="kg/m³"
                    value={
                      consumoCimentoKgM3
                    }
                    onChange={
                      setConsumoCimentoKgM3
                    }
                    step="0.01"
                  />

                  <CampoNumero
                    label="Areia"
                    unidade="m³/m³"
                    value={
                      consumoAreiaM3M3
                    }
                    onChange={
                      setConsumoAreiaM3M3
                    }
                    step="0.0001"
                  />

                  <CampoNumero
                    label="Brita"
                    unidade="m³/m³"
                    value={
                      consumoBritaM3M3
                    }
                    onChange={
                      setConsumoBritaM3M3
                    }
                    step="0.0001"
                  />

                  <CampoNumero
                    label="Água"
                    unidade="L/m³"
                    value={
                      consumoAguaLM3
                    }
                    onChange={
                      setConsumoAguaLM3
                    }
                    step="0.01"
                  />

                  <CampoNumero
                    label="Neoprene por viga"
                    unidade="m²"
                    value={
                      neopreneM2PorViga
                    }
                    onChange={
                      setNeopreneM2PorViga
                    }
                    step="0.0001"
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                ...estilos.card,
                marginTop: "22px",
              }}
            >
              <div
                style={
                  estilos.cardCabecalho
                }
              >
                <h2
                  style={
                    estilos.cardTitulo
                  }
                >
                  Preços dos materiais
                </h2>

                <p
                  style={
                    estilos.cardDescricao
                  }
                >
                  Valores unitários padrão
                  utilizados no cálculo do
                  custo de fabricação.
                </p>
              </div>

              <div
                style={estilos.cardCorpo}
              >
                <div
                  style={
                    estilos.gridCampos
                  }
                >
                  <CampoNumero
                    label="Cimento"
                    unidade="R$/kg"
                    value={
                      precoCimentoRsKg
                    }
                    onChange={
                      setPrecoCimentoRsKg
                    }
                    step="0.0001"
                  />

                  <CampoNumero
                    label="Areia"
                    unidade="R$/m³"
                    value={
                      precoAreiaRsM3
                    }
                    onChange={
                      setPrecoAreiaRsM3
                    }
                    step="0.0001"
                  />

                  <CampoNumero
                    label="Brita"
                    unidade="R$/m³"
                    value={
                      precoBritaRsM3
                    }
                    onChange={
                      setPrecoBritaRsM3
                    }
                    step="0.0001"
                  />

                  <CampoNumero
                    label="Água"
                    unidade="R$/L"
                    value={
                      precoAguaRsL
                    }
                    onChange={
                      setPrecoAguaRsL
                    }
                    step="0.000001"
                  />

                  <CampoNumero
                    label="Aço"
                    unidade="R$/kg"
                    value={
                      precoAcoRsKg
                    }
                    onChange={
                      setPrecoAcoRsKg
                    }
                    step="0.0001"
                  />

                  <CampoNumero
                    label="Neoprene"
                    unidade="R$/m²"
                    value={
                      precoNeopreneRsM2
                    }
                    onChange={
                      setPrecoNeopreneRsM2
                    }
                    step="0.0001"
                  />
                </div>
              </div>
            </div>

            <div
              style={
                estilos.areaSalvar
              }
            >
              <div>
                <strong
                  style={
                    estilos.tituloSalvar
                  }
                >
                  Configuração padrão
                </strong>

                <p
                  style={
                    estilos.textoSalvar
                  }
                >
                  Esses valores serão usados
                  como preenchimento inicial
                  nos novos projetos.
                </p>
              </div>

              <button
                type="submit"
                disabled={salvando}
                style={{
                  ...estilos.botaoSalvar,

                  opacity: salvando
                    ? 0.7
                    : 1,
                }}
              >
                {salvando
                  ? "Salvando..."
                  : "Salvar configurações"}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

function CampoNumero({
  label,
  unidade,
  value,
  onChange,
  step,
}: {
  label: string;
  unidade: string;
  value: string;
  onChange: (valor: string) => void;
  step: string;
}) {
  return (
    <div style={estilos.campo}>
      <label style={estilos.label}>
        {label}
      </label>

      <div
        style={
          estilos.campoComUnidade
        }
      >
        <input
          type="number"
          min="0"
          step={step}
          value={value}
          onChange={(evento) =>
            onChange(
              evento.target.value
            )
          }
          style={estilos.input}
        />

        <span
          style={estilos.unidade}
        >
          {unidade}
        </span>
      </div>
    </div>
  );
}

const estilos = {
  pagina: {
    minHeight: "100vh",
    background: tema.cores.fundo,
    color: tema.cores.texto,
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  cabecalho: {
    background: tema.cores.branco,
    borderBottom:
      `1px solid ${tema.cores.borda}`,
  },

  cabecalhoConteudo: {
    maxWidth: "1600px",
    margin: "0 auto",
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
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
    objectFit: "contain" as const,
  },

  divisor: {
    width: "1px",
    height: "38px",
    background:
      tema.cores.borda,
  },

  rotuloCabecalho: {
    display: "block",
    color:
      tema.cores.textoSecundario,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1px",
    textTransform:
      "uppercase" as const,
    marginBottom: "3px",
  },

  tituloCabecalho: {
    color:
      tema.cores.grafite,
    fontSize: "15px",
  },

  botaoVoltar: {
    height: "40px",
    padding: "0 15px",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.pequena,
    background:
      tema.cores.branco,
    color:
      tema.cores.grafite,
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },

  conteudo: {
    maxWidth: "1600px",
    margin: "0 auto",
    padding: "42px 24px 60px",
  },

  topo: {
    marginBottom: "24px",
  },

  sobretitulo: {
    color:
      tema.cores.laranja,
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "1.4px",
  },

  titulo: {
    margin: 0,
    color:
      tema.cores.grafite,
    fontSize: "30px",
  },

  descricao: {
    margin: "8px 0 0",
    color:
      tema.cores.textoSecundario,
    fontSize: "14px",
  },

  card: {
    overflow: "hidden",
    background:
      tema.cores.branco,
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.grande,
    boxShadow:
      tema.sombras.card,
  },

  cardCabecalho: {
    padding: "22px 24px",
    borderBottom:
      `1px solid ${tema.cores.borda}`,
  },

  cardTitulo: {
    margin: 0,
    color:
      tema.cores.grafite,
    fontSize: "17px",
  },

  cardDescricao: {
    margin: "5px 0 0",
    color:
      tema.cores.textoSecundario,
    fontSize: "12px",
  },

  cardCorpo: {
    padding: "24px",
  },

  gridCampos: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "18px",
  },

  campo: {
    display: "flex",
    flexDirection:
      "column" as const,
  },

  label: {
    marginBottom: "7px",
    color:
      tema.cores.grafite,
    fontSize: "12px",
    fontWeight: 700,
  },

  campoComUnidade: {
    display: "flex",
    alignItems: "stretch",
  },

  input: {
    width: "100%",
    height: "42px",
    boxSizing:
      "border-box" as const,
    padding: "0 11px",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRight: "none",
    borderRadius:
      `${tema.bordas.pequena} 0 0 ${tema.bordas.pequena}`,
    background:
      tema.cores.branco,
    color:
      tema.cores.grafite,
    outline: "none",
  },

  unidade: {
    minWidth: "75px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 10px",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      `0 ${tema.bordas.pequena} ${tema.bordas.pequena} 0`,
    background: "#FAFAF9",
    color:
      tema.cores.textoSecundario,
    fontSize: "11px",
    fontWeight: 700,
  },

  areaSalvar: {
    marginTop: "22px",
    padding: "20px 24px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
    background:
      tema.cores.branco,
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.grande,
    boxShadow:
      tema.sombras.card,
  },

  tituloSalvar: {
    color:
      tema.cores.grafite,
    fontSize: "14px",
  },

  textoSalvar: {
    margin: "5px 0 0",
    color:
      tema.cores.textoSecundario,
    fontSize: "12px",
  },

  botaoSalvar: {
    height: "44px",
    padding: "0 20px",
    border: "none",
    borderRadius:
      tema.bordas.pequena,
    background:
      tema.cores.laranja,
    color:
      tema.cores.branco,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace:
      "nowrap" as const,
  },

  erro: {
    marginBottom: "18px",
    padding: "13px 15px",
    background:
      tema.cores.erroFundo,
    color:
      tema.cores.erro,
    borderRadius:
      tema.bordas.media,
  },

  sucesso: {
    marginBottom: "18px",
    padding: "13px 15px",
    background:
      tema.cores.sucessoFundo,
    color:
      tema.cores.sucesso,
    borderRadius:
      tema.bordas.media,
  },

  estado: {
    padding: "45px 24px",
    textAlign:
      "center" as const,
    color:
      tema.cores.textoSecundario,
  },
};