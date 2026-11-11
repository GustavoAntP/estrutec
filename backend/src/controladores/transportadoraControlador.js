const transportadoraServico = require(
  "../servicos/transportadoraServico"
);

async function listar(req, res) {
  try {
    const transportadoras =
      await transportadoraServico.listarTransportadoras();

    return res.json({
      transportadoras,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function cadastrar(req, res) {
  try {
    const transportadora =
      await transportadoraServico.cadastrarTransportadora(
        req.body
      );

    return res.status(201).json({
      mensagem: "Transportadora cadastrada com sucesso.",
      transportadora,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function editar(req, res) {
  try {
    const transportadora =
      await transportadoraServico.editarTransportadora(
        req.params.id,
        req.body
      );

    return res.json({
      mensagem: "Transportadora atualizada com sucesso.",
      transportadora,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function alterarStatus(req, res) {
  try {
    const transportadora =
      await transportadoraServico.alterarStatusTransportadora(
        req.params.id,
        req.body.ativo
      );

    return res.json({
      mensagem: transportadora.ativo
        ? "Transportadora ativada com sucesso."
        : "Transportadora desativada com sucesso.",
      transportadora,
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