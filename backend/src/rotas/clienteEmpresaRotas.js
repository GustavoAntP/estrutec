const express = require("express");
const {cadastrar, listar, editar, excluir,} = require("../controladores/clienteEmpresaControlador");
const autenticar = require("../middlewares/autenticacaoMiddleware");
const somenteAdministrador = require("../middlewares/somenteAdministradorMiddleware");
const router = express.Router();

router.get("/", autenticar, listar);
router.post("/", autenticar, somenteAdministrador, cadastrar);
router.put("/:id", autenticar, somenteAdministrador, editar);
router.delete("/:id", autenticar, somenteAdministrador, excluir);

module.exports = router;