const montagemServico = require(
  "../servicos/montagemServico"
);

async function salvar(req, res) {
  try {
    const montagem =
      await montagemServico.salvarMontagem(
        req.params.id,
        req.usuario.id,
        req.body
      );

    return res.status(200).json({
      mensagem:
        "Configuração de montagem salva com sucesso!",
      montagem,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function buscar(req, res) {
  try {
    const montagem =
      await montagemServico.buscarMontagem(
        req.params.id,
        req.usuario.id
      );

    return res.status(200).json({
      montagem,
    });
  } catch (erro) {
    return res.status(404).json({
      erro: erro.message,
    });
  }
}

async function calcularCustos(req, res) {
  try {
    const resultado =
      await montagemServico.calcularCustos(
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

async function confirmar(req, res) {
  try {
    const resultado =
      await montagemServico.confirmarMontagem(
        req.params.id,
        req.usuario.id
      );

    return res.status(200).json({
      mensagem:
        "Montagem confirmada com sucesso!",
      ...resultado,
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
  calcularCustos,
  confirmar,
};