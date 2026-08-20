const express = require("express");
const cors = require("cors");

const sequelize = require("./configuracoes/banco");
// Modelos
const Usuario = require("./modelos/Usuario");
const Projeto = require("./modelos/Projeto");

// Rotas
const usuarioRotas = require("./rotas/usuarioRotas");
const authRotas = require("./rotas/authRotas");
const projetoRotas = require("./rotas/projetoRotas");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/usuarios", usuarioRotas);
app.use("/auth", authRotas);
app.use("/projetos", projetoRotas);




app.get("/", (req, res) => {
  res.json({
    mensagem: "API do Estrutec funcionando!",
  });
});

const PORTA = 3001;

async function iniciarServidor() {
  try {
    await sequelize.authenticate();
    console.log("Conexão com o PostgreSQL realizada com sucesso!");

    await sequelize.sync();
    console.log("Tabelas sincronizadas com sucesso!");

    app.listen(PORTA, () => {
      console.log(`Servidor Estrutec rodando na porta ${PORTA}`);
    });
  } catch (erro) {
    console.error("Erro ao conectar com o PostgreSQL:");
    console.error(erro);
  }
}

iniciarServidor();