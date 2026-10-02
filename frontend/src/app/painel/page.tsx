"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiAutenticada } from "@/servicos/api";

type Projeto = {
  id: number;
  codigo: string;
  nome: string;
  cliente: string;
  destino?: string | null;
  prazo?: string | null;
  bdi?: string | number;
  status: string;
};

export default function PainelPage() {
  const router = useRouter();

  const [projetos, setProjetos] = useState<Projeto[]>(
    []
  );

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarProjetos();
  }, []);

  async function carregarProjetos() {
    try {
      setCarregando(true);
      setErro("");

      const resposta =
        await apiAutenticada("/projetos");

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
            "Não foi possível carregar os projetos."
        );

        return;
      }

      const lista = Array.isArray(dados)
        ? dados
        : dados.projetos || [];

      setProjetos(lista);
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setCarregando(false);
    }
  }

  function sair() {
    localStorage.removeItem(
      "estrutec_token"
    );

    router.push("/login");
  }

  function formatarStatus(status: string) {
    const nomes: Record<string, string> = {
      RASCUNHO: "Rascunho",
      IMPORTACAO_PENDENTE:
        "Importação pendente",
      FABRICACAO_CALCULADA:
        "Fabricação calculada",
      LOGISTICA_CALCULADA:
        "Logística calculada",
      MONTAGEM_CALCULADA:
        "Montagem calculada",
      FINALIZADO: "Finalizado",
    };

    return nomes[status] || status;
  }

  return (
    <main style={estilos.pagina}>
      <header style={estilos.cabecalho}>
        <div>
          <h1 style={estilos.logo}>
            ESTRUTEC
          </h1>

          <p style={estilos.subtitulo}>
            Painel de Projetos
          </p>
        </div>

        <div style={estilos.acoes}>
          <button
            style={estilos.botaoNovo}
            onClick={() =>
              router.push("/projetos/novo")
            }
          >
            + Novo projeto
          </button>

          <button
            style={estilos.botaoSair}
            onClick={sair}
          >
            Sair
          </button>
        </div>
      </header>

      <section style={estilos.conteudo}>
        <div style={estilos.tituloSecao}>
          <div>
            <h2 style={estilos.titulo}>
              Projetos
            </h2>

            <p style={estilos.descricao}>
              Acompanhe os orçamentos e
              planejamentos cadastrados.
            </p>
          </div>

          <div style={estilos.contador}>
            {projetos.length} projeto(s)
          </div>
        </div>

        {carregando && (
          <div style={estilos.mensagem}>
            Carregando projetos...
          </div>
        )}

        {erro && (
          <div style={estilos.erro}>
            {erro}
          </div>
        )}

        {!carregando &&
          !erro &&
          projetos.length === 0 && (
            <div style={estilos.vazio}>
              <h3>
                Nenhum projeto cadastrado
              </h3>

              <p>
                Crie seu primeiro projeto para
                começar um orçamento.
              </p>
            </div>
          )}

        {!carregando &&
          projetos.length > 0 && (
            <div style={estilos.tabelaContainer}>
              <table style={estilos.tabela}>
                <thead>
                  <tr>
                    <th style={estilos.th}>
                      Código
                    </th>

                    <th style={estilos.th}>
                      Projeto
                    </th>

                    <th style={estilos.th}>
                      Cliente
                    </th>

                    <th style={estilos.th}>
                      Destino
                    </th>

                    <th style={estilos.th}>
                      Status
                    </th>

                    <th style={estilos.th}>
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {projetos.map(
                    (projeto) => (
                      <tr key={projeto.id}>
                        <td style={estilos.td}>
                          {projeto.codigo}
                        </td>

                        <td style={estilos.td}>
                          <strong>
                            {projeto.nome}
                          </strong>
                        </td>

                        <td style={estilos.td}>
                          {projeto.cliente}
                        </td>

                        <td style={estilos.td}>
                          {projeto.destino ||
                            "-"}
                        </td>

                        <td style={estilos.td}>
                          <span
                            style={
                              estilos.status
                            }
                          >
                            {formatarStatus(
                              projeto.status
                            )}
                          </span>
                        </td>

                        <td style={estilos.td}>
                          <button
                            style={
                              estilos.botaoAbrir
                            }
                            onClick={() =>
                              router.push(
                                `/projetos/${projeto.id}`
                              )
                            }
                          >
                            Abrir
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
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
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
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

  acoes: {
    display: "flex",
    gap: "10px",
  },

  botaoNovo: {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    padding: "11px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
  },

  botaoSair: {
    background: "#ffffff",
    border: "1px solid #d1d5db",
    padding: "11px 16px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  conteudo: {
    padding: "35px 40px",
  },

  tituloSecao: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },

  titulo: {
    margin: 0,
    fontSize: "24px",
  },

  descricao: {
    margin: "6px 0 0",
    color: "#6b7280",
  },

  contador: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    padding: "9px 13px",
    fontSize: "13px",
  },

  tabelaContainer: {
    background: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  },

  tabela: {
    width: "100%",
    borderCollapse:
      "collapse" as const,
  },

  th: {
    textAlign: "left" as const,
    background: "#f9fafb",
    padding: "13px",
    fontSize: "12px",
    color: "#4b5563",
    borderBottom:
      "1px solid #e5e7eb",
  },

  td: {
    padding: "14px 13px",
    borderBottom:
      "1px solid #f0f0f0",
    fontSize: "14px",
  },

  status: {
    background: "#f3f4f6",
    borderRadius: "20px",
    padding: "6px 10px",
    fontSize: "12px",
  },

  botaoAbrir: {
    background: "transparent",
    border: "1px solid #d1d5db",
    borderRadius: "5px",
    padding: "7px 12px",
    cursor: "pointer",
  },

  mensagem: {
    padding: "30px",
    textAlign: "center" as const,
  },

  erro: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "6px",
  },

  vazio: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "50px",
    textAlign: "center" as const,
    color: "#6b7280",
  },
};