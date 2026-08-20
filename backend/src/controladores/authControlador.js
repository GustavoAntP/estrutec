const authServico = require("../servicos/authServico");

async function login(req, res) {
  try {
    const { identificador, senha } = req.body;

    const resultado = await authServico.login(
      identificador,
      senha
    );

    return res.status(200).json({
      mensagem: "Login realizado com sucesso!",
      ...resultado,
    });
  } catch (erro) {
    return res.status(401).json({
      erro: erro.message,
    });
  }
}

module.exports = {
  login,
};