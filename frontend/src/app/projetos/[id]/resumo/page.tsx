"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  apiAutenticada,
} from "@/servicos/api";

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
        <div>
          <h1 style={estilos.logo}>
            ESTRUTEC
          </h1>

          <p style={estilos.subtitulo}>
            Resumo Financeiro
          </p>
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
          ← Voltar ao projeto
        </button>
      </header>

      <section style={estilos.conteudo}>
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
    background: "#f4f6f8",
    fontFamily: "Arial, sans-serif",
  },

  centralizado: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
  },

  cabecalho: {
    minHeight: "80px",
    background: "#ffffff",
    borderBottom:
      "1px solid #e5e7eb",
    padding: "16px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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

  cardProjeto: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "25px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "20px",
  },

  rotulo: {
    fontSize: "12px",
    color: "#6b7280",
    textTransform:
      "uppercase" as const,
  },

  nomeProjeto: {
    margin: "5px 0",
    fontSize: "21px",
  },

  cliente: {
    margin: 0,
    color: "#6b7280",
    fontSize: "13px",
  },

  status: {
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "20px",
    padding: "8px 14px",
    fontSize: "12px",
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "30px",
  },

  cardSecundario: {
    marginTop: "20px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "30px",
  },

  titulo: {
    margin: 0,
    fontSize: "21px",
  },

  descricao: {
    margin: "7px 0 22px",
    color: "#6b7280",
    fontSize: "14px",
  },

  gridCustos: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
  },

  indicador: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "18px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },

  custoDireto: {
    marginTop: "20px",
    padding: "18px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "17px",
  },

  gridBdi: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
  },

  valorFinal: {
    marginTop: "20px",
    background: "#111827",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "25px",
  },

  rotuloFinal: {
    fontSize: "13px",
    fontWeight: 700,
  },

  descricaoFinal: {
    margin: "7px 0 0",
    fontSize: "13px",
    color: "#d1d5db",
  },

  numeroFinal: {
    fontSize: "28px",
    whiteSpace: "nowrap" as const,
  },

  acoes: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },

  botaoSecundario: {
    background: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    padding: "11px 16px",
    cursor: "pointer",
  },

  botaoVoltarProjeto: {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "11px 16px",
    cursor: "pointer",
    fontWeight: 600,
  },
    sucesso: {
    marginTop: "20px",
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "7px",
    padding: "12px 14px",
    fontSize: "13px",
    },

    avisoFinalizado: {
    marginTop: "20px",
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    padding: "12px 14px",
    fontSize: "13px",
    fontWeight: 600,
    },

    botaoFinalizar: {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "11px 16px",
    cursor: "pointer",
    fontWeight: 600,
    },

    botaoRelatorio: {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "11px 16px",
    cursor: "pointer",
    fontWeight: 600,
    },
    overlayModal: {
    position: "fixed" as const,
    inset: 0,

    background:
        "rgba(17, 24, 39, 0.65)",

    backdropFilter: "blur(2px)",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    padding: "20px",

    zIndex: 9999,
    },

    modalFinalizacao: {
    width: "100%",
    maxWidth: "500px",

    background: "#ffffff",

    borderRadius: "22px",

    padding: "32px",

    border: "1px solid #e5e7eb",

    boxShadow:
        "0 25px 60px rgba(0, 0, 0, 0.30)",
    },

    iconeModal: {
    width: "52px",
    height: "52px",

    borderRadius: "16px",

    background: "#111827",
    color: "#ffffff",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    fontSize: "24px",
    fontWeight: 700,

    marginBottom: "20px",
    },

    tituloModal: {
    margin: 0,

    color: "#111827",

    fontSize: "23px",
    fontWeight: 700,
    },

    textoModal: {
    margin: "10px 0 20px",

    color: "#6b7280",

    fontSize: "14px",
    lineHeight: 1.6,
    },

    avisoModal: {
    background: "#f9fafb",

    border: "1px solid #e5e7eb",
    borderRadius: "14px",

    padding: "16px",

    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",

    color: "#4b5563",

    fontSize: "13px",
    lineHeight: 1.5,
    },

    valorModal: {
    marginTop: "18px",

    padding: "18px",

    background: "#111827",
    color: "#ffffff",

    borderRadius: "14px",

    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",

    gap: "15px",

    fontSize: "14px",
    },

    acoesModal: {
    marginTop: "25px",

    display: "flex",
    justifyContent: "flex-end",

    gap: "10px",
    },

    botaoCancelarModal: {
    background: "#ffffff",

    color: "#374151",

    border: "1px solid #d1d5db",
    borderRadius: "10px",

    padding: "12px 18px",

    cursor: "pointer",
    fontWeight: 600,
    },

    botaoConfirmarModal: {
    background: "#111827",

    color: "#ffffff",

    border: "none",
    borderRadius: "10px",

    padding: "12px 18px",

    cursor: "pointer",
    fontWeight: 600,
    },
};