const express = require("express");
const usuarioControlador = require("../controladores/usuarioControlador");

const router = express.Router();

router.post("/", usuarioControlador.cadastrar);

module.exports = router;