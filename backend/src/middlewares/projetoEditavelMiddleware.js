const Projeto = require("../modelos/Projeto");

async function verificarProjetoEditavel(
  req,
  res,
  next
) {
  try {
    const projeto = await Projeto.findOne({
      where: {
        id: req.params.id,
        usuario_id: req.usuario.id,
      },
    });

    if (!projeto) {
      return res.status(404).json({
        erro: "Projeto não encontrado.",
      });
    }

    if (projeto.status === "FINALIZADO") {
      return res.status(409).json({
        erro:
          "Este projeto está finalizado e não pode ser alterado. Reabra o projeto antes de realizar modificações.",
      });
    }

    req.projeto = projeto;

    return next();
  } catch (erro) {
    return res.status(500).json({
      erro:
        "Erro ao verificar situação do projeto.",
    });
  }
}

module.exports = verificarProjetoEditavel;