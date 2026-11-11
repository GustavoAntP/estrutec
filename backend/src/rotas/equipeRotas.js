const express = require("express");

const {
  listar,
  cadastrar,
  editar,
  alterarStatus,
} = require(
  "../controladores/equipeControlador"
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
  listar
);

router.post(
  "/",
  autenticar,
  somenteAdministrador,
  cadastrar
);

router.put(
  "/:id",
  autenticar,
  somenteAdministrador,
  editar
);

router.patch(
  "/:id/status",
  autenticar,
  somenteAdministrador,
  alterarStatus
);

module.exports = router;