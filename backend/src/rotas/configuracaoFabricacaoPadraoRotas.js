const express = require("express");

const configuracaoFabricacaoPadraoControlador =
  require(
    "../controladores/configuracaoFabricacaoPadraoControlador"
  );

const autenticar = require(
  "../middlewares/autenticacaoMiddleware"
);

const somenteAdministrador = require(
  "../middlewares/somenteAdministradorMiddleware"
);

const router = express.Router();

router.get(
  "/",
  autenticar,
  configuracaoFabricacaoPadraoControlador.buscar
);

router.put(
  "/",
  autenticar,
  somenteAdministrador,
  configuracaoFabricacaoPadraoControlador.salvar
);

module.exports = router;