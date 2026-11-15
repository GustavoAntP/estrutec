const logisticaPropriaServico = require(
  "../servicos/logisticaPropriaServico"
);

async function salvar(req, res) {
  try {
    const freteProprio =
      await logisticaPropriaServico.salvarLogisticaPropria(
        req.params.id,
        req.usuario.id,
        req.body
      );

    return res.status(200).json({
      mensagem:
        "Frete próprio salvo com sucesso!",
      freteProprio,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function buscar(req, res) {
  try {
    const freteProprio =
      await logisticaPropriaServico.buscarLogisticaPropria(
        req.params.id,
        req.usuario.id
      );

    return res.status(200).json({
      freteProprio,
    });
  } catch (erro) {
    return res.status(404).json({
      erro: erro.message,
    });
  }
}

async function calcularCusto(req, res) {
  try {
    const resultado =
      await logisticaPropriaServico.calcularCustoFreteProprio(
        req.params.id,
        req.usuario.id
      );

    return res.status(200).json(resultado);
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function sugerirViagens(req, res) {
  try {
    const resultado =
      await logisticaPropriaServico.sugerirQuantidadeViagens(
        req.params.id,
        req.usuario.id
      );

    return res.status(200).json(resultado);
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function aplicarSugestao(req, res) {
  try {
    const resultado =
      await logisticaPropriaServico.aplicarSugestaoViagens(
        req.params.id,
        req.usuario.id
      );

    return res.status(200).json({
      mensagem:
        "Sugestão de viagens aplicada com sucesso!",
      resultado,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

module.exports = {
  salvar,
  buscar,
  calcularCusto,
  sugerirViagens,
  aplicarSugestao,
};