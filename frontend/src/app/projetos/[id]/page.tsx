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
            <strong>
              1. Importação
            </strong>

            <span>
              Planilha de elementos
              pré-moldados
            </span>
          </button>

          <button
            style={estilos.etapa}
            onClick={() =>
              abrirEtapa("fabricacao")
            }
          >
            <strong>
              2. Fabricação
            </strong>

            <span>
              Materiais, volumes e custos
            </span>
          </button>

          <button
            style={estilos.etapa}
            onClick={() =>
              abrirEtapa("logistica")
            }
          >
            <strong>
              3. Logística
            </strong>

            <span>
              Frete próprio ou terceirizado
            </span>
          </button>

          <button
            style={estilos.etapa}
            onClick={() =>
              abrirEtapa("montagem")
            }
          >
            <strong>
              4. Montagem
            </strong>

            <span>
              Equipamentos, equipe e custos
            </span>
          </button>

          <button
            style={estilos.etapa}
            onClick={() =>
              abrirEtapa("resumo")
            }
          >
            <strong>
              5. Resumo Financeiro
            </strong>

            <span>
              Custos, BDI e valor final
            </span>
          </button>

          <button
            style={estilos.etapa}
            onClick={() =>
              abrirEtapa("relatorio")
            }
          >
            <strong>
              6. Relatório
            </strong>

            <span>
              Relatório final em PDF
            </span>
          </button>
        </div>
      </section>
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
};