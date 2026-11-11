const Equipe = require(
  "../modelos/Equipe"
);

async function cadastrarEquipe(dados) {
  const {
    nome,
    descricao,
    quantidade_padrao,
    custo_diario_padrao,
  } = dados;

  if (!nome || !nome.trim()) {
    throw new Error(
      "Informe o nome da equipe."
    );
  }

  const quantidade =
    Number(quantidade_padrao || 1);

  if (quantidade < 1) {
    throw new Error(
      "A quantidade padrão deve ser maior que zero."
    );
  }

  return Equipe.create({
    nome: nome.trim(),

    descricao:
      descricao?.trim() || null,

    quantidade_padrao:
      quantidade,

    custo_diario_padrao:
      Number(
        custo_diario_padrao || 0
      ),
  });
}

async function listarEquipes() {
  return Equipe.findAll({
    order: [["nome", "ASC"]],
  });
}

async function editarEquipe(
  id,
  dados
) {
  const equipe =
    await Equipe.findByPk(id);

  if (!equipe) {
    throw new Error(
      "Equipe não encontrada."
    );
  }

  const {
    nome,
    descricao,
    quantidade_padrao,
    custo_diario_padrao,
  } = dados;

  if (!nome || !nome.trim()) {
    throw new Error(
      "Informe o nome da equipe."
    );
  }

  const quantidade =
    Number(quantidade_padrao || 1);

  if (quantidade < 1) {
    throw new Error(
      "A quantidade padrão deve ser maior que zero."
    );
  }

  await equipe.update({
    nome: nome.trim(),

    descricao:
      descricao?.trim() || null,

    quantidade_padrao:
      quantidade,

    custo_diario_padrao:
      Number(
        custo_diario_padrao || 0
      ),
  });

  return equipe;
}

async function alterarStatusEquipe(
  id,
  ativo
) {
  const equipe =
    await Equipe.findByPk(id);

  if (!equipe) {
    throw new Error(
      "Equipe não encontrada."
    );
  }

  await equipe.update({
    ativo: Boolean(ativo),
  });

  return equipe;
}

module.exports = {
  cadastrarEquipe,
  listarEquipes,
  editarEquipe,
  alterarStatusEquipe,
};