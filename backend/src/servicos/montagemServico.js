const Projeto = require("../modelos/Projeto");
const MontagemProjeto = require("../modelos/MontagemProjeto");
const EquipamentoMontagem = require("../modelos/EquipamentoMontagem");
const EquipeMontagem = require("../modelos/EquipeMontagem");

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

function validarCusto(valor, nome) {
  const numero = Number(valor ?? 0);

  if (!Number.isFinite(numero) || numero < 0) {
    throw new Error(`${nome} inválido.`);
  }

  return numero;
}

async function salvarMontagem(
  projetoId,
  usuarioId,
  dados
) {
  await verificarProjeto(projetoId, usuarioId);

  const dadosMontagem = {
    custo_hospedagem: validarCusto(
      dados.custoHospedagem,
      "Custo de hospedagem"
    ),

    custo_alimentacao: validarCusto(
      dados.custoAlimentacao,
      "Custo de alimentação"
    ),

    custo_transporte_equipe: validarCusto(
      dados.custoTransporteEquipe,
      "Custo de transporte da equipe"
    ),

    outros_custos: validarCusto(
      dados.outrosCustos,
      "Outros custos"
    ),

    observacoes:
      dados.observacoes?.trim() || null,
  };

  let montagem = await MontagemProjeto.findOne({
    where: {
      projeto_id: projetoId,
    },
  });

  if (montagem) {
    await montagem.update(dadosMontagem);
  } else {
    montagem = await MontagemProjeto.create({
      projeto_id: projetoId,
      ...dadosMontagem,
    });
  }

  return montagem;
}

async function buscarMontagem(
  projetoId,
  usuarioId
) {
  await verificarProjeto(projetoId, usuarioId);

  const montagem = await MontagemProjeto.findOne({
    where: {
      projeto_id: projetoId,
    },
  });

  if (!montagem) {
    throw new Error(
      "Montagem ainda não configurada para este projeto."
    );
  }

  return montagem;
}

async function calcularCustos(
  projetoId,
  usuarioId
) {
  const projeto = await verificarProjeto(
    projetoId,
    usuarioId
  );

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

  const equipamentos =
    await EquipamentoMontagem.findAll({
      where: {
        montagem_id: montagem.id,
      },
      order: [["id", "ASC"]],
    });

  const equipes = await EquipeMontagem.findAll({
    where: {
      montagem_id: montagem.id,
    },
    order: [["id", "ASC"]],
  });

  let custoTotalEquipamentos = 0;

  const detalhesEquipamentos = equipamentos.map(
    (equipamento) => {
      const quantidade = Number(
        equipamento.quantidade
      );

      const tempoUso = Number(
        equipamento.tempo_uso
      );

      const valorUnitario = Number(
        equipamento.valor_unitario
      );

      const mobilizacao = Number(
        equipamento.custo_mobilizacao
      );

      const desmobilizacao = Number(
        equipamento.custo_desmobilizacao
      );

      const custoUso =
        quantidade *
        tempoUso *
        valorUnitario;

      const custoTotal =
        custoUso +
        mobilizacao +
        desmobilizacao;

      custoTotalEquipamentos += custoTotal;

      return {
        id: equipamento.id,
        nome: equipamento.nome,
        quantidade,
        tipoCobranca:
          equipamento.tipo_cobranca,
        tempoUso,
        valorUnitario,
        custoUso,
        custoMobilizacao: mobilizacao,
        custoDesmobilizacao: desmobilizacao,
        custoTotal,
      };
    }
  );

  let custoTotalEquipes = 0;

  const detalhesEquipes = equipes.map(
    (equipe) => {
      const quantidadeTrabalhadores = Number(
        equipe.quantidade_trabalhadores
      );

      const quantidadeDias = Number(
        equipe.quantidade_dias
      );

      const custoDiarioPorTrabalhador =
        Number(
          equipe.custo_diario_por_trabalhador
        );

      const custoTotal =
        quantidadeTrabalhadores *
        quantidadeDias *
        custoDiarioPorTrabalhador;

      custoTotalEquipes += custoTotal;

      return {
        id: equipe.id,
        funcao: equipe.funcao,
        quantidadeTrabalhadores,
        quantidadeDias,
        custoDiarioPorTrabalhador,
        custoTotal,
      };
    }
  );

  const custoHospedagem = Number(
    montagem.custo_hospedagem
  );

  const custoAlimentacao = Number(
    montagem.custo_alimentacao
  );

  const custoTransporteEquipe = Number(
    montagem.custo_transporte_equipe
  );

  const outrosCustos = Number(
    montagem.outros_custos
  );

  const custosGerais =
    custoHospedagem +
    custoAlimentacao +
    custoTransporteEquipe +
    outrosCustos;

  const custoTotalMontagem =
    custoTotalEquipamentos +
    custoTotalEquipes +
    custosGerais;

  return {
    projeto: {
      id: projeto.id,
      codigo: projeto.codigo,
      nome: projeto.nome,
    },

    equipamentos: {
      quantidade: equipamentos.length,
      custoTotal: custoTotalEquipamentos,
      detalhes: detalhesEquipamentos,
    },

    equipes: {
      quantidade: equipes.length,
      custoTotal: custoTotalEquipes,
      detalhes: detalhesEquipes,
    },

    custosGerais: {
      hospedagem: custoHospedagem,
      alimentacao: custoAlimentacao,
      transporteEquipe:
        custoTransporteEquipe,
      outrosCustos,
      total: custosGerais,
    },

    custoTotalMontagem,
  };
}

async function confirmarMontagem(
  projetoId,
  usuarioId
) {
  const projeto = await verificarProjeto(
    projetoId,
    usuarioId
  );

  // Recalcula os custos antes de confirmar
  const resultado = await calcularCustos(
    projetoId,
    usuarioId
  );

  await projeto.update({
    status: "MONTAGEM_CALCULADA",
  });

  return {
    projeto: {
      id: projeto.id,
      codigo: projeto.codigo,
      nome: projeto.nome,
      status: projeto.status,
    },

    custoTotalMontagem:
      resultado.custoTotalMontagem,
  };
}

module.exports = {
  salvarMontagem,
  buscarMontagem,
  calcularCustos,
  confirmarMontagem,
};