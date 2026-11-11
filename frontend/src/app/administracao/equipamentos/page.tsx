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

type Equipamento = {
  id: number;
  nome: string;
  descricao: string | null;
  tipo_cobranca: "HORA" | "DIA";
  valor_padrao: string | number;
  mobilizacao_padrao: string | number;
  desmobilizacao_padrao: string | number;
  ativo: boolean;
};

export default function EquipamentosPage() {
  const router = useRouter();

  const [equipamentos, setEquipamentos] =
    useState<Equipamento[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [verificandoAcesso, setVerificandoAcesso] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  const [modalNovoAberto, setModalNovoAberto] =
    useState(false);

  const [modalEdicaoAberto, setModalEdicaoAberto] =
    useState(false);

  const [
    equipamentoEditando,
    setEquipamentoEditando,
  ] = useState<Equipamento | null>(null);

  const [nome, setNome] =
    useState("");

  const [descricao, setDescricao] =
    useState("");

  const [tipoCobranca, setTipoCobranca] =
    useState<"HORA" | "DIA">("DIA");

  const [valorPadrao, setValorPadrao] =
    useState("");

  const [
    mobilizacaoPadrao,
    setMobilizacaoPadrao,
  ] = useState("");

  const [
    desmobilizacaoPadrao,
    setDesmobilizacaoPadrao,
  ] = useState("");

  useEffect(() => {
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

      setVerificandoAcesso(false);
      carregarEquipamentos();
    } catch {
      localStorage.removeItem(
        "estrutec_token"
      );

      localStorage.removeItem(
        "estrutec_usuario"
      );

      router.replace("/");
    }
  }, []);

  async function carregarEquipamentos() {
    try {
      setCarregando(true);
      setErro("");

      const resposta =
        await apiAutenticada(
          "/equipamentos"
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
            "Não foi possível carregar os equipamentos."
        );
      }

      setEquipamentos(
        dados.equipamentos || []
      );
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível carregar os equipamentos."
      );
    } finally {
      setCarregando(false);
    }
  }

  function limparFormulario() {
    setNome("");
    setDescricao("");
    setTipoCobranca("DIA");
    setValorPadrao("");
    setMobilizacaoPadrao("");
    setDesmobilizacaoPadrao("");
  }

  function abrirNovoEquipamento() {
    limparFormulario();
    setErro("");
    setModalNovoAberto(true);
  }

  function abrirEdicao(
    equipamento: Equipamento
  ) {
    setEquipamentoEditando(
      equipamento
    );

    setNome(
      equipamento.nome
    );

    setDescricao(
      equipamento.descricao || ""
    );

    setTipoCobranca(
      equipamento.tipo_cobranca
    );

    setValorPadrao(
      String(
        equipamento.valor_padrao || ""
      )
    );

    setMobilizacaoPadrao(
      String(
        equipamento.mobilizacao_padrao ||
          ""
      )
    );

    setDesmobilizacaoPadrao(
      String(
        equipamento.desmobilizacao_padrao ||
          ""
      )
    );

    setErro("");
    setModalEdicaoAberto(true);
  }

  async function cadastrarEquipamento(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    try {
      setErro("");

      const resposta =
        await apiAutenticada(
          "/equipamentos",
          {
            method: "POST",

            body: JSON.stringify({
              nome,
              descricao,

              tipo_cobranca:
                tipoCobranca,

              valor_padrao:
                Number(
                  valorPadrao || 0
                ),

              mobilizacao_padrao:
                Number(
                  mobilizacaoPadrao ||
                    0
                ),

              desmobilizacao_padrao:
                Number(
                  desmobilizacaoPadrao ||
                    0
                ),
            }),
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
            "Não foi possível cadastrar o equipamento."
        );
      }

      setModalNovoAberto(false);

      await carregarEquipamentos();

      setSucesso(
        "Equipamento cadastrado com sucesso!"
      );

      setTimeout(
        () => setSucesso(""),
        3000
      );
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível cadastrar o equipamento."
      );
    }
  }

  async function salvarEdicao(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (!equipamentoEditando) {
      return;
    }

    try {
      setErro("");

      const resposta =
        await apiAutenticada(
          `/equipamentos/${equipamentoEditando.id}`,
          {
            method: "PUT",

            body: JSON.stringify({
              nome,
              descricao,

              tipo_cobranca:
                tipoCobranca,

              valor_padrao:
                Number(
                  valorPadrao || 0
                ),

              mobilizacao_padrao:
                Number(
                  mobilizacaoPadrao ||
                    0
                ),

              desmobilizacao_padrao:
                Number(
                  desmobilizacaoPadrao ||
                    0
                ),
            }),
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
            "Não foi possível atualizar o equipamento."
        );
      }

      setModalEdicaoAberto(false);
      setEquipamentoEditando(null);

      await carregarEquipamentos();

      setSucesso(
        "Equipamento atualizado com sucesso!"
      );

      setTimeout(
        () => setSucesso(""),
        3000
      );
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível atualizar o equipamento."
      );
    }
  }

  async function alterarStatus(
    equipamento: Equipamento
  ) {
    try {
      setErro("");

      const resposta =
        await apiAutenticada(
          `/equipamentos/${equipamento.id}/status`,
          {
            method: "PATCH",

            body: JSON.stringify({
              ativo:
                !equipamento.ativo,
            }),
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
            "Não foi possível alterar o status."
        );
      }

      await carregarEquipamentos();

      setSucesso(
        equipamento.ativo
          ? "Equipamento desativado com sucesso!"
          : "Equipamento ativado com sucesso!"
      );

      setTimeout(
        () => setSucesso(""),
        3000
      );
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível alterar o status."
      );
    }
  }

  function formatarMoeda(
    valor: string | number
  ) {
    return new Intl.NumberFormat(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    ).format(Number(valor || 0));
  }

  if (verificandoAcesso) {
    return (
      <main style={estilos.pagina}>
        <div style={estilos.estado}>
          Verificando acesso...
        </div>
      </main>
    );
  }

  return (
    <main style={estilos.pagina}>
      <header style={estilos.cabecalho}>
        <div
          style={
            estilos.cabecalhoConteudo
          }
        >
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
                Equipamentos
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
            style={estilos.botaoVoltar}
          >
            Voltar
          </button>
        </div>
      </header>

      <section style={estilos.conteudo}>
        <div style={estilos.topo}>
          <div>
            <span
              style={estilos.sobretitulo}
            >
              ADMINISTRAÇÃO
            </span>

            <h1 style={estilos.titulo}>
              Equipamentos
            </h1>

            <p style={estilos.descricao}>
              Cadastre os equipamentos
              utilizados na montagem dos
              projetos.
            </p>
          </div>

          <button
            type="button"
            onClick={
              abrirNovoEquipamento
            }
            style={
              estilos.botaoPrincipal
            }
          >
            + Novo equipamento
          </button>
        </div>

        <div style={estilos.resumo}>
          <div style={estilos.resumoItem}>
            <span
              style={estilos.resumoValor}
            >
              {equipamentos.length}
            </span>

            <span
              style={estilos.resumoTexto}
            >
              Equipamentos cadastrados
            </span>
          </div>

          <div
            style={
              estilos.separadorResumo
            }
          />

          <div style={estilos.resumoItem}>
            <span
              style={estilos.resumoValor}
            >
              {
                equipamentos.filter(
                  (equipamento) =>
                    equipamento.ativo
                ).length
              }
            </span>

            <span
              style={estilos.resumoTexto}
            >
              Ativos
            </span>
          </div>
        </div>

        {erro && (
          <div style={estilos.erro}>
            {erro}
          </div>
        )}

        {sucesso && (
          <div style={estilos.sucesso}>
            {sucesso}
          </div>
        )}

        <div style={estilos.card}>
          <div
            style={
              estilos.cardCabecalho
            }
          >
            <h2
              style={estilos.cardTitulo}
            >
              Equipamentos
            </h2>

            <p
              style={
                estilos.cardDescricao
              }
            >
              Valores padrão utilizados
              na etapa de montagem.
            </p>
          </div>

          {carregando ? (
            <div style={estilos.estado}>
              Carregando equipamentos...
            </div>
          ) : equipamentos.length ===
            0 ? (
            <div style={estilos.estado}>
              Nenhum equipamento
              cadastrado.
            </div>
          ) : (
            <div
              style={
                estilos.tabelaContainer
              }
            >
              <table
                style={estilos.tabela}
              >
                <thead>
                  <tr>
                    <th style={estilos.th}>
                      Equipamento
                    </th>

                    <th style={estilos.th}>
                      Cobrança
                    </th>

                    <th style={estilos.th}>
                      Valor padrão
                    </th>

                    <th style={estilos.th}>
                      Mobilização
                    </th>

                    <th style={estilos.th}>
                      Desmobilização
                    </th>

                    <th style={estilos.th}>
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
                  {equipamentos.map(
                    (equipamento) => (
                      <tr
                        key={
                          equipamento.id
                        }
                      >
                        <td
                          style={
                            estilos.td
                          }
                        >
                          <strong
                            style={
                              estilos.nomeItem
                            }
                          >
                            {
                              equipamento.nome
                            }
                          </strong>

                          {equipamento.descricao && (
                            <span
                              style={
                                estilos.descricaoItem
                              }
                            >
                              {
                                equipamento.descricao
                              }
                            </span>
                          )}
                        </td>

                        <td
                          style={
                            estilos.td
                          }
                        >
                          {equipamento.tipo_cobranca ===
                          "HORA"
                            ? "Por hora"
                            : "Por dia"}
                        </td>

                        <td
                          style={
                            estilos.td
                          }
                        >
                          {formatarMoeda(
                            equipamento.valor_padrao
                          )}
                        </td>

                        <td
                          style={
                            estilos.td
                          }
                        >
                          {formatarMoeda(
                            equipamento.mobilizacao_padrao
                          )}
                        </td>

                        <td
                          style={
                            estilos.td
                          }
                        >
                          {formatarMoeda(
                            equipamento.desmobilizacao_padrao
                          )}
                        </td>

                        <td
                          style={
                            estilos.td
                          }
                        >
                          <span
                            style={
                              equipamento.ativo
                                ? estilos.statusAtivo
                                : estilos.statusInativo
                            }
                          >
                            {equipamento.ativo
                              ? "Ativo"
                              : "Inativo"}
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
                              estilos.acoes
                            }
                          >
                            <button
                              type="button"
                              onClick={() =>
                                abrirEdicao(
                                  equipamento
                                )
                              }
                              style={
                                estilos.botaoEditar
                              }
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                alterarStatus(
                                  equipamento
                                )
                              }
                              style={
                                equipamento.ativo
                                  ? estilos.botaoDesativar
                                  : estilos.botaoAtivar
                              }
                            >
                              {equipamento.ativo
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
          style={estilos.overlayModal}
          onClick={() => {
            setModalNovoAberto(false);
            setModalEdicaoAberto(false);
          }}
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
                    ? "Novo equipamento"
                    : "Editar equipamento"}
                </h2>

                <p
                  style={
                    estilos.modalDescricao
                  }
                >
                  Defina os valores padrão
                  utilizados na montagem.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setModalNovoAberto(
                    false
                  );

                  setModalEdicaoAberto(
                    false
                  );
                }}
                style={
                  estilos.botaoFechar
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                modalNovoAberto
                  ? cadastrarEquipamento
                  : salvarEdicao
              }
              style={
                estilos.formulario
              }
            >
              <div style={estilos.campo}>
                <label
                  style={estilos.label}
                >
                  Nome *
                </label>

                <input
                  value={nome}
                  required
                  onChange={(evento) =>
                    setNome(
                      evento.target.value
                    )
                  }
                  style={estilos.input}
                />
              </div>

              <div style={estilos.campo}>
                <label
                  style={estilos.label}
                >
                  Descrição
                </label>

                <textarea
                  value={descricao}
                  onChange={(evento) =>
                    setDescricao(
                      evento.target.value
                    )
                  }
                  style={estilos.textarea}
                />
              </div>

              <div style={estilos.campo}>
                <label
                  style={estilos.label}
                >
                  Tipo de cobrança
                </label>

                <select
                  value={tipoCobranca}
                  onChange={(evento) =>
                    setTipoCobranca(
                      evento.target
                        .value as
                        | "HORA"
                        | "DIA"
                    )
                  }
                  style={estilos.input}
                >
                  <option value="DIA">
                    Por dia
                  </option>

                  <option value="HORA">
                    Por hora
                  </option>
                </select>
              </div>

              <div
                style={
                  estilos.gridValores
                }
              >
                <div style={estilos.campo}>
                  <label
                    style={estilos.label}
                  >
                    Valor padrão (R$)
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorPadrao}
                    onChange={(evento) =>
                      setValorPadrao(
                        evento.target.value
                      )
                    }
                    style={
                      estilos.input
                    }
                  />
                </div>

                <div style={estilos.campo}>
                  <label
                    style={estilos.label}
                  >
                    Mobilização (R$)
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={
                      mobilizacaoPadrao
                    }
                    onChange={(evento) =>
                      setMobilizacaoPadrao(
                        evento.target.value
                      )
                    }
                    style={
                      estilos.input
                    }
                  />
                </div>

                <div style={estilos.campo}>
                  <label
                    style={estilos.label}
                  >
                    Desmobilização (R$)
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={
                      desmobilizacaoPadrao
                    }
                    onChange={(evento) =>
                      setDesmobilizacaoPadrao(
                        evento.target.value
                      )
                    }
                    style={
                      estilos.input
                    }
                  />
                </div>
              </div>

              <div
                style={
                  estilos.acoesModal
                }
              >
                <button
                  type="button"
                  onClick={() => {
                    setModalNovoAberto(
                      false
                    );

                    setModalEdicaoAberto(
                      false
                    );
                  }}
                  style={
                    estilos.botaoCancelar
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
                    ? "Cadastrar equipamento"
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

const estilos = {
  pagina: {
    minHeight: "100vh",
    background: tema.cores.fundo,
    color: tema.cores.texto,
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  cabecalho: {
    background: tema.cores.branco,
    borderBottom:
      `1px solid ${tema.cores.borda}`,
  },

  cabecalhoConteudo: {
    maxWidth: "1600px",
    margin: "0 auto",
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
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
    objectFit: "contain" as const,
  },

  divisor: {
    width: "1px",
    height: "38px",
    background: tema.cores.borda,
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
    color: tema.cores.grafite,
    fontSize: "15px",
  },

  botaoVoltar: {
    height: "40px",
    padding: "0 15px",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.pequena,
    background: tema.cores.branco,
    color: tema.cores.grafite,
    cursor: "pointer",
    fontWeight: 600,
  },

  conteudo: {
    maxWidth: "1600px",
    margin: "0 auto",
    padding: "42px 24px 60px",
  },

  topo: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-end",
    gap: "25px",
    marginBottom: "24px",
  },

  sobretitulo: {
    color: tema.cores.laranja,
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "1.4px",
  },

  titulo: {
    margin: 0,
    fontSize: "30px",
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
    color: tema.cores.branco,
    fontWeight: 700,
    cursor: "pointer",
  },

  resumo: {
    display: "flex",
    alignItems: "center",
    gap: "28px",
    padding: "20px 24px",
    marginBottom: "22px",
    background: tema.cores.branco,
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.grande,
    boxShadow: tema.sombras.card,
  },

  resumoItem: {
    display: "flex",
    flexDirection:
      "column" as const,
    gap: "3px",
  },

  resumoValor: {
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
    background: tema.cores.borda,
  },

  card: {
    overflow: "hidden",
    background: tema.cores.branco,
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.grande,
    boxShadow: tema.sombras.card,
  },

  cardCabecalho: {
    padding: "22px 24px",
    borderBottom:
      `1px solid ${tema.cores.borda}`,
  },

  cardTitulo: {
    margin: 0,
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
    padding: "14px 20px",
    textAlign: "left" as const,
    background: "#FAFAF9",
    color:
      tema.cores.textoSecundario,
    borderBottom:
      `1px solid ${tema.cores.borda}`,
    fontSize: "11px",
  },

  td: {
    padding: "16px 20px",
    borderBottom:
      `1px solid ${tema.cores.borda}`,
    fontSize: "13px",
  },

  nomeItem: {
    display: "block",
  },

  descricaoItem: {
    display: "block",
    marginTop: "4px",
    color:
      tema.cores.textoSecundario,
    fontSize: "11px",
  },

  statusAtivo: {
    padding: "5px 9px",
    borderRadius: "20px",
    background:
      tema.cores.sucessoFundo,
    color: tema.cores.sucesso,
    fontSize: "11px",
    fontWeight: 700,
  },

  statusInativo: {
    padding: "5px 9px",
    borderRadius: "20px",
    background: "#F5F5F4",
    color: "#78716C",
    fontSize: "11px",
    fontWeight: 700,
  },

  acoes: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
  },

  botaoEditar: {
    padding: "7px 11px",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.pequena,
    background: tema.cores.branco,
    cursor: "pointer",
  },

  botaoDesativar: {
    padding: "7px 11px",
    border: "1px solid #FED7AA",
    borderRadius:
      tema.bordas.pequena,
    background: "#FFF7ED",
    color: "#C2410C",
    cursor: "pointer",
  },

  botaoAtivar: {
    padding: "7px 11px",
    border: "1px solid #BBF7D0",
    borderRadius:
      tema.bordas.pequena,
    background: "#F0FDF4",
    color: "#166534",
    cursor: "pointer",
  },

  estado: {
    padding: "45px 24px",
    textAlign: "center" as const,
    color:
      tema.cores.textoSecundario,
  },

  erro: {
    marginBottom: "18px",
    padding: "13px 15px",
    background:
      tema.cores.erroFundo,
    color: tema.cores.erro,
    borderRadius:
      tema.bordas.media,
  },

  sucesso: {
    marginBottom: "18px",
    padding: "13px 15px",
    background:
      tema.cores.sucessoFundo,
    color: tema.cores.sucesso,
    borderRadius:
      tema.bordas.media,
  },

  overlayModal: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 1000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    background:
      "rgba(23,23,23,0.55)",
  },

  modal: {
    width: "100%",
    maxWidth: "650px",
    maxHeight: "90vh",
    overflowY: "auto" as const,
    padding: "26px",
    background: tema.cores.branco,
    borderRadius:
      tema.bordas.modal,
    boxShadow:
      tema.sombras.destaque,
  },

  modalCabecalho: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: "20px",
    marginBottom: "24px",
  },

  modalRotulo: {
    display: "block",
    marginBottom: "5px",
    color: tema.cores.laranja,
    fontSize: "10px",
    fontWeight: 800,
  },

  modalTitulo: {
    margin: 0,
    fontSize: "22px",
  },

  modalDescricao: {
    margin: "7px 0 0",
    color:
      tema.cores.textoSecundario,
    fontSize: "13px",
  },

  botaoFechar: {
    width: "34px",
    height: "34px",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius: "8px",
    background: tema.cores.branco,
    cursor: "pointer",
    fontSize: "20px",
  },

  formulario: {
    display: "flex",
    flexDirection:
      "column" as const,
    gap: "15px",
  },

  campo: {
    display: "flex",
    flexDirection:
      "column" as const,
  },

  label: {
    marginBottom: "6px",
    fontSize: "12px",
    fontWeight: 700,
  },

  input: {
    width: "100%",
    height: "42px",
    boxSizing:
      "border-box" as const,
    padding: "0 11px",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.pequena,
    background: tema.cores.branco,
  },

  textarea: {
    width: "100%",
    minHeight: "80px",
    resize: "vertical" as const,
    boxSizing:
      "border-box" as const,
    padding: "11px",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.pequena,
    fontFamily: "inherit",
  },

  gridValores: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: "12px",
  },

  acoesModal: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    paddingTop: "8px",
  },

  botaoCancelar: {
    height: "42px",
    padding: "0 16px",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.pequena,
    background: tema.cores.branco,
    cursor: "pointer",
  },

  botaoSalvar: {
    height: "42px",
    padding: "0 18px",
    border: "none",
    borderRadius:
      tema.bordas.pequena,
    background:
      tema.cores.laranja,
    color: tema.cores.branco,
    fontWeight: 700,
    cursor: "pointer",
  },
};