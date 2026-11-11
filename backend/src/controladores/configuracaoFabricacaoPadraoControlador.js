const configuracaoFabricacaoPadraoServico =
  require(
    "../servicos/configuracaoFabricacaoPadraoServico"
  );

async function buscar(req, res) {
  try {
    const configuracao =
      await configuracaoFabricacaoPadraoServico
        .buscarConfiguracaoPadrao();

    return res.status(200).json({
      configuracao,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function salvar(req, res) {
  try {
    const configuracao =
      await configuracaoFabricacaoPadraoServico
        .salvarConfiguracaoPadrao(
          req.body
        );

    return res.status(200).json({
      mensagem:
        "Configuração padrão atualizada com sucesso!",
      configuracao,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

module.exports = {
  buscar,
  salvar,
};