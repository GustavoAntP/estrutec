const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const Usuario = require("../modelos/Usuario");

async function login(identificador, senha) {
  if (!identificador || !senha) {
    throw new Error("CPF/e-mail e senha são obrigatórios.");
  }

  const valorDigitado = identificador.trim();

  const cpfLimpo = valorDigitado.replace(/\D/g, "");
  const emailNormalizado = valorDigitado.toLowerCase();

  const usuario = await Usuario.findOne({
    where: {
      [Op.or]: [
        { cpf: cpfLimpo },
        { email: emailNormalizado },
      ],
    },
  });

  if (!usuario) {
    throw new Error("CPF/e-mail ou senha inválidos.");
  }

  if (!usuario.ativo) {
    throw new Error("Usuário inativo.");
  }

  const senhaCorreta = await bcrypt.compare(
    senha,
    usuario.senha_hash
  );

  if (!senhaCorreta) {
    throw new Error("CPF/e-mail ou senha inválidos.");
  }

  const token = jwt.sign(
    {
      id: usuario.id,
      nome: usuario.nome,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "8h",
    }
  );

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      cpf: usuario.cpf,
      email: usuario.email,
    },
  };
}

module.exports = {
  login,
};