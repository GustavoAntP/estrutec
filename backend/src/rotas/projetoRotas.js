const express = require("express");
const projetoControlador = require("../controladores/projetoControlador");
const autenticar = require("../middlewares/autenticacaoMiddleware");
const planilhaControlador = require("../controladores/planilhaControlador");
const uploadPlanilha = require("../middlewares/uploadPlanilhaMiddleware");
const elementoProjetoControlador = require("../controladores/elementoProjetoControlador");
const fabricacaoControlador = require("../controladores/fabricacaoControlador");
const configuracaoFabricacaoControlador = require("../controladores/configuracaoFabricacaoControlador");
const precoFabricacaoControlador = require("../controladores/precoFabricacaoControlador");
const logisticaControlador = require("../controladores/logisticaControlador");
const logisticaTerceirizadaControlador = require("../controladores/logisticaTerceirizadaControlador");
const logisticaPropriaControlador = require("../controladores/logisticaPropriaControlador");
const montagemControlador = require("../controladores/montagemControlador");
const equipamentoMontagemControlador = require("../controladores/equipamentoMontagemControlador");
const equipeMontagemControlador = require("../controladores/equipeMontagemControlador");
const resumoFinanceiroControlador = require("../controladores/resumoFinanceiroControlador");
const relatorioControlador = require("../controladores/relatorioControlador");
const verificarProjetoEditavel = require("../middlewares/projetoEditavelMiddleware");


const router = express.Router();

router.get("/", autenticar, projetoControlador.listar);
router.get("/:id", autenticar, projetoControlador.buscarPorId);
router.post("/", autenticar, projetoControlador.cadastrar);
router.put("/:id", autenticar, verificarProjetoEditavel, projetoControlador.atualizar);
router.delete("/:id", autenticar, verificarProjetoEditavel, projetoControlador.excluir);

router.post("/:id/importar-planilha", verificarProjetoEditavel, autenticar, uploadPlanilha.single("arquivo"), planilhaControlador.importar);
router.post("/:id/confirmar-importacao", verificarProjetoEditavel, autenticar, elementoProjetoControlador.confirmarImportacao);

router.get("/:id/elementos", autenticar, elementoProjetoControlador.listar);
router.put("/:id/elementos/:elementoId", autenticar, verificarProjetoEditavel, elementoProjetoControlador.atualizar);

router.get("/:id/fabricacao/volumes", autenticar, fabricacaoControlador.calcularVolumes);
router.get("/:id/fabricacao/configuracao", autenticar, configuracaoFabricacaoControlador.buscar);
router.put("/:id/fabricacao/configuracao", autenticar, verificarProjetoEditavel, configuracaoFabricacaoControlador.salvar);
router.get("/:id/fabricacao/materiais", autenticar, fabricacaoControlador.calcularMateriais);

router.get("/:id/fabricacao/precos", autenticar, precoFabricacaoControlador.buscar);
router.put("/:id/fabricacao/precos", autenticar,verificarProjetoEditavel, precoFabricacaoControlador.salvar);
router.get("/:id/fabricacao/custos", autenticar, fabricacaoControlador.calcularCustos);
router.post("/:id/fabricacao/confirmar", autenticar, verificarProjetoEditavel, fabricacaoControlador.confirmar);

router.get("/:id/logistica", autenticar, logisticaControlador.buscar);
router.put("/:id/logistica", autenticar, verificarProjetoEditavel, logisticaControlador.salvar);
router.get("/:id/logistica/custos", autenticar, logisticaControlador.calcularCusto);
router.post("/:id/logistica/confirmar", autenticar, verificarProjetoEditavel, logisticaControlador.confirmar);

router.get("/:id/logistica/terceirizada", autenticar, logisticaTerceirizadaControlador.buscar);
router.put("/:id/logistica/terceirizada", autenticar, verificarProjetoEditavel, logisticaTerceirizadaControlador.salvar);

router.get("/:id/logistica/propria", autenticar, logisticaPropriaControlador.buscar);
router.put("/:id/logistica/propria", autenticar, verificarProjetoEditavel, logisticaPropriaControlador.salvar);
router.get("/:id/logistica/propria/custos", autenticar, logisticaPropriaControlador.calcularCusto);
router.get("/:id/logistica/propria/sugestao-viagens", autenticar, logisticaPropriaControlador.sugerirViagens);
router.post("/:id/logistica/propria/aplicar-sugestao-viagens", verificarProjetoEditavel, autenticar, logisticaPropriaControlador.aplicarSugestao);

router.get("/:id/montagem", autenticar, montagemControlador.buscar);
router.put("/:id/montagem", autenticar, verificarProjetoEditavel, montagemControlador.salvar);

router.get("/:id/montagem/equipamentos", autenticar, equipamentoMontagemControlador.listar);
router.post("/:id/montagem/equipamentos", autenticar, verificarProjetoEditavel, equipamentoMontagemControlador.cadastrar);
router.put("/:id/montagem/equipamentos/:equipamentoId", autenticar, verificarProjetoEditavel, equipamentoMontagemControlador.atualizar);
router.delete("/:id/montagem/equipamentos/:equipamentoId", autenticar, verificarProjetoEditavel, equipamentoMontagemControlador.excluir);

router.get("/:id/montagem/equipes", autenticar, equipeMontagemControlador.listar);
router.post("/:id/montagem/equipes", autenticar, verificarProjetoEditavel, equipeMontagemControlador.cadastrar);
router.put("/:id/montagem/equipes/:equipeId", autenticar, verificarProjetoEditavel, equipeMontagemControlador.atualizar);
router.delete("/:id/montagem/equipes/:equipeId", autenticar, verificarProjetoEditavel, equipeMontagemControlador.excluir);

router.get("/:id/montagem/custos", autenticar, montagemControlador.calcularCustos);
router.post("/:id/montagem/confirmar", autenticar, verificarProjetoEditavel, montagemControlador.confirmar);

router.get("/:id/resumo-financeiro", autenticar, resumoFinanceiroControlador.calcular);
router.post("/:id/finalizar", autenticar, resumoFinanceiroControlador.finalizar);
router.get("/:id/relatorio-final", autenticar, relatorioControlador.gerarFinal);
router.post("/:id/reabrir", autenticar, projetoControlador.reabrir);



module.exports = router;