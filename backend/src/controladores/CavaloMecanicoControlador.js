const CavaloMecanicoServico =
  require(
    "../servicos/CavaloMecanicoServico"
  );

async function listarCavalosMecanicos(
  req,
  res
) {
  try {
    const cavalos =
      await CavaloMecanicoServico
        .listarCavalosMecanicos();

    return res.json({
      cavalos,
    });
  } catch (erro) {
    return res.status(400).json({
      erro:
        erro.message ||
        "Não foi possível listar os cavalos mecânicos.",
    });
  }
}

async function criarCavaloMecanico(
  req,
  res
) {
  try {
    const cavalo =
      await CavaloMecanicoServico
        .criarCavaloMecanico(
          req.body
        );

    return res.status(201).json({
      mensagem:
        "Cavalo mecânico cadastrado com sucesso!",
      cavalo,
    });
  } catch (erro) {
    return res.status(400).json({
      erro:
        erro.message ||
        "Não foi possível cadastrar o cavalo mecânico.",
    });
  }
}

async function atualizarCavaloMecanico(
  req,
  res
) {
  try {
    const cavalo =
      await CavaloMecanicoServico
        .atualizarCavaloMecanico(
          req.params.id,
          req.body
        );

    return res.json({
      mensagem:
        "Cavalo mecânico atualizado com sucesso!",
      cavalo,
    });
  } catch (erro) {
    return res.status(400).json({
      erro:
        erro.message ||
        "Não foi possível atualizar o cavalo mecânico.",
    });
  }
}

async function alterarStatusCavaloMecanico(
  req,
  res
) {
  try {
    const cavalo =
      await CavaloMecanicoServico
        .alterarStatusCavaloMecanico(
          req.params.id,
          req.body.ativo
        );

    return res.json({
      mensagem:
        cavalo.ativo
          ? "Cavalo mecânico ativado com sucesso!"
          : "Cavalo mecânico desativado com sucesso!",

      cavalo,
    });
  } catch (erro) {
    return res.status(400).json({
      erro:
        erro.message ||
        "Não foi possível alterar o status do cavalo mecânico.",
    });
  }
}

module.exports = {
  listarCavalosMecanicos,
  criarCavaloMecanico,
  atualizarCavaloMecanico,
  alterarStatusCavaloMecanico,
};