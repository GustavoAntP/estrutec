const fabricacaoServico = require(
  "../servicos/fabricacaoServico"
);

async function calcularVolumes(req, res) {
  try {
    const resultado =
      await fabricacaoServico.calcularVolumes(
        req.params.id,
        req.usuario.id
      );

    return res.status(200).json(resultado);
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function calcularMateriais(req, res) {
  try {
    const resultado =
      await fabricacaoServico.calcularMateriais(
        req.params.id,
        req.usuario.id
      );

    return res.status(200).json(resultado);
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

module.exports = {
  calcularVolumes,
  calcularMateriais,
};