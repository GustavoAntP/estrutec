const Projeto = require("../modelos/Projeto");
const LogisticaProjeto = require(
  "../modelos/LogisticaProjeto"
);
const LogisticaTerceirizada = require(
  "../modelos/LogisticaTerceirizada"
);

async function buscarLogisticaTerceirizada(
  projetoId,
  usuarioId
) {
  const projeto = await Projeto.findOne({
    where: {
      id: projetoId,
      usuario_id: usuarioId,
    },
  });

  if (!projeto) {
    throw new Error("Projeto não encontrado.");
  }

  const logistica = await LogisticaProjeto.findOne({
    where: {
      projeto_id: projetoId,
    },
  });

  if (!logistica) {
    throw new Error(
      "Logística ainda não configurada."
    );
  }

  if (logistica.tipo_frete !== "TERCEIRIZADO") {
    throw new Error(
      "O projeto não está configurado para frete terceirizado."
    );
  }

  const terceirizada =
    await LogisticaTerceirizada.findOne({
      where: {
        logistica_id: logistica.id,
      },
    });

  if (!terceirizada) {
    throw new Error(
      "Dados do frete terceirizado ainda não cadastrados."
    );
  }

  return terceirizada;
}

async function salvarLogisticaTerceirizada(
  projetoId,
  usuarioId,
  dados
) {
  const projeto = await Projeto.findOne({
    where: {
      id: projetoId,
      usuario_id: usuarioId,
    },
  });

  if (!projeto) {
    throw new Error("Projeto não encontrado.");
  }

  const logistica = await LogisticaProjeto.findOne({
    where: {
      projeto_id: projetoId,
    },
  });

  if (!logistica) {
    throw new Error(
      "Configure primeiro o tipo de logística."
    );
  }

  if (logistica.tipo_frete !== "TERCEIRIZADO") {
    throw new Error(
      "O projeto deve estar configurado como TERCEIRIZADO."
    );
  }

  if (!dados.empresa?.trim()) {
    throw new Error(
      "Empresa transportadora é obrigatória."
    );
  }

  const valorTotal = Number(dados.valorTotal);

  if (
    !Number.isFinite(valorTotal) ||
    valorTotal < 0
  ) {
    throw new Error(
      "Valor total da cotação inválido."
    );
  }

  const dadosFrete = {
    empresa: dados.empresa.trim(),

    numero_cotacao:
      dados.numeroCotacao?.trim() || null,

    validade_cotacao:
      dados.validadeCotacao || null,

    valor_total: valorTotal,

    observacoes:
      dados.observacoes?.trim() || null,
  };

  let terceirizada =
    await LogisticaTerceirizada.findOne({
      where: {
        logistica_id: logistica.id,
      },
    });

  if (terceirizada) {
    await terceirizada.update(dadosFrete);
  } else {
    terceirizada =
      await LogisticaTerceirizada.create({
        logistica_id: logistica.id,
        ...dadosFrete,
      });
  }

  return terceirizada;
}

module.exports = {
  salvarLogisticaTerceirizada,
  buscarLogisticaTerceirizada,
};