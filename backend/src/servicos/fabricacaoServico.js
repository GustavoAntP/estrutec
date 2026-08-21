const Projeto = require("../modelos/Projeto");
const ElementoProjeto = require("../modelos/ElementoProjeto");
const ConfiguracaoFabricacao = require("../modelos/ConfiguracaoFabricacao");
const PrecoFabricacao = require("../modelos/PrecoFabricacao");

async function calcularVolumes(projetoId, usuarioId) {
  const projeto = await Projeto.findOne({
    where: {
      id: projetoId,
      usuario_id: usuarioId,
    },
  });

  if (!projeto) {
    throw new Error("Projeto não encontrado.");
  }

  const elementos = await ElementoProjeto.findAll({
    where: {
      projeto_id: projetoId,
    },
    order: [["id", "ASC"]],
  });

  if (elementos.length === 0) {
    throw new Error(
      "O projeto não possui elementos estruturais cadastrados."
    );
  }

  let volumeCalculado = 0;
  let totalPecas = 0;
  let elementosPendentes = 0;

  const resultados = elementos.map((elemento) => {
    const largura = Number(elemento.largura);
    const altura = Number(elemento.altura);
    const comprimento = Number(elemento.comprimento);
    const quantidade = Number(elemento.quantidade);

    const secao = elemento.secao
      ? elemento.secao.toUpperCase()
      : null;

    totalPecas += quantidade;

    let areaUtilizada = null;
    let volumeUnitario = null;
    let volumeTotal = null;
    let statusCalculo = "CALCULADO";

    if (secao === "RETANGULAR") {
      areaUtilizada = largura * altura;
    } else {
      if (
        elemento.area_secao === null ||
        elemento.area_secao === undefined
      ) {
        elementosPendentes++;

        statusCalculo = "PENDENTE_AREA_SECAO";

        return {
          id: elemento.id,
          nomeAplicacao: elemento.nome_aplicacao,
          tipo: elemento.tipo,
          secao: elemento.secao,
          quantidade,
          areaUtilizada: null,
          volumeUnitario: null,
          volumeTotal: null,
          statusCalculo,
        };
      }

      areaUtilizada = Number(elemento.area_secao);
    }

    volumeUnitario =
      areaUtilizada * comprimento;

    volumeTotal =
      volumeUnitario * quantidade;

    volumeCalculado += volumeTotal;

    return {
      id: elemento.id,
      nomeAplicacao: elemento.nome_aplicacao,
      tipo: elemento.tipo,
      secao: elemento.secao,
      quantidade,

      areaUtilizada: Number(
        areaUtilizada.toFixed(4)
      ),

      volumeUnitario: Number(
        volumeUnitario.toFixed(4)
      ),

      volumeTotal: Number(
        volumeTotal.toFixed(4)
      ),

      statusCalculo,
    };
  });

  return {
    projeto: {
      id: projeto.id,
      codigo: projeto.codigo,
      nome: projeto.nome,
    },

    resumo: {
      totalRegistros: elementos.length,
      totalPecas,
      elementosCalculados:
        elementos.length - elementosPendentes,
      elementosPendentes,

      volumeCalculadoM3: Number(
        volumeCalculado.toFixed(4)
      ),

      volumeTotalM3:
        elementosPendentes === 0
          ? Number(volumeCalculado.toFixed(4))
          : null,
    },

    elementos: resultados,
  };
}

async function calcularMateriais(projetoId, usuarioId) {
  const resultadoVolumes = await calcularVolumes(
    projetoId,
    usuarioId
  );

  if (resultadoVolumes.resumo.elementosPendentes > 0) {
    throw new Error(
      "Existem elementos sem área de seção definida. Complete os dados antes de calcular os materiais."
    );
  }

  const configuracao =
    await ConfiguracaoFabricacao.findOne({
      where: {
        projeto_id: projetoId,
      },
    });

  if (!configuracao) {
    throw new Error(
      "Configuração de fabricação ainda não cadastrada."
    );
  }

  const volume = Number(
    resultadoVolumes.resumo.volumeTotalM3
  );

  const desperdicio = Number(
    configuracao.desperdicio_percentual
  );

  const fatorDesperdicio =
    1 + desperdicio / 100;

  const cimento =
    volume *
    Number(configuracao.consumo_cimento_kg_m3) *
    fatorDesperdicio;

  const areia =
    volume *
    Number(configuracao.consumo_areia_m3_m3) *
    fatorDesperdicio;

  const brita =
    volume *
    Number(configuracao.consumo_brita_m3_m3) *
    fatorDesperdicio;

  const agua =
    volume *
    Number(configuracao.consumo_agua_l_m3) *
    fatorDesperdicio;

  const aco =
    volume *
    Number(configuracao.taxa_armadura_kg_m3) *
    fatorDesperdicio;

  const totalVigas =
    resultadoVolumes.elementos
      .filter(
        (elemento) =>
          elemento.tipo === "VIGA"
      )
      .reduce(
        (total, elemento) =>
          total + Number(elemento.quantidade),
        0
      );

  const neoprenePorViga =
    configuracao.neoprene_m2_por_viga !== null
      ? Number(configuracao.neoprene_m2_por_viga)
      : 0;

  const neoprene =
    totalVigas * neoprenePorViga;

  return {
    projeto: resultadoVolumes.projeto,

    parametros: {
      fckMpa: Number(configuracao.fck_mpa),
      desperdicioPercentual: desperdicio,
      taxaArmaduraKgM3: Number(
        configuracao.taxa_armadura_kg_m3
      ),
    },

    resumo: {
      volumeConcretoM3: volume,
      totalPecas:
        resultadoVolumes.resumo.totalPecas,
      totalVigas,
    },

    materiais: {
      cimentoKg: Number(cimento.toFixed(2)),
      areiaM3: Number(areia.toFixed(4)),
      britaM3: Number(brita.toFixed(4)),
      aguaLitros: Number(agua.toFixed(2)),
      acoKg: Number(aco.toFixed(2)),
      neopreneM2: Number(neoprene.toFixed(4)),
    },
  };
}

async function calcularCustos(projetoId, usuarioId) {
  const resultadoMateriais = await calcularMateriais(
    projetoId,
    usuarioId
  );

  const precos = await PrecoFabricacao.findOne({
    where: {
      projeto_id: projetoId,
    },
  });

  if (!precos) {
    throw new Error(
      "Preços de fabricação ainda não cadastrados."
    );
  }

  const materiais = resultadoMateriais.materiais;

  const custoCimento =
    materiais.cimentoKg *
    Number(precos.preco_cimento_kg);

  const custoAreia =
    materiais.areiaM3 *
    Number(precos.preco_areia_m3);

  const custoBrita =
    materiais.britaM3 *
    Number(precos.preco_brita_m3);

  const custoAgua =
    materiais.aguaLitros *
    Number(precos.preco_agua_l);

  const custoAco =
    materiais.acoKg *
    Number(precos.preco_aco_kg);

  const custoNeoprene =
    materiais.neopreneM2 *
    Number(precos.preco_neoprene_m2);

  const custoTotal =
    custoCimento +
    custoAreia +
    custoBrita +
    custoAgua +
    custoAco +
    custoNeoprene;

  return {
    projeto: resultadoMateriais.projeto,

    resumo: {
      volumeConcretoM3:
        resultadoMateriais.resumo.volumeConcretoM3,

      totalPecas:
        resultadoMateriais.resumo.totalPecas,

      totalVigas:
        resultadoMateriais.resumo.totalVigas,
    },

    materiais: {
      cimento: {
        quantidade: materiais.cimentoKg,
        unidade: "kg",
        precoUnitario: Number(
          precos.preco_cimento_kg
        ),
        custo: Number(custoCimento.toFixed(2)),
      },

      areia: {
        quantidade: materiais.areiaM3,
        unidade: "m³",
        precoUnitario: Number(
          precos.preco_areia_m3
        ),
        custo: Number(custoAreia.toFixed(2)),
      },

      brita: {
        quantidade: materiais.britaM3,
        unidade: "m³",
        precoUnitario: Number(
          precos.preco_brita_m3
        ),
        custo: Number(custoBrita.toFixed(2)),
      },

      agua: {
        quantidade: materiais.aguaLitros,
        unidade: "L",
        precoUnitario: Number(
          precos.preco_agua_l
        ),
        custo: Number(custoAgua.toFixed(2)),
      },

      aco: {
        quantidade: materiais.acoKg,
        unidade: "kg",
        precoUnitario: Number(
          precos.preco_aco_kg
        ),
        custo: Number(custoAco.toFixed(2)),
      },

      neoprene: {
        quantidade: materiais.neopreneM2,
        unidade: "m²",
        precoUnitario: Number(
          precos.preco_neoprene_m2
        ),
        custo: Number(custoNeoprene.toFixed(2)),
      },
    },

    custoTotalFabricacao: Number(
      custoTotal.toFixed(2)
    ),
  };
}

module.exports = {
  calcularVolumes,
  calcularMateriais,
  calcularCustos,
};