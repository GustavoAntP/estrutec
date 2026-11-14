"use client";

import Image from "next/image";
import {useEffect, useState,} from "react";
import {useParams, useRouter,} from "next/navigation";
import {apiAutenticada,} from "@/servicos/api";
import { tema } from "@/estilos/tema";

type ResumoFinanceiro = {
  projeto: {
    id: number;
    codigo: string;
    nome: string;
    cliente: string;
    status: string;
  };

  custos: {
    fabricacao: number;
    logistica: number;
    montagem: number;
    custoDireto: number;
  };

  bdi: {
    percentual: number;
    valor: number;
  };

  valorFinal: number;
};

export default function ResumoPage() {
  const router = useRouter();

  const params =
    useParams<{ id: string }>();

  const id = params.id;

  const [resumo, setResumo] =
    useState<ResumoFinanceiro | null>(
      null
    );

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [finalizando, setFinalizando] =
    useState(false);

  const [projetoFinalizado, setProjetoFinalizado] =
    useState(
        resumo?.projeto.status === "FINALIZADO"
    );

  const [sucessoFinalizacao, setSucessoFinalizacao] =
    useState("");

  const [modalFinalizacaoAberto, setModalFinalizacaoAberto] =
    useState(false);

  useEffect(() => {
    carregarResumo();
  }, [id]);

  async function carregarResumo() {
    setCarregando(true);
    setErro("");

    try {
      const resposta =
        await apiAutenticada(
          `/projetos/${id}/resumo-financeiro`,
          {
            cache: "no-store",
          }
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
            "Não foi possível carregar o resumo financeiro."
        );

        return;
      }

      setResumo(dados);
      setProjetoFinalizado(
        dados.projeto.status === "FINALIZADO"
      );
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setCarregando(false);
    }
  }

  function formatarMoeda(
    valor: number
  ) {
    return new Intl.NumberFormat(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    ).format(valor);
  }

  function formatarStatus(
    status: string
  ) {
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letra) =>
        letra.toUpperCase()
      );
  }

  async function finalizarProjeto() {
    if (!resumo) {
        return;
    }

    setFinalizando(true);
    setErro("");
    setSucessoFinalizacao("");

    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/finalizar`,
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
        setErro(
            dados.erro ||
            "Não foi possível finalizar o projeto."
        );

        return;
        }

        setModalFinalizacaoAberto(false);

        setProjetoFinalizado(true);

        setSucessoFinalizacao(
        dados.mensagem ||
            "Projeto finalizado com sucesso!"
        );

        await carregarResumo();
    } catch {
        setErro(
        "Não foi possível conectar ao servidor."
        );
    } finally {
        setFinalizando(false);
    }
    }

  if (carregando) {
    return (
      <main style={estilos.centralizado}>
        Carregando resumo financeiro...
      </main>
    );
  }

  if (erro || !resumo) {
    return (
      <main style={estilos.centralizado}>
        <div>
          <p>{erro}</p>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/projetos/${id}`
              )
            }
            style={estilos.botaoVoltar}
          >
            Voltar ao projeto
          </button>
        </div>
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
                Resumo Financeiro
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/projetos/${id}`
              )
            }
            style={estilos.botaoVoltar}
          >
            Voltar ao projeto
          </button>
        </div>
      </header>

      <section style={estilos.conteudo}>
        <div style={estilos.topoPagina}>
          <span style={estilos.sobretitulo}>
            RESUMO FINANCEIRO
          </span>

          <h1 style={estilos.tituloPagina}>
            Visão financeira do projeto
          </h1>

          <p style={estilos.descricaoPagina}>
            Confira a composição dos custos,
            o BDI aplicado e o valor final do
            orçamento antes de finalizar o projeto.
          </p>
        </div>
        <div style={estilos.cardProjeto}>
          <div>
            <span style={estilos.rotulo}>
              Projeto
            </span>

            <h2 style={estilos.nomeProjeto}>
              {resumo.projeto.codigo} —{" "}
              {resumo.projeto.nome}
            </h2>

            <p style={estilos.cliente}>
              Cliente:{" "}
              {resumo.projeto.cliente}
            </p>
          </div>

          <div style={estilos.status}>
            {formatarStatus(
              resumo.projeto.status
            )}
          </div>
        </div>

        <div style={estilos.card}>
          <h2 style={estilos.titulo}>
            Composição do Custo Direto
          </h2>

          <p style={estilos.descricao}>
            Consolidação dos custos de
            fabricação, logística e montagem.
          </p>

          <div style={estilos.gridCustos}>
            <div style={estilos.indicador}>
              <span>Fabricação</span>

              <strong>
                {formatarMoeda(
                  resumo.custos.fabricacao
                )}
              </strong>
            </div>

            <div style={estilos.indicador}>
              <span>Logística</span>

              <strong>
                {formatarMoeda(
                  resumo.custos.logistica
                )}
              </strong>
            </div>

            <div style={estilos.indicador}>
              <span>Montagem</span>

              <strong>
                {formatarMoeda(
                  resumo.custos.montagem
                )}
              </strong>
            </div>
          </div>

          <div style={estilos.custoDireto}>
            <span>
              CUSTO DIRETO
            </span>

            <strong>
              {formatarMoeda(
                resumo.custos.custoDireto
              )}
            </strong>
          </div>
        </div>

        <div style={estilos.cardSecundario}>
          <h2 style={estilos.titulo}>
            BDI
          </h2>

          <p style={estilos.descricao}>
            Percentual aplicado sobre o
            custo direto do projeto.
          </p>

          <div style={estilos.gridBdi}>
            <div style={estilos.indicador}>
              <span>
                Percentual do BDI
              </span>

              <strong>
                {resumo.bdi.percentual}%
              </strong>
            </div>

            <div style={estilos.indicador}>
              <span>
                Valor do BDI
              </span>

              <strong>
                {formatarMoeda(
                  resumo.bdi.valor
                )}
              </strong>
            </div>
          </div>
        </div>

        <div style={estilos.valorFinal}>
          <div>
            <span style={estilos.rotuloFinal}>
              VALOR FINAL DO PROJETO
            </span>

            <p style={estilos.descricaoFinal}>
              Custo direto acrescido do BDI
              de {resumo.bdi.percentual}%.
            </p>
          </div>

          <strong style={estilos.numeroFinal}>
            {formatarMoeda(
              resumo.valorFinal
            )}
          </strong>
        </div>

        {sucessoFinalizacao && (
            <div style={estilos.sucesso}>
                {sucessoFinalizacao}
            </div>
            )}

            {projetoFinalizado && (
            <div style={estilos.avisoFinalizado}>
                Projeto finalizado. As etapas estão
                bloqueadas para edição.
            </div>
        )}

        <div style={estilos.acoes}>
            <button
                type="button"
                onClick={carregarResumo}
                style={estilos.botaoSecundario}
            >
                Atualizar resumo
            </button>

            {!projetoFinalizado ? (
                <button
                type="button"
                onClick={() =>
                    setModalFinalizacaoAberto(true)
                }
                disabled={finalizando}
                style={estilos.botaoFinalizar}
                >
                Finalizar projeto
                </button>
            ) : (
                <button
                type="button"
                onClick={() =>
                    router.push(
                    `/projetos/${id}/relatorio`
                    )
                }
                style={estilos.botaoRelatorio}
                >
                Abrir relatório final →
                </button>
            )}
        </div>
      </section>

      {modalFinalizacaoAberto && (
        <div
          style={estilos.overlayModal}
          onClick={() =>
            !finalizando &&
            setModalFinalizacaoAberto(false)
          }
        >
          <div
            style={estilos.modalFinalizacao}
            onClick={(evento) =>
              evento.stopPropagation()
            }
          >
            <div style={estilos.iconeModal}>
              ✓
            </div>

            <h2 style={estilos.tituloModal}>
              Finalizar projeto?
            </h2>

            <p style={estilos.textoModal}>
              Você está prestes a finalizar o projeto{" "}
              <strong>
                {resumo.projeto.codigo} —{" "}
                {resumo.projeto.nome}
              </strong>.
            </p>

            <div style={estilos.avisoModal}>
              <strong>Atenção</strong>

              <span>
                Após a finalização, as etapas de
                Fabricação, Logística e Montagem
                ficarão bloqueadas para edição.
                O projeto poderá ser reaberto
                posteriormente, se necessário.
              </span>
            </div>

            <div style={estilos.valorModal}>
              <span>Valor final do projeto</span>

              <strong>
                {formatarMoeda(
                  resumo.valorFinal
                )}
              </strong>
            </div>

            <div style={estilos.acoesModal}>
              <button
                type="button"
                onClick={() =>
                  setModalFinalizacaoAberto(false)
                }
                disabled={finalizando}
                style={estilos.botaoCancelarModal}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={finalizarProjeto}
                disabled={finalizando}
                style={estilos.botaoConfirmarModal}
              >
                {finalizando
                  ? "Finalizando..."
                  : "Sim, finalizar projeto"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

const estilos = {
  pagina: {
    minHeight: "100vh",
    background: tema.cores.fundo,
    color: tema.cores.grafite,
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  centralizado: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: tema.cores.fundo,
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
    justifyContent:
      "space-between",
    alignItems: "center",
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
    maxWidth: "1180px",
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
    maxWidth: "700px",
    margin: "8px 0 0",
    color:
      tema.cores.textoSecundario,
    fontSize: "14px",
    lineHeight: 1.55,
  },

  cardProjeto: {
    background:
      tema.cores.branco,
    border:
      `1px solid ${tema.cores.borda}`,
    borderLeft:
      `4px solid ${tema.cores.laranja}`,
    borderRadius:
      tema.bordas.grande,
    padding: "22px 26px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px",
    boxShadow:
      tema.sombras.card,
  },

  rotulo: {
    fontSize: "10px",
    color:
      tema.cores.laranja,
    fontWeight: 800,
    letterSpacing: "1px",
    textTransform:
      "uppercase" as const,
  },

  nomeProjeto: {
    margin: "6px 0",
    color:
      tema.cores.grafite,
    fontSize: "20px",
  },

  cliente: {
    margin: 0,
    color:
      tema.cores.textoSecundario,
    fontSize: "12px",
  },

  status: {
    background: "#FFF7ED",
    color: "#9A3412",
    border:
      "1px solid #FED7AA",
    borderRadius: "20px",
    padding: "7px 12px",
    fontSize: "11px",
    fontWeight: 700,
    whiteSpace:
      "nowrap" as const,
  },

  card: {
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

  titulo: {
    margin: 0,
    color:
      tema.cores.grafite,
    fontSize: "19px",
    fontWeight: 700,
  },

  descricao: {
    margin: "7px 0 22px",
    color:
      tema.cores.textoSecundario,
    fontSize: "13px",
    lineHeight: 1.5,
  },

  gridCustos: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "14px",
  },

  indicador: {
    minHeight: "92px",
    background: "#FAFAF9",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.pequena,
    padding: "17px",
    display: "flex",
    flexDirection:
      "column" as const,
    justifyContent:
      "space-between",
    gap: "8px",
  },

  custoDireto: {
    marginTop: "20px",
    padding: "17px 18px",
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
    fontSize: "16px",
  },

  gridBdi: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },

  valorFinal: {
    marginTop: "24px",
    background: "#FFF7ED",
    color:
      tema.cores.grafite,
    border:
      `2px solid ${tema.cores.laranja}`,
    borderRadius:
      tema.bordas.grande,
    padding: "26px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "25px",
    boxShadow:
      "0 6px 18px rgba(249, 115, 22, 0.08)",
  },

  rotuloFinal: {
    color: "#9A3412",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.8px",
  },

  descricaoFinal: {
    margin: "7px 0 0",
    fontSize: "12px",
    color:
      tema.cores.textoSecundario,
  },

  numeroFinal: {
    color:
      tema.cores.grafite,
    fontSize: "30px",
    whiteSpace:
      "nowrap" as const,
  },

  acoes: {
    marginTop: "22px",
    paddingTop: "20px",
    display: "flex",
    justifyContent:
      "flex-end",
    gap: "10px",
    borderTop:
      `1px solid ${tema.cores.borda}`,
  },

  botaoSecundario: {
    height: "44px",
    padding: "0 17px",
    background:
      tema.cores.branco,
    color:
      tema.cores.grafite,
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.pequena,
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },

  botaoVoltarProjeto: {
    height: "44px",
    padding: "0 18px",
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

  sucesso: {
    marginTop: "20px",
    background: "#F0FDF4",
    color: "#15803D",
    border:
      "1px solid #BBF7D0",
    borderRadius:
      tema.bordas.pequena,
    padding: "12px 14px",
    fontSize: "12px",
  },

  avisoFinalizado: {
    marginTop: "20px",
    background: "#FFF7ED",
    color: "#9A3412",
    border:
      "1px solid #FED7AA",
    borderRadius:
      tema.bordas.pequena,
    padding: "12px 14px",
    fontSize: "12px",
    fontWeight: 600,
  },

  botaoFinalizar: {
    height: "44px",
    padding: "0 18px",
    background:
      tema.cores.laranja,
    color:
      tema.cores.branco,
    border: "none",
    borderRadius:
      tema.bordas.pequena,
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 700,
  },

  botaoRelatorio: {
    height: "44px",
    padding: "0 18px",
    background:
      tema.cores.laranja,
    color:
      tema.cores.branco,
    border: "none",
    borderRadius:
      tema.bordas.pequena,
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 700,
  },

  overlayModal: {
    position:
      "fixed" as const,
    inset: 0,
    background:
      "rgba(23, 23, 23, 0.55)",
    backdropFilter:
      "blur(3px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 9999,
  },

  modalFinalizacao: {
    width: "100%",
    maxWidth: "500px",
    background:
      tema.cores.branco,
    borderRadius:
      tema.bordas.grande,
    padding: "30px",
    border:
      `1px solid ${tema.cores.borda}`,
    borderTop:
      `4px solid ${tema.cores.laranja}`,
    boxShadow:
      "0 25px 60px rgba(0, 0, 0, 0.22)",
  },

  iconeModal: {
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    background: "#FFF7ED",
    color:
      tema.cores.laranja,
    border:
      "1px solid #FED7AA",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: 800,
    marginBottom: "18px",
  },

  tituloModal: {
    margin: 0,
    color:
      tema.cores.grafite,
    fontSize: "22px",
    fontWeight: 700,
  },

  textoModal: {
    margin: "10px 0 20px",
    color:
      tema.cores.textoSecundario,
    fontSize: "13px",
    lineHeight: 1.6,
  },

  avisoModal: {
    background: "#FAFAF9",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.pequena,
    padding: "15px",
    display: "flex",
    flexDirection:
      "column" as const,
    gap: "6px",
    color:
      tema.cores.textoSecundario,
    fontSize: "12px",
    lineHeight: 1.5,
  },

  valorModal: {
    marginTop: "18px",
    padding: "17px",
    background: "#FFF7ED",
    color:
      tema.cores.grafite,
    border:
      `2px solid ${tema.cores.laranja}`,
    borderRadius:
      tema.bordas.pequena,
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "15px",
    fontSize: "13px",
  },

  acoesModal: {
    marginTop: "24px",
    display: "flex",
    justifyContent:
      "flex-end",
    gap: "10px",
  },

  botaoCancelarModal: {
    height: "43px",
    padding: "0 17px",
    background:
      tema.cores.branco,
    color:
      tema.cores.grafite,
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.pequena,
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },

  botaoConfirmarModal: {
    height: "43px",
    padding: "0 18px",
    background:
      tema.cores.laranja,
    color:
      tema.cores.branco,
    border: "none",
    borderRadius:
      tema.bordas.pequena,
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 700,
  },
};