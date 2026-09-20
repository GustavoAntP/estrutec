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

module.exports = {
  cadastrar,
};