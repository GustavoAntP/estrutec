"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { tema } from "@/estilos/tema";

export default function AdministracaoPage() {
  const router = useRouter();

  useEffect(() => {
    const token =
      localStorage.getItem("estrutec_token");

    const usuarioSalvo =
      localStorage.getItem("estrutec_usuario");

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
      }
    } catch {
      localStorage.removeItem(
        "estrutec_token"
      );

      localStorage.removeItem(
        "estrutec_usuario"
      );

      router.replace("/");
    }
  }, [router]);

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
              Gerenciamento do sistema
            </span>
          </div>
        </div>

        <button
          type="button"
          style={estilos.botaoVoltar}
          onClick={() =>
            router.push("/painel")
          }
        >
          Voltar ao painel
        </button>
      </header>

      <section style={estilos.conteudo}>
        <span style={estilos.sobretitulo}>
          ADMINISTRAÇÃO
        </span>

        <h1 style={estilos.titulo}>
          Gerenciamento
        </h1>

        <p style={estilos.descricao}>
          Selecione uma área para
          gerenciar os cadastros do
          sistema.
        </p>

        <div style={estilos.grid}>
          <Card
            titulo="Usuários"
            descricao="Cadastre, edite e gerencie os usuários do sistema."
            onClick={() =>
              router.push(
                "/administracao/usuarios"
              )
            }
          />

          <Card
            titulo="Empresas clientes"
            descricao="Gerencie as empresas clientes utilizadas nos projetos."
            onClick={() =>
              router.push(
                "/administracao/clientes"
              )
            }
          />

          <Card
            titulo="Transportadoras"
            descricao="Gerencie as transportadoras utilizadas na logística."
            onClick={() =>
              router.push(
                "/administracao/transportadoras"
              )
            }
          />
        </div>
      </section>
    </main>
  );
}

function Card({
  titulo,
  descricao,
  onClick,
}: {
  titulo: string;
  descricao: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={estilos.card}
    >
      <div style={estilos.icone}>
        →
      </div>

      <div>
        <h2 style={estilos.tituloCard}>
          {titulo}
        </h2>

        <p
          style={estilos.descricaoCard}
        >
          {descricao}
        </p>
      </div>
    </button>
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
    justifyContent: "space-between",
  },

  areaMarca: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
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

  botaoVoltar: {
    height: "44px",
    padding: "0 18px",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.pequena,
    background:
      tema.cores.branco,
    color:
      tema.cores.grafite,
    cursor: "pointer",
    fontWeight: 600,
  },

  conteudo: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "45px 30px",
  },

  sobretitulo: {
    color:
      tema.cores.laranja,
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

  grid: {
    marginTop: "30px",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },

  card: {
    minHeight: "150px",
    textAlign: "left" as const,
    padding: "24px",
    border:
      `1px solid ${tema.cores.borda}`,
    borderRadius:
      tema.bordas.grande,
    background:
      tema.cores.branco,
    cursor: "pointer",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    gap: "20px",
    boxShadow:
      tema.sombras.card,
  },

  icone: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background:
      tema.cores.avisoFundo,
    color:
      tema.cores.laranja,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: 700,
  },

  tituloCard: {
    margin: "0 0 8px",
    fontSize: "18px",
    color:
      tema.cores.grafite,
  },

  descricaoCard: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.5,
    color:
      tema.cores.textoSecundario,
  },
};