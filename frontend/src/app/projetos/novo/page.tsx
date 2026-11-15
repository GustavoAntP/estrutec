"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { apiAutenticada } from "@/servicos/api";
import { tema } from "@/estilos/tema";

type ClienteEmpresa = {
  id: number;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  ativo: boolean;
};

export default function NovoProjetoPage() {
  const router = useRouter();

  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [cliente, setCliente] = useState("");
  const [responsavel, setResponsavel] =
    useState("");
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [prazo, setPrazo] = useState("");
  const [bdi, setBdi] = useState("");
  const [observacoes, setObservacoes] =
    useState("");

  const [
    clientesEmpresas,
    setClientesEmpresas,
  ] = useState<ClienteEmpresa[]>([]);

  const [
    clienteEmpresaId,
    setClienteEmpresaId,
  ] = useState("");

  const [erro, setErro] = useState("");

  const [carregando, setCarregando] =
    useState(false);

  async function carregarClientesEmpresas() {
    try {
      const resposta =
        await apiAutenticada(
          "/clientes"
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
        throw new Error(
          dados.erro ||
            "Não foi possível carregar as empresas clientes."
        );
      }

      setClientesEmpresas(
        dados.clientes.filter(
          (
            cliente: ClienteEmpresa
          ) => cliente.ativo
        )
      );
    } catch (erro) {
      console.error(
        "Erro ao carregar empresas clientes:",
        erro
      );
    }
  }

  useEffect(() => {
    carregarClientesEmpresas();
  }, []);

  async function cadastrarProjeto(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    setErro("");
    setCarregando(true);

    try {
      const resposta =
        await apiAutenticada(
          "/projetos",
          {
            method: "POST",

            body: JSON.stringify({
              codigo,
              nome,

              cliente,

              cliente_empresa_id:
                Number(
                  clienteEmpresaId
                ),

              responsavel:
                responsavel || null,

              origem:
                origem || null,

              destino,

              prazo,

              bdi:
                Number(bdi || 0),

              observacoes:
                observacoes || null,
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
            "Não foi possível cadastrar o projeto."
        );

        return;
      }

      router.push("/painel");
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setCarregando(false);
    }
  }

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
                Novo Projeto
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/painel"
              )
            }
            style={
              estilos.botaoVoltar
            }
          >
            Voltar
          </button>
        </div>
      </header>

      <section
        style={estilos.conteudo}
      >
        <div style={estilos.topo}>
          <div>
            <span
              style={
                estilos.sobretitulo
              }
            >
              NOVO ORÇAMENTO
            </span>

            <h1
              style={estilos.titulo}
            >
              Novo Projeto
            </h1>

            <p
              style={
                estilos.descricao
              }
            >
              Cadastre os dados gerais
              da obra para iniciar o
              processo de orçamentação.
            </p>
          </div>
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
                  estilos.cardTitulo
                }
              >
                Dados gerais
              </h2>

              <p
                style={
                  estilos.cardDescricao
                }
              >
                Preencha as informações
                principais do projeto e
                da obra.
              </p>
            </div>

            <span
              style={
                estilos.obrigatorios
              }
            >
              * Campos obrigatórios
            </span>
          </div>

          <form
            onSubmit={
              cadastrarProjeto
            }
            style={
              estilos.formulario
            }
          >
            <div
              style={
                estilos.secaoFormulario
              }
            >
              <div
                style={
                  estilos.tituloSecao
                }
              >
                <span
                  style={
                    estilos.numeroSecao
                  }
                >
                  01
                </span>

                <div>
                  <strong>
                    Identificação
                  </strong>

                  <p>
                    Informações para
                    identificar o
                    orçamento.
                  </p>
                </div>
              </div>

              <div
                style={
                  estilos.linha
                }
              >
                <div
                  style={
                    estilos.campo
                  }
                >
                  <label
                    htmlFor="codigo"
                    style={
                      estilos.label
                    }
                  >
                    Código *
                  </label>

                  <input
                    id="codigo"
                    value={codigo}
                    onChange={(e) =>
                      setCodigo(
                        e.target.value
                      )
                    }
                    placeholder="Ex.: EST-002"
                    required
                    style={
                      estilos.input
                    }
                  />
                </div>

                <div
                  style={
                    estilos.campoMaior
                  }
                >
                  <label
                    htmlFor="nome"
                    style={
                      estilos.label
                    }
                  >
                    Nome do projeto *
                  </label>

                  <input
                    id="nome"
                    value={nome}
                    onChange={(e) =>
                      setNome(
                        e.target.value
                      )
                    }
                    placeholder="Ex.: Galpão Industrial"
                    required
                    style={
                      estilos.input
                    }
                  />
                </div>
              </div>

              <div
                style={
                  estilos.campo
                }
              >
                <label
                  htmlFor="cliente_empresa"
                  style={
                    estilos.label
                  }
                >
                  Empresa cliente *
                </label>

                <select
                  id="cliente_empresa"
                  value={
                    clienteEmpresaId
                  }
                  onChange={(e) => {
                    const id =
                      e.target.value;

                    setClienteEmpresaId(
                      id
                    );

                    const empresa =
                      clientesEmpresas.find(
                        (
                          cliente
                        ) =>
                          String(
                            cliente.id
                          ) === id
                      );

                    if (empresa) {
                      setCliente(
                        empresa
                          .nome_fantasia ||
                          empresa
                            .razao_social
                      );
                    } else {
                      setCliente("");
                    }
                  }}
                  required
                  style={
                    estilos.input
                  }
                >
                  <option value="">
                    Selecione uma
                    empresa cliente
                  </option>

                  {clientesEmpresas.map(
                    (empresa) => (
                      <option
                        key={
                          empresa.id
                        }
                        value={
                          empresa.id
                        }
                      >
                        {empresa
                          .nome_fantasia ||
                          empresa
                            .razao_social}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div
              style={
                estilos.separador
              }
            />

            <div
              style={
                estilos.secaoFormulario
              }
            >
              <div
                style={
                  estilos.tituloSecao
                }
              >
                <span
                  style={
                    estilos.numeroSecao
                  }
                >
                  02
                </span>

                <div>
                  <strong>
                    Localização
                  </strong>

                  <p>
                    Informe a origem e o
                    destino dos
                    elementos.
                  </p>
                </div>
              </div>

              <div
                style={
                  estilos.linha
                }
              >
                <div
                  style={
                    estilos.campo
                  }
                >
                  <label
                    htmlFor="origem"
                    style={
                      estilos.label
                    }
                  >
                    Origem
                  </label>

                  <input
                    id="origem"
                    value={origem}
                    onChange={(e) =>
                      setOrigem(
                        e.target.value
                      )
                    }
                    placeholder="Ex.: Joinville - SC"
                    style={
                      estilos.input
                    }
                  />
                </div>

                <div
                  style={
                    estilos.campo
                  }
                >
                  <label
                    htmlFor="destino"
                    style={
                      estilos.label
                    }
                  >
                    Destino *
                  </label>

                  <input
                    id="destino"
                    value={destino}
                    onChange={(e) =>
                      setDestino(
                        e.target.value
                      )
                    }
                    placeholder="Ex.: Curitiba - PR"
                    required
                    style={
                      estilos.input
                    }
                  />
                </div>
              </div>
            </div>

            <div
              style={
                estilos.separador
              }
            />

            <div
              style={
                estilos.secaoFormulario
              }
            >
              <div
                style={
                  estilos.tituloSecao
                }
              >
                <span
                  style={
                    estilos.numeroSecao
                  }
                >
                  03
                </span>

                <div>
                  <strong>
                    Orçamento
                  </strong>

                  <p>
                    Defina o prazo e o
                    percentual de BDI.
                  </p>
                </div>
              </div>

              <div
                style={
                  estilos.linha
                }
              >
                <div
                  style={
                    estilos.campo
                  }
                >
                  <label
                    htmlFor="prazo"
                    style={
                      estilos.label
                    }
                  >
                    Prazo *
                  </label>

                  <input
                    id="prazo"
                    type="date"
                    value={prazo}
                    onChange={(e) =>
                      setPrazo(
                        e.target.value
                      )
                    }
                    required
                    style={
                      estilos.input
                    }
                  />
                </div>

                <div
                  style={
                    estilos.campo
                  }
                >
                  <label
                    htmlFor="bdi"
                    style={
                      estilos.label
                    }
                  >
                    BDI (%)
                  </label>

                  <div
                    style={
                      estilos.campoComSufixo
                    }
                  >
                    <input
                      id="bdi"
                      type="number"
                      min="0"
                      step="0.01"
                      value={bdi}
                      onChange={(e) =>
                        setBdi(
                          e.target.value
                        )
                      }
                      placeholder="Ex.: 20"
                      style={{
                        ...estilos.input,
                        paddingRight:
                          "42px",
                      }}
                    />

                    <span
                      style={
                        estilos.sufixo
                      }
                    >
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={
                  estilos.campoCompleto
                }
              >
                <label
                  htmlFor="observacoes"
                  style={
                    estilos.label
                  }
                >
                  Observações
                </label>

                <textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) =>
                    setObservacoes(
                      e.target.value
                    )
                  }
                  rows={5}
                  placeholder="Informações adicionais sobre o projeto..."
                  style={
                    estilos.textarea
                  }
                />

                <span
                  style={
                    estilos.ajudaCampo
                  }
                >
                  Campo opcional para
                  informações relevantes
                  sobre a obra ou
                  orçamento.
                </span>
              </div>
            </div>

            {erro && (
              <div
                style={estilos.erro}
              >
                <strong>
                  Não foi possível criar
                  o projeto.
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
                type="button"
                style={
                  estilos.botaoCancelar
                }
                onClick={() =>
                  router.push(
                    "/painel"
                  )
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={carregando}
                style={{
                  ...estilos.botaoSalvar,

                  ...(carregando
                    ? estilos.botaoDesabilitado
                    : {}),
                }}
              >
                {carregando
                  ? "Criando projeto..."
                  : "Criar projeto"}
              </button>
            </div>
          </form>
        </div>
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
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
    padding:
      "42px 24px 60px",
  },

  topo: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent:
      "space-between",
    gap: "24px",
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

  titulo: {
    margin: 0,
    color:
      tema.cores.grafite,
    fontSize: "30px",
    fontWeight: 750,
  },

  descricao: {
    maxWidth: "620px",
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
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "20px",
    borderBottom:
      `1px solid ${tema.cores.borda}`,
    borderTop:
      `3px solid ${tema.cores.laranja}`,
  },

  cardTitulo: {
    margin: 0,
    color:
      tema.cores.grafite,
    fontSize: "18px",
  },

  cardDescricao: {
    margin: "5px 0 0",
    color:
      tema.cores.textoSecundario,
    fontSize: "12px",
  },

  obrigatorios: {
    color:
      tema.cores.textoSecundario,
    fontSize: "11px",
  },

  formulario: {
    padding: "26px",
    display: "flex",
    flexDirection:
      "column" as const,
    gap: "26px",
  },

  secaoFormulario: {
    display: "flex",
    flexDirection:
      "column" as const,
    gap: "20px",
  },

  tituloSecao: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  numeroSecao: {
    minWidth: "35px",
    height: "35px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "7px",
    background: "#FFF7ED",
    color:
      tema.cores.laranja,
    fontSize: "11px",
    fontWeight: 800,
  },

  linha: {
    display: "flex",
    gap: "18px",
  },

  campo: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection:
      "column" as const,
    gap: "7px",
  },

  campoMaior: {
    flex: 2,
    minWidth: 0,
    display: "flex",
    flexDirection:
      "column" as const,
    gap: "7px",
  },

  campoCompleto: {
    width: "100%",
    display: "flex",
    flexDirection:
      "column" as const,
    gap: "7px",
  },

  label: {
    color:
      tema.cores.grafite,
    fontSize: "12px",
    fontWeight: 700,
  },

  input: {
    width: "100%",
    height: "44px",
    boxSizing:
      "border-box" as const,
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.pequena,
    padding: "0 12px",
    background:
      tema.cores.branco,
    color:
      tema.cores.grafite,
    fontSize: "13px",
    outline: "none",
  },

  textarea: {
    width: "100%",
    minHeight: "110px",
    boxSizing:
      "border-box" as const,
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.pequena,
    padding: "12px",
    background:
      tema.cores.branco,
    color:
      tema.cores.grafite,
    fontFamily:
      "Arial, Helvetica, sans-serif",
    fontSize: "13px",
    lineHeight: 1.5,
    resize:
      "vertical" as const,
    outline: "none",
  },

  ajudaCampo: {
    color:
      tema.cores.textoSecundario,
    fontSize: "11px",
  },

  campoComSufixo: {
    position:
      "relative" as const,
  },

  sufixo: {
    position:
      "absolute" as const,
    top: "50%",
    right: "13px",
    transform:
      "translateY(-50%)",
    color:
      tema.cores.textoSecundario,
    fontSize: "12px",
    fontWeight: 700,
    pointerEvents:
      "none" as const,
  },

  separador: {
    width: "100%",
    height: "1px",
    background:
      tema.cores.borda,
  },

  erro: {
    display: "flex",
    flexDirection:
      "column" as const,
    gap: "4px",
    padding: "13px 15px",
    background:
      tema.cores.erroFundo,
    color:
      tema.cores.erro,
    border: "1px solid #FECACA",
    borderRadius:
      tema.bordas.pequena,
    fontSize: "12px",
  },

  acoes: {
    display: "flex",
    justifyContent:
      "flex-end",
    gap: "10px",
    paddingTop: "22px",
    borderTop:
      `1px solid ${tema.cores.borda}`,
  },

  botaoCancelar: {
    height: "44px",
    padding: "0 18px",
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

  botaoSalvar: {
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
    opacity: 0.6,
    cursor: "not-allowed",
  },
};