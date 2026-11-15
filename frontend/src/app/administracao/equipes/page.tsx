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

type Equipe = {
  id: number;
  nome: string;
  descricao: string | null;
  quantidade_padrao: number;
  custo_diario_padrao: string | number;
  ativo: boolean;
};

export default function EquipesPage() {
  const router = useRouter();

  const [equipes, setEquipes] =
    useState<Equipe[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [
    verificandoAcesso,
    setVerificandoAcesso,
  ] = useState(true);

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
    equipeEditando,
    setEquipeEditando,
  ] = useState<Equipe | null>(null);

  const [nome, setNome] =
    useState("");

  const [descricao, setDescricao] =
    useState("");

  const [
    quantidadePadrao,
    setQuantidadePadrao,
  ] = useState("1");

  const [
    custoDiarioPadrao,
    setCustoDiarioPadrao,
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
      carregarEquipes();
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

  async function carregarEquipes() {
    try {
      setCarregando(true);
      setErro("");

      const resposta =
        await apiAutenticada(
          "/equipes"
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
            "Não foi possível carregar as equipes."
        );
      }

      setEquipes(
        dados.equipes || []
      );
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível carregar as equipes."
      );
    } finally {
      setCarregando(false);
    }
  }

  function limparFormulario() {
    setNome("");
    setDescricao("");
    setQuantidadePadrao("1");
    setCustoDiarioPadrao("");
  }

  function abrirNovaEquipe() {
    limparFormulario();
    setErro("");
    setModalNovoAberto(true);
  }

  function abrirEdicao(
    equipe: Equipe
  ) {
    setEquipeEditando(equipe);

    setNome(equipe.nome);

    setDescricao(
      equipe.descricao || ""
    );

    setQuantidadePadrao(
      String(
        equipe.quantidade_padrao || 1
      )
    );

    setCustoDiarioPadrao(
      String(
        equipe.custo_diario_padrao ||
          ""
      )
    );

    setErro("");
    setModalEdicaoAberto(true);
  }

  async function cadastrarEquipe(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    try {
      setErro("");

      const resposta =
        await apiAutenticada(
          "/equipes",
          {
            method: "POST",

            body: JSON.stringify({
              nome,
              descricao,

              quantidade_padrao:
                Number(
                  quantidadePadrao || 1
                ),

              custo_diario_padrao:
                Number(
                  custoDiarioPadrao || 0
                ),
            }),
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
            "Não foi possível cadastrar a equipe."
        );
      }

      setModalNovoAberto(false);

      await carregarEquipes();

      setSucesso(
        "Equipe cadastrada com sucesso!"
      );

      setTimeout(
        () => setSucesso(""),
        3000
      );
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível cadastrar a equipe."
      );
    }
  }

  async function salvarEdicao(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (!equipeEditando) {
      return;
    }

    try {
      setErro("");

      const resposta =
        await apiAutenticada(
          `/equipes/${equipeEditando.id}`,
          {
            method: "PUT",

            body: JSON.stringify({
              nome,
              descricao,

              quantidade_padrao:
                Number(
                  quantidadePadrao || 1
                ),

              custo_diario_padrao:
                Number(
                  custoDiarioPadrao || 0
                ),
            }),
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
            "Não foi possível atualizar a equipe."
        );
      }

      setModalEdicaoAberto(false);
      setEquipeEditando(null);

      await carregarEquipes();

      setSucesso(
        "Equipe atualizada com sucesso!"
      );

      setTimeout(
        () => setSucesso(""),
        3000
      );
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível atualizar a equipe."
      );
    }
  }

  async function alterarStatus(
    equipe: Equipe
  ) {
    try {
      setErro("");

      const resposta =
        await apiAutenticada(
          `/equipes/${equipe.id}/status`,
          {
            method: "PATCH",

            body: JSON.stringify({
              ativo:
                !equipe.ativo,
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

      await carregarEquipes();

      setSucesso(
        equipe.ativo
          ? "Equipe desativada com sucesso!"
          : "Equipe ativada com sucesso!"
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
                Equipes
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
              Equipes
            </h1>

            <p style={estilos.descricao}>
              Cadastre as equipes utilizadas
              na etapa de montagem dos
              projetos.
            </p>
          </div>

          <button
            type="button"
            onClick={abrirNovaEquipe}
            style={
              estilos.botaoPrincipal
            }
          >
            + Nova equipe
          </button>
        </div>

        <div style={estilos.resumo}>
          <div style={estilos.resumoItem}>
            <span
              style={estilos.resumoValor}
            >
              {equipes.length}
            </span>

            <span
              style={estilos.resumoTexto}
            >
              Equipes cadastradas
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
                equipes.filter(
                  (equipe) =>
                    equipe.ativo
                ).length
              }
            </span>

            <span
              style={estilos.resumoTexto}
            >
              Ativas
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
              Equipes
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
              Carregando equipes...
            </div>
          ) : equipes.length === 0 ? (
            <div style={estilos.estado}>
              Nenhuma equipe cadastrada.
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
                      Equipe
                    </th>

                    <th style={estilos.th}>
                      Pessoas
                    </th>

                    <th style={estilos.th}>
                      Custo diário
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
                  {equipes.map(
                    (equipe) => (
                      <tr key={equipe.id}>
                        <td style={estilos.td}>
                          <strong
                            style={
                              estilos.nomeItem
                            }
                          >
                            {equipe.nome}
                          </strong>

                          {equipe.descricao && (
                            <span
                              style={
                                estilos.descricaoItem
                              }
                            >
                              {equipe.descricao}
                            </span>
                          )}
                        </td>

                        <td style={estilos.td}>
                          {
                            equipe.quantidade_padrao
                          }
                        </td>

                        <td style={estilos.td}>
                          {formatarMoeda(
                            equipe.custo_diario_padrao
                          )}
                        </td>

                        <td style={estilos.td}>
                          <span
                            style={
                              equipe.ativo
                                ? estilos.statusAtivo
                                : estilos.statusInativo
                            }
                          >
                            {equipe.ativo
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
                              estilos.acoes
                            }
                          >
                            <button
                              type="button"
                              onClick={() =>
                                abrirEdicao(
                                  equipe
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
                                  equipe
                                )
                              }
                              style={
                                equipe.ativo
                                  ? estilos.botaoDesativar
                                  : estilos.botaoAtivar
                              }
                            >
                              {equipe.ativo
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
                    ? "Nova equipe"
                    : "Editar equipe"}
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
                  ? cadastrarEquipe
                  : salvarEdicao
              }
              style={estilos.formulario}
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

              <div
                style={
                  estilos.gridValores
                }
              >
                <div style={estilos.campo}>
                  <label
                    style={estilos.label}
                  >
                    Quantidade de pessoas
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      quantidadePadrao
                    }
                    onChange={(evento) =>
                      setQuantidadePadrao(
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
                    Custo diário (R$)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      custoDiarioPadrao
                    }
                    onChange={(evento) =>
                      setCustoDiarioPadrao(
                        evento.target.value
                      )
                    }
                    style={estilos.input}
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
                    ? "Cadastrar equipe"
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
    textAlign:
      "left" as const,
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
    color:
      tema.cores.sucesso,
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
    justifyContent:
      "flex-end",
    gap: "8px",
  },

  botaoEditar: {
    padding: "7px 11px",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.pequena,
    background:
      tema.cores.branco,
    cursor: "pointer",
  },

  botaoDesativar: {
    padding: "7px 11px",
    border:
      "1px solid #FED7AA",
    borderRadius:
      tema.bordas.pequena,
    background: "#FFF7ED",
    color: "#C2410C",
    cursor: "pointer",
  },

  botaoAtivar: {
    padding: "7px 11px",
    border:
      "1px solid #BBF7D0",
    borderRadius:
      tema.bordas.pequena,
    background: "#F0FDF4",
    color: "#166534",
    cursor: "pointer",
  },

  estado: {
    padding: "45px 24px",
    textAlign:
      "center" as const,
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
    color:
      tema.cores.sucesso,
    borderRadius:
      tema.bordas.media,
  },

  overlayModal: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 1000,
    display: "flex",
    justifyContent:
      "center",
    alignItems: "center",
    padding: "20px",
    background:
      "rgba(23,23,23,0.55)",
  },

  modal: {
    width: "100%",
    maxWidth: "620px",
    maxHeight: "90vh",
    overflowY: "auto" as const,
    padding: "26px",
    background:
      tema.cores.branco,
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
    color:
      tema.cores.laranja,
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
    background:
      tema.cores.branco,
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
    background:
      tema.cores.branco,
  },

  textarea: {
    width: "100%",
    minHeight: "80px",
    resize:
      "vertical" as const,
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
      "repeat(2, 1fr)",
    gap: "12px",
  },

  acoesModal: {
    display: "flex",
    justifyContent:
      "flex-end",
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
    background:
      tema.cores.branco,
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
    color:
      tema.cores.branco,
    fontWeight: 700,
    cursor: "pointer",
  },
};