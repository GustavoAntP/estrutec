"use client";

import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  apiAutenticada,
} from "@/servicos/api";

type ResumoImportacao = {
  totalLinhas: number;
  totalPecas: number;
  pilares: number;
  vigas: number;
  elementosComErro: number;
};

type RespostaImportacao = {
  mensagem: string;

  projeto?: {
    id: number;
    codigo: string;
    nome: string;
  };

  arquivo?: string;

  resumo: ResumoImportacao;

  elementos: ElementoImportado[];

  erros: string[];    
};

type ElementoImportado = {
  linha?: number;
  linhaOrigem?: number;
  linha_origem?: number;

  nomeAplicacao?: string;
  nome_aplicacao?: string;

  tipo?: string;
  secao?: string;
  aplicacao?: string | null;

  largura?: number | string;
  altura?: number | string;
  comprimento?: number | string;

  quantidade?: number;

  areaSecao?: number | string | null;
  area_secao?: number | string | null;

  valido?: boolean;
  erros?: string[];
};

export default function ImportacaoPage() {
  const router = useRouter();

  const params =
    useParams<{ id: string }>();

  const id = params.id;

  const [arquivo, setArquivo] =
    useState<File | null>(null);

  const [resultado, setResultado] =
    useState<RespostaImportacao | null>(
      null
    );

  const [erro, setErro] =
    useState("");

  const [enviando, setEnviando] =
    useState(false);

  const [confirmando, setConfirmando] =
    useState(false);

  const [confirmado, setConfirmado] =
    useState(false);

  const [
    mensagemConfirmacao,
    setMensagemConfirmacao,
    ] = useState("");

  function obterLinha(
    elemento: ElementoImportado
  ) {
    return (
      elemento.linhaOrigem ??
      elemento.linha_origem ??
      elemento.linha ??
      "-"
    );
  }

  function obterNome(
    elemento: ElementoImportado
  ) {
    return (
      elemento.nomeAplicacao ??
      elemento.nome_aplicacao ??
      "-"
    );
  }

  function formatarNumero(
    valor?: number | string | null,
    casas = 3
  ) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return "-";
    }

    const numero = Number(valor);

    if (Number.isNaN(numero)) {
      return String(valor);
    }

    return numero.toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas,
      }
    );
  }

  function selecionarArquivo(
    evento: ChangeEvent<HTMLInputElement>
  ) {
    setErro("");
    setResultado(null);

    const selecionado =
      evento.target.files?.[0];

    if (!selecionado) {
      setArquivo(null);
      return;
    }

    if (
      !selecionado.name
        .toLowerCase()
        .endsWith(".xlsx")
    ) {
      setArquivo(null);

      setErro(
        "Selecione uma planilha no formato .xlsx."
      );

      return;
    }

    setArquivo(selecionado);
  }


  async function enviarPlanilha(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (!arquivo) {
      setErro(
        "Selecione uma planilha antes de continuar."
      );

      return;
    }

    setErro("");
    setEnviando(true);
    setResultado(null);

    try {
      const formData = new FormData();

      formData.append(
        "arquivo",
        arquivo
      );

      const resposta =
        await apiAutenticada(
          `/projetos/${id}/importar-planilha`,
          {
            method: "POST",
            body: formData,
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
            "Não foi possível importar a planilha."
        );

        return;
      }

      setResultado(dados);
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setEnviando(false);
    }
  }

    async function confirmarImportacao() {
    if (!resultado) {
        return;
    }

    if (
        resultado.resumo.elementosComErro > 0
    ) {
        setErro(
        "Corrija os elementos com erro antes de confirmar a importação."
        );

        return;
    }

    setErro("");
    setConfirmando(true);
    setMensagemConfirmacao("");

    try {
        const resposta =
        await apiAutenticada(
            `/projetos/${id}/confirmar-importacao`,
            {
            method: "POST",

            body: JSON.stringify({
                elementos:
                resultado.elementos,
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

        const dados =
        await resposta.json();

        if (!resposta.ok) {
        setErro(
            dados.erro ||
            "Não foi possível confirmar a importação."
        );

        return;
        }

        setConfirmado(true);

        setMensagemConfirmacao(
        dados.mensagem ||
            "Importação confirmada com sucesso!"
        );
    } catch {
        setErro(
        "Não foi possível conectar ao servidor."
        );
    } finally {
        setConfirmando(false);
    }
    }

  return (
    <main style={estilos.pagina}>
      <header style={estilos.cabecalho}>
        <div>
          <h1 style={estilos.logo}>
            ESTRUTEC
          </h1>

          <p style={estilos.subtitulo}>
            Importação da Planilha
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
          <h2 style={estilos.titulo}>
            Importar elementos pré-moldados
          </h2>

          <p style={estilos.descricao}>
            Selecione a planilha padrão
            contendo os elementos estruturais
            do projeto.
          </p>

          <form
            onSubmit={enviarPlanilha}
            style={estilos.formulario}
          >
            <div style={estilos.upload}>
              <label
                htmlFor="arquivo"
                style={estilos.label}
              >
                Planilha Excel (.xlsx)
              </label>

              <input
                id="arquivo"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={
                  selecionarArquivo
                }
              />

              {arquivo && (
                <div
                  style={
                    estilos.arquivoSelecionado
                  }
                >
                  <strong>
                    Arquivo selecionado:
                  </strong>

                  <span>
                    {arquivo.name}
                  </span>
                </div>
              )}
            </div>

            {erro && (
              <div style={estilos.erro}>
                {erro}
              </div>
            )}

            <div style={estilos.acoes}>
              <button
                type="submit"
                disabled={
                  !arquivo || enviando
                }
                style={estilos.botaoEnviar}
              >
                {enviando
                  ? "Processando..."
                  : "Importar planilha"}
              </button>
            </div>
          </form>
        </div>

        {resultado && (
        <div style={estilos.cardResultado}>
            <h3 style={estilos.tituloResultado}>
            Planilha processada
            </h3>

            <p style={estilos.sucesso}>
            {resultado.mensagem}
            </p>

            <div style={estilos.resumo}>
            <div style={estilos.indicador}>
                <span>
                Linhas identificadas
                </span>

                <strong>
                {resultado.resumo.totalLinhas}
                </strong>
            </div>

            <div style={estilos.indicador}>
                <span>Total de peças</span>

                <strong>
                {resultado.resumo.totalPecas}
                </strong>
            </div>

            <div style={estilos.indicador}>
                <span>Pilares</span>

                <strong>
                {resultado.resumo.pilares}
                </strong>
            </div>

            <div style={estilos.indicador}>
                <span>Vigas</span>

                <strong>
                {resultado.resumo.vigas}
                </strong>
            </div>

            <div style={estilos.indicador}>
                <span>
                Elementos com erro
                </span>

                <strong>
                {
                    resultado.resumo
                    .elementosComErro
                }
                </strong>
            </div>
            </div>

            <div style={estilos.preview}>
            <div style={estilos.cabecalhoPreview}>
                <div>
                <h3 style={estilos.tituloPreview}>
                    Elementos identificados
                </h3>

                <p
                    style={
                    estilos.descricaoPreview
                    }
                >
                    Confira os dados antes de
                    confirmar a importação.
                </p>
                </div>

                <span
                style={
                    estilos.quantidadePreview
                }
                >
                {resultado.elementos.length}
                {" "}registro(s)
                </span>
            </div>

            <div
                style={estilos.tabelaContainer}
            >
                <table style={estilos.tabela}>
                <thead>
                    <tr>
                    <th style={estilos.th}>
                        Linha
                    </th>

                    <th style={estilos.th}>
                        Elemento
                    </th>

                    <th style={estilos.th}>
                        Tipo
                    </th>

                    <th style={estilos.th}>
                        Seção
                    </th>

                    <th style={estilos.th}>
                        B (m)
                    </th>

                    <th style={estilos.th}>
                        H (m)
                    </th>

                    <th style={estilos.th}>
                        Comp. (m)
                    </th>

                    <th style={estilos.th}>
                        Qtde.
                    </th>

                    <th style={estilos.th}>
                        Situação
                    </th>
                    </tr>
                </thead>

                <tbody>
                    {resultado.elementos.map(
                    (elemento, indice) => (
                        <tr key={indice}>
                        <td style={estilos.td}>
                            {obterLinha(
                            elemento
                            )}
                        </td>

                        <td style={estilos.td}>
                            {obterNome(
                            elemento
                            )}
                        </td>

                        <td style={estilos.td}>
                            {elemento.tipo ||
                            "-"}
                        </td>

                        <td style={estilos.td}>
                            {elemento.secao ||
                            "-"}
                        </td>

                        <td style={estilos.td}>
                            {formatarNumero(
                            elemento.largura
                            )}
                        </td>

                        <td style={estilos.td}>
                            {formatarNumero(
                            elemento.altura
                            )}
                        </td>

                        <td style={estilos.td}>
                            {formatarNumero(
                            elemento.comprimento
                            )}
                        </td>

                        <td style={estilos.td}>
                            {
                            elemento.quantidade ??
                            "-"
                            }
                        </td>

                        <td style={estilos.td}>
                            {elemento.erros &&
                            elemento.erros
                            .length > 0 ? (
                            <span
                                style={
                                estilos.comErro
                                }
                            >
                                Com erro
                            </span>
                            ) : (
                            <span
                                style={
                                estilos.valido
                                }
                            >
                                Válido
                            </span>
                            )}
                        </td>
                        </tr>
                    )
                    )}
                </tbody>
                </table>
            </div>
            </div>


            {/* ERROS GERAIS, SE EXISTIREM */}

            {resultado.erros &&
            resultado.erros.length > 0 && (
                <div
                style={estilos.listaErros}
                >
                <strong>
                    Problemas encontrados:
                </strong>

                <ul>
                    {resultado.erros.map(
                    (erro, indice) => (
                        <li key={indice}>
                        {String(erro)}
                        </li>
                    )
                    )}
                </ul>
                </div>
            )}
                <div style={estilos.acoesConfirmacao}>
                {confirmado ? (
                    <>
                    <div
                        style={
                        estilos.confirmacaoSucesso
                        }
                    >
                        {mensagemConfirmacao}
                    </div>

                    <button
                        type="button"
                        style={estilos.botaoContinuar}
                        onClick={() =>
                        router.push(
                            `/projetos/${id}/fabricacao`
                        )
                        }
                    >
                        Continuar para fabricação →
                    </button>
                    </>
                ) : (
                    <button
                    type="button"
                    onClick={confirmarImportacao}
                    disabled={
                        confirmando ||
                        resultado.resumo
                        .elementosComErro > 0
                    }
                    style={
                        estilos.botaoConfirmar
                    }
                    >
                    {confirmando
                        ? "Confirmando..."
                        : "Confirmar importação"}
                    </button>
                )}
                </div>
        </div>
        )}
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

  titulo: {
    margin: 0,
    fontSize: "22px",
  },

  descricao: {
    margin: "8px 0 25px",
    color: "#6b7280",
    lineHeight: 1.5,
  },

  formulario: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },

  upload: {
    padding: "25px",
    border: "2px dashed #d1d5db",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },

  label: {
    fontWeight: 600,
    fontSize: "14px",
  },

  arquivoSelecionado: {
    marginTop: "5px",
    padding: "10px",
    background: "#f3f4f6",
    borderRadius: "6px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
    fontSize: "13px",
  },

  erro: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "11px",
    borderRadius: "6px",
    fontSize: "13px",
  },

  acoes: {
    display: "flex",
    justifyContent: "flex-end",
  },

  botaoEnviar: {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "12px 18px",
    fontWeight: 600,
    cursor: "pointer",
  },

  cardResultado: {
    marginTop: "20px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "30px",
  },

  tituloResultado: {
    margin: 0,
    fontSize: "18px",
  },

  sucesso: {
    color: "#166534",
    marginTop: "8px",
  },

  resumo: {
    marginTop: "20px",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
  },

  indicador: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "7px",
    padding: "15px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  preview: {
  marginTop: "30px",
    },

    cabecalhoPreview: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "15px",
    },

    tituloPreview: {
    margin: 0,
    fontSize: "18px",
    },

    descricaoPreview: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px",
    },

    quantidadePreview: {
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "7px 12px",
    fontSize: "12px",
    whiteSpace: "nowrap" as const,
    },

    tabelaContainer: {
    width: "100%",
    overflowX: "auto" as const,
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    },

    tabela: {
    width: "100%",
    minWidth: "950px",
    borderCollapse: "collapse" as const,
    },

    th: {
    background: "#f9fafb",
    color: "#4b5563",
    textAlign: "left" as const,
    padding: "12px 14px",
    fontSize: "12px",
    fontWeight: 600,
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap" as const,
    },

    td: {
    padding: "12px 14px",
    fontSize: "13px",
    borderBottom: "1px solid #f0f0f0",
    whiteSpace: "nowrap" as const,
    },

    valido: {
    display: "inline-block",
    background: "#dcfce7",
    color: "#166534",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 600,
    },

    comErro: {
    display: "inline-block",
    background: "#fee2e2",
    color: "#991b1b",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 600,
    },

    listaErros: {
    marginTop: "15px",
    padding: "15px",
    background: "#fff7ed",
    color: "#9a3412",
    border: "1px solid #fed7aa",
    borderRadius: "7px",
    fontSize: "13px",
    },
    acoesConfirmacao: {
    marginTop: "25px",
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

    confirmacaoSucesso: {
    marginRight: "auto",
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
    padding: "11px 14px",
    borderRadius: "6px",
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