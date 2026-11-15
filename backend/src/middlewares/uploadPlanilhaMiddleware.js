const multer = require("multer");
const path = require("path");

const armazenamento = multer.memoryStorage();

const filtroArquivo = (req, arquivo, callback) => {
  const extensao = path.extname(arquivo.originalname).toLowerCase();

  if (extensao !== ".xlsx") {
    const erro = new Error(
      "Apenas arquivos Excel no formato .xlsx são permitidos."
    );
    erro.status = 400;
    return callback(erro);
  }

  callback(null, true);
};

const uploadPlanilha = multer({
  storage: armazenamento,
  fileFilter: filtroArquivo,
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 1,
  },
});

module.exports = uploadPlanilha;