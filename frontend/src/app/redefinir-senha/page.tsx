"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Image from "next/image";

import {
  useRouter,
} from "next/navigation";

import { api } from "@/servicos/api";
import { tema } from "@/estilos/tema";

export default function RedefinirSenhaPage() {
  const router = useRouter();

  const [token, setToken] =
    useState("");

  const [novaSenha, setNovaSenha] =
    useState("");

  const [
    confirmarSenha,
    setConfirmarSenha,
  ] = useState("");

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  const [salvando, setSalvando] =
    useState(false);

  useEffect(() => {
    const parametros =
      new URLSearchParams(
        window.location.search
      );

    const tokenUrl =
      parametros.get("token");

    if (tokenUrl) {
      setToken(tokenUrl);
    } else {
      setErro(
        "Link de recuperação inválido."
      );
    }
  }, []);

  async function redefinirSenha(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    setErro("");
    setSucesso("");

    if (!token) {
      setErro(
        "Link de recuperação inválido."
      );

      return;
    }

    if (novaSenha.length < 8) {
      setErro(
        "A senha deve possuir pelo menos 8 caracteres."
      );

      return;
    }

    if (
      novaSenha !==
      confirmarSenha
    ) {
      setErro(
        "As senhas informadas não são iguais."
      );

      return;
    }

    setSalvando(true);

    try {
      const resposta = await api(
        "/auth/redefinir-senha",
        {
          method: "POST",

          body: JSON.stringify({
            token,
            novaSenha,
          }),
        }
      );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        setErro(
          dados.erro ||
            "Não foi possível redefinir a senha."
        );

        return;
      }

      setSucesso(
        dados.mensagem ||
          "Senha redefinida com sucesso."
      );

      setNovaSenha("");
      setConfirmarSenha("");
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main style={estilos.pagina}>
      <section style={estilos.card}>
        <div style={estilos.areaLogo}>
          <Image
            src="/estrutec-logo.png"
            alt="Estrutec"
            width={190}
            height={120}
            priority
            style={estilos.logo}
          />
        </div>

        <div style={estilos.cabecalho}>
          <h1 style={estilos.titulo}>
            Criar nova senha
          </h1>

          <p style={estilos.descricao}>
            Informe uma nova senha para
            acessar sua conta no Estrutec.
          </p>
        </div>

        {!sucesso ? (
          <form
            onSubmit={redefinirSenha}
            style={estilos.formulario}
          >
            <div style={estilos.campo}>
              <label
                htmlFor="novaSenha"
                style={estilos.label}
              >
                Nova senha
              </label>

              <input
                id="novaSenha"
                type="password"
                value={novaSenha}
                onChange={(evento) =>
                  setNovaSenha(
                    evento.target.value
                  )
                }
                placeholder="Mínimo de 8 caracteres"
                required
                style={estilos.input}
              />
            </div>

            <div style={estilos.campo}>
              <label
                htmlFor="confirmarSenha"
                style={estilos.label}
              >
                Confirmar nova senha
              </label>

              <input
                id="confirmarSenha"
                type="password"
                value={confirmarSenha}
                onChange={(evento) =>
                  setConfirmarSenha(
                    evento.target.value
                  )
                }
                placeholder="Digite novamente"
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
              disabled={
                salvando || !token
              }
              style={{
                ...estilos.botao,

                ...(
                  salvando || !token
                    ? estilos.botaoDesabilitado
                    : {}
                ),
              }}
            >
              {salvando
                ? "Redefinindo..."
                : "Redefinir senha"}
            </button>
          </form>
        ) : (
          <div>
            <div style={estilos.sucesso}>
              <strong>
                Senha alterada!
              </strong>

              <span>
                {sucesso}
                {" "}
                Você já pode acessar sua
                conta usando a nova senha.
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/login")
              }
              style={estilos.botao}
            >
              Voltar para o Login
            </button>
          </div>
        )}
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

    background:
      tema.cores.fundo,

    padding: "24px",

    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "430px",

    background:
      tema.cores.branco,

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.grande,

    padding: "38px 40px",

    boxShadow:
      tema.sombras.destaque,
  },

  areaLogo: {
    display: "flex",
    justifyContent: "center",

    marginBottom: "20px",
  },

  logo: {
    width: "180px",
    height: "auto",

    objectFit:
      "contain" as const,
  },

  cabecalho: {
    textAlign:
      "center" as const,

    marginBottom: "28px",
  },

  titulo: {
    margin: "0 0 8px",

    color:
      tema.cores.grafite,

    fontSize: "24px",
  },

  descricao: {
    margin: 0,

    color:
      tema.cores.textoSecundario,

    fontSize: "13px",
    lineHeight: 1.6,
  },

  formulario: {
    display: "flex",

    flexDirection:
      "column" as const,

    gap: "19px",
  },

  campo: {
    display: "flex",

    flexDirection:
      "column" as const,

    gap: "7px",
  },

  label: {
    color:
      tema.cores.grafite,

    fontSize: "13px",
    fontWeight: 600,
  },

  input: {
    height: "46px",

    padding: "0 13px",

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.pequena,

    color:
      tema.cores.grafite,

    background:
      tema.cores.branco,

    fontSize: "14px",

    outline: "none",
  },

  botao: {
    width: "100%",
    height: "48px",

    marginTop: "4px",

    background:
      tema.cores.laranja,

    color:
      tema.cores.branco,

    border: "none",

    borderRadius:
      tema.bordas.pequena,

    fontSize: "14px",
    fontWeight: 700,

    cursor: "pointer",
  },

  botaoDesabilitado: {
    opacity: 0.6,

    cursor:
      "not-allowed",
  },

  erro: {
    padding: "11px 12px",

    background:
      tema.cores.erroFundo,

    color:
      tema.cores.erro,

    borderRadius:
      tema.bordas.pequena,

    fontSize: "13px",
  },

  sucesso: {
    padding: "16px",

    marginBottom: "18px",

    background:
      tema.cores.sucessoFundo,

    color:
      tema.cores.sucesso,

    borderRadius:
      tema.bordas.media,

    display: "flex",

    flexDirection:
      "column" as const,

    gap: "6px",

    fontSize: "13px",
    lineHeight: 1.5,
  },
};