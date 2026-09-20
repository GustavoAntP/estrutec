const projetoServico = require("../servicos/projetoServico");

async function cadastrar(req, res) {
  try {
    const projeto = await projetoServico.cadastrarProjeto(
      req.body,
      req.usuario.id
    );

    return res.status(201).json({
      mensagem: "Projeto cadastrado com sucesso!",
      projeto,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function listar(req, res) {
  try {
    const projetos = await projetoServico.listarProjetos(
      req.usuario.id
    );

    return res.status(200).json({
      projetos,
    });
  } catch (erro) {
    return res.status(500).json({
      erro: erro.message,
    });
  }
}

async function buscarPorId(req, res) {
  try {
    const projeto = await projetoServico.buscarProjetoPorId(
      req.params.id,
      req.usuario.id
    );

    return res.status(200).json({
      projeto,
    });
  } catch (erro) {
    return res.status(404).json({
      erro: erro.message,
    });
  }
}

async function atualizar(req, res) {
  try {
    const projeto = await projetoServico.atualizarProjeto(
      req.params.id,
      req.body,
      req.usuario.id
    );

    return res.status(200).json({
      mensagem: "Projeto atualizado com sucesso!",
      projeto,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function excluir(req, res) {
  try {
    await projetoServico.excluirProjeto(
      req.params.id,
      req.usuario.id
    );

    return res.status(200).json({
      mensagem: "Projeto excluído com sucesso!",
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
  buscarPorId,
  atualizar,
  excluir,
};