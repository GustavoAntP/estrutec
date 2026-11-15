const Carreta =
  require("../modelos/Carreta");

async function listarCarretas() {
  const carretas =
    await Carreta.findAll({
      order: [
        ["ativo", "DESC"],
        ["nome", "ASC"],
      ],
    });

  return carretas;
}

async function criarCarreta(dados) {
  const nome =
    String(dados.nome || "").trim();

  const placa =
    dados.placa
      ? String(dados.placa)
          .trim()
          .toUpperCase()
      : null;

  const tipo =
    dados.tipo
      ? String(dados.tipo).trim()
      : null;

  const capacidadePeso =
    Number(
      dados.capacidade_peso_kg
    );

  const capacidadePecas =
    Number(
      dados.capacidade_pecas
    );

  const observacoes =
    dados.observacoes
      ? String(dados.observacoes).trim()
      : null;

  if (!nome) {
    throw new Error(
      "Informe o nome da carreta."
    );
  }

  if (
    !Number.isFinite(
      capacidadePeso
    ) ||
    capacidadePeso <= 0
  ) {
    throw new Error(
      "Informe uma capacidade de peso válida."
    );
  }

  if (
    !Number.isInteger(
      capacidadePecas
    ) ||
    capacidadePecas <= 0
  ) {
    throw new Error(
      "Informe uma capacidade de peças válida."
    );
  }

  if (placa) {
    const existente =
      await Carreta.findOne({
        where: {
          placa,
        },
      });

    if (existente) {
      throw new Error(
        "Já existe uma carreta cadastrada com esta placa."
      );
    }
  }

  const carreta =
    await Carreta.create({
      nome,
      placa,
      tipo,

      capacidade_peso_kg:
        capacidadePeso,

      capacidade_pecas:
        capacidadePecas,

      observacoes,
      ativo: true,
    });

  return carreta;
}

async function atualizarCarreta(
  carretaId,
  dados
) {
  const carreta =
    await Carreta.findByPk(
      carretaId
    );

  if (!carreta) {
    throw new Error(
      "Carreta não encontrada."
    );
  }

  const nome =
    dados.nome !== undefined
      ? String(dados.nome).trim()
      : carreta.nome;

  const placa =
    dados.placa !== undefined
      ? dados.placa
        ? String(dados.placa)
            .trim()
            .toUpperCase()
        : null
      : carreta.placa;

  const tipo =
    dados.tipo !== undefined
      ? dados.tipo
        ? String(dados.tipo).trim()
        : null
      : carreta.tipo;

  const capacidadePeso =
    dados.capacidade_peso_kg !==
    undefined
      ? Number(
          dados.capacidade_peso_kg
        )
      : Number(
          carreta.capacidade_peso_kg
        );

  const capacidadePecas =
    dados.capacidade_pecas !==
    undefined
      ? Number(
          dados.capacidade_pecas
        )
      : Number(
          carreta.capacidade_pecas
        );

  const observacoes =
    dados.observacoes !== undefined
      ? dados.observacoes
        ? String(
            dados.observacoes
          ).trim()
        : null
      : carreta.observacoes;

  if (!nome) {
    throw new Error(
      "Informe o nome da carreta."
    );
  }

  if (
    !Number.isFinite(
      capacidadePeso
    ) ||
    capacidadePeso <= 0
  ) {
    throw new Error(
      "Informe uma capacidade de peso válida."
    );
  }

  if (
    !Number.isInteger(
      capacidadePecas
    ) ||
    capacidadePecas <= 0
  ) {
    throw new Error(
      "Informe uma capacidade de peças válida."
    );
  }

  if (
    placa &&
    placa !== carreta.placa
  ) {
    const existente =
      await Carreta.findOne({
        where: {
          placa,
        },
      });

    if (existente) {
      throw new Error(
        "Já existe uma carreta cadastrada com esta placa."
      );
    }
  }

  await carreta.update({
    nome,
    placa,
    tipo,

    capacidade_peso_kg:
      capacidadePeso,

    capacidade_pecas:
      capacidadePecas,

    observacoes,
  });

  return carreta;
}

async function alterarStatusCarreta(
  carretaId,
  ativo
) {
  const carreta =
    await Carreta.findByPk(
      carretaId
    );

  if (!carreta) {
    throw new Error(
      "Carreta não encontrada."
    );
  }

  if (typeof ativo !== "boolean") {
    throw new Error(
      "Status inválido."
    );
  }

  await carreta.update({
    ativo,
  });

  return carreta;
}

module.exports = {
  listarCarretas,
  criarCarreta,
  atualizarCarreta,
  alterarStatusCarreta,
};