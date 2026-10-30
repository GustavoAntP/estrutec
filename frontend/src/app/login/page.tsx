"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { api } from "@/servicos/api";
import { tema } from "@/estilos/tema";

export default function LoginPage() {
  const router = useRouter();

  const [identificador, setIdentificador] =
    useState("");

  const [senha, setSenha] = useState("");

  const [erro, setErro] = useState("");

  const [carregando, setCarregando] =
    useState(false);

  const [modalSemContaAberto, setModalSemContaAberto] =
    useState(false);

  const [
    modalEsqueciSenhaAberto,
    setModalEsqueciSenhaAberto,
  ] = useState(false);

  const [
    identificadorRecuperacao,
    setIdentificadorRecuperacao,
  ] = useState("");

  const [
    enviandoRecuperacao,
    setEnviandoRecuperacao,
  ] = useState(false);

  const [
    erroRecuperacao,
    setErroRecuperacao,
  ] = useState("");

  const [
    sucessoRecuperacao,
    setSucessoRecuperacao,
  ] = useState("");

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

  async function solicitarRecuperacaoSenha() {
    if (!identificadorRecuperacao.trim()) {
      setErroRecuperacao(
        "Informe seu CPF ou e-mail."
      );

      return;
    }

    setErroRecuperacao("");
    setSucessoRecuperacao("");
    setEnviandoRecuperacao(true);

    try {
      const resposta = await api(
        "/auth/esqueci-senha",
        {
          method: "POST",

          body: JSON.stringify({
            identificador:
              identificadorRecuperacao,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErroRecuperacao(
          dados.erro ||
            "Não foi possível solicitar a recuperação."
        );

        return;
      }

      setSucessoRecuperacao(
        dados.mensagem ||
          "Se os dados informados estiverem cadastrados, enviaremos as instruções para o e-mail associado à conta."
      );
    } catch {
      setErroRecuperacao(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setEnviandoRecuperacao(false);
    }
  }

  return (
    <main style={estilos.pagina}>
      <section style={estilos.card}>
        <div style={estilos.areaLogo}>
          <Image
            src="/estrutec-logo.png"
            alt="Estrutec"
            width={210}
            height={140}
            priority
            style={estilos.logoImagem}
          />
        </div>

        <div style={estilos.cabecalho}>
          <h1 style={estilos.titulo}>
            Acesse sua conta
          </h1>

          <p style={estilos.descricao}>
            Entre para continuar no sistema
            de orçamentação e planejamento
            de estruturas pré-moldadas.
          </p>
        </div>

        <form
          onSubmit={fazerLogin}
          style={estilos.formulario}
        >
          <div style={estilos.campo}>
            <label
              htmlFor="identificador"
              style={estilos.label}
            >
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
            <label
              htmlFor="senha"
              style={estilos.label}
            >
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
            style={{
              ...estilos.botao,

              ...(carregando
                ? estilos.botaoDesabilitado
                : {}),
            }}
          >
            {carregando
              ? "Entrando..."
              : "Entrar no Estrutec"}
          </button>
          <div style={estilos.opcoesAcesso}>
            <button
              type="button"
              onClick={() =>
                setModalSemContaAberto(true)
              }
              style={estilos.botaoSecundario}
            >
              Não possuo conta
            </button>

            <button
              type="button"
              onClick={() => {
                setModalEsqueciSenhaAberto(true);

                setIdentificadorRecuperacao(
                  identificador
                );

                setErroRecuperacao("");
                setSucessoRecuperacao("");
              }}
              style={estilos.botaoLink}
            >
              Esqueci minha senha
            </button>
          </div>
        </form>

        <div style={estilos.rodape}>
          <span style={estilos.detalheLaranja} />

          <span>
            ESTRUTEC
          </span>
        </div>
      </section>
      {modalSemContaAberto && (
      <div
        style={estilos.overlayModal}
        onClick={() =>
          setModalSemContaAberto(false)
        }
      >
        <div
          style={estilos.modal}
          onClick={(evento) =>
            evento.stopPropagation()
          }
        >
          <div style={estilos.iconeModal}>
            !
          </div>

          <h2 style={estilos.tituloModal}>
            Não possui uma conta?
          </h2>

          <p style={estilos.textoModal}>
            O acesso ao Estrutec é disponibilizado
            somente para usuários autorizados pela
            empresa.
          </p>

          <div style={estilos.avisoModal}>
            <strong>
              Como solicitar acesso?
            </strong>

            <span>
              Entre em contato com o responsável
              ou administrador da empresa que
              adquiriu o Estrutec. Ele poderá
              solicitar ou realizar a criação da
              sua conta de acesso.
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setModalSemContaAberto(false)
            }
            style={estilos.botaoFecharModal}
          >
            Entendi
          </button>
        </div>
      </div>
    )}
    {modalEsqueciSenhaAberto && (
      <div
        style={estilos.overlayModal}
        onClick={() =>
          !enviandoRecuperacao &&
          setModalEsqueciSenhaAberto(false)
        }
      >
        <div
          style={estilos.modal}
          onClick={(evento) =>
            evento.stopPropagation()
          }
        >
          <div
            style={estilos.iconeRecuperacao}
          >
            ↻
          </div>

          <h2 style={estilos.tituloModal}>
            Recuperar senha
          </h2>

          <p style={estilos.textoModal}>
            Informe seu CPF ou e-mail. Se
            houver uma conta vinculada aos
            dados informados, enviaremos um
            link para redefinir sua senha.
          </p>

          {!sucessoRecuperacao ? (
            <>
              <div style={estilos.campoModal}>
                <label
                  htmlFor="recuperacao"
                  style={estilos.label}
                >
                  CPF ou e-mail
                </label>

                <input
                  id="recuperacao"
                  type="text"
                  value={
                    identificadorRecuperacao
                  }
                  onChange={(evento) =>
                    setIdentificadorRecuperacao(
                      evento.target.value
                    )
                  }
                  placeholder="Digite seu CPF ou e-mail"
                  style={estilos.input}
                  disabled={
                    enviandoRecuperacao
                  }
                />
              </div>

              {erroRecuperacao && (
                <div style={estilos.erro}>
                  {erroRecuperacao}
                </div>
              )}

              <div
                style={
                  estilos.acoesRecuperacao
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    setModalEsqueciSenhaAberto(
                      false
                    )
                  }
                  disabled={
                    enviandoRecuperacao
                  }
                  style={
                    estilos.botaoCancelarRecuperacao
                  }
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    solicitarRecuperacaoSenha
                  }
                  disabled={
                    enviandoRecuperacao
                  }
                  style={
                    estilos.botaoEnviarRecuperacao
                  }
                >
                  {enviandoRecuperacao
                    ? "Enviando..."
                    : "Enviar link"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                style={
                  estilos.sucessoRecuperacao
                }
              >
                <strong>
                  Solicitação recebida
                </strong>

                <span>
                  {sucessoRecuperacao}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalEsqueciSenhaAberto(
                    false
                  )
                }
                style={
                  estilos.botaoFecharModal
                }
              >
                Entendi
              </button>
            </>
          )}
        </div>
      </div>
    )}
    </main>
  );
}

const estilos = {
  pagina: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    background: tema.cores.fundo,

    fontFamily:
      "Arial, Helvetica, sans-serif",

    padding: "24px",
  },

  card: {
    width: "100%",
    maxWidth: "430px",

    background: tema.cores.superficie,

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.grande,

    padding: "38px 40px 32px",

    boxShadow:
      tema.sombras.destaque,
  },

  areaLogo: {
    display: "flex",
    justifyContent: "center",

    marginBottom: "20px",
  },

  logoImagem: {
    width: "190px",
    height: "auto",
    objectFit: "contain" as const,
  },

  cabecalho: {
    textAlign: "center" as const,

    marginBottom: "30px",
  },

  titulo: {
    margin: "0 0 8px",

    color: tema.cores.grafite,

    fontSize: "24px",
    fontWeight: 700,
  },

  descricao: {
    margin: 0,

    color: tema.cores.textoSecundario,

    fontSize: "13px",
    lineHeight: 1.6,
  },

  formulario: {
    display: "flex",
    flexDirection: "column" as const,

    gap: "19px",
  },

  campo: {
    display: "flex",
    flexDirection: "column" as const,

    gap: "7px",
  },

  label: {
    color: tema.cores.grafite,

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

    background: tema.cores.branco,

    color: tema.cores.texto,

    fontSize: "14px",

    outline: "none",
  },

  botao: {
    height: "48px",

    marginTop: "4px",

    border: "none",

    borderRadius:
      tema.bordas.pequena,

    background:
      tema.cores.laranja,

    color: tema.cores.branco,

    fontSize: "14px",
    fontWeight: 700,

    cursor: "pointer",

    transition:
      "opacity 0.2s ease, transform 0.2s ease",
  },

  botaoDesabilitado: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  erro: {
    padding: "11px 12px",

    borderRadius:
      tema.bordas.pequena,

    background:
      tema.cores.erroFundo,

    color: tema.cores.erro,

    border:
      "1px solid #FECACA",

    fontSize: "13px",
  },

  rodape: {
    marginTop: "30px",

    paddingTop: "20px",

    borderTop:
      `1px solid ${tema.cores.borda}`,

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    gap: "7px",

    color: tema.cores.textoSecundario,

    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "1.5px",
  },

  detalheLaranja: {
    width: "7px",
    height: "7px",

    borderRadius: "2px",

    background:
      tema.cores.laranja,
  },
  opcoesAcesso: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  },

  botaoSecundario: {
    flex: 1,
    height: "42px",

    background: tema.cores.branco,

    color: tema.cores.grafite,

    border:
      "None",

    fontSize: "13px",
    fontWeight: 600,

    cursor: "pointer",
  },

  botaoLink: {
    flex: 1,

    background: "transparent",
    border: "none",

    color: tema.cores.laranja,

    fontSize: "13px",
    fontWeight: 600,

    cursor: "pointer",
  },

  overlayModal: {
    position: "fixed" as const,
    inset: 0,

    background:
      "rgba(23, 23, 23, 0.65)",

    backdropFilter: "blur(3px)",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    padding: "20px",

    zIndex: 9999,
  },

  modal: {
    width: "100%",
    maxWidth: "430px",

    background: tema.cores.branco,

    borderRadius:
      tema.bordas.modal,

    padding: "30px",

    border:
      `1px solid ${tema.cores.borda}`,

    boxShadow:
      tema.sombras.destaque,
  },

  iconeModal: {
    width: "48px",
    height: "48px",

    borderRadius: "14px",

    background: tema.cores.laranja,

    color: tema.cores.branco,

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    fontSize: "22px",
    fontWeight: 800,

    marginBottom: "18px",
  },

  tituloModal: {
    margin: "0 0 9px",

    color: tema.cores.grafite,

    fontSize: "22px",
  },

  textoModal: {
    margin: "0 0 18px",

    color:
      tema.cores.textoSecundario,

    fontSize: "14px",
    lineHeight: 1.6,
  },

  avisoModal: {
    background: tema.cores.avisoFundo,

    border:
      "1px solid #FED7AA",

    borderRadius:
      tema.bordas.media,

    padding: "15px",

    display: "flex",
    flexDirection: "column" as const,

    gap: "6px",

    color: tema.cores.grafite,

    fontSize: "13px",
    lineHeight: 1.5,
  },

  botaoFecharModal: {
    width: "100%",
    height: "44px",

    marginTop: "20px",

    border: "none",

    borderRadius:
      tema.bordas.pequena,

    background:
      tema.cores.grafite,

    color: tema.cores.branco,

    fontSize: "14px",
    fontWeight: 600,

    cursor: "pointer",
  },
    iconeRecuperacao: {
    width: "48px",
    height: "48px",

    borderRadius: "14px",

    background: tema.cores.laranja,

    color: tema.cores.branco,

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    fontSize: "22px",
    fontWeight: 800,

    marginBottom: "18px",
  },

  campoModal: {
    display: "flex",
    flexDirection: "column" as const,

    gap: "7px",

    marginTop: "20px",
  },

  acoesRecuperacao: {
    display: "flex",
    gap: "10px",

    marginTop: "20px",
  },

  botaoCancelarRecuperacao: {
    flex: 1,
    height: "44px",

    background: tema.cores.branco,

    color: tema.cores.grafite,

    border:
      `1px solid ${tema.cores.borda}`,

    borderRadius:
      tema.bordas.pequena,

    fontWeight: 600,
    cursor: "pointer",
  },

  botaoEnviarRecuperacao: {
    flex: 1,
    height: "44px",

    background: tema.cores.laranja,

    color: tema.cores.branco,

    border: "none",

    borderRadius:
      tema.bordas.pequena,

    fontWeight: 700,
    cursor: "pointer",
  },

  sucessoRecuperacao: {
    marginTop: "20px",

    padding: "16px",

    background:
      tema.cores.sucessoFundo,

    color: tema.cores.sucesso,

    borderRadius:
      tema.bordas.media,

    display: "flex",
    flexDirection: "column" as const,

    gap: "6px",

    fontSize: "13px",
    lineHeight: 1.5,
  },
};