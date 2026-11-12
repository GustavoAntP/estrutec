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

type CavaloMecanico = {
  id: number;
  nome: string;
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  consumo_carregado_km_l:
    | string
    | number;
  consumo_vazio_km_l:
    | string
    | number;
  observacoes: string | null;
  ativo: boolean;
};

export default function CavalosMecanicosPage() {
  const router = useRouter();

  const [
    cavalos,
    setCavalos,
  ] = useState<CavaloMecanico[]>([]);

  const [
    carregando,
    setCarregando,
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
    cavaloEditando,
    setCavaloEditando,
  ] = useState<CavaloMecanico | null>(
    null
  );

  const [nome, setNome] =
    useState("");

  const [placa, setPlaca] =
    useState("");

  const [marca, setMarca] =
    useState("");

  const [modelo, setModelo] =
    useState("");

  const [
    consumoCarregado,
    setConsumoCarregado,
  ] = useState("");

  const [
    consumoVazio,
    setConsumoVazio,
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

      carregarCavalos();
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

  async function carregarCavalos() {
    try {
      setCarregando(true);
      setErro("");

      const resposta =
        await apiAutenticada(
          "/cavalos-mecanicos"
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
            "Não foi possível carregar os cavalos mecânicos."
        );

        return;
      }

      setCavalos(
        dados.cavalos || []
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
    setMarca("");
    setModelo("");
    setConsumoCarregado("");
    setConsumoVazio("");
    setObservacoes("");
  }

  function abrirNovoCavalo() {
    limparFormulario();
    setErro("");
    setModalNovoAberto(true);
  }

  async function cadastrarCavalo(
    evento: FormEvent
  ) {
    evento.preventDefault();

    try {
      setErro("");

      const resposta =
        await apiAutenticada(
          "/cavalos-mecanicos",
          {
            method: "POST",

            body: JSON.stringify({
              nome,
              placa,
              marca,
              modelo,

              consumo_carregado_km_l:
                Number(
                  consumoCarregado
                ),

              consumo_vazio_km_l:
                Number(
                  consumoVazio
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
            "Não foi possível cadastrar o cavalo mecânico."
        );

        return;
      }

      setModalNovoAberto(false);

      setSucesso(
        "Cavalo mecânico cadastrado com sucesso!"
      );

      setTimeout(
        () => setSucesso(""),
        3000
      );

      carregarCavalos();
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    }
  }

  function abrirEdicao(
    cavalo: CavaloMecanico
  ) {
    setCavaloEditando(cavalo);

    setNome(
      cavalo.nome || ""
    );

    setPlaca(
      cavalo.placa || ""
    );

    setMarca(
      cavalo.marca || ""
    );

    setModelo(
      cavalo.modelo || ""
    );

    setConsumoCarregado(
      String(
        cavalo.consumo_carregado_km_l ??
          ""
      )
    );

    setConsumoVazio(
      String(
        cavalo.consumo_vazio_km_l ??
          ""
      )
    );

    setObservacoes(
      cavalo.observacoes || ""
    );

    setErro("");
    setModalEdicaoAberto(true);
  }

  async function salvarEdicao(
    evento: FormEvent
  ) {
    evento.preventDefault();

    if (!cavaloEditando) {
      return;
    }

    try {
      setErro("");

      const resposta =
        await apiAutenticada(
          `/cavalos-mecanicos/${cavaloEditando.id}`,
          {
            method: "PUT",

            body: JSON.stringify({
              nome,
              placa,
              marca,
              modelo,

              consumo_carregado_km_l:
                Number(
                  consumoCarregado
                ),

              consumo_vazio_km_l:
                Number(
                  consumoVazio
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
            "Não foi possível atualizar o cavalo mecânico."
        );

        return;
      }

      setModalEdicaoAberto(false);
      setCavaloEditando(null);

      setSucesso(
        "Cavalo mecânico atualizado com sucesso!"
      );

      setTimeout(
        () => setSucesso(""),
        3000
      );

      carregarCavalos();
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    }
  }

  async function alterarStatus(
    cavalo: CavaloMecanico
  ) {
    try {
      setErro("");

      const resposta =
        await apiAutenticada(
          `/cavalos-mecanicos/${cavalo.id}/status`,
          {
            method: "PATCH",

            body: JSON.stringify({
              ativo:
                !cavalo.ativo,
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
        cavalo.ativo
          ? "Cavalo mecânico desativado com sucesso!"
          : "Cavalo mecânico ativado com sucesso!"
      );

      setTimeout(
        () => setSucesso(""),
        3000
      );

      carregarCavalos();
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    }
  }

  return (
    <main style={estilos.pagina}>
      <header style={estilos.cabecalho}>
        <div style={estilos.areaMarca}>
          <Image
            src="/estrutec-logo.png"
            alt="Estrutec"
            width={150}
            height={90}
            priority
            style={estilos.logo}
          />

          <div style={estilos.divisor} />

          <div>
            <strong
              style={estilos.nomeArea}
            >
              Administração
            </strong>

            <span
              style={
                estilos.descricaoArea
              }
            >
              Cadastro de cavalos
              mecânicos
            </span>
          </div>
        </div>

        <div style={estilos.acoes}>
          <button
            type="button"
            style={estilos.botaoVoltar}
            onClick={() =>
              router.push(
                "/administracao"
              )
            }
          >
            Voltar ao Administração
          </button>

          <button
            type="button"
            style={estilos.botaoNovo}
            onClick={
              abrirNovoCavalo
            }
          >
            + Novo cavalo mecânico
          </button>
        </div>
      </header>

      <section
        style={estilos.conteudo}
      >
        <div
          style={estilos.topoPagina}
        >
          <div>
            <span
              style={
                estilos.sobretitulo
              }
            >
              ADMINISTRAÇÃO
            </span>

            <h1
              style={estilos.titulo}
            >
              Cavalos Mecânicos
            </h1>

            <p
              style={estilos.descricao}
            >
              Gerencie os veículos
              utilizados no transporte dos
              elementos estruturais.
            </p>
          </div>

          <div style={estilos.contador}>
            <strong>
              {cavalos.length}
            </strong>

            <span>
              {cavalos.length === 1
                ? "veículo"
                : "veículos"}
            </span>
          </div>
        </div>

        {sucesso && (
          <div
            style={estilos.sucesso}
          >
            {sucesso}
          </div>
        )}

        {erro && (
          <div style={estilos.erro}>
            {erro}
          </div>
        )}

        {carregando ? (
          <div
            style={estilos.mensagem}
          >
            Carregando cavalos
            mecânicos...
          </div>
        ) : (
          <div style={estilos.card}>
            <table
              style={estilos.tabela}
            >
              <thead>
                <tr>
                  <th
                    style={estilos.th}
                  >
                    Veículo
                  </th>

                  <th
                    style={estilos.th}
                  >
                    Placa
                  </th>

                  <th
                    style={estilos.th}
                  >
                    Consumo carregado
                  </th>

                  <th
                    style={estilos.th}
                  >
                    Consumo vazio
                  </th>

                  <th
                    style={estilos.th}
                  >
                    Status
                  </th>

                  <th
                    style={estilos.th}
                  >
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {cavalos.map(
                  (cavalo) => (
                    <tr
                      key={cavalo.id}
                    >
                      <td
                        style={
                          estilos.td
                        }
                      >
                        <strong>
                          {cavalo.nome}
                        </strong>

                        {(cavalo.marca ||
                          cavalo.modelo) && (
                          <div
                            style={
                              estilos.secundario
                            }
                          >
                            {[
                              cavalo.marca,
                              cavalo.modelo,
                            ]
                              .filter(
                                Boolean
                              )
                              .join(" ")}
                          </div>
                        )}
                      </td>

                      <td
                        style={
                          estilos.td
                        }
                      >
                        {cavalo.placa ||
                          "-"}
                      </td>

                      <td
                        style={
                          estilos.td
                        }
                      >
                        {Number(
                          cavalo.consumo_carregado_km_l
                        ).toLocaleString(
                          "pt-BR",
                          {
                            minimumFractionDigits:
                              2,
                            maximumFractionDigits:
                              2,
                          }
                        )}{" "}
                        km/L
                      </td>

                      <td
                        style={
                          estilos.td
                        }
                      >
                        {Number(
                          cavalo.consumo_vazio_km_l
                        ).toLocaleString(
                          "pt-BR",
                          {
                            minimumFractionDigits:
                              2,
                            maximumFractionDigits:
                              2,
                          }
                        )}{" "}
                        km/L
                      </td>

                      <td
                        style={
                          estilos.td
                        }
                      >
                        <span
                          style={
                            cavalo.ativo
                              ? estilos.statusAtivo
                              : estilos.statusInativo
                          }
                        >
                          {cavalo.ativo
                            ? "Ativo"
                            : "Inativo"}
                        </span>
                      </td>

                      <td
                        style={
                          estilos.td
                        }
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
                                cavalo
                              )
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            style={
                              estilos.botaoStatus
                            }
                            onClick={() =>
                              alterarStatus(
                                cavalo
                              )
                            }
                          >
                            {cavalo.ativo
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
      </section>

      {(modalNovoAberto ||
        modalEdicaoAberto) && (
        <div
          style={estilos.fundoModal}
        >
          <div style={estilos.modal}>
            <h2
              style={
                estilos.tituloModal
              }
            >
              {modalNovoAberto
                ? "Novo cavalo mecânico"
                : "Editar cavalo mecânico"}
            </h2>

            <form
              onSubmit={
                modalNovoAberto
                  ? cadastrarCavalo
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
                  label="Marca"
                  value={marca}
                  onChange={setMarca}
                />

                <Campo
                  label="Modelo"
                  value={modelo}
                  onChange={setModelo}
                />

                <Campo
                  label="Consumo carregado (km/L) *"
                  value={
                    consumoCarregado
                  }
                  onChange={
                    setConsumoCarregado
                  }
                  type="number"
                  step="0.01"
                  required
                />

                <Campo
                  label="Consumo vazio (km/L) *"
                  value={consumoVazio}
                  onChange={
                    setConsumoVazio
                  }
                  type="number"
                  step="0.01"
                  required
                />
              </div>

              <div
                style={{
                  marginTop: "14px",
                }}
              >
                <label
                  style={estilos.label}
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
                  style={{
                    ...estilos.input,
                    minHeight: "90px",
                    paddingTop: "10px",
                  }}
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
                  onClick={() => {
                    setModalNovoAberto(
                      false
                    );

                    setModalEdicaoAberto(
                      false
                    );

                    setCavaloEditando(
                      null
                    );
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={
                    estilos.botaoSalvar
                  }
                >
                  Salvar
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
}: {
  label: string;
  value: string;
  onChange: (
    valor: string
  ) => void;
  required?: boolean;
  type?: string;
  step?: string;
}) {
  return (
    <div>
      <label style={estilos.label}>
        {label}
      </label>

      <input
        value={value}
        required={required}
        type={type}
        step={step}
        min={
          type === "number"
            ? "0.01"
            : undefined
        }
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
    background: tema.cores.fundo,
    color: tema.cores.grafite,
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  cabecalho: {
    minHeight: "88px",
    background: tema.cores.branco,
    borderBottom:
      `1px solid ${tema.cores.borda}`,
    padding: "14px 40px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  areaMarca: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
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

  nomeArea: {
    display: "block",
    fontSize: "14px",
  },

  descricaoArea: {
    display: "block",
    marginTop: "3px",
    fontSize: "11px",
    color:
      tema.cores.textoSecundario,
  },

  acoes: {
    display: "flex",
    gap: "10px",
  },

  botaoNovo: {
    height: "44px",
    border: "none",
    borderRadius:
      tema.bordas.pequena,
    padding: "0 18px",
    background:
      tema.cores.laranja,
    color: tema.cores.branco,
    fontWeight: 700,
    cursor: "pointer",
  },

  botaoVoltar: {
    height: "44px",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.pequena,
    padding: "0 18px",
    background:
      tema.cores.branco,
    color: tema.cores.grafite,
    fontWeight: 600,
    cursor: "pointer",
  },

  conteudo: {
    maxWidth: "1500px",
    margin: "0 auto",
    padding: "30px 30px",
  },

  topoPagina: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-end",
    marginBottom: "24px",
  },

  sobretitulo: {
    color: tema.cores.laranja,
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "1.5px",
  },

  titulo: {
    margin: "7px 0",
    fontSize: "30px",
  },

  descricao: {
    margin: 0,
    color:
      tema.cores.textoSecundario,
  },

  contador: {
    padding: "10px 14px",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.media,
    background:
      tema.cores.branco,
    display: "flex",
    gap: "5px",
    alignItems: "baseline",
  },

  card: {
    background:
      tema.cores.branco,
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.media,
    overflowX:
      "auto" as const,
  },

  tabela: {
    width: "100%",
    borderCollapse:
      "collapse" as const,
  },

  th: {
    textAlign: "left" as const,
    padding: "15px",
    fontSize: "12px",
    background: "#FAFAF9",
    borderBottom:
      `1px solid ${tema.cores.borda}`,
    whiteSpace:
      "nowrap" as const,
  },

  td: {
    padding: "15px",
    borderBottom:
      `1px solid ${tema.cores.borda}`,
    fontSize: "13px",
    whiteSpace:
      "nowrap" as const,
  },

  secundario: {
    marginTop: "4px",
    fontSize: "11px",
    color:
      tema.cores.textoSecundario,
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

  acoesTabela: {
    display: "flex",
    gap: "7px",
  },

  botaoEditar: {
    border:
      `1px solid ${tema.cores.borda}`,
    background:
      tema.cores.branco,
    borderRadius: "6px",
    padding: "7px 10px",
    cursor: "pointer",
  },

  botaoStatus: {
    border:
      `1px solid ${tema.cores.borda}`,
    background: "#F5F5F4",
    borderRadius: "6px",
    padding: "7px 10px",
    cursor: "pointer",
  },

  mensagem: {
    padding: "40px",
    textAlign:
      "center" as const,
  },

  erro: {
    marginBottom: "16px",
    padding: "12px",
    background:
      tema.cores.erroFundo,
    color: tema.cores.erro,
    borderRadius:
      tema.bordas.media,
  },

  sucesso: {
    marginBottom: "16px",
    padding: "12px",
    background:
      tema.cores.sucessoFundo,
    color: tema.cores.sucesso,
    borderRadius:
      tema.bordas.media,
  },

  fundoModal: {
    position: "fixed" as const,
    inset: 0,
    background:
      "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
  },

  modal: {
    width: "100%",
    maxWidth: "750px",
    maxHeight: "90vh",
    overflowY: "auto" as const,
    background:
      tema.cores.branco,
    borderRadius:
      tema.bordas.modal,
    padding: "28px",
  },

  tituloModal: {
    margin: "0 0 22px",
  },

  gridFormulario: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, 1fr)",
    gap: "14px",
  },

  label: {
    display: "block",
    marginBottom: "6px",
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
  },

  acoesModal: {
    marginTop: "24px",
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
    borderRadius:
      tema.bordas.pequena,
    padding: "0 16px",
    cursor: "pointer",
  },

  botaoSalvar: {
    height: "42px",
    border: "none",
    background:
      tema.cores.laranja,
    color: tema.cores.branco,
    borderRadius:
      tema.bordas.pequena,
    padding: "0 18px",
    fontWeight: 700,
    cursor: "pointer",
  },
};