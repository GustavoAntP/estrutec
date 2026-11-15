const Projeto = require("../modelos/Projeto");

const fabricacaoServico = require(
  "./fabricacaoServico"
);

const logisticaServico = require(
  "./logisticaServico"
);

const montagemServico = require(
  "./montagemServico"
);

async function calcularResumoFinanceiro(
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

  const fabricacao =
    await fabricacaoServico.calcularCustos(
      projetoId,
      usuarioId
    );

  const logistica =
    await logisticaServico.calcularCustoLogistica(
      projetoId,
      usuarioId
    );

  const montagem =
    await montagemServico.calcularCustos(
      projetoId,
      usuarioId
    );

  const custoFabricacao = Number(
    fabricacao.custoTotalFabricacao
  );

  const custoLogistica = Number(
    logistica.custoLogistica
  );

  const custoMontagem = Number(
    montagem.custoTotalMontagem
  );

  const custoDireto =
    custoFabricacao +
    custoLogistica +
    custoMontagem;

  const bdiPercentual = Number(
    projeto.bdi || 0
  );

  const valorBdi =
    custoDireto *
    (bdiPercentual / 100);

  const valorFinal =
    custoDireto + valorBdi;

  return {
    projeto: {
      id: projeto.id,
      codigo: projeto.codigo,
      nome: projeto.nome,
      cliente: projeto.cliente,
      status: projeto.status,
    },

    custos: {
      fabricacao:
        Number(custoFabricacao.toFixed(2)),

      logistica:
        Number(custoLogistica.toFixed(2)),

      montagem:
        Number(custoMontagem.toFixed(2)),

      custoDireto:
        Number(custoDireto.toFixed(2)),
    },

    bdi: {
      percentual: bdiPercentual,
      valor: Number(valorBdi.toFixed(2)),
    },

    valorFinal:
      Number(valorFinal.toFixed(2)),
  };
}

async function finalizarProjeto(
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

  if (projeto.status === "FINALIZADO") {
    throw new Error(
      "Este projeto já está finalizado."
    );
  }

  if (projeto.status !== "MONTAGEM_CALCULADA") {
    throw new Error(
      "A montagem deve estar confirmada antes de finalizar o projeto."
    );
  }

  // Recalcula tudo antes da finalização
  const resumo = await calcularResumoFinanceiro(
    projetoId,
    usuarioId
  );

  if (
    !Number.isFinite(resumo.valorFinal) ||
    resumo.valorFinal < 0
  ) {
    throw new Error(
      "Não foi possível calcular o valor final do projeto."
    );
  }

  await projeto.update({
    status: "FINALIZADO",
  });

  return {
    projeto: {
      id: projeto.id,
      codigo: projeto.codigo,
      nome: projeto.nome,
      status: projeto.status,
    },

    custos: resumo.custos,
    bdi: resumo.bdi,
    valorFinal: resumo.valorFinal,
  };
}

module.exports = {
  calcularResumoFinanceiro,
  finalizarProjeto,
};