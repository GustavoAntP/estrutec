"use client";

import Image from "next/image";
import {FormEvent, useEffect, useState,} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/servicos/api";
import { tema } from "@/estilos/tema";

type ClienteEmpresa = {
  id: number;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  ativo: boolean;
};

export default function ClientesPage() {
  const router = useRouter();

  const [clientes, setClientes] =
    useState<ClienteEmpresa[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [
    verificandoAcesso,
    setVerificandoAcesso,
  ] = useState(true);

  const [
    modalEditarAberto,
    setModalEditarAberto,
    ] = useState(false);

  const [
    clienteEditando,
    setClienteEditando,
    ] = useState<ClienteEmpresa | null>(
    null
    );

  const [razaoSocial, setRazaoSocial] =
    useState("");

  const [
    nomeFantasia,
    setNomeFantasia,
    ] = useState("");

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

  const [salvando, setSalvando] =
    useState(false);

  const [erroEdicao, setErroEdicao] =
    useState("");

  const [
    clienteExcluir,
    setClienteExcluir,
    ] = useState<ClienteEmpresa | null>(
    null
    );

  const [excluindo, setExcluindo] =
    useState(false);

  const [sucesso, setSucesso] =
    useState("");

  const [
    modalNovoAberto,
    setModalNovoAberto,
    ] = useState(false);

  const [
    erroCadastro,
    setErroCadastro,
    ] = useState("");

  async function carregarClientes() {
    try {
      setCarregando(true);
      setErro("");

      const token =
        localStorage.getItem(
          "estrutec_token"
        );

      if (!token) {
        router.replace("/");
        return;
      }

      const resposta = await api(
        "/clientes",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
            "Não foi possível carregar os clientes."
        );
      }

      setClientes(dados.clientes);
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível carregar os clientes."
      );
    } finally {
      setCarregando(false);
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
      carregarClientes();
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

  function abrirEdicao(
    cliente: ClienteEmpresa
    ) {
    setClienteEditando(cliente);

    setRazaoSocial(
        cliente.razao_social
    );

    setNomeFantasia(
        cliente.nome_fantasia || ""
    );

    setCnpj(
        cliente.cnpj || ""
    );

    setEmail(
        cliente.email || ""
    );

    setTelefone(
        cliente.telefone || ""
    );

    setCidade(
        cliente.cidade || ""
    );

    setEstado(
        cliente.estado || ""
    );

    setErroEdicao("");
    setModalEditarAberto(true);
    }

    async function salvarEdicao(
    evento: FormEvent<HTMLFormElement>
    ) {
    evento.preventDefault();

    if (!clienteEditando) {
        return;
    }

    try {
        setSalvando(true);
        setErroEdicao("");

        const token =
        localStorage.getItem(
            "estrutec_token"
        );

        if (!token) {
        router.replace("/");
        return;
        }

        const resposta = await api(
        `/clientes/${clienteEditando.id}`,
        {
            method: "PUT",

            headers: {
            Authorization:
                `Bearer ${token}`,
            },

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
            }),
        }
        );

        const dados =
        await resposta.json();

        if (!resposta.ok) {
        throw new Error(
            dados.erro ||
            "Não foi possível atualizar a empresa."
        );
        }

        setModalEditarAberto(false);
        setClienteEditando(null);

        await carregarClientes();

        setSucesso(
        "Empresa cliente atualizada com sucesso!"
        );

        setTimeout(() => {
        setSucesso("");
        }, 3000);
    } catch (erro) {
        setErroEdicao(
        erro instanceof Error
            ? erro.message
            : "Não foi possível atualizar a empresa."
        );
    } finally {
        setSalvando(false);
    }
    }

    async function excluirCliente() {
    if (!clienteExcluir) {
        return;
    }

    try {
        setExcluindo(true);
        setErro("");

        const token =
        localStorage.getItem(
            "estrutec_token"
        );

        if (!token) {
        router.replace("/");
        return;
        }

        const resposta = await api(
        `/clientes/${clienteExcluir.id}`,
        {
            method: "DELETE",

            headers: {
            Authorization:
                `Bearer ${token}`,
            },
        }
        );

        const dados =
        await resposta.json();

        if (!resposta.ok) {
        throw new Error(
            dados.erro ||
            "Não foi possível excluir a empresa."
        );
        }

        setClienteExcluir(null);

        await carregarClientes();

        setSucesso(
        "Empresa cliente excluída com sucesso!"
        );

        setTimeout(() => {
        setSucesso("");
        }, 3000);
    } catch (erro) {
        setErro(
        erro instanceof Error
            ? erro.message
            : "Não foi possível excluir a empresa."
        );

        setClienteExcluir(null);
    } finally {
        setExcluindo(false);
    }
    }

    function abrirNovoCliente() {
        setRazaoSocial("");
        setNomeFantasia("");
        setCnpj("");
        setEmail("");
        setTelefone("");
        setCidade("");
        setEstado("");

        setErroCadastro("");
        setModalNovoAberto(true);
    }

    async function cadastrarCliente(
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
        router.replace("/");
        return;
        }

        const resposta = await api(
        "/clientes",
        {
            method: "POST",

            headers: {
            Authorization:
                `Bearer ${token}`,
            },

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
            }),
        }
        );

        const dados =
        await resposta.json();

        if (!resposta.ok) {
        throw new Error(
            dados.erro ||
            "Não foi possível cadastrar a empresa."
        );
        }

        setModalNovoAberto(false);

        await carregarClientes();

        setSucesso(
        "Empresa cliente cadastrada com sucesso!"
        );

        setTimeout(() => {
        setSucesso("");
        }, 3000);
    } catch (erro) {
        setErroCadastro(
        erro instanceof Error
            ? erro.message
            : "Não foi possível cadastrar a empresa."
        );
    } finally {
        setSalvando(false);
    }
    }

  if (verificandoAcesso) {
    return (
      <main style={estilos.pagina}>
        <div
          style={
            estilos.verificandoAcesso
          }
        >
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

            <div
              style={estilos.divisor}
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
                Empresas Clientes
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
              Empresas Clientes
            </h1>

            <p
              style={estilos.descricao}
            >
              Cadastre e gerencie as
              empresas atendidas pelo
              Estrutec.
            </p>
          </div>

          <button
            type="button"
            onClick={abrirNovoCliente}
            style={estilos.botaoPrincipal}
            >
            + Nova empresa cliente
          </button>
        </div>

        <div style={estilos.resumo}>
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
              {clientes.length}
            </span>

            <span
              style={
                estilos.resumoTexto
              }
            >
              Empresas cadastradas
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
              {
                clientes.filter(
                  (cliente) =>
                    cliente.ativo
                ).length
              }
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
            <div>
              <h2
                style={
                  estilos.cardTitulo
                }
              >
                Empresas
              </h2>

              <p
                style={
                  estilos.cardDescricao
                }
              >
                Clientes cadastrados no
                sistema.
              </p>
            </div>
          </div>

          {carregando ? (
            <div style={estilos.estado}>
              Carregando empresas...
            </div>
          ) : clientes.length === 0 ? (
            <div style={estilos.estado}>
              Nenhuma empresa cliente
              cadastrada.
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
                    <th
                      style={estilos.th}
                    >
                      Empresa
                    </th>

                    <th
                      style={estilos.th}
                    >
                      CNPJ
                    </th>

                    <th
                      style={estilos.th}
                    >
                      Local
                    </th>

                    <th
                      style={estilos.th}
                    >
                      Contato
                    </th>

                    <th
                      style={estilos.th}
                    >
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
                  {clientes.map(
                    (cliente) => (
                      <tr
                        key={cliente.id}
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
                              estilos.nomeEmpresa
                            }
                          >
                            {
                              cliente.nome_fantasia ||
                              cliente.razao_social
                            }
                          </strong>

                          {cliente.nome_fantasia && (
                            <span
                              style={
                                estilos.razaoSocial
                              }
                            >
                              {
                                cliente.razao_social
                              }
                            </span>
                          )}
                        </td>

                        <td
                          style={
                            estilos.td
                          }
                        >
                          {cliente.cnpj ||
                            "-"}
                        </td>

                        <td
                          style={
                            estilos.td
                          }
                        >
                          {cliente.cidade
                            ? `${cliente.cidade}${
                                cliente.estado
                                  ? ` / ${cliente.estado}`
                                  : ""
                              }`
                            : "-"}
                        </td>

                        <td
                          style={
                            estilos.td
                          }
                        >
                          {cliente.email ||
                            cliente.telefone ||
                            "-"}
                        </td>

                        <td
                          style={
                            estilos.td
                          }
                        >
                          <span
                            style={
                              cliente.ativo
                                ? estilos.statusAtivo
                                : estilos.statusInativo
                            }
                          >
                            {cliente.ativo
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
                                    abrirEdicao(cliente)
                                }
                                style={estilos.botaoEditar}
                                >
                                Editar
                                </button>

                                <button
                                type="button"
                                onClick={() =>
                                    setClienteExcluir(cliente)
                                }
                                style={estilos.botaoExcluir}
                                >
                                Excluir
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
      {modalEditarAberto &&
        clienteEditando && (
            <div
            style={
                estilos.overlayModal
            }
            onClick={() => {
                if (!salvando) {
                setModalEditarAberto(
                    false
                );
                }
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
                    Editar empresa
                    </h2>

                    <p
                    style={
                        estilos.modalDescricao
                    }
                    >
                    Atualize os dados da
                    empresa cliente.
                    </p>
                </div>

                <button
                    type="button"
                    disabled={salvando}
                    onClick={() =>
                    setModalEditarAberto(
                        false
                    )
                    }
                    style={
                    estilos.botaoFechar
                    }
                >
                    ×
                </button>
                </div>

                <form
                onSubmit={salvarEdicao}
                style={estilos.formulario}
                >
                <div style={estilos.campo}>
                    <label
                    style={estilos.label}
                    >
                    Razão social
                    </label>

                    <input
                    value={razaoSocial}
                    onChange={(evento) =>
                        setRazaoSocial(
                        evento.target.value
                        )
                    }
                    required
                    disabled={salvando}
                    style={estilos.input}
                    />
                </div>

                <div style={estilos.campo}>
                    <label
                    style={estilos.label}
                    >
                    Nome fantasia
                    </label>

                    <input
                    value={nomeFantasia}
                    onChange={(evento) =>
                        setNomeFantasia(
                        evento.target.value
                        )
                    }
                    disabled={salvando}
                    style={estilos.input}
                    />
                </div>

                <div style={estilos.campo}>
                    <label
                    style={estilos.label}
                    >
                    CNPJ
                    </label>

                    <input
                    value={cnpj}
                    onChange={(evento) =>
                        setCnpj(
                        evento.target.value
                        )
                    }
                    disabled={salvando}
                    style={estilos.input}
                    />
                </div>

                <div
                    style={
                    estilos.linhaCampos
                    }
                >
                    <div
                    style={
                        estilos.campoFlex
                    }
                    >
                    <label
                        style={estilos.label}
                    >
                        Cidade
                    </label>

                    <input
                        value={cidade}
                        onChange={(evento) =>
                        setCidade(
                            evento.target.value
                        )
                        }
                        disabled={salvando}
                        style={estilos.input}
                    />
                    </div>

                    <div
                    style={
                        estilos.campoEstado
                    }
                    >
                    <label
                        style={estilos.label}
                    >
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
                        disabled={salvando}
                        style={estilos.input}
                    />
                    </div>
                </div>

                <div style={estilos.campo}>
                    <label
                    style={estilos.label}
                    >
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
                    disabled={salvando}
                    style={estilos.input}
                    />
                </div>

                <div style={estilos.campo}>
                    <label
                    style={estilos.label}
                    >
                    Telefone
                    </label>

                    <input
                    value={telefone}
                    onChange={(evento) =>
                        setTelefone(
                        evento.target.value
                        )
                    }
                    disabled={salvando}
                    style={estilos.input}
                    />
                </div>

                {erroEdicao && (
                    <div
                    style={
                        estilos.erroModal
                    }
                    >
                    {erroEdicao}
                    </div>
                )}

                <div
                    style={
                    estilos.acoesModal
                    }
                >
                    <button
                    type="button"
                    disabled={salvando}
                    onClick={() =>
                        setModalEditarAberto(
                        false
                        )
                    }
                    style={
                        estilos.botaoCancelar
                    }
                    >
                    Cancelar
                    </button>

                    <button
                    type="submit"
                    disabled={salvando}
                    style={
                        estilos.botaoSalvar
                    }
                    >
                    {salvando
                        ? "Salvando..."
                        : "Salvar alterações"}
                    </button>
                </div>
                </form>
            </div>
            </div>
        )}
        {clienteExcluir && (
        <div
            style={estilos.overlayModal}
            onClick={() => {
            if (!excluindo) {
                setClienteExcluir(null);
            }
            }}
        >
            <div
            style={estilos.modalExcluir}
            onClick={(evento) =>
                evento.stopPropagation()
            }
            >
            <div
                style={
                estilos.iconeExcluir
                }
            >
                !
            </div>

            <h2
                style={
                estilos.modalTitulo
                }
            >
                Excluir empresa cliente?
            </h2>

            <p
                style={
                estilos.modalDescricaoExcluir
                }
            >
                Você está prestes a excluir
                permanentemente{" "}
                <strong>
                {clienteExcluir.nome_fantasia ||
                    clienteExcluir.razao_social}
                </strong>
                .
            </p>

            <div
                style={
                estilos.avisoExcluir
                }
            >
                Esta ação não poderá ser
                desfeita.
            </div>

            <div
                style={
                estilos.acoesModal
                }
            >
                <button
                type="button"
                disabled={excluindo}
                onClick={() =>
                    setClienteExcluir(null)
                }
                style={
                    estilos.botaoCancelar
                }
                >
                Cancelar
                </button>

                <button
                type="button"
                disabled={excluindo}
                onClick={excluirCliente}
                style={
                    estilos.botaoConfirmarExclusao
                }
                >
                {excluindo
                    ? "Excluindo..."
                    : "Excluir empresa"}
                </button>
            </div>
            </div>
        </div>
        )}
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
                    Nova empresa cliente
                </h2>

                <p style={estilos.modalDescricao}>
                    Cadastre uma empresa para
                    utilização nos projetos do Estrutec.
                </p>
                </div>

                <button
                type="button"
                disabled={salvando}
                onClick={() =>
                    setModalNovoAberto(false)
                }
                style={estilos.botaoFechar}
                >
                ×
                </button>
            </div>

            <form
                onSubmit={cadastrarCliente}
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
                    placeholder="Razão social da empresa"
                    required
                    disabled={salvando}
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
                    placeholder="Nome fantasia"
                    disabled={salvando}
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
                    placeholder="00.000.000/0000-00"
                    disabled={salvando}
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
                    placeholder="Cidade"
                    disabled={salvando}
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
                    placeholder="SC"
                    disabled={salvando}
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
                    placeholder="contato@empresa.com"
                    disabled={salvando}
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
                    placeholder="(47) 99999-9999"
                    disabled={salvando}
                    style={estilos.input}
                />
                </div>

                {erroCadastro && (
                <div style={estilos.erroModal}>
                    {erroCadastro}
                </div>
                )}

                <div style={estilos.acoesModal}>
                <button
                    type="button"
                    disabled={salvando}
                    onClick={() =>
                    setModalNovoAberto(false)
                    }
                    style={estilos.botaoCancelar}
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    disabled={salvando}
                    style={estilos.botaoSalvar}
                >
                    {salvando
                    ? "Cadastrando..."
                    : "Cadastrar empresa"}
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