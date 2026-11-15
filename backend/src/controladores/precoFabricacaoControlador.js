const precoFabricacaoServico = require(
  "../servicos/precoFabricacaoServico"
);

async function salvar(req, res) {
  try {
    const precos =
      await precoFabricacaoServico.salvarPrecos(
        req.params.id,
        req.usuario.id,
        req.body
      );

    return res.status(200).json({
      mensagem:
        "Preços de fabricação salvos com sucesso!",
      precos,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function buscar(req, res) {
  try {
    const precos =
      await precoFabricacaoServico.buscarPrecos(
        req.params.id,
        req.usuario.id
      );

    return res.status(200).json({
      precos,
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