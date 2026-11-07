"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiAutenticada } from "@/servicos/api";

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
  const [responsavel, setResponsavel] = useState("");
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [prazo, setPrazo] = useState("");
  const [bdi, setBdi] = useState("");
  const [observacoes, setObservacoes] = useState("");

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
          (cliente: ClienteEmpresa) =>
            cliente.ativo
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
      const resposta = await apiAutenticada(
        "/projetos",
        {
          method: "POST",

          body: JSON.stringify({
            codigo,
            nome,

            cliente,

            cliente_empresa_id:
              Number(clienteEmpresaId),

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

      if (resposta.status === 401) {
        localStorage.removeItem(
          "estrutec_token"
        );

        router.push("/login");

        return;
      }

      const dados = await resposta.json();

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
        <div>
          <h1 style={estilos.logo}>
            ESTRUTEC
          </h1>

          <p style={estilos.subtitulo}>
            Novo Projeto
          </p>
        </div>

        <button
          style={estilos.botaoVoltar}
          onClick={() =>
            router.push("/painel")
          }
        >
          ← Voltar
        </button>
      </header>

      <section style={estilos.conteudo}>
        <div style={estilos.card}>
          <div style={estilos.tituloArea}>
            <h2 style={estilos.titulo}>
              Cadastro do Projeto
            </h2>

            <p style={estilos.descricao}>
              Informe os dados gerais para
              iniciar o orçamento.
            </p>
          </div>

          <form
            onSubmit={cadastrarProjeto}
            style={estilos.formulario}
          >
            <div style={estilos.linha}>
              <div style={estilos.campo}>
                <label htmlFor="codigo">
                  Código *
                </label>

                <input
                  id="codigo"
                  value={codigo}
                  onChange={(e) =>
                    setCodigo(e.target.value)
                  }
                  placeholder="Ex.: EST-002"
                  required
                  style={estilos.input}
                />
              </div>

              <div style={estilos.campoMaior}>
                <label htmlFor="nome">
                  Nome do projeto *
                </label>

                <input
                  id="nome"
                  value={nome}
                  onChange={(e) =>
                    setNome(e.target.value)
                  }
                  placeholder="Ex.: Galpão Industrial"
                  required
                  style={estilos.input}
                />
              </div>
            </div>

            <div style={estilos.campo}>
              <label htmlFor="cliente_empresa">
                Empresa cliente *
              </label>

              <select
                id="cliente_empresa"
                value={clienteEmpresaId}
                onChange={(e) => {
                  const id =
                    e.target.value;

                  setClienteEmpresaId(id);

                  const empresa =
                    clientesEmpresas.find(
                      (cliente) =>
                        String(cliente.id) === id
                    );

                  if (empresa) {
                    setCliente(
                      empresa.nome_fantasia ||
                        empresa.razao_social
                    );
                  } else {
                    setCliente("");
                  }
                }}
                required
                style={estilos.input}
              >
                <option value="">
                  Selecione uma empresa cliente
                </option>

                {clientesEmpresas.map(
                  (empresa) => (
                    <option
                      key={empresa.id}
                      value={empresa.id}
                    >
                      {empresa.nome_fantasia ||
                        empresa.razao_social}
                    </option>
                  )
                )}
              </select>
            </div>

            <div style={estilos.linha}>
              <div style={estilos.campo}>
                <label htmlFor="origem">
                  Origem
                </label>

                <input
                  id="origem"
                  value={origem}
                  onChange={(e) =>
                    setOrigem(e.target.value)
                  }
                  placeholder="Ex.: Joinville - SC"
                  style={estilos.input}
                />
              </div>

              <div style={estilos.campo}>
                <label htmlFor="destino">
                  Destino *
                </label>

                <input
                  id="destino"
                  value={destino}
                  onChange={(e) =>
                    setDestino(e.target.value)
                  }
                  placeholder="Ex.: Curitiba - PR"
                  required
                  style={estilos.input}
                />
              </div>
            </div>

            <div style={estilos.linha}>
              <div style={estilos.campo}>
                <label htmlFor="prazo">
                  Prazo *
                </label>

                <input
                  id="prazo"
                  type="date"
                  value={prazo}
                  onChange={(e) =>
                    setPrazo(e.target.value)
                  }
                  required
                  style={estilos.input}
                />
              </div>

              <div style={estilos.campo}>
                <label htmlFor="bdi">
                  BDI (%)
                </label>

                <input
                  id="bdi"
                  type="number"
                  min="0"
                  step="0.01"
                  value={bdi}
                  onChange={(e) =>
                    setBdi(e.target.value)
                  }
                  placeholder="Ex.: 20"
                  style={estilos.input}
                />
              </div>
            </div>

            <div style={estilos.campoCompleto}>
              <label htmlFor="observacoes">
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
                style={estilos.textarea}
              />
            </div>

            {erro && (
              <div style={estilos.erro}>
                {erro}
              </div>
            )}

            <div style={estilos.acoes}>
              <button
                type="button"
                style={estilos.botaoCancelar}
                onClick={() =>
                  router.push("/painel")
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={carregando}
                style={estilos.botaoSalvar}
              >
                {carregando
                  ? "Salvando..."
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
    background: "#f4f6f8",
    fontFamily: "Arial, sans-serif",
  },

  cabecalho: {
    minHeight: "80px",
    background: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
    padding: "16px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
    border: "1px solid #d1d5db",
    background: "#ffffff",
    borderRadius: "6px",
    padding: "10px 15px",
    cursor: "pointer",
  },

  conteudo: {
    padding: "35px 40px",
    display: "flex",
    justifyContent: "center",
  },

  card: {
    width: "100%",
    maxWidth: "900px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "30px",
  },

  tituloArea: {
    marginBottom: "30px",
  },

  titulo: {
    margin: 0,
    fontSize: "23px",
  },

  descricao: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },

  formulario: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },

  linha: {
    display: "flex",
    gap: "20px",
  },

  campo: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
    fontSize: "14px",
    fontWeight: 600,
  },

  campoMaior: {
    flex: 2,
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
    fontSize: "14px",
    fontWeight: 600,
  },

  campoCompleto: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
    fontSize: "14px",
    fontWeight: 600,
  },

  input: {
    height: "43px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    padding: "0 12px",
    fontSize: "14px",
  },

  textarea: {
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    padding: "12px",
    fontFamily: "Arial, sans-serif",
    resize: "vertical" as const,
  },

  erro: {
    padding: "11px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "6px",
    fontSize: "13px",
  },

  acoes: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "10px",
  },

  botaoCancelar: {
    padding: "11px 18px",
    background: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
  },

  botaoSalvar: {
    padding: "11px 18px",
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
  },
};