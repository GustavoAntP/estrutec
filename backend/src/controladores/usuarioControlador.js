const usuarioServico = require("../servicos/usuarioServico");

async function cadastrar(req, res) {
  try {
    const usuario = await usuarioServico.cadastrarUsuario(req.body);

    return res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso!",
      usuario,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function listar(req, res) {
  try {
    const usuarios =
      await usuarioServico.listarUsuarios();

    return res.status(200).json({
      usuarios,
    });
  } catch (erro) {
    console.error(
      "ERRO AO LISTAR USUÁRIOS:",
      erro
    );

    return res.status(500).json({
      erro: erro.message,
    });
  }
}

async function editar(req, res) {
  try {
    const usuario =
      await usuarioServico.editarUsuario(
        req.params.id,
        req.body
      );

    return res.status(200).json({
      mensagem:
        "Usuário atualizado com sucesso!",
      usuario,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function alterarStatus(req, res) {
  try {
    const usuario =
      await usuarioServico.alterarStatusUsuario(
        req.params.id,
        req.body.ativo,
        req.usuario.id
      );

    return res.status(200).json({
      mensagem:
        usuario.ativo
          ? "Usuário ativado com sucesso!"
          : "Usuário desativado com sucesso!",
      usuario,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

module.exports = {
  cadastrar,
  listar,
  editar,
  alterarStatus,
};