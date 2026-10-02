"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/servicos/api";

export default function LoginPage() {
  const router = useRouter();

  const [identificador, setIdentificador] =
    useState("");

  const [senha, setSenha] = useState("");

  const [erro, setErro] = useState("");

  const [carregando, setCarregando] =
    useState(false);

  async function fazerLogin(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    setErro("");
    setCarregando(true);

    try {
      const resposta = await api(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            identificador,
            senha,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(
          dados.erro ||
            "Não foi possível realizar o login."
        );

        return;
      }

      localStorage.setItem(
        "estrutec_token",
        dados.token
      );

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
      <section style={estilos.card}>
        <div style={estilos.cabecalho}>
          <h1 style={estilos.logo}>
            ESTRUTEC
          </h1>

          <p style={estilos.descricao}>
            Orçamentação e Planejamento de
            Estruturas Pré-Moldadas
          </p>
        </div>

        <form
          onSubmit={fazerLogin}
          style={estilos.formulario}
        >
          <div style={estilos.campo}>
            <label htmlFor="identificador">
              CPF ou e-mail
            </label>

            <input
              id="identificador"
              type="text"
              value={identificador}
              onChange={(evento) =>
                setIdentificador(
                  evento.target.value
                )
              }
              placeholder="Digite seu CPF ou e-mail"
              required
              style={estilos.input}
            />
          </div>

          <div style={estilos.campo}>
            <label htmlFor="senha">
              Senha
            </label>

            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(evento) =>
                setSenha(
                  evento.target.value
                )
              }
              placeholder="Digite sua senha"
              required
              style={estilos.input}
            />
          </div>

          {erro && (
            <div style={estilos.erro}>
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            style={estilos.botao}
          >
            {carregando
              ? "Entrando..."
              : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}

const estilos = {
  pagina: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f4f6f8",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "12px",
    padding: "40px",
    boxShadow:
      "0 8px 30px rgba(0,0,0,0.08)",
  },

  cabecalho: {
    textAlign: "center" as const,
    marginBottom: "32px",
  },

  logo: {
    margin: 0,
    fontSize: "30px",
    letterSpacing: "1px",
  },

  descricao: {
    color: "#666",
    fontSize: "14px",
    lineHeight: "1.5",
  },

  formulario: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },

  campo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
    fontSize: "14px",
    fontWeight: 600,
  },

  input: {
    height: "44px",
    padding: "0 12px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
  },

  botao: {
    height: "46px",
    border: "none",
    borderRadius: "6px",
    background: "#111827",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
  },

  erro: {
    padding: "10px",
    borderRadius: "6px",
    background: "#fee2e2",
    color: "#991b1b",
    fontSize: "13px",
  },
};