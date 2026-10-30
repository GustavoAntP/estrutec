"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { apiAutenticada } from "@/servicos/api";
import { tema } from "@/estilos/tema";

type Projeto = {
  id: number;
  codigo: string;
  nome: string;
  cliente: string;
  origem?: string | null;
  destino?: string | null;
  prazo?: string | null;
  bdi?: string | number;
  status: string;
};

export default function PainelPage() {
  const router = useRouter();

  const [projetos, setProjetos] =
    useState<Projeto[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    carregarProjetos();
  }, []);

  async function carregarProjetos() {
    try {
      setCarregando(true);
      setErro("");

      const resposta =
        await apiAutenticada(
          "/projetos"
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
            "Não foi possível carregar os projetos."
        );

        return;
      }

      const lista =
        Array.isArray(dados)
          ? dados
          : dados.projetos || [];

      setProjetos(lista);
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setCarregando(false);
    }
  }

  function sair() {
    localStorage.removeItem(
      "estrutec_token"
    );

    router.push("/login");
  }

  function formatarStatus(
    status: string
  ) {
    const nomes:
      Record<string, string> = {
      RASCUNHO:
        "Rascunho",

      IMPORTACAO_PENDENTE:
        "Importação pendente",

      FABRICACAO_CALCULADA:
        "Fabricação calculada",

      LOGISTICA_CALCULADA:
        "Logística calculada",

      MONTAGEM_CALCULADA:
        "Montagem calculada",

      FINALIZADO:
        "Finalizado",
    };

    return nomes[status] || status;
  }

  function estiloStatus(
    status: string
  ) {
    if (status === "FINALIZADO") {
      return estilos.statusFinalizado;
    }

    if (
      status ===
        "MONTAGEM_CALCULADA" ||
      status ===
        "LOGISTICA_CALCULADA" ||
      status ===
        "FABRICACAO_CALCULADA"
    ) {
      return estilos.statusAndamento;
    }

    return estilos.statusPendente;
  }

  return (
    <main style={estilos.pagina}>
      <header style={estilos.cabecalho}>
        <div style={estilos.areaMarca}>
          <Image
            src="/estrutec-logo.png"
            alt="Estrutec"
            width={150}
            height={90}
            priority
            style={estilos.logo}
          />

          <div style={estilos.divisor} />

          <div>
            <strong style={estilos.nomeArea}>
              Painel de Projetos
            </strong>

            <span style={estilos.descricaoArea}>
              Orçamentação e planejamento
            </span>
          </div>
        </div>

        <div style={estilos.acoes}>
          <button
            type="button"
            style={estilos.botaoNovo}
            onClick={() =>
              router.push(
                "/projetos/novo"
              )
            }
          >
            <span style={estilos.iconeMais}>
              +
            </span>

            Novo projeto
          </button>

          <button
            type="button"
            style={estilos.botaoSair}
            onClick={sair}
          >
            Sair
          </button>
        </div>
      </header>

      <section style={estilos.conteudo}>
        <div style={estilos.topoPagina}>
          <div>
            <span
              style={
                estilos.sobretitulo
              }
            >
              VISÃO GERAL
            </span>

            <h1 style={estilos.titulo}>
              Projetos
            </h1>

            <p style={estilos.descricao}>
              Acompanhe seus orçamentos,
              etapas e planejamentos de
              estruturas pré-moldadas.
            </p>
          </div>

          <div style={estilos.contador}>
            <strong>
              {projetos.length}
            </strong>

            <span>
              {projetos.length === 1
                ? "projeto"
                : "projetos"}
            </span>
          </div>
        </div>

        {carregando && (
          <div style={estilos.mensagem}>
            <div
              style={
                estilos.indicadorCarregando
              }
            />

            Carregando projetos...
          </div>
        )}

        {erro && (
          <div style={estilos.erro}>
            {erro}
          </div>
        )}

        {!carregando &&
          !erro &&
          projetos.length === 0 && (
            <div style={estilos.vazio}>
              <div
                style={
                  estilos.iconeVazio
                }
              >
                +
              </div>

              <h3
                style={
                  estilos.tituloVazio
                }
              >
                Nenhum projeto cadastrado
              </h3>

              <p
                style={
                  estilos.textoVazio
                }
              >
                Crie seu primeiro projeto
                para começar um novo
                orçamento.
              </p>

              <button
                type="button"
                style={
                  estilos.botaoNovoVazio
                }
                onClick={() =>
                  router.push(
                    "/projetos/novo"
                  )
                }
              >
                + Criar primeiro projeto
              </button>
            </div>
          )}

        {!carregando &&
          projetos.length > 0 && (
            <div style={estilos.lista}>
              {projetos.map(
                (projeto) => (
                  <article
                    key={projeto.id}
                    style={
                      estilos.cardProjeto
                    }
                  >
                    <div
                      style={
                        estilos.barraCard
                      }
                    />

                    <div
                      style={
                        estilos.conteudoCard
                      }
                    >
                      <div
                        style={
                          estilos.topoCard
                        }
                      >
                        <div>
                          <span
                            style={
                              estilos.codigo
                            }
                          >
                            {projeto.codigo}
                          </span>

                          <h2
                            style={
                              estilos.nomeProjeto
                            }
                          >
                            {projeto.nome}
                          </h2>

                          <p
                            style={
                              estilos.cliente
                            }
                          >
                            {projeto.cliente}
                          </p>
                        </div>

                        <span
                          style={{
                            ...estilos.statusBase,
                            ...estiloStatus(
                              projeto.status
                            ),
                          }}
                        >
                          {projeto.status ===
                          "FINALIZADO"
                            ? "✓ "
                            : "● "}

                          {formatarStatus(
                            projeto.status
                          )}
                        </span>
                      </div>

                      <div
                        style={
                          estilos.rodapeCard
                        }
                      >
                        <div
                          style={
                            estilos.dadosProjeto
                          }
                        >
                          <div
                            style={
                              estilos.dado
                            }
                          >
                            <span style={estilos.dadoSpan}>
                              Origem
                            </span>

                            <strong>
                              {projeto.origem ||
                                "-"}
                            </strong>
                          </div>

                          <div
                            style={
                              estilos.setaRota
                            }
                          >
                            →
                          </div>

                          <div
                            style={
                              estilos.dado
                            }
                          >
                            <span style={estilos.dadoSpan}>
                              Destino
                            </span>

                            <strong>
                              {projeto.destino ||
                                "-"}
                            </strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          style={
                            estilos.botaoAbrir
                          }
                          onClick={() =>
                            router.push(
                              `/projetos/${projeto.id}`
                            )
                          }
                        >
                          Abrir projeto
                          <span>
                            →
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
      </section>
    </main>
  );
}

const estilos = {
  pagina: {
    minHeight: "100vh",

    background:
      tema.cores.fundo,

    fontFamily:
      "Arial, Helvetica, sans-serif",

    color:
      tema.cores.grafite,
  },

  cabecalho: {
    minHeight: "88px",

    background:
      tema.cores.branco,

    borderBottom:
      `1px solid ${tema.cores.borda}`,

    padding: "14px 40px",

    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",

    gap: "25px",

    boxShadow:
      "0 1px 4px rgba(23, 23, 23, 0.04)",
  },

  areaMarca: {
    display: "flex",
    alignItems: "center",

    gap: "20px",
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

  nomeArea: {
    display: "block",

    color:
      tema.cores.grafite,

    fontSize: "14px",
  },

  descricaoArea: {
    display: "block",

    marginTop: "3px",

    color:
      tema.cores.textoSecundario,

    fontSize: "11px",
  },

  acoes: {
    display: "flex",
    alignItems: "center",

    gap: "10px",
  },

  botaoNovo: {
    height: "44px",

    display: "flex",
    alignItems: "center",

    gap: "8px",

    background:
      tema.cores.laranja,

    color:
      tema.cores.branco,

    border: "none",

    padding: "0 17px",

    borderRadius:
      tema.bordas.pequena,

    cursor: "pointer",

    fontWeight: 700,
    fontSize: "13px",

    boxShadow:
      "0 5px 14px rgba(249, 115, 22, 0.20)",
  },

  iconeMais: {
    fontSize: "19px",
    lineHeight: 1,
  },

  botaoSair: {
    height: "44px",

    background:
      tema.cores.branco,

    color:
      tema.cores.grafite,

    border:
      `1px solid ${tema.cores.borda}`,

    padding: "0 16px",

    borderRadius:
      tema.bordas.pequena,

    cursor: "pointer",

    fontWeight: 600,
    fontSize: "13px",
  },

  conteudo: {
    width: "100%",
    maxWidth: "1600px",
    margin: "0 auto",
    padding: "14px 24px",
    boxSizing: "border-box" as const,
  },

  topoPagina: {
    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "flex-end",

    gap: "25px",

    marginBottom: "28px",
  },

  sobretitulo: {
    color:
      tema.cores.laranja,

    fontSize: "11px",
    fontWeight: 800,

    letterSpacing: "1.5px",
  },

  titulo: {
    margin: "7px 0 5px",

    color:
      tema.cores.grafite,

    fontSize: "30px",

    letterSpacing: "-0.5px",
  },

  descricao: {
    margin: 0,

    color:
      tema.cores.textoSecundario,

    fontSize: "14px",
  },

  contador: {
    minWidth: "100px",

    padding: "10px 14px",

    background:
      tema.cores.branco,

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.media,

    display: "flex",

    alignItems: "baseline",

    justifyContent: "center",

    gap: "5px",

    boxShadow:
      tema.sombras.card,

    color:
      tema.cores.textoSecundario,

    fontSize: "12px",
  },

  lista: {
    display: "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(420px, 1fr))",

    gap: "18px",
  },

  cardProjeto: {
    position: "relative" as const,

    display: "flex",

    background:
      tema.cores.branco,

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.media,

    overflow: "hidden",

    boxShadow:
      tema.sombras.card,
  },

  barraCard: {
    width: "5px",

    flexShrink: 0,

    background:
      tema.cores.laranja,
  },

  conteudoCard: {
    width: "100%",

    padding: "22px 24px",
  },

  topoCard: {
    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "flex-start",

    gap: "20px",

    paddingBottom: "20px",

    borderBottom:
      `1px solid ${tema.cores.borda}`,
  },

  codigo: {
    display: "block",

    marginBottom: "6px",

    color:
      tema.cores.laranja,

    fontSize: "11px",
    fontWeight: 800,

    letterSpacing: "0.8px",
  },

  nomeProjeto: {
    margin: 0,

    color:
      tema.cores.grafite,

    fontSize: "18px",
  },

  cliente: {
    margin: "5px 0 0",

    color:
      tema.cores.textoSecundario,

    fontSize: "13px",
  },

  statusBase: {
    padding: "6px 10px",

    borderRadius: "20px",

    fontSize: "11px",
    fontWeight: 700,

    whiteSpace:
      "nowrap" as const,
  },

  statusFinalizado: {
    background: "#DCFCE7",
    color: "#166534",

    border:
      "1px solid #BBF7D0",
  },

  statusAndamento: {
    background:
      tema.cores.avisoFundo,

    color:
      "#C2410C",

    border:
      "1px solid #FED7AA",
  },

  statusPendente: {
    background:
      "#F5F5F4",

    color:
      "#78716C",

    border:
      "1px solid #E7E5E4",
  },

  rodapeCard: {
    paddingTop: "18px",

    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "center",

    gap: "20px",
  },

  dadosProjeto: {
    display: "flex",

    alignItems: "center",

    gap: "14px",
  },

  dado: {
    display: "flex",

    flexDirection:
      "column" as const,

    gap: "3px",
  },

  dadoSpan: {
    color:
      tema.cores.textoSecundario,

    fontSize: "10px",
  },

  setaRota: {
    color:
      tema.cores.laranja,

    fontSize: "18px",
  },

  botaoAbrir: {
    display: "flex",

    alignItems: "center",

    gap: "8px",

    background:
      tema.cores.grafite,

    color:
      tema.cores.branco,

    border: "none",

    borderRadius:
      tema.bordas.pequena,

    padding: "10px 14px",

    cursor: "pointer",

    fontSize: "12px",
    fontWeight: 700,

    whiteSpace:
      "nowrap" as const,
  },

  mensagem: {
    minHeight: "150px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "10px",

    color:
      tema.cores.textoSecundario,

    fontSize: "14px",
  },

  indicadorCarregando: {
    width: "9px",
    height: "9px",

    borderRadius: "50%",

    background:
      tema.cores.laranja,
  },

  erro: {
    background:
      tema.cores.erroFundo,

    color:
      tema.cores.erro,

    border:
      "1px solid #FECACA",

    padding: "13px",

    borderRadius:
      tema.bordas.media,

    fontSize: "13px",
  },

  vazio: {
    background:
      tema.cores.branco,

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.grande,

    padding: "60px 30px",

    textAlign:
      "center" as const,

    boxShadow:
      tema.sombras.card,
  },

  iconeVazio: {
    width: "54px",
    height: "54px",

    margin: "0 auto 18px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    borderRadius: "16px",

    background:
      tema.cores.avisoFundo,

    color:
      tema.cores.laranja,

    fontSize: "27px",
    fontWeight: 400,
  },

  tituloVazio: {
    margin: "0 0 7px",

    color:
      tema.cores.grafite,

    fontSize: "18px",
  },

  textoVazio: {
    margin: "0 0 22px",

    color:
      tema.cores.textoSecundario,

    fontSize: "13px",
  },

  botaoNovoVazio: {
    background:
      tema.cores.laranja,

    color:
      tema.cores.branco,

    border: "none",

    borderRadius:
      tema.bordas.pequena,

    padding: "11px 17px",

    cursor: "pointer",

    fontWeight: 700,
  },
};