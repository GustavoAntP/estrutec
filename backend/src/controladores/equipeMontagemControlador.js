const equipeMontagemServico = require(
  "../servicos/equipeMontagemServico"
);

async function cadastrar(req, res) {
  try {
    const equipe =
      await equipeMontagemServico.cadastrar(
        req.params.id,
        req.usuario.id,
        req.body
      );

    return res.status(201).json({
      mensagem:
        "Equipe cadastrada com sucesso!",
      equipe,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function listar(req, res) {
  try {
    const equipes =
      await equipeMontagemServico.listar(
        req.params.id,
        req.usuario.id
      );

    return res.status(200).json({
      equipes,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function atualizar(req, res) {
  try {
    const equipe =
      await equipeMontagemServico.atualizar(
        req.params.id,
        req.params.equipeId,
        req.usuario.id,
        req.body
      );

    return res.status(200).json({
      mensagem:
        "Equipe atualizada com sucesso!",
      equipe,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function excluir(req, res) {
  try {
    await equipeMontagemServico.excluir(
      req.params.id,
      req.params.equipeId,
      req.usuario.id
    );

    return res.status(200).json({
      mensagem:
        "Equipe excluída com sucesso!",
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