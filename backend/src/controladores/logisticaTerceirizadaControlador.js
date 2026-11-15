const logisticaTerceirizadaServico = require(
  "../servicos/logisticaTerceirizadaServico"
);

async function salvar(req, res) {
  try {
    const resultado =
      await logisticaTerceirizadaServico.salvarLogisticaTerceirizada(
        req.params.id,
        req.usuario.id,
        req.body
      );

    return res.status(200).json({
      mensagem:
        "Frete terceirizado salvo com sucesso!",
      freteTerceirizado: resultado,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function buscar(req, res) {
  try {
    const resultado =
      await logisticaTerceirizadaServico.buscarLogisticaTerceirizada(
        req.params.id,
        req.usuario.id
      );

    return res.status(200).json({
      freteTerceirizado: resultado,
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