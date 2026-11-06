"use client";

import Image from "next/image";
import {FormEvent, useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/servicos/api";
import { tema } from "@/estilos/tema";

type Usuario = {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  ativo: boolean;
  perfil: "ADMINISTRADOR" | "OPERADOR";
};

export default function UsuariosPage() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [modalNovoAberto, setModalNovoAberto] =
    useState(false);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [perfil, setPerfil] =
    useState<"OPERADOR" | "ADMINISTRADOR">(
        "OPERADOR"
    );

  const [salvando, setSalvando] =
    useState(false);

  const [erroCadastro, setErroCadastro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  const [modalEditarAberto, setModalEditarAberto] =
    useState(false);

  const [usuarioEditando, setUsuarioEditando] =
    useState<Usuario | null>(null);

  const [nomeEdicao, setNomeEdicao] =
    useState("");

  const [cpfEdicao, setCpfEdicao] =
    useState("");

  const [emailEdicao, setEmailEdicao] =
    useState("");

  const [perfilEdicao, setPerfilEdicao] =
    useState<"OPERADOR" | "ADMINISTRADOR">(
        "OPERADOR"
    );

  const [salvandoEdicao, setSalvandoEdicao] =
    useState(false);

  const [erroEdicao, setErroEdicao] =
    useState("");

  const [alterandoStatusId, setAlterandoStatusId] =
    useState<number | null>(null);

  const [
    verificandoAcesso,
    setVerificandoAcesso,
    ] = useState(true);

  async function carregarUsuarios() {
    try {
      setCarregando(true);
      setErro("");

      const token =
        localStorage.getItem("estrutec_token");

      if (!token) {
        router.push("/");
        return;
      }

      const resposta = await api(
        "/usuarios",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
            "Não foi possível carregar os usuários."
        );
      }

      setUsuarios(dados.usuarios);
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível carregar os usuários."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function cadastrarUsuario(
    evento: FormEvent<HTMLFormElement>
    ) {
    evento.preventDefault();

    try {
        setSalvando(true);
        setErroCadastro("");

        const token =
        localStorage.getItem(
            "estrutec_token"
        );

        if (!token) {
        router.push("/");
        return;
        }

        const resposta = await api(
        "/usuarios",
        {
            method: "POST",

            headers: {
            Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
            nome,
            cpf,
            email,
            senha,
            perfil,
            }),
        }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
        throw new Error(
            dados.erro ||
            "Não foi possível cadastrar o usuário."
        );
        }

        setNome("");
        setCpf("");
        setEmail("");
        setSenha("");
        setPerfil("OPERADOR");

        setModalNovoAberto(false);

        await carregarUsuarios();

        setSucesso(
        "Usuário criado com sucesso!"
        );

        setTimeout(() => {
        setSucesso("");
        }, 3000);
    } catch (erro) {
        setErroCadastro(
        erro instanceof Error
            ? erro.message
            : "Não foi possível cadastrar o usuário."
        );
    } finally {
        setSalvando(false);
    }
    }

    function abrirEdicao(usuario: Usuario) {
    setUsuarioEditando(usuario);

    setNomeEdicao(usuario.nome);
    setCpfEdicao(usuario.cpf);
    setEmailEdicao(usuario.email);
    setPerfilEdicao(usuario.perfil);

    setErroEdicao("");
    setModalEditarAberto(true);
    }

    async function salvarEdicao(
    evento: FormEvent<HTMLFormElement>
    ) {
    evento.preventDefault();

    if (!usuarioEditando) {
        return;
    }

    try {
        setSalvandoEdicao(true);
        setErroEdicao("");

        const token =
        localStorage.getItem(
            "estrutec_token"
        );

        if (!token) {
        router.push("/");
        return;
        }

        const resposta = await api(
        `/usuarios/${usuarioEditando.id}`,
        {
            method: "PUT",

            headers: {
            Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
            nome: nomeEdicao,
            cpf: cpfEdicao,
            email: emailEdicao,
            perfil: perfilEdicao,
            }),
        }
        );

        const dados =
        await resposta.json();

        if (!resposta.ok) {
        throw new Error(
            dados.erro ||
            "Não foi possível atualizar o usuário."
        );
        }

        setModalEditarAberto(false);
        setUsuarioEditando(null);

        await carregarUsuarios();

        setSucesso(
        "Usuário atualizado com sucesso!"
        );

        setTimeout(() => {
        setSucesso("");
        }, 3000);
    } catch (erro) {
        setErroEdicao(
        erro instanceof Error
            ? erro.message
            : "Não foi possível atualizar o usuário."
        );
    } finally {
        setSalvandoEdicao(false);
    }
    }

    async function alterarStatusUsuario(
    usuario: Usuario
    ) {
    try {
        setAlterandoStatusId(usuario.id);
        setErro("");

        const token =
        localStorage.getItem(
            "estrutec_token"
        );

        if (!token) {
        router.push("/");
        return;
        }

        const resposta = await api(
        `/usuarios/${usuario.id}/status`,
        {
            method: "PATCH",

            headers: {
            Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
            ativo: !usuario.ativo,
            }),
        }
        );

        const dados =
        await resposta.json();

        if (!resposta.ok) {
        throw new Error(
            dados.erro ||
            "Não foi possível alterar o status do usuário."
        );
        }

        await carregarUsuarios();

        setSucesso(
        usuario.ativo
            ? "Usuário desativado com sucesso!"
            : "Usuário ativado com sucesso!"
        );

        setTimeout(() => {
        setSucesso("");
        }, 3000);
    } catch (erro) {
        setErro(
        erro instanceof Error
            ? erro.message
            : "Não foi possível alterar o status do usuário."
        );
    } finally {
        setAlterandoStatusId(null);
    }
    }

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
        carregarUsuarios();
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

    if (verificandoAcesso) {
    return (
        <main style={estilos.pagina}>
        <div style={estilos.verificandoAcesso}>
            Verificando acesso...
        </div>
        </main>
    );
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
                Usuários
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/painel")}
            style={estilos.botaoVoltar}
          >
            Voltar ao painel
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
              Gerenciamento de usuários
            </h1>

            <p style={estilos.descricao}>
              Gerencie as contas que possuem acesso
              ao Estrutec.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {setErroCadastro(""); setModalNovoAberto(true);}}
            style={estilos.botaoPrincipal}
          >
            + Novo usuário
          </button>
        </div>

        <div style={estilos.resumo}>
          <div style={estilos.resumoItem}>
            <span style={estilos.resumoValor}>
              {usuarios.length}
            </span>

            <span style={estilos.resumoTexto}>
              Usuários cadastrados
            </span>
          </div>

          <div style={estilos.separadorResumo} />

          <div style={estilos.resumoItem}>
            <span style={estilos.resumoValor}>
              {
                usuarios.filter(
                  (usuario) => usuario.ativo
                ).length
              }
            </span>

            <span style={estilos.resumoTexto}>
              Ativos
            </span>
          </div>

          <div style={estilos.separadorResumo} />

          <div style={estilos.resumoItem}>
            <span style={estilos.resumoValor}>
              {
                usuarios.filter(
                  (usuario) =>
                    usuario.perfil ===
                    "ADMINISTRADOR"
                ).length
              }
            </span>

            <span style={estilos.resumoTexto}>
              Administradores
            </span>
          </div>
        </div>

        {sucesso && (
        <div style={estilos.sucesso}>
            <strong>
            Usuário criado com sucesso!
            </strong>

            <span>
            A nova conta já está disponível
            para acesso ao Estrutec.
            </span>
        </div>
        )}

        {erro && (
          <div style={estilos.erro}>
            {erro}
          </div>
        )}

        <div style={estilos.card}>
          <div style={estilos.cardCabecalho}>
            <div>
              <h2 style={estilos.cardTitulo}>
                Usuários
              </h2>

              <p style={estilos.cardDescricao}>
                Contas cadastradas no sistema.
              </p>
            </div>
          </div>

          {carregando ? (
            <div style={estilos.estado}>
              Carregando usuários...
            </div>
          ) : usuarios.length === 0 ? (
            <div style={estilos.estado}>
              Nenhum usuário cadastrado.
            </div>
          ) : (
            <div style={estilos.tabelaContainer}>
              <table style={estilos.tabela}>
                <thead>
                  <tr>
                    <th style={estilos.th}>
                      Usuário
                    </th>

                    <th style={estilos.th}>
                      CPF
                    </th>

                    <th style={estilos.th}>
                      Perfil
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
                  {usuarios.map((usuario) => (
                    <tr
                      key={usuario.id}
                      style={estilos.linha}
                    >
                      <td style={estilos.td}>
                        <div style={estilos.usuario}>
                          <div style={estilos.avatar}>
                            {usuario.nome
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong
                              style={
                                estilos.usuarioNome
                              }
                            >
                              {usuario.nome}
                            </strong>

                            <span
                              style={
                                estilos.usuarioEmail
                              }
                            >
                              {usuario.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td style={estilos.td}>
                        {usuario.cpf}
                      </td>

                      <td style={estilos.td}>
                        <span
                          style={
                            usuario.perfil ===
                            "ADMINISTRADOR"
                              ? estilos.badgeAdmin
                              : estilos.badgeOperador
                          }
                        >
                          {usuario.perfil ===
                          "ADMINISTRADOR"
                            ? "Administrador"
                            : "Operador"}
                        </span>
                      </td>

                      <td style={estilos.td}>
                        <span
                          style={
                            usuario.ativo
                              ? estilos.statusAtivo
                              : estilos.statusInativo
                          }
                        >
                          <span
                            style={{
                              ...estilos.pontoStatus,
                              background:
                                usuario.ativo
                                  ? tema.cores.sucesso
                                  : tema.cores.erro,
                            }}
                          />

                          {usuario.ativo
                            ? "Ativo"
                            : "Inativo"}
                        </span>
                      </td>

                        <td
                        style={{
                            ...estilos.td,
                            textAlign: "right",
                        }}
                        >
                        <div style={estilos.acoesUsuario}>
                            <button
                            type="button"
                            onClick={() =>
                                abrirEdicao(usuario)
                            }
                            style={estilos.botaoEditar}
                            >
                            Editar
                            </button>

                            <button
                            type="button"
                            onClick={() =>
                                alterarStatusUsuario(usuario)
                            }
                            disabled={
                                alterandoStatusId === usuario.id
                            }
                            style={
                                usuario.ativo
                                ? estilos.botaoDesativar
                                : estilos.botaoAtivar
                            }
                            >
                            {alterandoStatusId === usuario.id
                                ? "Aguarde..."
                                : usuario.ativo
                                ? "Desativar"
                                : "Ativar"}
                            </button>
                        </div>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      {modalNovoAberto && (
        <div
            style={estilos.overlayModal}
            onClick={() => {
            if (!salvando) {
                setModalNovoAberto(false);
            }
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
                    Novo usuário
                </h2>

                <p style={estilos.modalDescricao}>
                    Cadastre uma nova conta de acesso
                    ao Estrutec.
                </p>
                </div>

                <button
                type="button"
                onClick={() =>
                    setModalNovoAberto(false)
                }
                disabled={salvando}
                style={estilos.botaoFechar}
                >
                ×
                </button>
            </div>

            <form
                onSubmit={cadastrarUsuario}
                style={estilos.formulario}
            >
                <div style={estilos.campo}>
                <label style={estilos.label}>
                    Nome completo
                </label>

                <input
                    type="text"
                    value={nome}
                    onChange={(evento) =>
                    setNome(evento.target.value)
                    }
                    placeholder="Nome do usuário"
                    required
                    disabled={salvando}
                    style={estilos.input}
                />
                </div>

                <div style={estilos.linhaCampos}>
                <div style={estilos.campoFlex}>
                    <label style={estilos.label}>
                    CPF
                    </label>

                    <input
                    type="text"
                    value={cpf}
                    onChange={(evento) =>
                        setCpf(evento.target.value)
                    }
                    placeholder="000.000.000-00"
                    required
                    disabled={salvando}
                    style={estilos.input}
                    />
                </div>

                <div style={estilos.campoFlex}>
                    <label style={estilos.label}>
                    Perfil
                    </label>

                    <select
                    value={perfil}
                    onChange={(evento) =>
                        setPerfil(
                        evento.target.value as
                            | "OPERADOR"
                            | "ADMINISTRADOR"
                        )
                    }
                    disabled={salvando}
                    style={estilos.input}
                    >
                    <option value="OPERADOR">
                        Operador
                    </option>

                    <option value="ADMINISTRADOR">
                        Administrador
                    </option>
                    </select>
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
                    setEmail(evento.target.value)
                    }
                    placeholder="usuario@empresa.com"
                    required
                    disabled={salvando}
                    style={estilos.input}
                />
                </div>

                <div style={estilos.campo}>
                <label style={estilos.label}>
                    Senha inicial
                </label>

                <input
                    type="password"
                    value={senha}
                    onChange={(evento) =>
                    setSenha(evento.target.value)
                    }
                    placeholder="Digite uma senha inicial"
                    required
                    disabled={salvando}
                    style={estilos.input}
                />

                <span style={estilos.ajudaCampo}>
                    O usuário poderá alterar essa senha
                    posteriormente pela recuperação de senha.
                </span>
                </div>

                {erroCadastro && (
                <div style={estilos.erroModal}>
                    {erroCadastro}
                </div>
                )}

                <div style={estilos.acoesModal}>
                <button
                    type="button"
                    onClick={() =>
                    setModalNovoAberto(false)
                    }
                    disabled={salvando}
                    style={estilos.botaoCancelar}
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    disabled={salvando}
                    style={{
                    ...estilos.botaoSalvar,

                    ...(salvando
                        ? estilos.botaoDesabilitado
                        : {}),
                    }}
                >
                    {salvando
                    ? "Cadastrando..."
                    : "Cadastrar usuário"}
                </button>
                </div>
            </form>
            </div>
        </div>
        )}
        {modalEditarAberto &&
        usuarioEditando && (
            <div
            style={estilos.overlayModal}
            onClick={() => {
                if (!salvandoEdicao) {
                setModalEditarAberto(false);
                }
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
                    Editar usuário
                    </h2>

                    <p style={estilos.modalDescricao}>
                    Atualize os dados e o perfil
                    de acesso deste usuário.
                    </p>
                </div>

                <button
                    type="button"
                    disabled={salvandoEdicao}
                    onClick={() =>
                    setModalEditarAberto(false)
                    }
                    style={estilos.botaoFechar}
                >
                    ×
                </button>
                </div>

                <form
                onSubmit={salvarEdicao}
                style={estilos.formulario}
                >
                <div style={estilos.campo}>
                    <label style={estilos.label}>
                    Nome completo
                    </label>

                    <input
                    type="text"
                    value={nomeEdicao}
                    onChange={(evento) =>
                        setNomeEdicao(
                        evento.target.value
                        )
                    }
                    required
                    disabled={salvandoEdicao}
                    style={estilos.input}
                    />
                </div>

                <div style={estilos.linhaCampos}>
                    <div style={estilos.campoFlex}>
                    <label style={estilos.label}>
                        CPF
                    </label>

                    <input
                        type="text"
                        value={cpfEdicao}
                        onChange={(evento) =>
                        setCpfEdicao(
                            evento.target.value
                        )
                        }
                        required
                        disabled={salvandoEdicao}
                        style={estilos.input}
                    />
                    </div>

                    <div style={estilos.campoFlex}>
                    <label style={estilos.label}>
                        Perfil
                    </label>

                    <select
                        value={perfilEdicao}
                        onChange={(evento) =>
                        setPerfilEdicao(
                            evento.target.value as
                            | "OPERADOR"
                            | "ADMINISTRADOR"
                        )
                        }
                        disabled={salvandoEdicao}
                        style={estilos.input}
                    >
                        <option value="OPERADOR">
                        Operador
                        </option>

                        <option value="ADMINISTRADOR">
                        Administrador
                        </option>
                    </select>
                    </div>
                </div>

                <div style={estilos.campo}>
                    <label style={estilos.label}>
                    E-mail
                    </label>

                    <input
                    type="email"
                    value={emailEdicao}
                    onChange={(evento) =>
                        setEmailEdicao(
                        evento.target.value
                        )
                    }
                    required
                    disabled={salvandoEdicao}
                    style={estilos.input}
                    />
                </div>

                {erroEdicao && (
                    <div style={estilos.erroModal}>
                    {erroEdicao}
                    </div>
                )}

                <div style={estilos.acoesModal}>
                    <button
                    type="button"
                    onClick={() =>
                        setModalEditarAberto(false)
                    }
                    disabled={salvandoEdicao}
                    style={estilos.botaoCancelar}
                    >
                    Cancelar
                    </button>

                    <button
                    type="submit"
                    disabled={salvandoEdicao}
                    style={{
                        ...estilos.botaoSalvar,

                        ...(salvandoEdicao
                        ? estilos.botaoDesabilitado
                        : {}),
                    }}
                    >
                    {salvandoEdicao
                        ? "Salvando..."
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
    color: tema.cores.textoSecundario,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1px",
    textTransform: "uppercase" as const,
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
    borderRadius: tema.bordas.pequena,
    background: tema.cores.branco,
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
    justifyContent: "space-between",
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
    letterSpacing: "-0.5px",
  },

  descricao: {
    margin: "8px 0 0",
    color: tema.cores.textoSecundario,
    fontSize: "14px",
    lineHeight: 1.5,
  },

  botaoPrincipal: {
    height: "44px",
    padding: "0 18px",
    border: "none",
    borderRadius: tema.bordas.pequena,
    background: tema.cores.laranja,
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
    background: tema.cores.branco,
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius: tema.bordas.grande,
    boxShadow: tema.sombras.card,
  },

  resumoItem: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "3px",
  },

  resumoValor: {
    color: tema.cores.grafite,
    fontSize: "22px",
    fontWeight: 750,
  },

  resumoTexto: {
    color: tema.cores.textoSecundario,
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
    borderRadius: tema.bordas.grande,
    boxShadow: tema.sombras.card,
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
    color: tema.cores.textoSecundario,
    fontSize: "12px",
  },

  tabelaContainer: {
    overflowX: "auto" as const,
  },

  tabela: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },

  th: {
    padding: "13px 20px",
    background: "#FAFAF9",
    color: tema.cores.textoSecundario,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.4px",
    textTransform: "uppercase" as const,
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
    verticalAlign: "middle" as const,
  },

  usuario: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  avatar: {
    width: "36px",
    height: "36px",
    flexShrink: 0,
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: tema.cores.grafite,
    color: tema.cores.branco,
    fontSize: "13px",
    fontWeight: 800,
  },

  usuarioNome: {
    display: "block",
    color: tema.cores.grafite,
    fontSize: "13px",
    marginBottom: "4px",
  },

  usuarioEmail: {
    display: "block",
    color: tema.cores.textoSecundario,
    fontSize: "12px",
  },

  badgeAdmin: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "999px",
    background: tema.cores.avisoFundo,
    color: tema.cores.laranja,
    fontSize: "11px",
    fontWeight: 700,
  },

  badgeOperador: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "999px",
    background: tema.cores.cinza,
    color: tema.cores.textoSecundario,
    fontSize: "11px",
    fontWeight: 700,
  },

  statusAtivo: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: tema.cores.sucesso,
    fontSize: "12px",
    fontWeight: 700,
  },

  statusInativo: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: tema.cores.erro,
    fontSize: "12px",
    fontWeight: 700,
  },

  pontoStatus: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
  },

  botaoEditar: {
    height: "34px",
    padding: "0 13px",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius: tema.bordas.pequena,
    background: tema.cores.branco,
    color: tema.cores.grafite,
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },

  estado: {
    padding: "50px 24px",
    textAlign: "center" as const,
    color: tema.cores.textoSecundario,
    fontSize: "13px",
  },

  erro: {
    marginBottom: "20px",
    padding: "13px 15px",
    background: tema.cores.erroFundo,
    color: tema.cores.erro,
    borderRadius: tema.bordas.pequena,
    border: "1px solid #FECACA",
    fontSize: "13px",
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
        "rgba(23, 23, 23, 0.62)",

    backdropFilter: "blur(3px)",
    },

    modal: {
    width: "100%",
    maxWidth: "560px",

    background: tema.cores.branco,

    border:
        `1px solid ${tema.cores.borda}`,

    borderRadius: tema.bordas.modal,

    padding: "28px",

    boxShadow:
        tema.sombras.destaque,
    },

    modalCabecalho: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",

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

    ajudaCampo: {
    color:
        tema.cores.textoSecundario,

    fontSize: "11px",
    lineHeight: 1.4,
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

    paddingTop: "5px",
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

    botaoDesabilitado: {
    opacity: 0.6,
    cursor: "not-allowed",
    },
    sucesso: {
    marginBottom: "20px",

    padding: "14px 16px",

    display: "flex",
    flexDirection: "column" as const,

    gap: "4px",

    background:
        tema.cores.sucessoFundo,

    color:
        tema.cores.sucesso,

    borderRadius:
        tema.bordas.media,

    border:
        "1px solid #BBF7D0",

    fontSize: "13px",
    },
    acoesUsuario: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    },

    botaoDesativar: {
    height: "34px",
    padding: "0 13px",

    border: "1px solid #FECACA",

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

    border: "1px solid #BBF7D0",

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
    verificandoAcesso: {
    minHeight: "100vh",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    color:
        tema.cores.textoSecundario,

    fontSize: "13px",
    },
    };