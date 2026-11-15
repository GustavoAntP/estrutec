const CarretaServico =
  require(
    "../servicos/CarretaServico"
  );

async function listarCarretas(
  req,
  res
) {
  try {
    const carretas =
      await CarretaServico
        .listarCarretas();

    return res.json({
      carretas,
    });
  } catch (erro) {
    return res.status(400).json({
      erro:
        erro.message ||
        "Não foi possível listar as carretas.",
    });
  }
}

async function criarCarreta(
  req,
  res
) {
  try {
    const carreta =
      await CarretaServico
        .criarCarreta(
          req.body
        );

    return res.status(201).json({
      mensagem:
        "Carreta cadastrada com sucesso!",
      carreta,
    });
  } catch (erro) {
    return res.status(400).json({
      erro:
        erro.message ||
        "Não foi possível cadastrar a carreta.",
    });
  }
}

async function atualizarCarreta(
  req,
  res
) {
  try {
    const carreta =
      await CarretaServico
        .atualizarCarreta(
          req.params.id,
          req.body
        );

    return res.json({
      mensagem:
        "Carreta atualizada com sucesso!",
      carreta,
    });
  } catch (erro) {
    return res.status(400).json({
      erro:
        erro.message ||
        "Não foi possível atualizar a carreta.",
    });
  }
}

async function alterarStatusCarreta(
  req,
  res
) {
  try {
    const carreta =
      await CarretaServico
        .alterarStatusCarreta(
          req.params.id,
          req.body.ativo
        );

    return res.json({
      mensagem:
        carreta.ativo
          ? "Carreta ativada com sucesso!"
          : "Carreta desativada com sucesso!",

      carreta,
    });
  } catch (erro) {
    return res.status(400).json({
      erro:
        erro.message ||
        "Não foi possível alterar o status da carreta.",
    });
  }
}

module.exports = {
  listarCarretas,
  criarCarreta,
  atualizarCarreta,
  alterarStatusCarreta,
};