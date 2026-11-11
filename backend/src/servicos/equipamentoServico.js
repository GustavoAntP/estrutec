const Equipamento = require(
  "../modelos/Equipamento"
);

async function cadastrarEquipamento(dados) {
  const {
    nome,
    descricao,
    tipo_cobranca,
    valor_padrao,
    mobilizacao_padrao,
    desmobilizacao_padrao,
  } = dados;

  if (!nome || !nome.trim()) {
    throw new Error(
      "Informe o nome do equipamento."
    );
  }

  const tiposPermitidos = [
    "HORA",
    "DIA",
  ];

  const tipo =
    tipo_cobranca || "DIA";

  if (
    !tiposPermitidos.includes(tipo)
  ) {
    throw new Error(
      "Tipo de cobrança inválido."
    );
  }

  return Equipamento.create({
    nome: nome.trim(),

    descricao:
      descricao?.trim() || null,

    tipo_cobranca: tipo,

    valor_padrao:
      Number(valor_padrao || 0),

    mobilizacao_padrao:
      Number(
        mobilizacao_padrao || 0
      ),

    desmobilizacao_padrao:
      Number(
        desmobilizacao_padrao || 0
      ),
  });
}

async function listarEquipamentos() {
  return Equipamento.findAll({
    order: [["nome", "ASC"]],
  });
}

async function editarEquipamento(
  id,
  dados
) {
  const equipamento =
    await Equipamento.findByPk(id);

  if (!equipamento) {
    throw new Error(
      "Equipamento não encontrado."
    );
  }

  const {
    nome,
    descricao,
    tipo_cobranca,
    valor_padrao,
    mobilizacao_padrao,
    desmobilizacao_padrao,
  } = dados;

  if (!nome || !nome.trim()) {
    throw new Error(
      "Informe o nome do equipamento."
    );
  }

  const tiposPermitidos = [
    "HORA",
    "DIA",
  ];

  if (
    tipo_cobranca &&
    !tiposPermitidos.includes(
      tipo_cobranca
    )
  ) {
    throw new Error(
      "Tipo de cobrança inválido."
    );
  }

  await equipamento.update({
    nome: nome.trim(),

    descricao:
      descricao?.trim() || null,

    tipo_cobranca:
      tipo_cobranca ||
      equipamento.tipo_cobranca,

    valor_padrao:
      Number(valor_padrao || 0),

    mobilizacao_padrao:
      Number(
        mobilizacao_padrao || 0
      ),

    desmobilizacao_padrao:
      Number(
        desmobilizacao_padrao || 0
      ),
  });

  return equipamento;
}

async function alterarStatusEquipamento(
  id,
  ativo
) {
  const equipamento =
    await Equipamento.findByPk(id);

  if (!equipamento) {
    throw new Error(
      "Equipamento não encontrado."
    );
  }

  await equipamento.update({
    ativo: Boolean(ativo),
  });

  return equipamento;
}

module.exports = {
  cadastrarEquipamento,
  listarEquipamentos,
  editarEquipamento,
  alterarStatusEquipamento,
};