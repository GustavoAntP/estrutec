const elementoProjetoServico = require(
  "../servicos/elementoProjetoServico"
);

async function confirmarImportacao(req, res) {
  try {
    const { elementos } = req.body;

    const resultado =
      await elementoProjetoServico.confirmarImportacao(
        req.params.id,
        req.usuario.id,
        elementos
      );

    return res.status(201).json({
      mensagem: "Importação confirmada com sucesso!",
      resumo: resultado,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function listar(req, res) {
  try {
    const elementos =
      await elementoProjetoServico.listarElementos(
        req.params.id,
        req.usuario.id
      );

    return res.status(200).json({
      elementos,
    });
  } catch (erro) {
    return res.status(404).json({
      erro: erro.message,
    });
  }
}

async function atualizar(req, res) {
  try {
    const elemento =
      await elementoProjetoServico.atualizarElemento(
        req.params.id,
        req.params.elementoId,
        req.usuario.id,
        req.body
      );

    return res.status(200).json({
      mensagem: "Elemento atualizado com sucesso!",
      elemento,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

module.exports = {
  confirmarImportacao,
  listar,
  atualizar,
};