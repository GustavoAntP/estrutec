const express = require("express");
const projetoControlador = require("../controladores/projetoControlador");
const autenticar = require("../middlewares/autenticacaoMiddleware");
const planilhaControlador = require("../controladores/planilhaControlador");
const uploadPlanilha = require("../middlewares/uploadPlanilhaMiddleware");
const elementoProjetoControlador = require("../controladores/elementoProjetoControlador");
const fabricacaoControlador = require("../controladores/fabricacaoControlador");
const configuracaoFabricacaoControlador = require("../controladores/configuracaoFabricacaoControlador");
const precoFabricacaoControlador = require("../controladores/precoFabricacaoControlador");


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

router.get("/:id/fabricacao/volumes", autenticar, fabricacaoControlador.calcularVolumes);
router.get("/:id/fabricacao/configuracao", autenticar, configuracaoFabricacaoControlador.buscar);
router.put("/:id/fabricacao/configuracao", autenticar, configuracaoFabricacaoControlador.salvar);
router.get("/:id/fabricacao/materiais", autenticar, fabricacaoControlador.calcularMateriais);

router.get("/:id/fabricacao/precos", autenticar, precoFabricacaoControlador.buscar);
router.put("/:id/fabricacao/precos", autenticar, precoFabricacaoControlador.salvar);
router.get("/:id/fabricacao/custos", autenticar, fabricacaoControlador.calcularCustos);

module.exports = router;