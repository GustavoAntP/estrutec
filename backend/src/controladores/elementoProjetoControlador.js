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

module.exports = {
  confirmarImportacao,
};