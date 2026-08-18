const express = require("express");
const cors = require("cors");

const sequelize = require("./configuracoes/banco");

const app = express();

app.use(cors());
app.use(express.json());

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

    app.listen(PORTA, () => {
      console.log(`Servidor Estrutec rodando na porta ${PORTA}`);
    });
  } catch (erro) {
    console.error("Erro ao conectar com o PostgreSQL:");
    console.error(erro);
  }
}

iniciarServidor();