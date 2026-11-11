const equipamentoServico = require(
  "../servicos/equipamentoServico"
);

async function listar(req, res) {
  try {
    const equipamentos =
      await equipamentoServico.listarEquipamentos();

    return res.json({
      equipamentos,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function cadastrar(req, res) {
  try {
    const equipamento =
      await equipamentoServico.cadastrarEquipamento(
        req.body
      );

    return res.status(201).json({
      mensagem:
        "Equipamento cadastrado com sucesso.",
      equipamento,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function editar(req, res) {
  try {
    const equipamento =
      await equipamentoServico.editarEquipamento(
        req.params.id,
        req.body
      );

    return res.json({
      mensagem:
        "Equipamento atualizado com sucesso.",
      equipamento,
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
    const equipamento =
      await equipamentoServico.alterarStatusEquipamento(
        req.params.id,
        req.body.ativo
      );

    return res.json({
      mensagem: equipamento.ativo
        ? "Equipamento ativado com sucesso."
        : "Equipamento desativado com sucesso.",

      equipamento,
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