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

type Transportadora = {
  id: number;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  observacoes: string | null;
  ativo: boolean;
};

export default function TransportadorasPage() {
  const router = useRouter();

  const [transportadoras, setTransportadoras] =
    useState<Transportadora[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  const [modalNovoAberto, setModalNovoAberto] =
    useState(false);

  const [modalEdicaoAberto, setModalEdicaoAberto] =
    useState(false);

  const [transportadoraEditando, setTransportadoraEditando] =
    useState<Transportadora | null>(null);

  const [razaoSocial, setRazaoSocial] =
    useState("");

  const [nomeFantasia, setNomeFantasia] =
    useState("");

  const [cnpj, setCnpj] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [telefone, setTelefone] =
    useState("");

  const [cidade, setCidade] =
    useState("");

  const [estado, setEstado] =
    useState("");

  const [observacoes, setObservacoes] =
    useState("");

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

      carregarTransportadoras();
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

  async function carregarTransportadoras() {
    try {
      setCarregando(true);
      setErro("");

      const resposta =
        await apiAutenticada(
          "/transportadoras"
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
            "Não foi possível carregar as transportadoras."
        );

        return;
      }

      setTransportadoras(
        dados.transportadoras || []
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
    setRazaoSocial("");
    setNomeFantasia("");
    setCnpj("");
    setEmail("");
    setTelefone("");
    setCidade("");
    setEstado("");
    setObservacoes("");
  }

  function abrirNovaTransportadora() {
    limparFormulario();
    setErro("");
    setModalNovoAberto(true);
  }

  async function cadastrarTransportadora(
    evento: FormEvent
  ) {
    evento.preventDefault();

    try {
      setErro("");

      const resposta =
        await apiAutenticada(
          "/transportadoras",
          {
            method: "POST",

            body: JSON.stringify({
              razao_social:
                razaoSocial,

              nome_fantasia:
                nomeFantasia,

              cnpj,
              email,
              telefone,
              cidade,
              estado,
              observacoes,
            }),
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        setErro(
          dados.erro ||
            "Não foi possível cadastrar a transportadora."
        );

        return;
      }

      setModalNovoAberto(false);

      setSucesso(
        "Transportadora cadastrada com sucesso!"
      );

      setTimeout(
        () => setSucesso(""),
        3000
      );

      carregarTransportadoras();
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    }
  }

  function abrirEdicao(
    transportadora: Transportadora
  ) {
    setTransportadoraEditando(
      transportadora
    );

    setRazaoSocial(
      transportadora.razao_social
    );

    setNomeFantasia(
      transportadora.nome_fantasia ||
        ""
    );

    setCnpj(
      transportadora.cnpj || ""
    );

    setEmail(
      transportadora.email || ""
    );

    setTelefone(
      transportadora.telefone || ""
    );

    setCidade(
      transportadora.cidade || ""
    );

    setEstado(
      transportadora.estado || ""
    );

    setObservacoes(
      transportadora.observacoes ||
        ""
    );

    setErro("");
    setModalEdicaoAberto(true);
  }

  async function salvarEdicao(
    evento: FormEvent
  ) {
    evento.preventDefault();

    if (!transportadoraEditando) {
      return;
    }

    try {
      setErro("");

      const resposta =
        await apiAutenticada(
          `/transportadoras/${transportadoraEditando.id}`,
          {
            method: "PUT",

            body: JSON.stringify({
              razao_social:
                razaoSocial,

              nome_fantasia:
                nomeFantasia,

              cnpj,
              email,
              telefone,
              cidade,
              estado,
              observacoes,
            }),
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        setErro(
          dados.erro ||
            "Não foi possível atualizar a transportadora."
        );

        return;
      }

      setModalEdicaoAberto(false);

      setTransportadoraEditando(
        null
      );

      setSucesso(
        "Transportadora atualizada com sucesso!"
      );

      setTimeout(
        () => setSucesso(""),
        3000
      );

      carregarTransportadoras();
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    }
  }

  async function alterarStatus(
    transportadora: Transportadora
  ) {
    try {
      setErro("");

      const resposta =
        await apiAutenticada(
          `/transportadoras/${transportadora.id}/status`,
          {
            method: "PATCH",

            body: JSON.stringify({
              ativo:
                !transportadora.ativo,
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
        transportadora.ativo
          ? "Transportadora desativada com sucesso!"
          : "Transportadora ativada com sucesso!"
      );

      setTimeout(
        () => setSucesso(""),
        3000
      );

      carregarTransportadoras();
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    }
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
            <span style={estilos.rotuloCabecalho}>
              Administração
            </span>

            <strong style={estilos.tituloCabecalho}>
              Transportadoras
            </strong>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push("/administracao")
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
          <span style={estilos.sobretitulo}>
            ADMINISTRAÇÃO
          </span>

          <h1 style={estilos.titulo}>
            Transportadoras
          </h1>

          <p style={estilos.descricao}>
            Cadastre e gerencie as transportadoras
            utilizadas na logística dos projetos.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNovaTransportadora}
          style={estilos.botaoPrincipal}
        >
          + Nova transportadora
        </button>
      </div>

      <div style={estilos.resumo}>
        <div style={estilos.resumoItem}>
          <span style={estilos.resumoValor}>
            {transportadoras.length}
          </span>

          <span style={estilos.resumoTexto}>
            Transportadoras cadastradas
          </span>
        </div>

        <div style={estilos.separadorResumo} />

        <div style={estilos.resumoItem}>
          <span style={estilos.resumoValor}>
            {
              transportadoras.filter(
                (transportadora) =>
                  transportadora.ativo
              ).length
            }
          </span>

          <span style={estilos.resumoTexto}>
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
        <div style={estilos.cardCabecalho}>
          <div>
            <h2 style={estilos.cardTitulo}>
              Transportadoras
            </h2>

            <p style={estilos.cardDescricao}>
              Transportadoras cadastradas no sistema.
            </p>
          </div>
        </div>

        {carregando ? (
          <div style={estilos.estado}>
            Carregando transportadoras...
          </div>
        ) : transportadoras.length === 0 ? (
          <div style={estilos.estado}>
            Nenhuma transportadora cadastrada.
          </div>
        ) : (
          <div style={estilos.tabelaContainer}>
            <table style={estilos.tabela}>
              <thead>
                <tr>
                  <th style={estilos.th}>
                    Transportadora
                  </th>

                  <th style={estilos.th}>
                    CNPJ
                  </th>

                  <th style={estilos.th}>
                    Local
                  </th>

                  <th style={estilos.th}>
                    Contato
                  </th>

                  <th style={estilos.th}>
                    Status
                  </th>

                  <th
                    style={{
                      ...estilos.th,
                      textAlign: "right",
                    }}
                  >
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {transportadoras.map(
                  (transportadora) => (
                    <tr
                      key={transportadora.id}
                      style={estilos.linha}
                    >
                      <td style={estilos.td}>
                        <strong
                          style={
                            estilos.nomeEmpresa
                          }
                        >
                          {transportadora.nome_fantasia ||
                            transportadora.razao_social}
                        </strong>

                        {transportadora.nome_fantasia && (
                          <span
                            style={
                              estilos.razaoSocial
                            }
                          >
                            {
                              transportadora.razao_social
                            }
                          </span>
                        )}
                      </td>

                      <td style={estilos.td}>
                        {transportadora.cnpj ||
                          "-"}
                      </td>

                      <td style={estilos.td}>
                        {transportadora.cidade
                          ? `${transportadora.cidade}${
                              transportadora.estado
                                ? ` / ${transportadora.estado}`
                                : ""
                            }`
                          : "-"}
                      </td>

                      <td style={estilos.td}>
                        {transportadora.email ||
                          transportadora.telefone ||
                          "-"}
                      </td>

                      <td style={estilos.td}>
                        <span
                          style={
                            transportadora.ativo
                              ? estilos.statusAtivo
                              : estilos.statusInativo
                          }
                        >
                          {transportadora.ativo
                            ? "Ativa"
                            : "Inativa"}
                        </span>
                      </td>

                      <td
                        style={{
                          ...estilos.td,
                          textAlign: "right",
                        }}
                      >
                        <div style={estilos.acoes}>
                          <button
                            type="button"
                            onClick={() =>
                              abrirEdicao(
                                transportadora
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
                                transportadora
                              )
                            }
                            style={
                              transportadora.ativo
                                ? estilos.botaoDesativar
                                : estilos.botaoAtivar
                            }
                          >
                            {transportadora.ativo
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
          <div style={estilos.modalCabecalho}>
            <div>
              <span style={estilos.modalRotulo}>
                ADMINISTRAÇÃO
              </span>

              <h2 style={estilos.modalTitulo}>
                {modalNovoAberto
                  ? "Nova transportadora"
                  : "Editar transportadora"}
              </h2>

              <p style={estilos.modalDescricao}>
                {modalNovoAberto
                  ? "Cadastre uma transportadora para utilização na logística do Estrutec."
                  : "Atualize os dados da transportadora."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setModalNovoAberto(false);
                setModalEdicaoAberto(false);
              }}
              style={estilos.botaoFechar}
            >
              ×
            </button>
          </div>

          <form
            onSubmit={
              modalNovoAberto
                ? cadastrarTransportadora
                : salvarEdicao
            }
            style={estilos.formulario}
          >
            <div style={estilos.campo}>
              <label style={estilos.label}>
                Razão social *
              </label>

              <input
                value={razaoSocial}
                onChange={(evento) =>
                  setRazaoSocial(
                    evento.target.value
                  )
                }
                required
                style={estilos.input}
              />
            </div>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                Nome fantasia
              </label>

              <input
                value={nomeFantasia}
                onChange={(evento) =>
                  setNomeFantasia(
                    evento.target.value
                  )
                }
                style={estilos.input}
              />
            </div>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                CNPJ
              </label>

              <input
                value={cnpj}
                onChange={(evento) =>
                  setCnpj(
                    evento.target.value
                  )
                }
                style={estilos.input}
              />
            </div>

            <div style={estilos.linhaCampos}>
              <div style={estilos.campoFlex}>
                <label style={estilos.label}>
                  Cidade
                </label>

                <input
                  value={cidade}
                  onChange={(evento) =>
                    setCidade(
                      evento.target.value
                    )
                  }
                  style={estilos.input}
                />
              </div>

              <div style={estilos.campoEstado}>
                <label style={estilos.label}>
                  UF
                </label>

                <input
                  value={estado}
                  onChange={(evento) =>
                    setEstado(
                      evento.target.value
                        .toUpperCase()
                        .slice(0, 2)
                    )
                  }
                  maxLength={2}
                  style={estilos.input}
                />
              </div>
            </div>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                E-mail
              </label>

              <input
                type="email"
                value={email}
                onChange={(evento) =>
                  setEmail(
                    evento.target.value
                  )
                }
                style={estilos.input}
              />
            </div>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                Telefone
              </label>

              <input
                value={telefone}
                onChange={(evento) =>
                  setTelefone(
                    evento.target.value
                  )
                }
                style={estilos.input}
              />
            </div>

            <div style={estilos.campo}>
              <label style={estilos.label}>
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

            <div style={estilos.acoesModal}>
              <button
                type="button"
                onClick={() => {
                  setModalNovoAberto(false);
                  setModalEdicaoAberto(false);
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
                  ? "Cadastrar transportadora"
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
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label style={estilos.label}>
        {label}
      </label>

      <input
        value={value}
        required={required}
        onChange={(e) =>
          onChange(e.target.value)
        }
        style={estilos.input}
      />
    </div>
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
    background:
      tema.cores.branco,
    color: tema.cores.grafite,
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
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
    gap: "24px",
    marginBottom: "28px",
  },

  sobretitulo: {
    display: "block",
    marginBottom: "8px",
    color: tema.cores.laranja,
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "1.4px",
  },

  titulo: {
    margin: 0,
    color: tema.cores.grafite,
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
    color: tema.cores.branco,
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
    color: tema.cores.grafite,
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
    color: tema.cores.grafite,
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
    textAlign: "left" as const,
  },

  linha: {
    borderTop:
      `1px solid ${tema.cores.borda}`,
  },

  td: {
    padding: "16px 20px",
    color: tema.cores.texto,
    fontSize: "13px",
    verticalAlign:
      "middle" as const,
  },

  nomeEmpresa: {
    display: "block",
    color: tema.cores.grafite,
    fontSize: "13px",
  },

  razaoSocial: {
    display: "block",
    marginTop: "4px",
    color:
      tema.cores.textoSecundario,
    fontSize: "11px",
  },

  statusAtivo: {
    color: tema.cores.sucesso,
    fontSize: "12px",
    fontWeight: 700,
  },

  statusInativo: {
    color: tema.cores.erro,
    fontSize: "12px",
    fontWeight: 700,
  },

  estado: {
    padding: "50px 24px",
    textAlign: "center" as const,
    color:
      tema.cores.textoSecundario,
    fontSize: "13px",
  },

  erro: {
    marginBottom: "20px",
    padding: "13px 15px",
    background:
      tema.cores.erroFundo,
    color: tema.cores.erro,
    borderRadius:
      tema.bordas.pequena,
    border:
      "1px solid #FECACA",
    fontSize: "13px",
  },

  verificandoAcesso: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color:
      tema.cores.textoSecundario,
    fontSize: "13px",
  },
  acoes: {
    display: "flex",
    justifyContent: "flex-end",
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
    color: tema.cores.grafite,
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    },

    botaoExcluir: {
    height: "34px",
    padding: "0 13px",
    border: "1px solid #FECACA",
    borderRadius:
        tema.bordas.pequena,
    background:
        tema.cores.erroFundo,
    color: tema.cores.erro,
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    },

    sucesso: {
    marginBottom: "20px",
    padding: "13px 15px",
    background:
        tema.cores.sucessoFundo,
    color: tema.cores.sucesso,
    border: "1px solid #BBF7D0",
    borderRadius:
        tema.bordas.pequena,
    fontSize: "13px",
    fontWeight: 600,
    },

    overlayModal: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background:
        "rgba(23,23,23,0.62)",
    backdropFilter: "blur(3px)",
    },

    modal: {
    width: "100%",
    maxWidth: "580px",
    maxHeight: "90vh",
    overflowY: "auto" as const,
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
    display: "flex",
    justifyContent:
        "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "24px",
    },

    modalRotulo: {
    display: "block",
    marginBottom: "6px",
    color: tema.cores.laranja,
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1.3px",
    },

    modalTitulo: {
    margin: 0,
    color: tema.cores.grafite,
    fontSize: "22px",
    },

    modalDescricao: {
    margin: "6px 0 0",
    color:
        tema.cores.textoSecundario,
    fontSize: "13px",
    lineHeight: 1.5,
    },

    botaoFechar: {
    width: "34px",
    height: "34px",
    border:
        `1px solid ${tema.cores.borda}`,
    borderRadius:
        tema.bordas.pequena,
    background:
        tema.cores.branco,
    color:
        tema.cores.textoSecundario,
    fontSize: "20px",
    cursor: "pointer",
    },

    formulario: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "17px",
    },

    campo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
    },

    linhaCampos: {
    display: "flex",
    gap: "14px",
    },

    campoFlex: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
    },

    campoEstado: {
    width: "100px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
    },

    label: {
    color: tema.cores.grafite,
    fontSize: "12px",
    fontWeight: 700,
    },

    input: {
    width: "100%",
    height: "43px",
    boxSizing: "border-box" as const,
    padding: "0 12px",
    border:
        `1px solid ${tema.cores.borda}`,
    borderRadius:
        tema.bordas.pequena,
    background:
        tema.cores.branco,
    color: tema.cores.texto,
    fontSize: "13px",
    outline: "none",
    },

    erroModal: {
    padding: "11px 12px",
    background:
        tema.cores.erroFundo,
    color: tema.cores.erro,
    border: "1px solid #FECACA",
    borderRadius:
        tema.bordas.pequena,
    fontSize: "12px",
    },

    acoesModal: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "5px",
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
    color: tema.cores.grafite,
    fontSize: "13px",
    fontWeight: 600,
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
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    },

    modalExcluir: {
    width: "100%",
    maxWidth: "450px",
    padding: "28px",
    background:
        tema.cores.branco,
    borderRadius:
        tema.bordas.modal,
    boxShadow:
        tema.sombras.destaque,
    },

    iconeExcluir: {
    width: "46px",
    height: "46px",
    marginBottom: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "13px",
    background:
        tema.cores.erroFundo,
    color: tema.cores.erro,
    fontSize: "21px",
    fontWeight: 800,
    },

    modalDescricaoExcluir: {
    margin: "10px 0 18px",
    color:
        tema.cores.textoSecundario,
    fontSize: "13px",
    lineHeight: 1.6,
    },

    avisoExcluir: {
    marginBottom: "20px",
    padding: "12px",
    background:
        tema.cores.erroFundo,
    color: tema.cores.erro,
    borderRadius:
        tema.bordas.pequena,
    fontSize: "12px",
    fontWeight: 600,
    },

    botaoConfirmarExclusao: {
    height: "42px",
    padding: "0 18px",
    border: "none",
    borderRadius:
        tema.bordas.pequena,
    background:
        tema.cores.erro,
    color: tema.cores.branco,
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    },
};