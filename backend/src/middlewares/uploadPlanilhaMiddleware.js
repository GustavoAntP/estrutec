const multer = require("multer");
const path = require("path");

const armazenamento = multer.memoryStorage();

//Rejeição de arquivo no Multer sem handler global no Express retorna HTML de erro 500 sem payload JSON.
const filtroArquivo = (req, arquivo, callback) => {
  const extensao = path.extname(arquivo.originalname).toLowerCase();

  if (extensao !== ".xlsx") {
    return callback(
      new Error("Apenas arquivos Excel no formato .xlsx são permitidos.")
    );
  }

  callback(null, true);
};

const uploadPlanilha = multer({
  storage: armazenamento,
  fileFilter: filtroArquivo,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = uploadPlanilha;