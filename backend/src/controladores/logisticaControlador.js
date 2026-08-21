const logisticaServico = require(
  "../servicos/logisticaServico"
);

async function salvar(req, res) {
  try {
    const logistica =
      await logisticaServico.salvarLogistica(
        req.params.id,
        req.usuario.id,
        req.body
      );

    return res.status(200).json({
      mensagem:
        "Configuração de logística salva com sucesso!",
      logistica,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function buscar(req, res) {
  try {
    const logistica =
      await logisticaServico.buscarLogistica(
        req.params.id,
        req.usuario.id
      );

    return res.status(200).json({
      logistica,
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