const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const Usuario = require("../modelos/Usuario");
const { cpfValido } = require("../utilitarios/validadores");

async function cadastrarUsuario(dados) {
  const { nome, cpf, email, senha } = dados;

  if (!nome || !cpf || !email || !senha) {
    throw new Error("Nome, CPF, e-mail e senha são obrigatórios.");
  }

  // Remove pontos, traços e outros caracteres do CPF
  const cpfLimpo = cpf.replace(/\D/g, "");

  if (cpfLimpo.length !== 11) {
    throw new Error("CPF deve conter 11 números.");
  }

 if (!cpfValido(cpfLimpo)) {
   throw new Error("CPF inválido.");
  }

  const emailNormalizado = email.trim().toLowerCase();

  const usuarioExistente = await Usuario.findOne({
    where: {
      [Op.or]: [
        { cpf: cpfLimpo },
        { email: emailNormalizado },
      ],
    },
  });

  if (usuarioExistente) {
    throw new Error("CPF ou e-mail já cadastrado.");
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const usuario = await Usuario.create({
    nome: nome.trim(),
    cpf: cpfLimpo,
    email: emailNormalizado,
    senha_hash: senhaHash,
  });

  return {
    id: usuario.id,
    nome: usuario.nome,
    cpf: usuario.cpf,
    email: usuario.email,
    ativo: usuario.ativo,
  };
}

module.exports = {
  cadastrarUsuario,
};