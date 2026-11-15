const Projeto = require("../modelos/Projeto");
const MontagemProjeto = require("../modelos/MontagemProjeto");
const EquipamentoMontagem = require("../modelos/EquipamentoMontagem");

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
  if (!dados.nome?.trim()) {
    throw new Error("Nome do equipamento é obrigatório.");
  }

  const quantidade = Number(dados.quantidade);
  const tempoUso = Number(dados.tempoUso);
  const valorUnitario = Number(dados.valorUnitario);

  const tipoCobranca = String(
    dados.tipoCobranca || ""
  ).toUpperCase();

  if (
    !Number.isInteger(quantidade) ||
    quantidade <= 0
  ) {
    throw new Error("Quantidade inválida.");
  }

  if (
    !["HORA", "DIA"].includes(tipoCobranca)
  ) {
    throw new Error(
      "Tipo de cobrança deve ser HORA ou DIA."
    );
  }

  if (
    !Number.isFinite(tempoUso) ||
    tempoUso <= 0
  ) {
    throw new Error("Tempo de uso inválido.");
  }

  if (
    !Number.isFinite(valorUnitario) ||
    valorUnitario < 0
  ) {
    throw new Error("Valor unitário inválido.");
  }

  const mobilizacao = Number(
    dados.custoMobilizacao ?? 0
  );

  const desmobilizacao = Number(
    dados.custoDesmobilizacao ?? 0
  );

  if (
    !Number.isFinite(mobilizacao) ||
    mobilizacao < 0 ||
    !Number.isFinite(desmobilizacao) ||
    desmobilizacao < 0
  ) {
    throw new Error(
      "Custos de mobilização ou desmobilização inválidos."
    );
  }

  return {
    nome: dados.nome.trim(),
    quantidade,
    tipo_cobranca: tipoCobranca,
    tempo_uso: tempoUso,
    valor_unitario: valorUnitario,
    custo_mobilizacao: mobilizacao,
    custo_desmobilizacao: desmobilizacao,
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

  return EquipamentoMontagem.create({
    montagem_id: montagem.id,
    ...dadosValidados,
  });
}

async function listar(projetoId, usuarioId) {
  const montagem = await obterMontagem(
    projetoId,
    usuarioId
  );

  return EquipamentoMontagem.findAll({
    where: {
      montagem_id: montagem.id,
    },
    order: [["id", "ASC"]],
  });
}

async function atualizar(
  projetoId,
  equipamentoId,
  usuarioId,
  dados
) {
  const montagem = await obterMontagem(
    projetoId,
    usuarioId
  );

  const equipamento =
    await EquipamentoMontagem.findOne({
      where: {
        id: equipamentoId,
        montagem_id: montagem.id,
      },
    });

  if (!equipamento) {
    throw new Error("Equipamento não encontrado.");
  }

  const dadosCompletos = {
    nome: dados.nome ?? equipamento.nome,
    quantidade:
      dados.quantidade ?? equipamento.quantidade,
    tipoCobranca:
      dados.tipoCobranca ??
      equipamento.tipo_cobranca,
    tempoUso:
      dados.tempoUso ?? equipamento.tempo_uso,
    valorUnitario:
      dados.valorUnitario ??
      equipamento.valor_unitario,
    custoMobilizacao:
      dados.custoMobilizacao ??
      equipamento.custo_mobilizacao,
    custoDesmobilizacao:
      dados.custoDesmobilizacao ??
      equipamento.custo_desmobilizacao,
    observacoes:
      dados.observacoes !== undefined
        ? dados.observacoes
        : equipamento.observacoes,
  };

  const dadosValidados =
    validarDados(dadosCompletos);

  await equipamento.update(dadosValidados);

  return equipamento;
}

async function excluir(
  projetoId,
  equipamentoId,
  usuarioId
) {
  const montagem = await obterMontagem(
    projetoId,
    usuarioId
  );

  const equipamento =
    await EquipamentoMontagem.findOne({
      where: {
        id: equipamentoId,
        montagem_id: montagem.id,
      },
    });

  if (!equipamento) {
    throw new Error("Equipamento não encontrado.");
  }

  await equipamento.destroy();
}

module.exports = {
  cadastrar,
  listar,
  atualizar,
  excluir,
};