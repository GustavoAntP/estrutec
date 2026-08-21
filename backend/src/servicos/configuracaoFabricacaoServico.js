const Projeto = require("../modelos/Projeto");
const ConfiguracaoFabricacao = require(
  "../modelos/ConfiguracaoFabricacao"
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

async function salvarConfiguracao(
  projetoId,
  usuarioId,
  dados
) {
  await verificarProjeto(projetoId, usuarioId);

  const {
    fckMpa,
    taxaArmaduraKgM3,
    desperdicioPercentual,
    consumoCimentoKgM3,
    consumoAreiaM3M3,
    consumoBritaM3M3,
    consumoAguaLM3,
    neopreneM2PorViga,
  } = dados;

  const fck = Number(fckMpa);
  const taxaArmadura = Number(taxaArmaduraKgM3);
  const desperdicio = Number(desperdicioPercentual ?? 0);
  const cimento = Number(consumoCimentoKgM3);
  const areia = Number(consumoAreiaM3M3);
  const brita = Number(consumoBritaM3M3);
  const agua = Number(consumoAguaLM3);

  if (!Number.isFinite(fck) || fck <= 0) {
    throw new Error("FCK inválido.");
  }

  if (
    !Number.isFinite(taxaArmadura) ||
    taxaArmadura < 0
  ) {
    throw new Error("Taxa de armadura inválida.");
  }

  if (
    !Number.isFinite(desperdicio) ||
    desperdicio < 0 ||
    desperdicio > 100
  ) {
    throw new Error(
      "Percentual de desperdício deve estar entre 0 e 100."
    );
  }

  if (!Number.isFinite(cimento) || cimento <= 0) {
    throw new Error("Consumo de cimento inválido.");
  }

  if (!Number.isFinite(areia) || areia <= 0) {
    throw new Error("Consumo de areia inválido.");
  }

  if (!Number.isFinite(brita) || brita <= 0) {
    throw new Error("Consumo de brita inválido.");
  }

  if (!Number.isFinite(agua) || agua <= 0) {
    throw new Error("Consumo de água inválido.");
  }

  let neoprene = null;

  if (
    neopreneM2PorViga !== undefined &&
    neopreneM2PorViga !== null &&
    neopreneM2PorViga !== ""
  ) {
    neoprene = Number(neopreneM2PorViga);

    if (!Number.isFinite(neoprene) || neoprene < 0) {
      throw new Error("Quantidade de neoprene inválida.");
    }
  }

  const dadosConfiguracao = {
    projeto_id: projetoId,
    fck_mpa: fck,
    taxa_armadura_kg_m3: taxaArmadura,
    desperdicio_percentual: desperdicio,
    consumo_cimento_kg_m3: cimento,
    consumo_areia_m3_m3: areia,
    consumo_brita_m3_m3: brita,
    consumo_agua_l_m3: agua,
    neoprene_m2_por_viga: neoprene,
  };

  let configuracao = await ConfiguracaoFabricacao.findOne({
    where: {
      projeto_id: projetoId,
    },
  });

  if (configuracao) {
    await configuracao.update(dadosConfiguracao);
  } else {
    configuracao = await ConfiguracaoFabricacao.create(
      dadosConfiguracao
    );
  }

  return configuracao;
}

async function buscarConfiguracao(projetoId, usuarioId) {
  await verificarProjeto(projetoId, usuarioId);

  const configuracao = await ConfiguracaoFabricacao.findOne({
    where: {
      projeto_id: projetoId,
    },
  });

  if (!configuracao) {
    throw new Error(
      "Configuração de fabricação ainda não cadastrada."
    );
  }

  return configuracao;
}

module.exports = {
  salvarConfiguracao,
  buscarConfiguracao,
};