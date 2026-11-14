"use client";

import Image from "next/image";

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

import { tema } from "@/estilos/tema";

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

  areaSecao?:
    | number
    | string
    | null;

  area_secao?:
    | number
    | string
    | null;

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

  const [
    resultado,
    setResultado,
  ] =
    useState<RespostaImportacao | null>(
      null
    );

  const [erro, setErro] =
    useState("");

  const [enviando, setEnviando] =
    useState(false);

  const [
    confirmando,
    setConfirmando,
  ] = useState(false);

  const [
    confirmado,
    setConfirmado,
  ] = useState(false);

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
    valor?:
      | number
      | string
      | null,
    casas = 3
  ) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return "-";
    }

    const numero =
      Number(valor);

    if (
      Number.isNaN(numero)
    ) {
      return String(valor);
    }

    return numero.toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits:
          casas,

        maximumFractionDigits:
          casas,
      }
    );
  }

  function selecionarArquivo(
    evento:
      ChangeEvent<HTMLInputElement>
  ) {
    setErro("");
    setResultado(null);
    setConfirmado(false);
    setMensagemConfirmacao("");

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
    evento:
      FormEvent<HTMLFormElement>
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
    setConfirmado(false);
    setMensagemConfirmacao("");

    try {
      const formData =
        new FormData();

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

      if (
        resposta.status === 401
      ) {
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
      resultado.resumo
        .elementosComErro > 0
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

            body:
              JSON.stringify({
                elementos:
                  resultado.elementos,
              }),
          }
        );

      if (
        resposta.status === 401
      ) {
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

  const possuiErros =
    Boolean(
      resultado &&
        resultado.resumo
          .elementosComErro > 0
    );

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
                Projetos
              </span>

              <strong
                style={
                  estilos.tituloCabecalho
                }
              >
                Importação
              </strong>
            </div>
          </div>

          <button
            type="button"
            style={
              estilos.botaoVoltar
            }
            onClick={() =>
              router.push(
                `/projetos/${id}`
              )
            }
          >
            Voltar ao projeto
          </button>
        </div>
      </header>

      <section
        style={estilos.conteudo}
      >
        <div style={estilos.topo}>
          <span
            style={
              estilos.sobretitulo
            }
          >
            IMPORTAÇÃO
          </span>

          <h1
            style={estilos.tituloPagina}
          >
            Elementos pré-moldados
          </h1>

          <p
            style={
              estilos.descricaoPagina
            }
          >
            Importe a planilha do
            projeto e confira os
            elementos identificados
            antes de prosseguir para a
            fabricação.
          </p>
        </div>

        <div style={estilos.card}>
          <div
            style={
              estilos.cardCabecalho
            }
          >
            <div>
              <h2
                style={
                  estilos.tituloCard
                }
              >
                Importar planilha
              </h2>

              <p
                style={
                  estilos.descricaoCard
                }
              >
                O arquivo deve estar no
                formato Excel (.xlsx).
              </p>
            </div>

            <span
              style={
                estilos.formatoArquivo
              }
            >
              .XLSX
            </span>
          </div>

          <form
            onSubmit={
              enviarPlanilha
            }
            style={
              estilos.formulario
            }
          >
            <div
              style={estilos.upload}
            >
              <div
                style={
                  estilos.iconeUpload
                }
              >
                XLS
              </div>

              <div
                style={
                  estilos.uploadConteudo
                }
              >
                <label
                  htmlFor="arquivo"
                  style={
                    estilos.label
                  }
                >
                  Selecione a planilha
                  do projeto
                </label>

                <span
                  style={
                    estilos.ajudaUpload
                  }
                >
                  Somente arquivos
                  Excel no formato
                  .xlsx.
                </span>

                <input
                  id="arquivo"
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={
                    selecionarArquivo
                  }
                  style={
                    estilos.inputArquivo
                  }
                />
              </div>
            </div>

            {arquivo && (
              <div
                style={
                  estilos.arquivoSelecionado
                }
              >
                <div
                  style={
                    estilos.arquivoIcone
                  }
                >
                  ✓
                </div>

                <div>
                  <span
                    style={
                      estilos.arquivoRotulo
                    }
                  >
                    Arquivo selecionado
                  </span>

                  <strong
                    style={
                      estilos.arquivoNome
                    }
                  >
                    {arquivo.name}
                  </strong>
                </div>
              </div>
            )}

            {erro && (
              <div
                style={
                  estilos.erro
                }
              >
                <strong>
                  Atenção
                </strong>

                <span>
                  {erro}
                </span>
              </div>
            )}

            <div
              style={estilos.acoes}
            >
              <button
                type="submit"
                disabled={
                  !arquivo ||
                  enviando
                }
                style={{
                  ...estilos
                    .botaoEnviar,

                  ...(!arquivo ||
                  enviando
                    ? estilos
                        .botaoDesabilitado
                    : {}),
                }}
              >
                {enviando
                  ? "Processando..."
                  : "Importar planilha"}
              </button>
            </div>
          </form>
        </div>

        {resultado && (
          <div
            style={
              estilos.cardResultado
            }
          >
            <div
              style={
                estilos.resultadoCabecalho
              }
            >
              <div>
                <span
                  style={
                    estilos.sobretituloResultado
                  }
                >
                  RESULTADO DA IMPORTAÇÃO
                </span>

                <h2
                  style={
                    estilos.tituloResultado
                  }
                >
                  Planilha processada
                </h2>

                <p
                  style={
                    estilos.sucesso
                  }
                >
                  {resultado.mensagem}
                </p>
              </div>

              <div
                style={{
                  ...estilos
                    .statusResultado,

                  ...(possuiErros
                    ? estilos
                        .statusComErro
                    : estilos
                        .statusValido),
                }}
              >
                {possuiErros
                  ? "Revisão necessária"
                  : "Pronto para confirmar"}
              </div>
            </div>

            <div
              style={
                estilos.resumo
              }
            >
              <div
                style={
                  estilos.indicador
                }
              >
                <span
                  style={
                    estilos.indicadorRotulo
                  }
                >
                  Linhas identificadas
                </span>

                <strong
                  style={
                    estilos.indicadorValor
                  }
                >
                  {
                    resultado.resumo
                      .totalLinhas
                  }
                </strong>
              </div>

              <div
                style={
                  estilos.indicador
                }
              >
                <span
                  style={
                    estilos.indicadorRotulo
                  }
                >
                  Total de peças
                </span>

                <strong
                  style={
                    estilos.indicadorValor
                  }
                >
                  {
                    resultado.resumo
                      .totalPecas
                  }
                </strong>
              </div>

              <div
                style={
                  estilos.indicador
                }
              >
                <span
                  style={
                    estilos.indicadorRotulo
                  }
                >
                  Pilares
                </span>

                <strong
                  style={
                    estilos.indicadorValor
                  }
                >
                  {
                    resultado.resumo
                      .pilares
                  }
                </strong>
              </div>

              <div
                style={
                  estilos.indicador
                }
              >
                <span
                  style={
                    estilos.indicadorRotulo
                  }
                >
                  Vigas
                </span>

                <strong
                  style={
                    estilos.indicadorValor
                  }
                >
                  {
                    resultado.resumo
                      .vigas
                  }
                </strong>
              </div>

              <div
                style={{
                  ...estilos.indicador,

                  ...(possuiErros
                    ? estilos
                        .indicadorErro
                    : {}),
                }}
              >
                <span
                  style={
                    estilos.indicadorRotulo
                  }
                >
                  Elementos com erro
                </span>

                <strong
                  style={{
                    ...estilos
                      .indicadorValor,

                    ...(possuiErros
                      ? estilos
                          .valorErro
                      : {}),
                  }}
                >
                  {
                    resultado.resumo
                      .elementosComErro
                  }
                </strong>
              </div>
            </div>

            <div
              style={
                estilos.preview
              }
            >
              <div
                style={
                  estilos.cabecalhoPreview
                }
              >
                <div>
                  <h3
                    style={
                      estilos.tituloPreview
                    }
                  >
                    Elementos
                    identificados
                  </h3>

                  <p
                    style={
                      estilos.descricaoPreview
                    }
                  >
                    Confira os dados
                    antes de confirmar
                    a importação.
                  </p>
                </div>

                <span
                  style={
                    estilos.quantidadePreview
                  }
                >
                  {
                    resultado.elementos
                      .length
                  }{" "}
                  registro(s)
                </span>
              </div>

              <div
                style={
                  estilos.tabelaContainer
                }
              >
                <table
                  style={
                    estilos.tabela
                  }
                >
                  <thead>
                    <tr>
                      <th
                        style={
                          estilos.th
                        }
                      >
                        Linha
                      </th>

                      <th
                        style={
                          estilos.th
                        }
                      >
                        Elemento
                      </th>

                      <th
                        style={
                          estilos.th
                        }
                      >
                        Tipo
                      </th>

                      <th
                        style={
                          estilos.th
                        }
                      >
                        Seção
                      </th>

                      <th
                        style={
                          estilos.th
                        }
                      >
                        B (m)
                      </th>

                      <th
                        style={
                          estilos.th
                        }
                      >
                        H (m)
                      </th>

                      <th
                        style={
                          estilos.th
                        }
                      >
                        Comp. (m)
                      </th>

                      <th
                        style={
                          estilos.th
                        }
                      >
                        Qtde.
                      </th>

                      <th
                        style={
                          estilos.th
                        }
                      >
                        Situação
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {resultado.elementos.map(
                      (
                        elemento,
                        indice
                      ) => (
                        <tr
                          key={
                            indice
                          }
                        >
                          <td
                            style={
                              estilos.td
                            }
                          >
                            {obterLinha(
                              elemento
                            )}
                          </td>

                          <td
                            style={
                              estilos.td
                            }
                          >
                            <strong>
                              {obterNome(
                                elemento
                              )}
                            </strong>
                          </td>

                          <td
                            style={
                              estilos.td
                            }
                          >
                            {elemento.tipo ||
                              "-"}
                          </td>

                          <td
                            style={
                              estilos.td
                            }
                          >
                            {elemento.secao ||
                              "-"}
                          </td>

                          <td
                            style={
                              estilos.td
                            }
                          >
                            {formatarNumero(
                              elemento.largura
                            )}
                          </td>

                          <td
                            style={
                              estilos.td
                            }
                          >
                            {formatarNumero(
                              elemento.altura
                            )}
                          </td>

                          <td
                            style={
                              estilos.td
                            }
                          >
                            {formatarNumero(
                              elemento.comprimento
                            )}
                          </td>

                          <td
                            style={
                              estilos.td
                            }
                          >
                            {elemento.quantidade ??
                              "-"}
                          </td>

                          <td
                            style={
                              estilos.td
                            }
                          >
                            {elemento.erros &&
                            elemento.erros
                              .length >
                              0 ? (
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

            {resultado.erros &&
              resultado.erros
                .length > 0 && (
                <div
                  style={
                    estilos.listaErros
                  }
                >
                  <strong>
                    Problemas
                    encontrados:
                  </strong>

                  <ul
                    style={
                      estilos.listaErrosUl
                    }
                  >
                    {resultado.erros.map(
                      (
                        mensagem,
                        indice
                      ) => (
                        <li
                          key={
                            indice
                          }
                        >
                          {String(
                            mensagem
                          )}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

            <div
              style={
                estilos.acoesConfirmacao
              }
            >
              {confirmado ? (
                <>
                  <div
                    style={
                      estilos.confirmacaoSucesso
                    }
                  >
                    <strong>
                      Importação
                      confirmada
                    </strong>

                    <span>
                      {
                        mensagemConfirmacao
                      }
                    </span>
                  </div>

                  <button
                    type="button"
                    style={
                      estilos.botaoContinuar
                    }
                    onClick={() =>
                      router.push(
                        `/projetos/${id}/fabricacao`
                      )
                    }
                  >
                    Continuar para
                    fabricação →
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={
                    confirmarImportacao
                  }
                  disabled={
                    confirmando ||
                    resultado.resumo
                      .elementosComErro >
                      0
                  }
                  style={{
                    ...estilos
                      .botaoConfirmar,

                    ...(confirmando ||
                    resultado.resumo
                      .elementosComErro >
                      0
                      ? estilos
                          .botaoDesabilitado
                      : {}),
                  }}
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

    background:
      tema.cores.fundo,

    color:
      tema.cores.grafite,

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

    alignItems: "center",

    justifyContent:
      "space-between",

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
    maxWidth: "1250px",

    margin: "0 auto",

    padding:
      "42px 24px 60px",
  },

  topo: {
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
    maxWidth: "680px",

    margin: "8px 0 0",

    color:
      tema.cores.textoSecundario,

    fontSize: "14px",

    lineHeight: 1.55,
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
    padding: "22px 26px",

    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "center",

    gap: "20px",

    borderTop:
      `3px solid ${tema.cores.laranja}`,

    borderBottom:
      `1px solid ${tema.cores.borda}`,
  },

  tituloCard: {
    margin: 0,

    color:
      tema.cores.grafite,

    fontSize: "18px",
  },

  descricaoCard: {
    margin: "5px 0 0",

    color:
      tema.cores.textoSecundario,

    fontSize: "12px",
  },

  formatoArquivo: {
    padding: "6px 10px",

    borderRadius: "20px",

    background: "#FFF7ED",

    color:
      tema.cores.laranja,

    fontSize: "11px",

    fontWeight: 800,

    letterSpacing: "0.6px",
  },

  formulario: {
    padding: "26px",

    display: "flex",

    flexDirection:
      "column" as const,

    gap: "20px",
  },

  upload: {
    minHeight: "145px",

    padding: "24px",

    display: "flex",

    alignItems: "center",

    gap: "20px",

    border:
      `2px dashed ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.pequena,

    background: "#FAFAF9",
  },

  iconeUpload: {
    width: "58px",

    height: "58px",

    flexShrink: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    borderRadius: "10px",

    background: "#FFF7ED",

    color:
      tema.cores.laranja,

    fontSize: "14px",

    fontWeight: 800,
  },

  uploadConteudo: {
    flex: 1,

    minWidth: 0,

    display: "flex",

    flexDirection:
      "column" as const,

    alignItems:
      "flex-start",

    gap: "7px",
  },

  label: {
    color:
      tema.cores.grafite,

    fontWeight: 700,

    fontSize: "14px",
  },

  ajudaUpload: {
    color:
      tema.cores.textoSecundario,

    fontSize: "12px",
  },

  inputArquivo: {
    marginTop: "6px",

    maxWidth: "100%",

    fontSize: "13px",
  },

  arquivoSelecionado: {
    padding: "13px 15px",

    display: "flex",

    alignItems: "center",

    gap: "12px",

    background: "#FFF7ED",

    border:
      "1px solid #FED7AA",

    borderRadius:
      tema.bordas.pequena,
  },

  arquivoIcone: {
    width: "30px",

    height: "30px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    borderRadius: "50%",

    background:
      tema.cores.laranja,

    color:
      tema.cores.branco,

    fontSize: "13px",

    fontWeight: 800,
  },

  arquivoRotulo: {
    display: "block",

    marginBottom: "2px",

    color: "#9A3412",

    fontSize: "10px",

    fontWeight: 700,

    textTransform:
      "uppercase" as const,
  },

  arquivoNome: {
    display: "block",

    color:
      tema.cores.grafite,

    fontSize: "13px",
  },

  erro: {
    padding: "12px 14px",

    display: "flex",

    flexDirection:
      "column" as const,

    gap: "3px",

    background:
      tema.cores.erroFundo,

    color:
      tema.cores.erro,

    border:
      "1px solid #FECACA",

    borderRadius:
      tema.bordas.pequena,

    fontSize: "12px",
  },

  acoes: {
    paddingTop: "20px",

    display: "flex",

    justifyContent:
      "flex-end",

    borderTop:
      `1px solid ${tema.cores.borda}`,
  },

  botaoEnviar: {
    minWidth: "160px",

    height: "44px",

    padding: "0 20px",

    background:
      tema.cores.laranja,

    color:
      tema.cores.branco,

    border: "none",

    borderRadius:
      tema.bordas.pequena,

    fontSize: "13px",

    fontWeight: 700,

    cursor: "pointer",
  },

  botaoDesabilitado: {
    opacity: 0.55,

    cursor: "not-allowed",
  },

  cardResultado: {
    marginTop: "24px",

    padding: "26px",

    background:
      tema.cores.branco,

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.grande,

    boxShadow:
      tema.sombras.card,
  },

  resultadoCabecalho: {
    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "flex-start",

    gap: "20px",
  },

  sobretituloResultado: {
    display: "block",

    marginBottom: "5px",

    color:
      tema.cores.laranja,

    fontSize: "10px",

    fontWeight: 800,

    letterSpacing: "1px",
  },

  tituloResultado: {
    margin: 0,

    color:
      tema.cores.grafite,

    fontSize: "20px",
  },

  sucesso: {
    margin: "6px 0 0",

    color: "#15803D",

    fontSize: "12px",
  },

  statusResultado: {
    padding: "7px 11px",

    borderRadius: "20px",

    fontSize: "11px",

    fontWeight: 700,

    whiteSpace:
      "nowrap" as const,
  },

  statusValido: {
    color: "#15803D",

    background: "#F0FDF4",

    border:
      "1px solid #BBF7D0",
  },

  statusComErro: {
    color: "#B91C1C",

    background: "#FEF2F2",

    border:
      "1px solid #FECACA",
  },

  resumo: {
    marginTop: "24px",

    display: "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",

    gap: "12px",
  },

  indicador: {
    minHeight: "85px",

    padding: "15px",

    display: "flex",

    flexDirection:
      "column" as const,

    justifyContent:
      "space-between",

    gap: "8px",

    background: "#FAFAF9",

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.pequena,
  },

  indicadorErro: {
    background: "#FEF2F2",

    border:
      "1px solid #FECACA",
  },

  indicadorRotulo: {
    color:
      tema.cores.textoSecundario,

    fontSize: "11px",
  },

  indicadorValor: {
    color:
      tema.cores.grafite,

    fontSize: "22px",
  },

  valorErro: {
    color: "#B91C1C",
  },

  preview: {
    marginTop: "32px",
  },

  cabecalhoPreview: {
    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "center",

    gap: "20px",

    marginBottom: "15px",
  },

  tituloPreview: {
    margin: 0,

    color:
      tema.cores.grafite,

    fontSize: "17px",
  },

  descricaoPreview: {
    margin: "5px 0 0",

    color:
      tema.cores.textoSecundario,

    fontSize: "12px",
  },

  quantidadePreview: {
    padding: "7px 11px",

    background: "#FAFAF9",

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius: "20px",

    color:
      tema.cores.textoSecundario,

    fontSize: "11px",

    fontWeight: 600,

    whiteSpace:
      "nowrap" as const,
  },

  tabelaContainer: {
    width: "100%",

    overflowX:
      "auto" as const,

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.pequena,
  },

  tabela: {
    width: "100%",

    minWidth: "950px",

    borderCollapse:
      "collapse" as const,
  },

  th: {
    padding: "12px 14px",

    background: "#FAFAF9",

    color:
      tema.cores.textoSecundario,

    textAlign:
      "left" as const,

    fontSize: "11px",

    fontWeight: 700,

    textTransform:
      "uppercase" as const,

    letterSpacing: "0.35px",

    borderBottom:
      `1px solid ${tema.cores.borda}`,

    whiteSpace:
      "nowrap" as const,
  },

  td: {
    padding: "12px 14px",

    color:
      tema.cores.grafite,

    fontSize: "12px",

    borderBottom:
      `1px solid ${tema.cores.borda}`,

    whiteSpace:
      "nowrap" as const,
  },

  valido: {
    display: "inline-block",

    padding: "5px 9px",

    borderRadius: "20px",

    background: "#F0FDF4",

    color: "#15803D",

    border:
      "1px solid #BBF7D0",

    fontSize: "10px",

    fontWeight: 700,
  },

  comErro: {
    display: "inline-block",

    padding: "5px 9px",

    borderRadius: "20px",

    background: "#FEF2F2",

    color: "#B91C1C",

    border:
      "1px solid #FECACA",

    fontSize: "10px",

    fontWeight: 700,
  },

  listaErros: {
    marginTop: "18px",

    padding: "15px 17px",

    background: "#FFF7ED",

    color: "#9A3412",

    border:
      "1px solid #FED7AA",

    borderRadius:
      tema.bordas.pequena,

    fontSize: "12px",
  },

  listaErrosUl: {
    margin:
      "9px 0 0",

    paddingLeft: "20px",

    lineHeight: 1.6,
  },

  acoesConfirmacao: {
    marginTop: "26px",

    paddingTop: "22px",

    display: "flex",

    alignItems: "center",

    justifyContent:
      "flex-end",

    gap: "15px",

    borderTop:
      `1px solid ${tema.cores.borda}`,
  },

  botaoConfirmar: {
    minWidth: "180px",

    height: "44px",

    padding: "0 20px",

    background:
      tema.cores.laranja,

    color:
      tema.cores.branco,

    border: "none",

    borderRadius:
      tema.bordas.pequena,

    fontSize: "13px",

    fontWeight: 700,

    cursor: "pointer",
  },

  confirmacaoSucesso: {
    marginRight: "auto",

    padding: "11px 14px",

    display: "flex",

    flexDirection:
      "column" as const,

    gap: "3px",

    background: "#F0FDF4",

    color: "#15803D",

    border:
      "1px solid #BBF7D0",

    borderRadius:
      tema.bordas.pequena,

    fontSize: "12px",
  },

  botaoContinuar: {
    minWidth: "205px",

    height: "44px",

    padding: "0 20px",

    background:
      tema.cores.laranja,

    color:
      tema.cores.branco,

    border: "none",

    borderRadius:
      tema.bordas.pequena,

    fontSize: "13px",

    fontWeight: 700,

    cursor: "pointer",
  },
};