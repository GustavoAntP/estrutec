const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensagem: "API do Estrutec funcionando!"
  });
});

const PORTA = 3001;

app.listen(PORTA, () => {
  console.log(`Servidor Estrutec rodando na porta ${PORTA}`);
});