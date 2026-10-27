"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiAutenticada } from "@/servicos/api";

type Projeto = {
  id: number;
  codigo: string;
  nome: string;
  cliente: string;
  responsavel?: string | null;
  origem?: string | null;
  destino?: string | null;
  prazo?: string | null;
  bdi?: string | number;
  status: string;
  observacoes?: string | null;
};

export default function ProjetoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const id = params.id;

  const [projeto, setProjeto] =
    useState<Projeto | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");

  const [reabrindo, setReabrindo] =
    useState(false);

  const [modalReabrirAberto, setModalReabrirAberto] =
    useState(false);

  const [erroReabertura, setErroReabertura] =
    useState("");

  const [sucessoReabertura, setSucessoReabertura] =
    useState("");

  useEffect(() => {
    carregarProjeto();
  }, [id]);

  async function carregarProjeto() {
    try {
      setCarregando(true);
      setErro("");

      const resposta =
        await apiAutenticada(
          `/projetos/${id}`
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
            "Não foi possível carregar o projeto."
        );

        return;
      }

      setProjeto(
        dados.projeto || dados
      );
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function reabrirProjeto() {
    setReabrindo(true);
    setErroReabertura("");
    setSucessoReabertura("");

    try {
      const resposta = await apiAutenticada(
        `/projetos/${id}/reabrir`,
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

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        setErroReabertura(
          dados.erro ||
            "Não foi possível reabrir o projeto."
        );

        return;
      }

      setModalReabrirAberto(false);

      setSucessoReabertura(
        dados.mensagem ||
          "Projeto reaberto com sucesso!"
      );

      await carregarProjeto();
    } catch {
      setErroReabertura(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setReabrindo(false);
    }
  }

  function etapaDisponivel(etapa: string) {
    if (!projeto) {
      return false;
    }

    const status = projeto.status;

    const ordem = [
      "RASCUNHO",
      "IMPORTACAO_PENDENTE",
      "FABRICACAO_CALCULADA",
      "LOGISTICA_CALCULADA",
      "MONTAGEM_CALCULADA",
      "FINALIZADO",
    ];

    const indiceAtual =
      ordem.indexOf(status);

    // Ainda não temos um status específico
    // para "importação concluída".
    if (etapa === "importacao") {
      return true;
    }

    if (etapa === "fabricacao") {
      return true;
    }

    if (etapa === "logistica") {
      return indiceAtual >= 2;
    }

    if (etapa === "montagem") {
      return indiceAtual >= 3;
    }

    if (etapa === "resumo") {
      return indiceAtual >= 4;
    }

    if (etapa === "relatorio") {
      return status === "FINALIZADO";
    }

    return false;
  }

  function etapaConcluida(etapa: string) {
    if (!projeto) {
      return false;
    }
    const status = projeto.status;

    const ordem = [
      "RASCUNHO",
      "IMPORTACAO_PENDENTE",
      "FABRICACAO_CALCULADA",
      "LOGISTICA_CALCULADA",
      "MONTAGEM_CALCULADA",
      "FINALIZADO",
    ];

    const indiceAtual =
      ordem.indexOf(status);

    if (etapa === "fabricacao") {
      return indiceAtual >= 2;
    }

    if (etapa === "logistica") {
      return indiceAtual >= 3;
    }

    if (etapa === "montagem") {
      return indiceAtual >= 4;
    }

    if (etapa === "resumo") {
      return indiceAtual >= 4;
    }

    if (etapa === "relatorio") {
      return status === "FINALIZADO";
    }

    return false;
  }

  function textoStatusEtapa(
      etapa: string
    ) {
      if (!etapaDisponivel(etapa)) {
        return "Bloqueada";
      }

      if (
        etapa === "resumo" ||
        etapa === "relatorio"
      ) {
        return etapaConcluida(etapa)
          ? "Disponível"
          : "Pendente";
      }

      return etapaConcluida(etapa)
        ? "Concluída"
        : "Pendente";
    }

  function formatarStatus(status: string) {
    const nomes: Record<string, string> = {
      RASCUNHO: "Rascunho",
      IMPORTACAO_PENDENTE:
        "Importação pendente",
      FABRICACAO_CALCULADA:
        "Fabricação calculada",
      LOGISTICA_CALCULADA:
        "Logística calculada",
      MONTAGEM_CALCULADA:
        "Montagem calculada",
      FINALIZADO: "Finalizado",
    };

    return nomes[status] || status;
  }

  function formatarData(data?: string | null) {
    if (!data) {
      return "-";
    }

    return new Date(
      `${data}T12:00:00`
    ).toLocaleDateString("pt-BR");
  }

  function abrirEtapa(caminho: string) {
    router.push(
      `/projetos/${id}/${caminho}`
    );
  }

  if (carregando) {
    return (
      <main style={estilos.centralizado}>
        Carregando projeto...
      </main>
    );
  }

  if (erro || !projeto) {
    return (
      <main style={estilos.centralizado}>
        <div>
          <p>{erro}</p>

          <button
            onClick={() =>
              router.push("/painel")
            }
          >
            Voltar ao painel
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
            Projeto {projeto.codigo}
          </p>
        </div>

        <button
          style={estilos.botaoVoltar}
          onClick={() =>
            router.push("/painel")
          }
        >
          ← Voltar ao painel
        </button>
      </header>

      <section style={estilos.conteudo}>
        <div style={estilos.topoProjeto}>
          <div>
            <p style={estilos.codigo}>
              {projeto.codigo}
            </p>

            <h2 style={estilos.tituloProjeto}>
              {projeto.nome}
            </h2>

            <p style={estilos.cliente}>
              {projeto.cliente}
            </p>
          </div>
          <span style={estilos.status}>
            {formatarStatus(
              projeto.status
            )}
          </span>
        </div>
        <div style={estilos.grid}>
          <div style={estilos.cardDados}>
            <h3 style={estilos.tituloCard}>
              Dados Gerais
            </h3>

            <div style={estilos.dados}>
              <div>
                <span style={estilos.rotulo}>
                  Responsável
                </span>

                <strong>
                  {projeto.responsavel ||
                    "-"}
                </strong>
              </div>

              <div>
                <span style={estilos.rotulo}>
                  Origem
                </span>

                <strong>
                  {projeto.origem || "-"}
                </strong>
              </div>

              <div>
                <span style={estilos.rotulo}>
                  Destino
                </span>

                <strong>
                  {projeto.destino || "-"}
                </strong>
              </div>

              <div>
                <span style={estilos.rotulo}>
                  Prazo
                </span>

                <strong>
                  {formatarData(
                    projeto.prazo
                  )}
                </strong>
              </div>

              <div>
                <span style={estilos.rotulo}>
                  BDI
                </span>

                <strong>
                  {Number(
                    projeto.bdi || 0
                  ).toLocaleString(
                    "pt-BR"
                  )}
                  %
                </strong>
              </div>
            </div>

            {projeto.observacoes && (
              <div style={estilos.observacoes}>
                <span style={estilos.rotulo}>
                  Observações
                </span>

                <p>
                  {projeto.observacoes}
                </p>
              </div>
            )}
          </div>
        </div>

        <h3 style={estilos.tituloEtapas}>
          Etapas do Orçamento
        </h3>

        <div style={estilos.etapas}>
        <button
          style={estilos.etapa}
          onClick={() =>
            abrirEtapa("importacao")
          }
        >
          <div style={estilos.cabecalhoEtapa}>
            <strong style={estilos.tituloEtapa}>
              1. Importação
            </strong>

            <span style={estilos.statusPendente}>
              ○ Planilha
            </span>
          </div>

          <span style={estilos.descricaoEtapa}>
            Planilha de elementos pré-moldados
          </span>
        </button>

        <button
          style={estilos.etapa}
          onClick={() =>
            abrirEtapa("fabricacao")
          }
        >
          <div style={estilos.cabecalhoEtapa}>
            <strong style={estilos.tituloEtapa}>
              2. Fabricação
            </strong>

            <span
              style={
                etapaConcluida("fabricacao")
                  ? estilos.statusConcluido
                  : estilos.statusPendente
              }
            >
              {etapaConcluida("fabricacao")
                ? "✓ Concluída"
                : "○ Pendente"}
            </span>
          </div>

          <span style={estilos.descricaoEtapa}>
            Materiais, volumes e custos
          </span>
        </button>

          <button
            disabled={
              !etapaDisponivel("logistica")
            }
            style={{
              ...estilos.etapa,
              ...(!etapaDisponivel("logistica")
                ? estilos.etapaBloqueada
                : {}),
            }}
            onClick={() =>
              abrirEtapa("logistica")
            }
          >
          <div style={estilos.cabecalhoEtapa}>
            <strong style={estilos.tituloEtapa}>
              3. Logística
            </strong>
          <span
            style={
              etapaConcluida("logistica")
                ? estilos.statusConcluido
                : etapaDisponivel("logistica")
                  ? estilos.statusPendente
                  : estilos.statusBloqueado
            }
          >
            {etapaConcluida("logistica")
              ? "✓ Concluída"
              : etapaDisponivel("logistica")
                ? "○ Pendente"
                : "🔒 Bloqueada"}
          </span>
          </div>
          <span style={estilos.descricaoEtapa}>
            Frete próprio ou terceirizado
          </span>
        </button>

          <button
            disabled={
              !etapaDisponivel("montagem")
            }
            style={{
              ...estilos.etapa,
              ...(!etapaDisponivel("montagem")
                ? estilos.etapaBloqueada
                : {}),
            }}
            onClick={() =>
              abrirEtapa("montagem")
            }
          >
          <div style={estilos.cabecalhoEtapa}>
            <strong style={estilos.tituloEtapa}>
              4. Montagem
            </strong>

          <span
            style={
              etapaConcluida("montagem")
                ? estilos.statusConcluido
                : etapaDisponivel("montagem")
                  ? estilos.statusPendente
                  : estilos.statusBloqueado
            }
          >
            {etapaConcluida("montagem")
              ? "✓ Concluída"
              : etapaDisponivel("montagem")
                ? "○ Pendente"
                : "🔒 Bloqueada"}
          </span>
          </div>

          <span style={estilos.descricaoEtapa}>
            Equipamentos, equipe e custos
          </span>
        </button>

          <button
            disabled={
              !etapaDisponivel("resumo")
            }
            style={{
              ...estilos.etapa,
              ...(!etapaDisponivel("resumo")
                ? estilos.etapaBloqueada
                : {}),
            }}
            onClick={() =>
              abrirEtapa("resumo")
            }
          >
          <div style={estilos.cabecalhoEtapa}>
            <strong style={estilos.tituloEtapa}>
              5. Resumo Financeiro
            </strong>

          <span
            style={
              etapaConcluida("resumo")
                ? estilos.statusConcluido
                : etapaDisponivel("resumo")
                  ? estilos.statusPendente
                  : estilos.statusBloqueado
            }
          >
            {etapaConcluida("resumo")
              ? "✓ Disponível"
              : etapaDisponivel("resumo")
                ? "○ Pendente"
                : "🔒 Bloqueada"}
          </span>
          </div>

          <span style={estilos.descricaoEtapa}>
            Custos, BDI e valor final
          </span>
        </button>

          <button
            disabled={
              !etapaDisponivel("relatorio")
            }
            style={{
              ...estilos.etapa,
              ...(!etapaDisponivel("relatorio")
                ? estilos.etapaBloqueada
                : {}),
            }}
            onClick={() =>
              abrirEtapa("relatorio")
            }
          >
          <div style={estilos.cabecalhoEtapa}>
            <strong style={estilos.tituloEtapa}>
              6. Relatório
            </strong>

          <span
            style={
              etapaConcluida("relatorio")
                ? estilos.statusConcluido
                : estilos.statusBloqueado
            }
          >
            {etapaConcluida("relatorio")
              ? "✓ Disponível"
              : "🔒 Bloqueada"}
          </span>
          </div>

          <span style={estilos.descricaoEtapa}>
            Relatório final em PDF
          </span>
        </button>
      </div>

        {projeto.status === "FINALIZADO" && (
            <div style={estilos.areaReabrir}>
              <button
                type="button"
                onClick={() =>
                  setModalReabrirAberto(true)
                }
                style={estilos.botaoReabrir}
              >
                Reabrir projeto
              </button>
            </div>
          )}
      </section>

      {modalReabrirAberto && (
        <div
          style={estilos.overlayModal}
          onClick={() =>
            !reabrindo &&
            setModalReabrirAberto(false)
          }
        >
          <div
            style={estilos.modal}
            onClick={(evento) =>
              evento.stopPropagation()
            }
          >
            <div style={estilos.iconeModal}>
              ↻
            </div>

            <h2 style={estilos.tituloModal}>
              Reabrir projeto?
            </h2>

            <p style={estilos.textoModal}>
              O projeto voltará para a etapa de
              montagem calculada e poderá ser
              alterado novamente.
            </p>

            <div style={estilos.avisoModal}>
              <strong>Atenção</strong>

              <span>
                Após a reabertura, Fabricação,
                Logística e Montagem poderão ser
                editadas novamente. Depois das
                alterações, será necessário revisar
                os valores e finalizar o projeto
                novamente.
              </span>
            </div>

            <div style={estilos.acoesModal}>
              <button
                type="button"
                onClick={() =>
                  setModalReabrirAberto(false)
                }
                disabled={reabrindo}
                style={estilos.botaoCancelarModal}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={reabrirProjeto}
                disabled={reabrindo}
                style={estilos.botaoConfirmarModal}
              >
                {reabrindo
                  ? "Reabrindo..."
                  : "Sim, reabrir projeto"}
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
    justifyContent:
      "space-between",
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
    border:
      "1px solid #d1d5db",
    borderRadius: "6px",
    padding: "10px 15px",
    cursor: "pointer",
  },

  conteudo: {
    padding: "35px 40px",
    maxWidth: "1300px",
    margin: "0 auto",
  },

  topoProjeto: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },

  codigo: {
    margin: 0,
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: 600,
  },

  tituloProjeto: {
    margin: "5px 0",
    fontSize: "28px",
  },

  cliente: {
    margin: 0,
    color: "#6b7280",
  },

  status: {
    padding: "8px 14px",
    borderRadius: "20px",
    background: "#e5e7eb",
    fontSize: "13px",
    fontWeight: 600,
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "1fr",
    gap: "20px",
  },

  cardDados: {
    background: "#ffffff",
    border:
      "1px solid #e5e7eb",
    borderRadius: "9px",
    padding: "25px",
  },

  tituloCard: {
    margin: "0 0 22px",
    fontSize: "18px",
  },

  dados: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "22px",
  },

  rotulo: {
    display: "block",
    color: "#6b7280",
    fontSize: "12px",
    marginBottom: "5px",
  },

  observacoes: {
    marginTop: "22px",
    paddingTop: "18px",
    borderTop:
      "1px solid #e5e7eb",
    fontSize: "14px",
  },

  tituloEtapas: {
    margin:
      "32px 0 16px",
    fontSize: "18px",
  },

  etapas: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "15px",
  },

  etapa: {
    minHeight: "100px",
    padding: "20px",
    background: "#ffffff",
    border:
      "1px solid #e5e7eb",
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "left" as const,
    display: "flex",
    flexDirection:
      "column" as const,
    gap: "7px",
  },
  cabecalhoEtapa: {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  },

  tituloEtapa: {
    fontSize: "15px",
    color: "#111827",
  },

  descricaoEtapa: {
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  statusConcluido: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "20px",
    padding: "5px 9px",
    fontSize: "11px",
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  },

  statusPendente: {
    background: "#f3f4f6",
    color: "#6b7280",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "5px 9px",
    fontSize: "11px",
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  },
  statusBloqueado: {
    background: "#f3f4f6",
    color: "#9ca3af",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "5px 9px",
    fontSize: "11px",
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  },

  etapaBloqueada: {
    background: "#f9fafb",
    opacity: 0.6,
    cursor: "not-allowed",
  },
  botaoReabrir: {
  background: "rgb(229, 231, 235)",
  color: "#000000",
  border: "none",
  borderRadius: "8px",
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "14px",
  },
  areaReabrir: {
    marginTop: "30px",
    paddingTop: "20px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "flex-end",
  },

overlayModal: {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(17, 24, 39, 0.65)",
  backdropFilter: "blur(2px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  zIndex: 9999,
},

modal: {
  width: "100%",
  maxWidth: "480px",
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
  fontSize: "25px",
  fontWeight: 700,
  marginBottom: "20px",
},

tituloModal: {
  margin: 0,
  color: "#111827",
  fontSize: "23px",
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