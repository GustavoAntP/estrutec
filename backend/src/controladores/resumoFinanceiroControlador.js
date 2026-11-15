const resumoFinanceiroServico = require(
  "../servicos/resumoFinanceiroServico"
);

async function calcular(req, res) {
  try {
    const resumo =
      await resumoFinanceiroServico
        .calcularResumoFinanceiro(
          req.params.id,
          req.usuario.id
        );

    return res.status(200).json(resumo);
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function finalizar(req, res) {
  try {
    const resultado =
      await resumoFinanceiroServico.finalizarProjeto(
        req.params.id,
        req.usuario.id
      );

    return res.status(200).json({
      mensagem:
        "Projeto finalizado com sucesso!",
      ...resultado,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

module.exports = {
  calcular,
  finalizar,
};