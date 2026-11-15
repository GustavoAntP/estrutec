const CavaloMecanico =
  require("../modelos/CavaloMecanico");

async function listarCavalosMecanicos() {
  const cavalos =
    await CavaloMecanico.findAll({
      order: [
        ["ativo", "DESC"],
        ["nome", "ASC"],
      ],
    });

  return cavalos;
}

async function criarCavaloMecanico(dados) {
  const nome =
    String(dados.nome || "").trim();

  const placa =
    dados.placa
      ? String(dados.placa)
          .trim()
          .toUpperCase()
      : null;

  const marca =
    dados.marca
      ? String(dados.marca).trim()
      : null;

  const modelo =
    dados.modelo
      ? String(dados.modelo).trim()
      : null;

  const consumoCarregado =
    Number(
      dados.consumo_carregado_km_l
    );

  const consumoVazio =
    Number(
      dados.consumo_vazio_km_l
    );

  const observacoes =
    dados.observacoes
      ? String(dados.observacoes).trim()
      : null;

  if (!nome) {
    throw new Error(
      "Informe o nome do cavalo mecânico."
    );
  }

  if (
    !Number.isFinite(consumoCarregado) ||
    consumoCarregado <= 0
  ) {
    throw new Error(
      "Informe um consumo carregado válido."
    );
  }

  if (
    !Number.isFinite(consumoVazio) ||
    consumoVazio <= 0
  ) {
    throw new Error(
      "Informe um consumo vazio válido."
    );
  }

  if (placa) {
    const existente =
      await CavaloMecanico.findOne({
        where: {
          placa,
        },
      });

    if (existente) {
      throw new Error(
        "Já existe um cavalo mecânico cadastrado com esta placa."
      );
    }
  }

  const cavalo =
    await CavaloMecanico.create({
      nome,
      placa,
      marca,
      modelo,

      consumo_carregado_km_l:
        consumoCarregado,

      consumo_vazio_km_l:
        consumoVazio,

      observacoes,

      ativo: true,
    });

  return cavalo;
}

async function atualizarCavaloMecanico(
  cavaloId,
  dados
) {
  const cavalo =
    await CavaloMecanico.findByPk(
      cavaloId
    );

  if (!cavalo) {
    throw new Error(
      "Cavalo mecânico não encontrado."
    );
  }

  const nome =
    dados.nome !== undefined
      ? String(dados.nome).trim()
      : cavalo.nome;

  const placa =
    dados.placa !== undefined
      ? dados.placa
        ? String(dados.placa)
            .trim()
            .toUpperCase()
        : null
      : cavalo.placa;

  const marca =
    dados.marca !== undefined
      ? dados.marca
        ? String(dados.marca).trim()
        : null
      : cavalo.marca;

  const modelo =
    dados.modelo !== undefined
      ? dados.modelo
        ? String(dados.modelo).trim()
        : null
      : cavalo.modelo;

  const consumoCarregado =
    dados.consumo_carregado_km_l !==
    undefined
      ? Number(
          dados.consumo_carregado_km_l
        )
      : Number(
          cavalo.consumo_carregado_km_l
        );

  const consumoVazio =
    dados.consumo_vazio_km_l !==
    undefined
      ? Number(
          dados.consumo_vazio_km_l
        )
      : Number(
          cavalo.consumo_vazio_km_l
        );

  const observacoes =
    dados.observacoes !== undefined
      ? dados.observacoes
        ? String(
            dados.observacoes
          ).trim()
        : null
      : cavalo.observacoes;

  if (!nome) {
    throw new Error(
      "Informe o nome do cavalo mecânico."
    );
  }

  if (
    !Number.isFinite(consumoCarregado) ||
    consumoCarregado <= 0
  ) {
    throw new Error(
      "Informe um consumo carregado válido."
    );
  }

  if (
    !Number.isFinite(consumoVazio) ||
    consumoVazio <= 0
  ) {
    throw new Error(
      "Informe um consumo vazio válido."
    );
  }

  if (
    placa &&
    placa !== cavalo.placa
  ) {
    const existente =
      await CavaloMecanico.findOne({
        where: {
          placa,
        },
      });

    if (existente) {
      throw new Error(
        "Já existe um cavalo mecânico cadastrado com esta placa."
      );
    }
  }

  await cavalo.update({
    nome,
    placa,
    marca,
    modelo,

    consumo_carregado_km_l:
      consumoCarregado,

    consumo_vazio_km_l:
      consumoVazio,

    observacoes,
  });

  return cavalo;
}

async function alterarStatusCavaloMecanico(
  cavaloId,
  ativo
) {
  const cavalo =
    await CavaloMecanico.findByPk(
      cavaloId
    );

  if (!cavalo) {
    throw new Error(
      "Cavalo mecânico não encontrado."
    );
  }

  if (typeof ativo !== "boolean") {
    throw new Error(
      "Status inválido."
    );
  }

  await cavalo.update({
    ativo,
  });

  return cavalo;
}

module.exports = {
  listarCavalosMecanicos,
  criarCavaloMecanico,
  atualizarCavaloMecanico,
  alterarStatusCavaloMecanico,
};