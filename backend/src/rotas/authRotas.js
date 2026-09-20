const express = require("express");
const authControlador = require("../controladores/authControlador");
const autenticar = require("../middlewares/autenticacaoMiddleware");

const router = express.Router();

router.post("/login", authControlador.login);
router.get("/verificar", autenticar, (req, res) => {
  return res.status(200).json({
    mensagem: "Token válido!",
    usuario: req.usuario,
  });
});

module.exports = router;