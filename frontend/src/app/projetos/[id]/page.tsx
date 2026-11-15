"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

import { apiAutenticada } from "@/servicos/api";
import { tema } from "@/estilos/tema";

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
      <div style={estilos.areaMarca}>
        <Image
          src="/estrutec-logo.png"
          alt="Estrutec"
          width={150}
          height={90}
          priority
          style={estilos.logoImagem}
        />

        <div style={estilos.divisorCabecalho} />

        <div>
          <strong style={estilos.nomeArea}>
            Projeto {projeto.codigo}
          </strong>

          <span style={estilos.descricaoArea}>
            Orçamento e planejamento
          </span>
        </div>
      </div>

      <button
        type="button"
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
          <span style={estilos.sobretitulo}>
            PROJETO
          </span>

          <h1 style={estilos.tituloProjeto}>
            {projeto.nome}
          </h1>

          <div style={estilos.informacoesTopo}>
            <span>
              <strong>
                {projeto.codigo}
              </strong>
            </span>

            <span style={estilos.separadorTopo}>
              •
            </span>

            <span>
              {projeto.cliente}
            </span>
          </div>
        </div>

        <span
          style={{
            ...estilos.statusProjeto,

            ...(projeto.status === "FINALIZADO"
              ? estilos.statusFinalizado
              : estilos.statusAndamento),
          }}
        >
          {projeto.status === "FINALIZADO"
            ? "✓ "
            : "● "}

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
              ● Entrada
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

    background:
      tema.cores.fundo,

    fontFamily:
      "Arial, Helvetica, sans-serif",

    color:
      tema.cores.grafite,
  },

  centralizado: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
  },

  cabecalho: {
    minHeight: "88px",

    background:
      tema.cores.branco,

    borderBottom:
      `1px solid ${tema.cores.borda}`,

    padding: "14px 24px",

    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",

    gap: "20px",

    boxShadow:
      "0 1px 4px rgba(23, 23, 23, 0.04)",
  },
  areaMarca: {
  display: "flex",
  alignItems: "center",
  gap: "20px",
  },

  logoImagem: {
    width: "125px",
    height: "auto",

    objectFit:
      "contain" as const,
  },

  divisorCabecalho: {
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
  botaoVoltar: {
    height: "42px",

    background:
      tema.cores.branco,

    color:
      tema.cores.grafite,

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.pequena,

    padding: "0 15px",

    cursor: "pointer",

    fontWeight: 600,
    fontSize: "13px",
  },

  conteudo: {
    width: "100%",
    maxWidth: "1600px",

    margin: "0 auto",

    padding: "38px 24px 60px",

    boxSizing:
      "border-box" as const,
  },

  topoProjeto: {
    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "center",

    gap: "25px",

    marginBottom: "26px",
  },

  sobretitulo: {
  color:
    tema.cores.laranja,

  fontSize: "11px",
  fontWeight: 800,

  letterSpacing: "1.5px",
  },

  informacoesTopo: {
    display: "flex",
    alignItems: "center",

    gap: "8px",

    marginTop: "8px",

    color:
      tema.cores.textoSecundario,

    fontSize: "13px",
  },

  separadorTopo: {
    color:
      tema.cores.laranja,
  },

  statusProjeto: {
    padding: "8px 13px",

    borderRadius: "20px",

    fontSize: "12px",
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

    color: "#C2410C",

    border:
      "1px solid #FED7AA",
  },

  tituloProjeto: {
    margin: "7px 0 0",

    color:
      tema.cores.grafite,

    fontSize: "30px",

    letterSpacing: "-0.5px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "1fr",
    gap: "20px",
  },

  cardDados: {
    background:
      tema.cores.branco,

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.grande,

    padding: "26px",

    boxShadow:
      tema.sombras.card,
  },

  tituloCard: {
    margin: "0 0 22px",

    color:
      tema.cores.grafite,

    fontSize: "17px",
  },
  dados: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "22px",
  },

  rotulo: {
    display: "block",

    color:
      tema.cores.textoSecundario,

    fontSize: "11px",
    fontWeight: 600,

    marginBottom: "5px",

    textTransform:
      "uppercase" as const,

    letterSpacing: "0.5px",
  },

  observacoes: {
    marginTop: "22px",

    paddingTop: "18px",

    borderTop:
      `1px solid ${tema.cores.borda}`,

    color:
      tema.cores.grafite,

    fontSize: "14px",
  },

  tituloEtapas: {
    margin: "34px 0 16px",

    color:
      tema.cores.grafite,

    fontSize: "18px",
  },

  etapas: {
    display: "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",

    gap: "16px",
  },

  etapa: {
    position: "relative" as const,

    minHeight: "125px",

    padding: "20px",

    background:
      tema.cores.branco,

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.media,

    cursor: "pointer",

    textAlign: "left" as const,

    display: "flex",

    flexDirection:
      "column" as const,

    justifyContent:
      "space-between",

    gap: "14px",

    boxShadow:
      tema.sombras.card,
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

    color:
      tema.cores.grafite,
  },

  descricaoEtapa: {
    color:
      tema.cores.textoSecundario,

    fontSize: "13px",

    lineHeight: 1.5,
  },

  statusConcluido: {
    background:
      tema.cores.sucessoFundo,

    color:
      "#166534",

    border:
      "1px solid #BBF7D0",

    borderRadius: "20px",

    padding: "5px 9px",

    fontSize: "11px",

    fontWeight: 700,

    whiteSpace:
      "nowrap" as const,
  },

  statusPendente: {
    background:
      tema.cores.avisoFundo,

    color:
      "#C2410C",

    border:
      "1px solid #FED7AA",

    borderRadius: "20px",

    padding: "5px 9px",

    fontSize: "11px",

    fontWeight: 700,

    whiteSpace:
      "nowrap" as const,
  },
  statusBloqueado: {
    background:
      tema.cores.cinza,

    color:
      tema.cores.bloqueado,

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius: "20px",

    padding: "5px 9px",

    fontSize: "11px",

    fontWeight: 700,

    whiteSpace:
      "nowrap" as const,
  },

  etapaBloqueada: {
    background:
      "#FAFAF9",

    opacity: 0.55,

    cursor: "not-allowed",
  },
  botaoReabrir: {
    background:
      tema.cores.branco,

    color:
      tema.cores.grafite,

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.pequena,

    padding: "11px 17px",

    cursor: "pointer",

    fontWeight: 700,
    fontSize: "13px",
  },
  areaReabrir: {
    marginTop: "30px",

    paddingTop: "20px",

    borderTop:
      `1px solid ${tema.cores.borda}`,

    display: "flex",

    justifyContent:
      "flex-end",
  },

  overlayModal: {
    position: "fixed" as const,
    inset: 0,

    background:
      "rgba(23, 23, 23, 0.70)",

    backdropFilter:
      "blur(4px)",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    padding: "20px",

    zIndex: 9999,
  },

  modal: {
    width: "100%",
    maxWidth: "470px",

    background:
      tema.cores.branco,

    borderRadius:
      tema.bordas.modal,

    padding: "30px",

    border:
      `1px solid ${tema.cores.borda}`,

    boxShadow:
      tema.sombras.destaque,
  },

  iconeModal: {
    width: "52px",
    height: "52px",

    borderRadius: "16px",

    background:
      tema.cores.laranja,

    color:
      tema.cores.branco,

    display: "flex",

    alignItems: "center",
    justifyContent: "center",

    fontSize: "25px",
    fontWeight: 700,

    marginBottom: "20px",
  },

  tituloModal: {
    margin: 0,

    color:
      tema.cores.grafite,

    fontSize: "23px",
  },

  textoModal: {
    margin: "10px 0 20px",

    color:
      tema.cores.textoSecundario,

    fontSize: "14px",

    lineHeight: 1.6,
  },

  avisoModal: {
    background:
      tema.cores.avisoFundo,

    border:
      "1px solid #FED7AA",

    borderRadius:
      tema.bordas.media,

    padding: "16px",

    display: "flex",

    flexDirection:
      "column" as const,

    gap: "6px",

    color:
      tema.cores.grafite,

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
    background:
      tema.cores.branco,

    color:
      tema.cores.grafite,

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.pequena,

    padding: "12px 18px",

    cursor: "pointer",

    fontWeight: 600,
  },

  botaoConfirmarModal: {
    background:
      tema.cores.laranja,

    color:
      tema.cores.branco,

    border: "none",

    borderRadius:
      tema.bordas.pequena,

    padding: "12px 18px",

    cursor: "pointer",

    fontWeight: 700,
  },
};