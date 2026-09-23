const Projeto = require("../modelos/Projeto");
const LogisticaProjeto = require(
  "../modelos/LogisticaProjeto"
);
const LogisticaPropria = require(
  "../modelos/LogisticaPropria"
);
const ElementoProjeto = require(
  "../modelos/ElementoProjeto"
);

async function obterLogistica(
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

  if (logistica.tipo_frete !== "PROPRIO") {
    throw new Error(
      "O projeto não está configurado para frete próprio."
    );
  }

  return logistica;
}

async function salvarLogisticaPropria(
  projetoId,
  usuarioId,
  dados
) {
  const logistica = await obterLogistica(
    projetoId,
    usuarioId
  );

  const distancia = Number(dados.distanciaIdaKm);
  const quantidadeViagens = Number(
    dados.quantidadeViagens
  );

  const consumoCarregado = Number(
    dados.consumoCarregadoKmL
  );

  const consumoVazio = Number(
    dados.consumoVazioKmL
  );

  const precoDiesel = Number(
    dados.precoDieselL
  );

  if (
    !Number.isFinite(distancia) ||
    distancia <= 0
  ) {
    throw new Error("Distância inválida.");
  }

  if (
    !Number.isInteger(quantidadeViagens) ||
    quantidadeViagens <= 0
  ) {
    throw new Error(
      "Quantidade de viagens inválida."
    );
  }

  if (
    !Number.isFinite(consumoCarregado) ||
    consumoCarregado <= 0
  ) {
    throw new Error(
      "Consumo carregado inválido."
    );
  }

  if (
    !Number.isFinite(consumoVazio) ||
    consumoVazio <= 0
  ) {
    throw new Error(
      "Consumo vazio inválido."
    );
  }

  if (
    !Number.isFinite(precoDiesel) ||
    precoDiesel < 0
  ) {
    throw new Error(
      "Preço do diesel inválido."
    );
  }

  const numeroOuZero = (valor, nome) => {
    const numero = Number(valor ?? 0);

    if (
      !Number.isFinite(numero) ||
      numero < 0
    ) {
      throw new Error(`${nome} inválido.`);
    }

    return numero;
  };

  let capacidadePecas = null;

  if (
    dados.capacidadePecas !== undefined &&
    dados.capacidadePecas !== null &&
    dados.capacidadePecas !== ""
  ) {
    capacidadePecas = Number(
      dados.capacidadePecas
    );

    if (
      !Number.isInteger(capacidadePecas) ||
      capacidadePecas <= 0
    ) {
      throw new Error(
        "Capacidade de peças inválida."
      );
    }
  }

  let capacidadePesoKg = null;

  if (
    dados.capacidadePesoKg !== undefined &&
    dados.capacidadePesoKg !== null &&
    dados.capacidadePesoKg !== ""
  ) {
    capacidadePesoKg = Number(
      dados.capacidadePesoKg
    );

    if (
      !Number.isFinite(capacidadePesoKg) ||
      capacidadePesoKg <= 0
    ) {
      throw new Error(
        "Capacidade de peso inválida."
      );
    }
  }

  const dadosFrete = {
    distancia_ida_km: distancia,

    considerar_ida_volta:
      dados.considerarIdaVolta !== false,

    quantidade_viagens: quantidadeViagens,

    cavalo_mecanico:
      dados.cavaloMecanico?.trim() || null,

    carreta:
      dados.carreta?.trim() || null,

    capacidade_pecas: capacidadePecas,

    capacidade_peso_kg: capacidadePesoKg,

    consumo_carregado_km_l:
      consumoCarregado,

    consumo_vazio_km_l:
      consumoVazio,

    preco_diesel_l: precoDiesel,

    pedagios: numeroOuZero(
      dados.pedagios,
      "Pedágio"
    ),

    custo_motorista_por_viagem:
      numeroOuZero(
        dados.custoMotoristaPorViagem,
        "Custo do motorista"
      ),

    alimentacao_motorista_por_viagem:
      numeroOuZero(
        dados.alimentacaoMotoristaPorViagem,
        "Alimentação do motorista"
      ),

    manutencao_por_km:
      numeroOuZero(
        dados.manutencaoPorKm,
        "Manutenção"
      ),

    custo_carregamento_por_viagem:
      numeroOuZero(
        dados.custoCarregamentoPorViagem,
        "Custo de carregamento"
      ),

    custo_descarregamento_por_viagem:
      numeroOuZero(
        dados.custoDescarregamentoPorViagem,
        "Custo de descarregamento"
      ),

    seguro: numeroOuZero(
      dados.seguro,
      "Seguro"
    ),

    outros_custos: numeroOuZero(
      dados.outrosCustos,
      "Outros custos"
    ),

    observacoes:
      dados.observacoes?.trim() || null,
  };

  let freteProprio =
    await LogisticaPropria.findOne({
      where: {
        logistica_id: logistica.id,
      },
    });

  if (freteProprio) {
    await freteProprio.update(dadosFrete);
  } else {
    freteProprio =
      await LogisticaPropria.create({
        logistica_id: logistica.id,
        ...dadosFrete,
      });
  }

  return freteProprio;
}

async function buscarLogisticaPropria(
  projetoId,
  usuarioId
) {
  const logistica = await obterLogistica(
    projetoId,
    usuarioId
  );

  const freteProprio =
    await LogisticaPropria.findOne({
      where: {
        logistica_id: logistica.id,
      },
    });

  if (!freteProprio) {
    throw new Error(
      "Dados do frete próprio ainda não cadastrados."
    );
  }

  return freteProprio;
}

async function calcularCustoFreteProprio(
  projetoId,
  usuarioId
) {
  const logistica = await obterLogistica(
    projetoId,
    usuarioId
  );

  const freteProprio =
    await LogisticaPropria.findOne({
      where: {
        logistica_id: logistica.id,
      },
    });

  if (!freteProprio) {
    throw new Error(
      "Dados do frete próprio ainda não cadastrados."
    );
  }

  const distanciaIda = Number(
    freteProprio.distancia_ida_km
  );

  const viagens = Number(
    freteProprio.quantidade_viagens
  );

  const consumoCarregado = Number(
    freteProprio.consumo_carregado_km_l
  );

  const consumoVazio = Number(
    freteProprio.consumo_vazio_km_l
  );

  const precoDiesel = Number(
    freteProprio.preco_diesel_l
  );

  // Todas as viagens de ida são consideradas carregadas.
  const kmCarregado =
    distanciaIda * viagens;

  // O retorno é considerado vazio quando ida/volta estiver ativo.
  const kmVazio =
    freteProprio.considerar_ida_volta
      ? distanciaIda * viagens
      : 0;

  const kmTotal =
    kmCarregado + kmVazio;

  const litrosCarregado =
    kmCarregado / consumoCarregado;

  const litrosVazio =
    kmVazio > 0
      ? kmVazio / consumoVazio
      : 0;

  const litrosTotal =
    litrosCarregado + litrosVazio;

  const custoCombustivel =
    litrosTotal * precoDiesel;

  const custoManutencao =
    kmTotal *
    Number(freteProprio.manutencao_por_km);

  const custoMotorista =
    Number(
      freteProprio.custo_motorista_por_viagem
    ) * viagens;

  const custoAlimentacao =
    Number(
      freteProprio.alimentacao_motorista_por_viagem
    ) * viagens;

  // Neste momento, o campo "pedagios" representa
  // o valor de pedágio por viagem.
  const custoPedagios =
    Number(freteProprio.pedagios) *
    viagens;

  const custoCarregamento =
    Number(
      freteProprio.custo_carregamento_por_viagem
    ) * viagens;

  const custoDescarregamento =
    Number(
      freteProprio.custo_descarregamento_por_viagem
    ) * viagens;

  const custoSeguro =
    Number(freteProprio.seguro);

  const outrosCustos =
    Number(freteProprio.outros_custos);

  const custoTotal =
    custoCombustivel +
    custoManutencao +
    custoMotorista +
    custoAlimentacao +
    custoPedagios +
    custoCarregamento +
    custoDescarregamento +
    custoSeguro +
    outrosCustos;

  return {
    transporte: {
      cavaloMecanico:
        freteProprio.cavalo_mecanico,

      carreta:
        freteProprio.carreta,

      quantidadeViagens: viagens,

      distanciaIdaKm: distanciaIda,

      considerarIdaVolta:
        freteProprio.considerar_ida_volta,

      kmCarregado: Number(
        kmCarregado.toFixed(2)
      ),

      kmVazio: Number(
        kmVazio.toFixed(2)
      ),

      kmTotal: Number(
        kmTotal.toFixed(2)
      ),
    },

    combustivel: {
      consumoCarregadoKmL:
        consumoCarregado,

      consumoVazioKmL:
        consumoVazio,

      litrosCarregado: Number(
        litrosCarregado.toFixed(2)
      ),

      litrosVazio: Number(
        litrosVazio.toFixed(2)
      ),

      litrosTotal: Number(
        litrosTotal.toFixed(2)
      ),

      precoDieselL:
        precoDiesel,

      custoCombustivel: Number(
        custoCombustivel.toFixed(2)
      ),
    },

    custos: {
      combustivel: Number(
        custoCombustivel.toFixed(2)
      ),

      manutencao: Number(
        custoManutencao.toFixed(2)
      ),

      motorista: Number(
        custoMotorista.toFixed(2)
      ),

      alimentacao: Number(
        custoAlimentacao.toFixed(2)
      ),

      pedagios: Number(
        custoPedagios.toFixed(2)
      ),

      carregamento: Number(
        custoCarregamento.toFixed(2)
      ),

      descarregamento: Number(
        custoDescarregamento.toFixed(2)
      ),

      seguro: Number(
        custoSeguro.toFixed(2)
      ),

      outrosCustos: Number(
        outrosCustos.toFixed(2)
      ),
    },

    custoPorViagem: Number(
      (custoTotal / viagens).toFixed(2)
    ),

    custoTotalFreteProprio: Number(
      custoTotal.toFixed(2)
    ),
  };
}

async function sugerirQuantidadeViagens(
  projetoId,
  usuarioId
) {
  const logistica = await obterLogistica(
    projetoId,
    usuarioId
  );

  const freteProprio =
    await LogisticaPropria.findOne({
      where: {
        logistica_id: logistica.id,
      },
    });

  if (!freteProprio) {
    throw new Error(
      "Dados do frete próprio ainda não cadastrados."
    );
  }

  const capacidadePecas = Number(
    freteProprio.capacidade_pecas
  );

  if (
    !Number.isInteger(capacidadePecas) ||
    capacidadePecas <= 0
  ) {
    throw new Error(
      "Informe uma capacidade de peças válida para a carreta."
    );
  }

  const elementos = await ElementoProjeto.findAll({
    where: {
      projeto_id: projetoId,
    },
  });

  if (elementos.length === 0) {
    throw new Error(
      "O projeto não possui elementos cadastrados."
    );
  }

  const totalPecas = elementos.reduce(
    (total, elemento) =>
      total + Number(elemento.quantidade),
    0
  );

  const viagensPorPecas = Math.ceil(
    totalPecas / capacidadePecas
  );

  const capacidadePesoKg =
    freteProprio.capacidade_peso_kg !== null
      ? Number(freteProprio.capacidade_peso_kg)
      : null;

  const elementosSemPeso = elementos.filter(
    (elemento) =>
      elemento.peso_unitario_kg === null ||
      elemento.peso_unitario_kg === undefined ||
      Number(elemento.peso_unitario_kg) <= 0
  );

  let pesoTotalKg = null;
  let viagensPorPeso = null;
  let quantidadeViagensSugerida = null;
  let criterioLimitante = null;

  if (
    capacidadePesoKg !== null &&
    capacidadePesoKg > 0
  ) {
    if (elementosSemPeso.length === 0) {
      pesoTotalKg = elementos.reduce(
        (total, elemento) => {
          const pesoUnitario = Number(
            elemento.peso_unitario_kg
          );

          const quantidade = Number(
            elemento.quantidade
          );

          return (
            total +
            pesoUnitario * quantidade
          );
        },
        0
      );

      viagensPorPeso = Math.ceil(
        pesoTotalKg / capacidadePesoKg
      );

      quantidadeViagensSugerida = Math.max(
        viagensPorPecas,
        viagensPorPeso
      );

      if (viagensPorPeso > viagensPorPecas) {
        criterioLimitante = "PESO";
      } else if (
        viagensPorPecas > viagensPorPeso
      ) {
        criterioLimitante = "PECAS";
      } else {
        criterioLimitante = "EMPATE";
      }
    } else {
      criterioLimitante = "PESO_PENDENTE";
    }
  } else {
    quantidadeViagensSugerida =
      viagensPorPecas;

    criterioLimitante = "PECAS";
  }

  return {
    totalPecas,

    pesoTotalKg:
      pesoTotalKg !== null
        ? Number(pesoTotalKg.toFixed(2))
        : null,

    capacidades: {
      pecas: capacidadePecas,
      pesoKg: capacidadePesoKg,
    },

    calculo: {
      viagensPorPecas,
      viagensPorPeso,
      quantidadeViagensSugerida,
      criterioLimitante,
    },

    quantidadeViagensAtual: Number(
      freteProprio.quantidade_viagens
    ),

    elementosSemPeso: elementosSemPeso.map(
      (elemento) => ({
        id: elemento.id,
        nomeAplicacao:
          elemento.nome_aplicacao,
      })
    ),
  };
}

async function aplicarSugestaoViagens(
  projetoId,
  usuarioId
) {
  const sugestao = await sugerirQuantidadeViagens(
    projetoId,
    usuarioId
  );

  if (
    sugestao.calculo.quantidadeViagensSugerida === null
  ) {
    throw new Error(
      "Não é possível aplicar a sugestão enquanto existirem elementos sem peso informado."
    );
  }

  const logistica = await obterLogistica(
    projetoId,
    usuarioId
  );

  const freteProprio =
    await LogisticaPropria.findOne({
      where: {
        logistica_id: logistica.id,
      },
    });

  if (!freteProprio) {
    throw new Error(
      "Dados do frete próprio ainda não cadastrados."
    );
  }

  const quantidadeAnterior = Number(
    freteProprio.quantidade_viagens
  );

  const quantidadeNova = Number(
    sugestao.calculo.quantidadeViagensSugerida
  );

  await freteProprio.update({
    quantidade_viagens: quantidadeNova,
  });

  return {
    quantidadeAnterior,
    quantidadeAtual: quantidadeNova,

    criterioLimitante:
      sugestao.calculo.criterioLimitante,

    viagensPorPecas:
      sugestao.calculo.viagensPorPecas,

    viagensPorPeso:
      sugestao.calculo.viagensPorPeso,
  };
}

module.exports = {
  salvarLogisticaPropria,
  buscarLogisticaPropria,
  calcularCustoFreteProprio,
  sugerirQuantidadeViagens,
  aplicarSugestaoViagens,
};