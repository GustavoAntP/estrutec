const ConfiguracaoFabricacaoPadrao = require(
  "../modelos/ConfiguracaoFabricacaoPadrao"
);

async function buscarConfiguracaoPadrao() {
  let configuracao =
    await ConfiguracaoFabricacaoPadrao.findOne({
      order: [["id", "ASC"]],
    });

  if (!configuracao) {
    configuracao =
      await ConfiguracaoFabricacaoPadrao.create({});
  }

  return configuracao;
}

async function salvarConfiguracaoPadrao(dados) {
  const campos = {
    fck_mpa: Number(
      dados.fckMpa ?? 0
    ),

    taxa_armadura_kg_m3: Number(
      dados.taxaArmaduraKgM3 ?? 0
    ),

    consumo_cimento_kg_m3: Number(
      dados.consumoCimentoKgM3 ?? 0
    ),

    consumo_areia_m3_m3: Number(
      dados.consumoAreiaM3M3 ?? 0
    ),

    consumo_brita_m3_m3: Number(
      dados.consumoBritaM3M3 ?? 0
    ),

    consumo_agua_l_m3: Number(
      dados.consumoAguaLM3 ?? 0
    ),

    neoprene_m2_por_viga: Number(
      dados.neopreneM2PorViga ?? 0
    ),

    preco_cimento_rs_kg: Number(
      dados.precoCimentoRsKg ?? 0
    ),

    preco_areia_rs_m3: Number(
      dados.precoAreiaRsM3 ?? 0
    ),

    preco_brita_rs_m3: Number(
      dados.precoBritaRsM3 ?? 0
    ),

    preco_agua_rs_l: Number(
      dados.precoAguaRsL ?? 0
    ),

    preco_aco_rs_kg: Number(
      dados.precoAcoRsKg ?? 0
    ),

    preco_neoprene_rs_m2: Number(
      dados.precoNeopreneRsM2 ?? 0
    ),
  };

  for (const valor of Object.values(campos)) {
    if (
      !Number.isFinite(valor) ||
      valor < 0
    ) {
      throw new Error(
        "Os valores informados devem ser números válidos e não negativos."
      );
    }
  }

  let configuracao =
    await ConfiguracaoFabricacaoPadrao.findOne({
      order: [["id", "ASC"]],
    });

  if (configuracao) {
    await configuracao.update(campos);
  } else {
    configuracao =
      await ConfiguracaoFabricacaoPadrao.create(
        campos
      );
  }

  return configuracao;
}

module.exports = {
  buscarConfiguracaoPadrao,
  salvarConfiguracaoPadrao,
};