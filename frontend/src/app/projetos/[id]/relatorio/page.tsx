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

export default function RelatorioPage() {
  const router = useRouter();

  const params =
    useParams<{ id: string }>();

  const id = params.id;

  const [urlPdf, setUrlPdf] =
    useState<string | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    carregarRelatorio();

    return () => {
      if (urlPdf) {
        URL.revokeObjectURL(urlPdf);
      }
    };
  }, [id]);

  async function carregarRelatorio() {
    setCarregando(true);
    setErro("");

    try {
      const resposta =
        await apiAutenticada(
          `/projetos/${id}/relatorio-final`,
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

      if (!resposta.ok) {
        let mensagem =
          "Não foi possível gerar o relatório final.";

        try {
          const dados =
            await resposta.json();

          mensagem =
            dados.erro || mensagem;
        } catch {
          // mantém a mensagem padrão
        }

        setErro(mensagem);
        return;
      }

      const blob =
        await resposta.blob();

      const url =
        URL.createObjectURL(blob);

      setUrlPdf((urlAnterior) => {
        if (urlAnterior) {
          URL.revokeObjectURL(
            urlAnterior
          );
        }

        return url;
      });
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setCarregando(false);
    }
  }

  function baixarRelatorio() {
    if (!urlPdf) {
      return;
    }

    const link =
      document.createElement("a");

    link.href = urlPdf;

    link.download =
      `relatorio-estrutec-projeto-${id}.pdf`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  }

  return (
    <main style={estilos.pagina}>
      <header style={estilos.cabecalho}>
        <div>
          <h1 style={estilos.logo}>
            ESTRUTEC
          </h1>

          <p style={estilos.subtitulo}>
            Relatório Final
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              `/projetos/${id}/resumo`
            )
          }
          style={estilos.botaoVoltar}
        >
          ← Voltar ao resumo
        </button>
      </header>

      <section style={estilos.conteudo}>
        <div style={estilos.card}>
          <div style={estilos.cabecalhoRelatorio}>
            <div>
              <h2 style={estilos.titulo}>
                Relatório Final do Projeto
              </h2>

              <p style={estilos.descricao}>
                Documento consolidado com
                fabricação, logística,
                montagem e resumo financeiro.
              </p>
            </div>

            {urlPdf && (
              <div style={estilos.acoes}>
                <button
                  type="button"
                  onClick={carregarRelatorio}
                  style={estilos.botaoSecundario}
                >
                  Atualizar
                </button>

                <button
                  type="button"
                  onClick={baixarRelatorio}
                  style={estilos.botaoPrincipal}
                >
                  Baixar PDF
                </button>
              </div>
            )}
          </div>

          {carregando && (
            <div style={estilos.estado}>
              Gerando relatório...
            </div>
          )}

          {erro && (
            <div style={estilos.erro}>
              <strong>
                Não foi possível abrir o relatório.
              </strong>

              <span>{erro}</span>

              <button
                type="button"
                onClick={carregarRelatorio}
                style={estilos.botaoTentar}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!carregando &&
            !erro &&
            urlPdf && (
              <div style={estilos.pdfContainer}>
                <iframe
                  src={urlPdf}
                  title="Relatório final do projeto"
                  style={estilos.pdf}
                />
              </div>
            )}
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

  cabecalho: {
    minHeight: "80px",
    background: "#ffffff",
    borderBottom:
      "1px solid #e5e7eb",
    padding: "16px 40px",
    display: "flex",
    justifyContent:
      "space-between",
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
    border:
      "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "10px 15px",
    cursor: "pointer",
  },

  conteudo: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "35px 40px",
  },

  card: {
    background: "#ffffff",
    border:
      "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "30px",
  },

  cabecalhoRelatorio: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
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

  acoes: {
    display: "flex",
    gap: "10px",
  },

  botaoSecundario: {
    background: "#ffffff",
    color: "#374151",
    border:
      "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "11px 16px",
    cursor: "pointer",
    fontWeight: 600,
  },

  botaoPrincipal: {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "11px 18px",
    cursor: "pointer",
    fontWeight: 600,
  },

  estado: {
    marginTop: "30px",
    minHeight: "400px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f9fafb",
    borderRadius: "10px",
    color: "#6b7280",
  },

  erro: {
    marginTop: "25px",
    padding: "20px",
    background: "#fef2f2",
    border:
      "1px solid #fecaca",
    borderRadius: "10px",
    color: "#991b1b",
    display: "flex",
    flexDirection:
      "column" as const,
    gap: "8px",
  },

  botaoTentar: {
    marginTop: "5px",
    alignSelf:
      "flex-start" as const,
    background: "#ffffff",
    border:
      "1px solid #fecaca",
    borderRadius: "7px",
    padding: "9px 13px",
    cursor: "pointer",
  },

  pdfContainer: {
    marginTop: "25px",
    height: "750px",
    border:
      "1px solid #d1d5db",
    borderRadius: "10px",
    overflow: "hidden",
    background: "#f3f4f6",
  },

  pdf: {
    width: "100%",
    height: "100%",
    border: "none",
  },
};