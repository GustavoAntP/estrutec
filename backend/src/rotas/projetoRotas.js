const express = require("express");
const projetoControlador = require("../controladores/projetoControlador");
const autenticar = require("../middlewares/autenticacaoMiddleware");
const planilhaControlador = require("../controladores/planilhaControlador");
const uploadPlanilha = require("../middlewares/uploadPlanilhaMiddleware");
const elementoProjetoControlador = require("../controladores/elementoProjetoControlador");

const router = express.Router();

router.get("/", autenticar, projetoControlador.listar);
router.get("/:id", autenticar, projetoControlador.buscarPorId);
router.post("/", autenticar, projetoControlador.cadastrar);
router.put("/:id", autenticar, projetoControlador.atualizar);
router.delete("/:id", autenticar, projetoControlador.excluir);

router.post("/:id/importar-planilha", autenticar, uploadPlanilha.single("arquivo"), planilhaControlador.importar);
router.post("/:id/confirmar-importacao", autenticar, elementoProjetoControlador.confirmarImportacao);
router.get("/:id/elementos", autenticar, elementoProjetoControlador.listar);
router.put("/:id/elementos/:elementoId", autenticar, elementoProjetoControlador.atualizar);


module.exports = router;