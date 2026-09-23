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

module.exports = {
  salvar,
  buscar,
};