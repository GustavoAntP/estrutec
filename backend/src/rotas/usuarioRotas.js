const express = require("express");
const {cadastrar, listar, editar, alterarStatus} = require("../controladores/usuarioControlador");
const autenticar = require("../middlewares/autenticacaoMiddleware");
const somenteAdministrador = require("../middlewares/somenteAdministradorMiddleware");
const router = express.Router();

router.get("/", autenticar, somenteAdministrador, listar);
router.post("/", autenticar, somenteAdministrador, cadastrar);
router.put("/:id", autenticar, somenteAdministrador, editar);
router.patch("/:id/status", autenticar, somenteAdministrador, alterarStatus);

module.exports = router;