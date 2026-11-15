const Projeto = require("../modelos/Projeto");
const LogisticaProjeto = require("../modelos/LogisticaProjeto");
const LogisticaTerceirizada = require("../modelos/LogisticaTerceirizada");

const logisticaPropriaServico = require(
  "./logisticaPropriaServico"
);

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

async function salvarLogistica(
  projetoId,
  usuarioId,
  dados
) {
  await verificarProjeto(projetoId, usuarioId);

  const tipoFrete = String(
    dados.tipoFrete || ""
  )
    .trim()
    .toUpperCase();

  const tiposPermitidos = [
    "PROPRIO",
    "TERCEIRIZADO",
  ];

  if (!tiposPermitidos.includes(tipoFrete)) {
    throw new Error(
      "Tipo de frete inválido. Utilize PROPRIO ou TERCEIRIZADO."
    );
  }

  let logistica = await LogisticaProjeto.findOne({
    where: {
      projeto_id: projetoId,
    },
  });

  const dadosLogistica = {
    tipo_frete: tipoFrete,

    observacoes:
      dados.observacoes !== undefined
        ? dados.observacoes?.trim() || null
        : logistica?.observacoes || null,
  };

  if (logistica) {
    await logistica.update(dadosLogistica);
  } else {
    logistica = await LogisticaProjeto.create({
      projeto_id: projetoId,
      ...dadosLogistica,
    });
  }

  return logistica;
}

async function buscarLogistica(
  projetoId,
  usuarioId
) {
  await verificarProjeto(projetoId, usuarioId);

  const logistica = await LogisticaProjeto.findOne({
    where: {
      projeto_id: projetoId,
    },
  });

  if (!logistica) {
    throw new Error(
      "Logística ainda não configurada para este projeto."
    );
  }

  return logistica;
}

async function calcularCustoLogistica(
  projetoId,
  usuarioId
) {
  const projeto = await verificarProjeto(
    projetoId,
    usuarioId
  );

  const logistica = await LogisticaProjeto.findOne({
    where: {
      projeto_id: projetoId,
    },
  });

  if (!logistica) {
    throw new Error(
      "Logística ainda não configurada para este projeto."
    );
  }

  if (logistica.tipo_frete === "PROPRIO") {
    const resultado =
      await logisticaPropriaServico.calcularCustoFreteProprio(
        projetoId,
        usuarioId
      );

    return {
      projeto: {
        id: projeto.id,
        codigo: projeto.codigo,
        nome: projeto.nome,
      },

      tipoFrete: "PROPRIO",

      custoLogistica:
        resultado.custoTotalFreteProprio,

      detalhes: resultado,
    };
  }

  if (logistica.tipo_frete === "TERCEIRIZADO") {
    const freteTerceirizado =
      await LogisticaTerceirizada.findOne({
        where: {
          logistica_id: logistica.id,
        },
      });

    if (!freteTerceirizado) {
      throw new Error(
        "Dados do frete terceirizado ainda não cadastrados."
      );
    }

    const valorTotal = Number(
      freteTerceirizado.valor_total
    );

    return {
      projeto: {
        id: projeto.id,
        codigo: projeto.codigo,
        nome: projeto.nome,
      },

      tipoFrete: "TERCEIRIZADO",

      custoLogistica: Number(
        valorTotal.toFixed(2)
      ),

      detalhes: {
        empresa:
          freteTerceirizado.empresa,

        numeroCotacao:
          freteTerceirizado.numero_cotacao,

        validadeCotacao:
          freteTerceirizado.validade_cotacao,

        valorTotal: Number(
          valorTotal.toFixed(2)
        ),

        observacoes:
          freteTerceirizado.observacoes,
      },
    };
  }

  throw new Error(
    "Tipo de frete não reconhecido."
  );
}

async function confirmarLogistica(
  projetoId,
  usuarioId
) {
  const projeto = await verificarProjeto(
    projetoId,
    usuarioId
  );

  // Valida se existe um custo logístico calculável.
  const resultado = await calcularCustoLogistica(
    projetoId,
    usuarioId
  );

  await projeto.update({
    status: "LOGISTICA_CALCULADA",
  });

  return {
    projeto: {
      id: projeto.id,
      codigo: projeto.codigo,
      nome: projeto.nome,
      status: projeto.status,
    },

    tipoFrete: resultado.tipoFrete,
    custoLogistica: resultado.custoLogistica,
  };
}

module.exports = {
  salvarLogistica,
  buscarLogistica,
  calcularCustoLogistica,
  confirmarLogistica,
};