const Projeto = require("../modelos/Projeto");
const PrecoFabricacao = require(
  "../modelos/PrecoFabricacao"
);

async function verificarProjeto(projetoId, usuarioId) {
  const projeto = await Projeto.findOne({
    where: {
      id: projetoId,
      usuario_id: usuarioId,
    },
  });

  if (!projeto) {
    throw new Error("Projeto não encontrado.");
  }

  return projeto;
}

async function salvarPrecos(
  projetoId,
  usuarioId,
  dados
) {
  await verificarProjeto(projetoId, usuarioId);

  const campos = {
    preco_cimento_kg: Number(dados.precoCimentoKg),
    preco_areia_m3: Number(dados.precoAreiaM3),
    preco_brita_m3: Number(dados.precoBritaM3),
    preco_agua_l: Number(dados.precoAguaL),
    preco_aco_kg: Number(dados.precoAcoKg),
    preco_neoprene_m2: Number(dados.precoNeopreneM2),
  };

  for (const valor of Object.values(campos)) {
    if (!Number.isFinite(valor) || valor < 0) {
      throw new Error(
        "Todos os preços devem possuir valores válidos."
      );
    }
  }

  let precos = await PrecoFabricacao.findOne({
    where: {
      projeto_id: projetoId,
    },
  });

  if (precos) {
    await precos.update(campos);
  } else {
    precos = await PrecoFabricacao.create({
      projeto_id: projetoId,
      ...campos,
    });
  }

  return precos;
}

async function buscarPrecos(projetoId, usuarioId) {
  await verificarProjeto(projetoId, usuarioId);

  const precos = await PrecoFabricacao.findOne({
    where: {
      projeto_id: projetoId,
    },
  });

  if (!precos) {
    throw new Error(
      "Preços de fabricação ainda não cadastrados."
    );
  }

  return precos;
}

module.exports = {
  salvarPrecos,
  buscarPrecos,
};