"use client";

import Image from "next/image";

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

import { tema } from "@/estilos/tema";

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
                Relatório Final
              </strong>
            </div>
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
            Voltar ao resumo
          </button>
        </div>
      </header>

      <section style={estilos.conteudo}>
        <div style={estilos.topoPagina}>
          <span style={estilos.sobretitulo}>
            RELATÓRIO FINAL
          </span>

          <h1 style={estilos.tituloPagina}>
            Documento consolidado
          </h1>

          <p style={estilos.descricaoPagina}>
            Visualize, atualize e baixe o relatório
            final com as informações de fabricação,
            logística, montagem e resumo financeiro
            do projeto.
          </p>
        </div>

        <div style={estilos.card}>
          <div style={estilos.cabecalhoRelatorio}>
            <div>
              <h2 style={estilos.titulo}>
                Relatório Final do Projeto
              </h2>

              <p style={estilos.descricao}>
                O documento abaixo representa a versão
                consolidada do orçamento.
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
              <div style={estilos.estadoConteudo}>
                <div style={estilos.estadoIcone}>
                  PDF
                </div>

                <strong>
                  Gerando relatório...
                </strong>

                <span>
                  Aguarde enquanto o documento é preparado.
                </span>
              </div>
            </div>
          )}

          {erro && (
            <div style={estilos.erro}>
              <strong>
                Não foi possível abrir o relatório.
              </strong>

              <span>
                {erro}
              </span>

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
              <div style={estilos.pdfArea}>
                <div style={estilos.pdfBarra}>
                  <div style={estilos.pdfIdentificacao}>
                    <div style={estilos.pdfIcone}>
                      PDF
                    </div>

                    <div>
                      <strong style={estilos.pdfTitulo}>
                        Relatório Estrutec
                      </strong>

                      <span style={estilos.pdfDescricao}>
                        Visualização do documento final
                      </span>
                    </div>
                  </div>

                  <span style={estilos.statusDocumento}>
                    Documento gerado
                  </span>
                </div>

                <div style={estilos.pdfContainer}>
                  <iframe
                    src={urlPdf}
                    title="Relatório final do projeto"
                    style={estilos.pdf}
                  />
                </div>
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
    background: tema.cores.fundo,
    color: tema.cores.grafite,
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
    maxWidth: "1300px",
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

  cabecalhoRelatorio: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
    paddingBottom: "22px",
    borderBottom:
      `1px solid ${tema.cores.borda}`,
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

  acoes: {
    display: "flex",
    gap: "10px",
  },

  botaoSecundario: {
    height: "42px",
    padding: "0 16px",
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

  botaoPrincipal: {
    height: "42px",
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

  estado: {
    marginTop: "24px",
    minHeight: "500px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#FAFAF9",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.pequena,
  },

  estadoConteudo: {
    display: "flex",
    flexDirection:
      "column" as const,
    alignItems: "center",
    gap: "8px",
    color:
      tema.cores.textoSecundario,
    fontSize: "12px",
  },

  estadoIcone: {
    width: "54px",
    height: "54px",
    marginBottom: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#FFF7ED",
    color:
      tema.cores.laranja,
    border:
      "1px solid #FED7AA",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: 800,
  },

  erro: {
    marginTop: "24px",
    padding: "18px",
    background:
      tema.cores.erroFundo,
    border:
      "1px solid #FECACA",
    borderRadius:
      tema.bordas.pequena,
    color:
      tema.cores.erro,
    display: "flex",
    flexDirection:
      "column" as const,
    alignItems:
      "flex-start",
    gap: "7px",
    fontSize: "12px",
  },

  botaoTentar: {
    marginTop: "6px",
    height: "38px",
    padding: "0 13px",
    background:
      tema.cores.branco,
    color:
      tema.cores.erro,
    border:
      "1px solid #FECACA",
    borderRadius:
      tema.bordas.pequena,
    cursor: "pointer",
    fontWeight: 600,
  },

  pdfArea: {
    marginTop: "24px",
  },

  pdfBarra: {
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "20px",
    background: "#FAFAF9",
    border:
      `1px solid ${tema.cores.borda}`,
    borderBottom: "none",
    borderRadius:
      `${tema.bordas.pequena} ${tema.bordas.pequena} 0 0`,
  },

  pdfIdentificacao: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  pdfIcone: {
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#FFF7ED",
    color:
      tema.cores.laranja,
    border:
      "1px solid #FED7AA",
    borderRadius: "7px",
    fontSize: "10px",
    fontWeight: 800,
  },

  pdfTitulo: {
    display: "block",
    color:
      tema.cores.grafite,
    fontSize: "12px",
  },

  pdfDescricao: {
    display: "block",
    marginTop: "2px",
    color:
      tema.cores.textoSecundario,
    fontSize: "10px",
  },

  statusDocumento: {
    padding: "6px 10px",
    background: "#F0FDF4",
    color: "#15803D",
    border:
      "1px solid #BBF7D0",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: 700,
  },

  pdfContainer: {
    height: "750px",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      `0 0 ${tema.bordas.pequena} ${tema.bordas.pequena}`,
    overflow: "hidden",
    background: "#F5F5F4",
  },

  pdf: {
    width: "100%",
    height: "100%",
    border: "none",
  },
};