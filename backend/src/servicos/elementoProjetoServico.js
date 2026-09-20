const sequelize = require("../configuracoes/banco");
const Projeto = require("../modelos/Projeto");
const ElementoProjeto = require("../modelos/ElementoProjeto");

async function confirmarImportacao(projetoId, usuarioId, elementos) {
  if (!Array.isArray(elementos) || elementos.length === 0) {
    throw new Error("Nenhum elemento foi enviado para importação.");
  }

  const projeto = await Projeto.findOne({
    where: {
      id: projetoId,
      usuario_id: usuarioId,
    },
  });

  if (!projeto) {
    throw new Error("Projeto não encontrado.");
  }

  const elementosPreparados = elementos.map((elemento) => {
    const largura = Number(elemento.largura);
    const altura = Number(elemento.altura);
    const comprimento = Number(elemento.comprimento);
    const quantidade = Number(elemento.quantidade);

    if (
      !elemento.nomeAplicacao ||
      !elemento.tipo ||
      !Number.isFinite(largura) ||
      largura <= 0 ||
      !Number.isFinite(altura) ||
      altura <= 0 ||
      !Number.isFinite(comprimento) ||
      comprimento <= 0 ||
      !Number.isInteger(quantidade) ||
      quantidade <= 0
    ) {
      throw new Error(
        `Elemento inválido na linha ${elemento.linhaOrigem ?? "desconhecida"}.`
      );
    }

    return {
      projeto_id: projeto.id,
      linha_origem: elemento.linhaOrigem ?? null,
      nome_aplicacao: String(elemento.nomeAplicacao).trim(),
      tipo: String(elemento.tipo).trim(),
      secao: elemento.secao
        ? String(elemento.secao).trim()
        : null,
      aplicacao: elemento.aplicacao
        ? String(elemento.aplicacao).trim()
        : null,
      largura,
      altura,
      comprimento,
      quantidade,
    };
  });

  const transacao = await sequelize.transaction();

  try {
    // Evita duplicação caso uma nova planilha seja confirmada.
    await ElementoProjeto.destroy({
      where: {
        projeto_id: projeto.id,
      },
      transaction: transacao,
    });

    const elementosSalvos = await ElementoProjeto.bulkCreate(
      elementosPreparados,
      {
        transaction: transacao,
      }
    );

    await transacao.commit();

    const totalPecas = elementosPreparados.reduce(
      (total, elemento) => total + elemento.quantidade,
      0
    );

    return {
      totalElementos: elementosSalvos.length,
      totalPecas,
    };
  } catch (erro) {
    await transacao.rollback();
    throw erro;
  }
}

async function listarElementos(projetoId, usuarioId) {
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

  return elementos;
}

async function atualizarElemento(
  projetoId,
  elementoId,
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

  const elemento = await ElementoProjeto.findOne({
    where: {
      id: elementoId,
      projeto_id: projetoId,
    },
  });

  if (!elemento) {
    throw new Error("Elemento não encontrado.");
  }

  const largura =
    dados.largura !== undefined
      ? Number(dados.largura)
      : Number(elemento.largura);

  const altura =
    dados.altura !== undefined
      ? Number(dados.altura)
      : Number(elemento.altura);

  const comprimento =
    dados.comprimento !== undefined
      ? Number(dados.comprimento)
      : Number(elemento.comprimento);

  const quantidade =
    dados.quantidade !== undefined
      ? Number(dados.quantidade)
      : elemento.quantidade;

  if (!Number.isFinite(largura) || largura <= 0) {
    throw new Error("Largura inválida.");
  }

  if (!Number.isFinite(altura) || altura <= 0) {
    throw new Error("Altura inválida.");
  }

  if (!Number.isFinite(comprimento) || comprimento <= 0) {
    throw new Error("Comprimento inválido.");
  }

  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    throw new Error("Quantidade inválida.");
  }

  let areaSecao = elemento.area_secao;

  if (dados.areaSecao !== undefined) {
    if (
      dados.areaSecao !== null &&
      dados.areaSecao !== ""
    ) {
      areaSecao = Number(dados.areaSecao);

      if (
        !Number.isFinite(areaSecao) ||
        areaSecao <= 0
      ) {
        throw new Error("Área da seção inválida.");
      }
    } else {
      areaSecao = null;
    }
  }

  await elemento.update({
    nome_aplicacao:
      dados.nomeAplicacao !== undefined
        ? dados.nomeAplicacao.trim()
        : elemento.nome_aplicacao,

    tipo:
      dados.tipo !== undefined
        ? dados.tipo.trim().toUpperCase()
        : elemento.tipo,

    secao:
      dados.secao !== undefined
        ? dados.secao?.trim().toUpperCase() || null
        : elemento.secao,

    aplicacao:
      dados.aplicacao !== undefined
        ? dados.aplicacao?.trim().toUpperCase() || null
        : elemento.aplicacao,

    area_secao: areaSecao,

    largura,
    altura,
    comprimento,
    quantidade,
  });

  return elemento;
}

module.exports = {
  confirmarImportacao,
  listarElementos,
  atualizarElemento,
};