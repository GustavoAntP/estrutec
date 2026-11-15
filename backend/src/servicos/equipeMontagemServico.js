const Projeto = require("../modelos/Projeto");
const MontagemProjeto = require("../modelos/MontagemProjeto");
const EquipeMontagem = require("../modelos/EquipeMontagem");

async function obterMontagem(projetoId, usuarioId) {
  const projeto = await Projeto.findOne({
    where: {
      id: projetoId,
      usuario_id: usuarioId,
    },
  });

  if (!projeto) {
    throw new Error("Projeto não encontrado.");
  }

  const montagem = await MontagemProjeto.findOne({
    where: {
      projeto_id: projetoId,
    },
  });

  if (!montagem) {
    throw new Error(
      "Configure primeiro os dados gerais da montagem."
    );
  }

  return montagem;
}

function validarDados(dados) {
  if (!dados.funcao?.trim()) {
    throw new Error("Função da equipe é obrigatória.");
  }

  const quantidadeTrabalhadores = Number(
    dados.quantidadeTrabalhadores
  );

  const quantidadeDias = Number(
    dados.quantidadeDias
  );

  const custoDiarioPorTrabalhador = Number(
    dados.custoDiarioPorTrabalhador
  );

  if (
    !Number.isInteger(quantidadeTrabalhadores) ||
    quantidadeTrabalhadores <= 0
  ) {
    throw new Error(
      "Quantidade de trabalhadores inválida."
    );
  }

  if (
    !Number.isFinite(quantidadeDias) ||
    quantidadeDias <= 0
  ) {
    throw new Error(
      "Quantidade de dias inválida."
    );
  }

  if (
    !Number.isFinite(custoDiarioPorTrabalhador) ||
    custoDiarioPorTrabalhador < 0
  ) {
    throw new Error(
      "Custo diário por trabalhador inválido."
    );
  }

  return {
    funcao: dados.funcao.trim(),

    quantidade_trabalhadores:
      quantidadeTrabalhadores,

    quantidade_dias:
      quantidadeDias,

    custo_diario_por_trabalhador:
      custoDiarioPorTrabalhador,

    observacoes:
      dados.observacoes?.trim() || null,
  };
}

async function cadastrar(
  projetoId,
  usuarioId,
  dados
) {
  const montagem = await obterMontagem(
    projetoId,
    usuarioId
  );

  const dadosValidados = validarDados(dados);

  return EquipeMontagem.create({
    montagem_id: montagem.id,
    ...dadosValidados,
  });
}

async function listar(projetoId, usuarioId) {
  const montagem = await obterMontagem(
    projetoId,
    usuarioId
  );

  return EquipeMontagem.findAll({
    where: {
      montagem_id: montagem.id,
    },
    order: [["id", "ASC"]],
  });
}

async function atualizar(
  projetoId,
  equipeId,
  usuarioId,
  dados
) {
  const montagem = await obterMontagem(
    projetoId,
    usuarioId
  );

  const equipe = await EquipeMontagem.findOne({
    where: {
      id: equipeId,
      montagem_id: montagem.id,
    },
  });

  if (!equipe) {
    throw new Error(
      "Registro de equipe não encontrado."
    );
  }

  const dadosCompletos = {
    funcao:
      dados.funcao ?? equipe.funcao,

    quantidadeTrabalhadores:
      dados.quantidadeTrabalhadores ??
      equipe.quantidade_trabalhadores,

    quantidadeDias:
      dados.quantidadeDias ??
      equipe.quantidade_dias,

    custoDiarioPorTrabalhador:
      dados.custoDiarioPorTrabalhador ??
      equipe.custo_diario_por_trabalhador,

    observacoes:
      dados.observacoes !== undefined
        ? dados.observacoes
        : equipe.observacoes,
  };

  const dadosValidados =
    validarDados(dadosCompletos);

  await equipe.update(dadosValidados);

  return equipe;
}

async function excluir(
  projetoId,
  equipeId,
  usuarioId
) {
  const montagem = await obterMontagem(
    projetoId,
    usuarioId
  );

  const equipe = await EquipeMontagem.findOne({
    where: {
      id: equipeId,
      montagem_id: montagem.id,
    },
  });

  if (!equipe) {
    throw new Error(
      "Registro de equipe não encontrado."
    );
  }

  await equipe.destroy();
}

module.exports = {
  cadastrar,
  listar,
  atualizar,
  excluir,
};