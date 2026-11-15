const equipeServico = require(
  "../servicos/equipeServico"
);

async function listar(req, res) {
  try {
    const equipes =
      await equipeServico.listarEquipes();

    return res.json({
      equipes,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function cadastrar(req, res) {
  try {
    const equipe =
      await equipeServico.cadastrarEquipe(
        req.body
      );

    return res.status(201).json({
      mensagem:
        "Equipe cadastrada com sucesso.",
      equipe,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function editar(req, res) {
  try {
    const equipe =
      await equipeServico.editarEquipe(
        req.params.id,
        req.body
      );

    return res.json({
      mensagem:
        "Equipe atualizada com sucesso.",
      equipe,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function alterarStatus(
  req,
  res
) {
  try {
    const equipe =
      await equipeServico.alterarStatusEquipe(
        req.params.id,
        req.body.ativo
      );

    return res.json({
      mensagem: equipe.ativo
        ? "Equipe ativada com sucesso."
        : "Equipe desativada com sucesso.",

      equipe,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

module.exports = {
  listar,
  cadastrar,
  editar,
  alterarStatus,
};