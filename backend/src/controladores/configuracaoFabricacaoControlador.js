const configuracaoFabricacaoServico = require(
  "../servicos/configuracaoFabricacaoServico"
);

async function salvar(req, res) {
  try {
    const configuracao =
      await configuracaoFabricacaoServico.salvarConfiguracao(
        req.params.id,
        req.usuario.id,
        req.body
      );

    return res.status(200).json({
      mensagem:
        "Configuração de fabricação salva com sucesso!",
      configuracao,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function buscar(req, res) {
  try {
    const configuracao =
      await configuracaoFabricacaoServico.buscarConfiguracao(
        req.params.id,
        req.usuario.id
      );

    return res.status(200).json({
      configuracao,
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