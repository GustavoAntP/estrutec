const relatorioServico = require(
  "../servicos/relatorioServico"
);

async function gerarFinal(req, res) {
  try {
    const pdf =
      await relatorioServico
        .gerarRelatorioFinal(
          req.params.id,
          req.usuario.id
        );

    const nomeArquivo =
      `estrutec-projeto-${req.params.id}.pdf`;

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${nomeArquivo}"`
    );

    res.setHeader(
      "Content-Length",
      pdf.length
    );

    return res.send(pdf);
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

module.exports = {
  gerarFinal,
};