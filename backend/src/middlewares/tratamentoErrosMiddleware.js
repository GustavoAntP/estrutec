const multer = require("multer");

const tratamentoErrosMiddleware = (erro, req, res, next) => {
  if (erro instanceof multer.MulterError) {
    if (erro.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        erro: "O arquivo excede o tamanho máximo permitido de 8 MB.",
      });
    }

    return res.status(400).json({
      erro: "Erro ao enviar o arquivo.",
    });
  }

  if (erro.status === 400) {
    return res.status(400).json({
      erro: erro.message,
    });
  }

  console.error("Erro nao tratado:", erro);

  return res.status(500).json({
    erro: "Erro interno do servidor.",
  });
};

module.exports = tratamentoErrosMiddleware;