const jwt = require("jsonwebtoken");

function autenticar(req, res, next) {
  const autorizacao = req.headers.authorization;

  if (!autorizacao) {
    return res.status(401).json({
      erro: "Token não informado.",
    });
  }

  const [tipo, token] = autorizacao.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({
      erro: "Formato de token inválido.",
    });
  }

  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);

    req.usuario = {
      id: dados.id,
      nome: dados.nome,
    };

    next();
  } catch (erro) {
    return res.status(401).json({
      erro: "Token inválido ou expirado.",
    });
  }
}

module.exports = autenticar;