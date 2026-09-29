const equipamentoMontagemServico = require(
  "../servicos/equipamentoMontagemServico"
);

async function cadastrar(req, res) {
  try {
    const equipamento =
      await equipamentoMontagemServico.cadastrar(
        req.params.id,
        req.usuario.id,
        req.body
      );

    return res.status(201).json({
      mensagem: "Equipamento cadastrado com sucesso!",
      equipamento,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function listar(req, res) {
  try {
    const equipamentos =
      await equipamentoMontagemServico.listar(
        req.params.id,
        req.usuario.id
      );

    return res.status(200).json({
      equipamentos,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function atualizar(req, res) {
  try {
    const equipamento =
      await equipamentoMontagemServico.atualizar(
        req.params.id,
        req.params.equipamentoId,
        req.usuario.id,
        req.body
      );

    return res.status(200).json({
      mensagem: "Equipamento atualizado com sucesso!",
      equipamento,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function excluir(req, res) {
  try {
    await equipamentoMontagemServico.excluir(
      req.params.id,
      req.params.equipamentoId,
      req.usuario.id
    );

    return res.status(200).json({
      mensagem: "Equipamento excluído com sucesso!",
    });
  } catch (erro) {
    return res.status(404).json({
      erro: erro.message,
    });
  }
}

module.exports = {
  cadastrar,
  listar,
  atualizar,
  excluir,
};