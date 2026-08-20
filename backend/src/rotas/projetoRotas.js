const express = require("express");
const projetoControlador = require("../controladores/projetoControlador");
const autenticar = require("../middlewares/autenticacaoMiddleware");

const router = express.Router();

router.get("/", autenticar, projetoControlador.listar);

router.get("/:id", autenticar, projetoControlador.buscarPorId);

router.post("/", autenticar, projetoControlador.cadastrar);

router.put("/:id", autenticar, projetoControlador.atualizar);

router.delete("/:id", autenticar, projetoControlador.excluir);

module.exports = router;