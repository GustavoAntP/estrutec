const Projeto = require("../modelos/Projeto");
const LogisticaProjeto = require(
  "../modelos/LogisticaProjeto"
);
const LogisticaPropria = require(
  "../modelos/LogisticaPropria"
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

module.exports = {
  salvarLogisticaPropria,
  buscarLogisticaPropria,
};