"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import Image from "next/image";

import { apiAutenticada } from "@/servicos/api";
import { tema } from "@/estilos/tema";

type Carreta = {
  id: number;
  nome: string;
  placa: string | null;
  tipo: string | null;
  capacidade_peso_kg:
    | string
    | number;
  capacidade_pecas: number;
  observacoes: string | null;
  ativo: boolean;
};

export default function CarretasPage() {
  const router = useRouter();

  const [carretas, setCarretas] =
    useState<Carreta[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  const [
    modalNovoAberto,
    setModalNovoAberto,
  ] = useState(false);

  const [
    modalEdicaoAberto,
    setModalEdicaoAberto,
  ] = useState(false);

  const [
    carretaEditando,
    setCarretaEditando,
  ] = useState<Carreta | null>(
    null
  );

  const [nome, setNome] =
    useState("");

  const [placa, setPlaca] =
    useState("");

  const [tipo, setTipo] =
    useState("");

  const [
    capacidadePeso,
    setCapacidadePeso,
  ] = useState("");

  const [
    capacidadePecas,
    setCapacidadePecas,
  ] = useState("");

  const [
    observacoes,
    setObservacoes,
  ] = useState("");

  useEffect(() => {
    verificarAcesso();
  }, []);

  function verificarAcesso() {
    const token =
      localStorage.getItem(
        "estrutec_token"
      );

    const usuarioSalvo =
      localStorage.getItem(
        "estrutec_usuario"
      );

    if (!token || !usuarioSalvo) {
      router.replace("/");
      return;
    }

    try {
      const usuario =
        JSON.parse(usuarioSalvo);

      if (
        usuario.perfil !==
        "ADMINISTRADOR"
      ) {
        router.replace("/painel");
        return;
      }

      carregarCarretas();
    } catch {
      localStorage.removeItem(
        "estrutec_token"
      );

      localStorage.removeItem(
        "estrutec_usuario"
      );

      router.replace("/");
    }
  }

  async function carregarCarretas() {
    try {
      setCarregando(true);
      setErro("");

      const resposta =
        await apiAutenticada(
          "/carretas"
        );

      if (resposta.status === 401) {
        router.push("/");
        return;
      }

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        setErro(
          dados.erro ||
            "Não foi possível carregar as carretas."
        );

        return;
      }

      setCarretas(
        dados.carretas || []
      );
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setCarregando(false);
    }
  }

  function limparFormulario() {
    setNome("");
    setPlaca("");
    setTipo("");
    setCapacidadePeso("");
    setCapacidadePecas("");
    setObservacoes("");
  }

  function abrirNovaCarreta() {
    limparFormulario();

    setErro("");
    setCarretaEditando(null);
    setModalNovoAberto(true);
  }

  function fecharModal() {
    setModalNovoAberto(false);
    setModalEdicaoAberto(false);
    setCarretaEditando(null);

    limparFormulario();
  }

  async function cadastrarCarreta(
    evento: FormEvent
  ) {
    evento.preventDefault();

    try {
      setErro("");

      const resposta =
        await apiAutenticada(
          "/carretas",
          {
            method: "POST",

            body: JSON.stringify({
              nome,
              placa,
              tipo,

              capacidade_peso_kg:
                Number(
                  capacidadePeso
                ),

              capacidade_pecas:
                Number(
                  capacidadePecas
                ),

              observacoes,
            }),
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        setErro(
          dados.erro ||
            "Não foi possível cadastrar a carreta."
        );

        return;
      }

      fecharModal();

      setSucesso(
        "Carreta cadastrada com sucesso!"
      );

      setTimeout(
        () => setSucesso(""),
        3000
      );

      await carregarCarretas();
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    }
  }

  function abrirEdicao(
    carreta: Carreta
  ) {
    setCarretaEditando(
      carreta
    );

    setNome(
      carreta.nome || ""
    );

    setPlaca(
      carreta.placa || ""
    );

    setTipo(
      carreta.tipo || ""
    );

    setCapacidadePeso(
      String(
        carreta.capacidade_peso_kg ??
          ""
      )
    );

    setCapacidadePecas(
      String(
        carreta.capacidade_pecas ??
          ""
      )
    );

    setObservacoes(
      carreta.observacoes || ""
    );

    setErro("");
    setModalEdicaoAberto(true);
  }

  async function salvarEdicao(
    evento: FormEvent
  ) {
    evento.preventDefault();

    if (!carretaEditando) {
      return;
    }

    try {
      setErro("");

      const resposta =
        await apiAutenticada(
          `/carretas/${carretaEditando.id}`,
          {
            method: "PUT",

            body: JSON.stringify({
              nome,
              placa,
              tipo,

              capacidade_peso_kg:
                Number(
                  capacidadePeso
                ),

              capacidade_pecas:
                Number(
                  capacidadePecas
                ),

              observacoes,
            }),
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        setErro(
          dados.erro ||
            "Não foi possível atualizar a carreta."
        );

        return;
      }

      fecharModal();

      setSucesso(
        "Carreta atualizada com sucesso!"
      );

      setTimeout(
        () => setSucesso(""),
        3000
      );

      await carregarCarretas();
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    }
  }

  async function alterarStatus(
    carreta: Carreta
  ) {
    try {
      setErro("");

      const resposta =
        await apiAutenticada(
          `/carretas/${carreta.id}/status`,
          {
            method: "PATCH",

            body: JSON.stringify({
              ativo:
                !carreta.ativo,
            }),
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        setErro(
          dados.erro ||
            "Não foi possível alterar o status."
        );

        return;
      }

      setSucesso(
        carreta.ativo
          ? "Carreta desativada com sucesso!"
          : "Carreta ativada com sucesso!"
      );

      setTimeout(
        () => setSucesso(""),
        3000
      );

      await carregarCarretas();
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    }
  }

  const carretasAtivas =
    carretas.filter(
      (carreta) =>
        carreta.ativo
    ).length;

  return (
    <main style={estilos.pagina}>
      <header
        style={estilos.cabecalho}
      >
        <div
          style={
            estilos.cabecalhoConteudo
          }
        >
          <div
            style={
              estilos.identidade
            }
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
              style={
                estilos.divisor
              }
            />

            <div>
              <span
                style={
                  estilos.rotuloCabecalho
                }
              >
                Administração
              </span>

              <strong
                style={
                  estilos.tituloCabecalho
                }
              >
                Carretas
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/administracao"
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
              ADMINISTRAÇÃO
            </span>

            <h1
              style={
                estilos.titulo
              }
            >
              Carretas
            </h1>

            <p
              style={
                estilos.descricao
              }
            >
              Cadastre e gerencie as
              carretas utilizadas no
              transporte dos elementos
              estruturais.
            </p>
          </div>

          <button
            type="button"
            onClick={
              abrirNovaCarreta
            }
            style={
              estilos.botaoPrincipal
            }
          >
            + Nova carreta
          </button>
        </div>

        <div
          style={estilos.resumo}
        >
          <div
            style={
              estilos.resumoItem
            }
          >
            <span
              style={
                estilos.resumoValor
              }
            >
              {carretas.length}
            </span>

            <span
              style={
                estilos.resumoTexto
              }
            >
              Carretas cadastradas
            </span>
          </div>

          <div
            style={
              estilos.separadorResumo
            }
          />

          <div
            style={
              estilos.resumoItem
            }
          >
            <span
              style={
                estilos.resumoValor
              }
            >
              {carretasAtivas}
            </span>

            <span
              style={
                estilos.resumoTexto
              }
            >
              Ativas
            </span>
          </div>
        </div>

        {erro && (
          <div
            style={estilos.erro}
          >
            {erro}
          </div>
        )}

        {sucesso && (
          <div
            style={
              estilos.sucesso
            }
          >
            {sucesso}
          </div>
        )}

        <div
          style={estilos.card}
        >
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
                Carretas
              </h2>

              <p
                style={
                  estilos.cardDescricao
                }
              >
                Carretas cadastradas
                no sistema.
              </p>
            </div>
          </div>

          {carregando ? (
            <div
              style={
                estilos.estado
              }
            >
              Carregando carretas...
            </div>
          ) : carretas.length ===
            0 ? (
            <div
              style={
                estilos.estado
              }
            >
              Nenhuma carreta
              cadastrada.
            </div>
          ) : (
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
                      Carreta
                    </th>

                    <th
                      style={
                        estilos.th
                      }
                    >
                      Placa
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
                      Capacidade
                      de peso
                    </th>

                    <th
                      style={
                        estilos.th
                      }
                    >
                      Capacidade
                      de peças
                    </th>

                    <th
                      style={
                        estilos.th
                      }
                    >
                      Status
                    </th>

                    <th
                      style={{
                        ...estilos.th,
                        textAlign:
                          "right",
                      }}
                    >
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {carretas.map(
                    (carreta) => (
                      <tr
                        key={
                          carreta.id
                        }
                        style={
                          estilos.linha
                        }
                      >
                        <td
                          style={
                            estilos.td
                          }
                        >
                          <strong
                            style={
                              estilos.nomeCarreta
                            }
                          >
                            {
                              carreta.nome
                            }
                          </strong>

                          {carreta.observacoes && (
                            <span
                              style={
                                estilos.secundario
                              }
                            >
                              {
                                carreta.observacoes
                              }
                            </span>
                          )}
                        </td>

                        <td
                          style={
                            estilos.td
                          }
                        >
                          {carreta.placa ||
                            "-"}
                        </td>

                        <td
                          style={
                            estilos.td
                          }
                        >
                          {carreta.tipo ||
                            "-"}
                        </td>

                        <td
                          style={
                            estilos.td
                          }
                        >
                          {Number(
                            carreta.capacidade_peso_kg
                          ).toLocaleString(
                            "pt-BR",
                            {
                              maximumFractionDigits: 2,
                            }
                          )}{" "}
                          kg
                        </td>

                        <td
                          style={
                            estilos.td
                          }
                        >
                          {
                            carreta.capacidade_pecas
                          }
                        </td>

                        <td
                          style={
                            estilos.td
                          }
                        >
                          <span
                            style={
                              carreta.ativo
                                ? estilos.statusAtivo
                                : estilos.statusInativo
                            }
                          >
                            {carreta.ativo
                              ? "Ativa"
                              : "Inativa"}
                          </span>
                        </td>

                        <td
                          style={{
                            ...estilos.td,
                            textAlign:
                              "right",
                          }}
                        >
                          <div
                            style={
                              estilos.acoesTabela
                            }
                          >
                            <button
                              type="button"
                              style={
                                estilos.botaoEditar
                              }
                              onClick={() =>
                                abrirEdicao(
                                  carreta
                                )
                              }
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              style={
                                carreta.ativo
                                  ? estilos.botaoDesativar
                                  : estilos.botaoAtivar
                              }
                              onClick={() =>
                                alterarStatus(
                                  carreta
                                )
                              }
                            >
                              {carreta.ativo
                                ? "Desativar"
                                : "Ativar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {(modalNovoAberto ||
        modalEdicaoAberto) && (
        <div
          style={
            estilos.overlayModal
          }
          onClick={fecharModal}
        >
          <div
            style={estilos.modal}
            onClick={(evento) =>
              evento.stopPropagation()
            }
          >
            <div
              style={
                estilos.modalCabecalho
              }
            >
              <div>
                <span
                  style={
                    estilos.modalRotulo
                  }
                >
                  ADMINISTRAÇÃO
                </span>

                <h2
                  style={
                    estilos.modalTitulo
                  }
                >
                  {modalNovoAberto
                    ? "Nova carreta"
                    : "Editar carreta"}
                </h2>

                <p
                  style={
                    estilos.modalDescricao
                  }
                >
                  Informe os dados da
                  carreta utilizada nas
                  operações de transporte.
                </p>
              </div>
            </div>

            <form
              onSubmit={
                modalNovoAberto
                  ? cadastrarCarreta
                  : salvarEdicao
              }
            >
              <div
                style={
                  estilos.gridFormulario
                }
              >
                <Campo
                  label="Nome / identificação *"
                  value={nome}
                  onChange={setNome}
                  required
                />

                <Campo
                  label="Placa"
                  value={placa}
                  onChange={setPlaca}
                />

                <Campo
                  label="Tipo"
                  value={tipo}
                  onChange={setTipo}
                />

                <Campo
                  label="Capacidade de peso (kg) *"
                  value={
                    capacidadePeso
                  }
                  onChange={
                    setCapacidadePeso
                  }
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                />

                <Campo
                  label="Capacidade de peças *"
                  value={
                    capacidadePecas
                  }
                  onChange={
                    setCapacidadePecas
                  }
                  type="number"
                  step="1"
                  min="1"
                  required
                />
              </div>

              <div
                style={
                  estilos.campoObservacoes
                }
              >
                <label
                  style={
                    estilos.label
                  }
                >
                  Observações
                </label>

                <textarea
                  value={observacoes}
                  onChange={(evento) =>
                    setObservacoes(
                      evento.target.value
                    )
                  }
                  style={
                    estilos.textarea
                  }
                />
              </div>

              <div
                style={
                  estilos.acoesModal
                }
              >
                <button
                  type="button"
                  style={
                    estilos.botaoCancelar
                  }
                  onClick={
                    fecharModal
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={
                    estilos.botaoSalvar
                  }
                >
                  {modalNovoAberto
                    ? "Cadastrar"
                    : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function Campo({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  step,
  min,
}: {
  label: string;
  value: string;
  onChange: (
    valor: string
  ) => void;
  required?: boolean;
  type?: string;
  step?: string;
  min?: string;
}) {
  return (
    <div style={estilos.campo}>
      <label
        style={estilos.label}
      >
        {label}
      </label>

      <input
        value={value}
        required={required}
        type={type}
        step={step}
        min={min}
        onChange={(evento) =>
          onChange(
            evento.target.value
          )
        }
        style={estilos.input}
      />
    </div>
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
    color:
      tema.cores.textoSecundario,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1px",
    textTransform:
      "uppercase" as const,
    marginBottom: "3px",
  },

  tituloCabecalho: {
    color:
      tema.cores.grafite,
    fontSize: "15px",
  },

  botaoVoltar: {
    height: "40px",
    padding: "0 15px",
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
    maxWidth: "1600px",
    margin: "0 auto",
    padding:
      "42px 24px 60px",
  },

  topo: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-end",
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
    margin: "8px 0 0",
    color:
      tema.cores.textoSecundario,
    fontSize: "14px",
  },

  botaoPrincipal: {
    height: "44px",
    padding: "0 18px",
    border: "none",
    borderRadius:
      tema.bordas.pequena,
    background:
      tema.cores.laranja,
    color:
      tema.cores.branco,
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },

  resumo: {
    display: "flex",
    alignItems: "center",
    gap: "28px",
    padding: "20px 24px",
    marginBottom: "22px",
    background:
      tema.cores.branco,
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.grande,
    boxShadow:
      tema.sombras.card,
  },

  resumoItem: {
    display: "flex",
    flexDirection:
      "column" as const,
    gap: "3px",
  },

  resumoValor: {
    color:
      tema.cores.grafite,
    fontSize: "22px",
    fontWeight: 750,
  },

  resumoTexto: {
    color:
      tema.cores.textoSecundario,
    fontSize: "12px",
  },

  separadorResumo: {
    width: "1px",
    height: "35px",
    background:
      tema.cores.borda,
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
    padding: "22px 24px",
    borderBottom:
      `1px solid ${tema.cores.borda}`,
  },

  cardTitulo: {
    margin: 0,
    color:
      tema.cores.grafite,
    fontSize: "17px",
  },

  cardDescricao: {
    margin: "5px 0 0",
    color:
      tema.cores.textoSecundario,
    fontSize: "12px",
  },

  tabelaContainer: {
    overflowX: "auto" as const,
  },

  tabela: {
    width: "100%",
    borderCollapse:
      "collapse" as const,
  },

  th: {
    padding: "13px 20px",
    background: "#FAFAF9",
    color:
      tema.cores.textoSecundario,
    fontSize: "11px",
    fontWeight: 700,
    textTransform:
      "uppercase" as const,
    textAlign:
      "left" as const,
    whiteSpace:
      "nowrap" as const,
  },

  linha: {
    borderTop:
      `1px solid ${tema.cores.borda}`,
  },

  td: {
    padding: "16px 20px",
    color:
      tema.cores.grafite,
    fontSize: "13px",
    verticalAlign:
      "middle" as const,
    whiteSpace:
      "nowrap" as const,
  },

  nomeCarreta: {
    display: "block",
    color:
      tema.cores.grafite,
    fontSize: "13px",
  },

  secundario: {
    display: "block",
    marginTop: "4px",
    maxWidth: "280px",
    overflow: "hidden",
    textOverflow:
      "ellipsis" as const,
    color:
      tema.cores.textoSecundario,
    fontSize: "11px",
  },

  statusAtivo: {
    color:
      tema.cores.sucesso,
    fontSize: "12px",
    fontWeight: 700,
  },

  statusInativo: {
    color:
      tema.cores.erro,
    fontSize: "12px",
    fontWeight: 700,
  },

  acoesTabela: {
    display: "flex",
    justifyContent:
      "flex-end",
    gap: "8px",
  },

  botaoEditar: {
    height: "34px",
    padding: "0 13px",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.pequena,
    background:
      tema.cores.branco,
    color:
      tema.cores.grafite,
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },

  botaoDesativar: {
    height: "34px",
    padding: "0 13px",
    border:
      "1px solid #FECACA",
    borderRadius:
      tema.bordas.pequena,
    background:
      tema.cores.erroFundo,
    color:
      tema.cores.erro,
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },

  botaoAtivar: {
    height: "34px",
    padding: "0 13px",
    border:
      "1px solid #BBF7D0",
    borderRadius:
      tema.bordas.pequena,
    background:
      tema.cores.sucessoFundo,
    color:
      tema.cores.sucesso,
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },

  estado: {
    padding: "50px 24px",
    textAlign:
      "center" as const,
    color:
      tema.cores.textoSecundario,
    fontSize: "13px",
  },

  erro: {
    marginBottom: "20px",
    padding: "13px 15px",
    background:
      tema.cores.erroFundo,
    color:
      tema.cores.erro,
    border:
      "1px solid #FECACA",
    borderRadius:
      tema.bordas.pequena,
    fontSize: "13px",
  },

  sucesso: {
    marginBottom: "20px",
    padding: "13px 15px",
    background:
      tema.cores.sucessoFundo,
    color:
      tema.cores.sucesso,
    border:
      "1px solid #BBF7D0",
    borderRadius:
      tema.bordas.pequena,
    fontSize: "13px",
    fontWeight: 600,
  },

  overlayModal: {
    position:
      "fixed" as const,
    inset: 0,
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background:
      "rgba(23,23,23,0.62)",
    backdropFilter:
      "blur(3px)",
  },

  modal: {
    width: "100%",
    maxWidth: "680px",
    maxHeight: "90vh",
    overflowY:
      "auto" as const,
    padding: "28px",
    background:
      tema.cores.branco,
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.modal,
    boxShadow:
      tema.sombras.destaque,
  },

  modalCabecalho: {
    marginBottom: "24px",
  },

  modalRotulo: {
    display: "block",
    marginBottom: "6px",
    color:
      tema.cores.laranja,
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1.3px",
  },

  modalTitulo: {
    margin: 0,
    color:
      tema.cores.grafite,
    fontSize: "22px",
  },

  modalDescricao: {
    margin: "7px 0 0",
    color:
      tema.cores.textoSecundario,
    fontSize: "13px",
    lineHeight: 1.5,
  },

  gridFormulario: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },

  campo: {
    display: "flex",
    flexDirection:
      "column" as const,
  },

  campoObservacoes: {
    marginTop: "16px",
  },

  label: {
    display: "block",
    marginBottom: "6px",
    color:
      tema.cores.grafite,
    fontSize: "12px",
    fontWeight: 700,
  },

  input: {
    width: "100%",
    height: "42px",
    boxSizing:
      "border-box" as const,
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.pequena,
    padding: "0 11px",
    background:
      tema.cores.branco,
    color:
      tema.cores.grafite,
    fontSize: "13px",
    outline: "none",
  },

  textarea: {
    width: "100%",
    minHeight: "95px",
    boxSizing:
      "border-box" as const,
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.pequena,
    padding: "11px",
    background:
      tema.cores.branco,
    color:
      tema.cores.grafite,
    fontFamily:
      "Arial, Helvetica, sans-serif",
    fontSize: "13px",
    resize:
      "vertical" as const,
    outline: "none",
  },

  acoesModal: {
    marginTop: "24px",
    paddingTop: "20px",
    borderTop:
      `1px solid ${tema.cores.borda}`,
    display: "flex",
    justifyContent:
      "flex-end",
    gap: "10px",
  },

  botaoCancelar: {
    height: "42px",
    border:
      `1px solid ${tema.cores.borda}`,
    background:
      tema.cores.branco,
    color:
      tema.cores.grafite,
    borderRadius:
      tema.bordas.pequena,
    padding: "0 16px",
    fontWeight: 600,
    cursor: "pointer",
  },

  botaoSalvar: {
    height: "42px",
    border: "none",
    background:
      tema.cores.laranja,
    color:
      tema.cores.branco,
    borderRadius:
      tema.bordas.pequena,
    padding: "0 18px",
    fontWeight: 700,
    cursor: "pointer",
  },
};