const planilhaServico = require("../servicos/planilhaServico");
const Projeto = require("../modelos/Projeto");

async function importar(req, res) {
  try {
    const projeto = await Projeto.findOne({
      where: {
        id: req.params.id,
        usuario_id: req.usuario.id,
      },
    });

    if (!projeto) {
      return res.status(404).json({
        erro: "Projeto não encontrado.",
      });
    }

    const resultado =
      await planilhaServico.processarPlanilha(req.file);

    return res.status(200).json({
      mensagem: "Planilha importada e validada com sucesso!",

      projeto: {
        id: projeto.id,
        codigo: projeto.codigo,
        nome: projeto.nome,
      },

      arquivo: {
        nome: resultado.nomeArquivo,
        tamanho: resultado.tamanho,
        planilha: resultado.nomePlanilha,
      },

      resumo: resultado.resumo,
      elementos: resultado.elementos,
      erros: resultado.erros,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

module.exports = {
  importar,
};