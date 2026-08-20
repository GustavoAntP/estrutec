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

module.exports = {
  confirmarImportacao,
};