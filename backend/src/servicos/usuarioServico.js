const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const Usuario = require("../modelos/Usuario");
const { cpfValido } = require("../utilitarios/validadores");

async function cadastrarUsuario(dados) {
  const { nome, cpf, email, senha, perfil } = dados;

  if (!nome || !cpf || !email || !senha) {
    throw new Error("Nome, CPF, e-mail e senha são obrigatórios.");
  }

  // Remove pontos, traços e outros caracteres do CPF
  const cpfLimpo = cpf.replace(/\D/g, "");

  if (cpfLimpo.length !== 11) {
    throw new Error("CPF deve conter 11 números.");
  }

 /*if (!cpfValido(cpfLimpo)) {
   throw new Error("CPF inválido.");
  }*/

  const perfisPermitidos = [
    "ADMINISTRADOR",
    "OPERADOR",
  ];

  if (
    perfil &&
    !perfisPermitidos.includes(perfil)
  ) {
    throw new Error(
      "Perfil de usuário inválido."
    );
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
    perfil: perfil || "OPERADOR",
  });

  return {
    id: usuario.id,
    nome: usuario.nome,
    cpf: usuario.cpf,
    email: usuario.email,
    ativo: usuario.ativo,
    perfil: usuario.perfil,
  };
}

async function listarUsuarios() {
  const usuarios =
    await Usuario.findAll({
      attributes: [
        "id",
        "nome",
        "cpf",
        "email",
        "ativo",
        "perfil",
      ],

      order: [
        ["nome", "ASC"],
      ],
    });

  return usuarios;
}

async function editarUsuario(id, dados) {
  const usuario = await Usuario.findByPk(id);

  if (!usuario) {
    throw new Error("Usuário não encontrado.");
  }

  const {
    nome,
    cpf,
    email,
    perfil,
  } = dados;

  if (!nome || !cpf || !email || !perfil) {
    throw new Error(
      "Nome, CPF, e-mail e perfil são obrigatórios."
    );
  }

  const cpfLimpo = cpf.replace(/\D/g, "");

  if (cpfLimpo.length !== 11) {
    throw new Error(
      "CPF deve conter 11 números."
    );
  }

  /*if (!cpfValido(cpfLimpo)) {
    throw new Error("CPF inválido.");
  }*/

  const emailNormalizado =
    email.trim().toLowerCase();

  const perfisPermitidos = [
    "ADMINISTRADOR",
    "OPERADOR",
  ];

  if (!perfisPermitidos.includes(perfil)) {
    throw new Error(
      "Perfil de usuário inválido."
    );
  }

  const usuarioExistente =
    await Usuario.findOne({
      where: {
        id: {
          [Op.ne]: usuario.id,
        },

        [Op.or]: [
          { cpf: cpfLimpo },
          { email: emailNormalizado },
        ],
      },
    });

  if (usuarioExistente) {
    throw new Error(
      "CPF ou e-mail já cadastrado para outro usuário."
    );
  }

  usuario.nome = nome.trim();
  usuario.cpf = cpfLimpo;
  usuario.email = emailNormalizado;
  usuario.perfil = perfil;

  await usuario.save();

  return {
    id: usuario.id,
    nome: usuario.nome,
    cpf: usuario.cpf,
    email: usuario.email,
    ativo: usuario.ativo,
    perfil: usuario.perfil,
  };
}

async function alterarStatusUsuario(
  id,
  ativo,
  usuarioLogadoId
) {
  const usuario = await Usuario.findByPk(id);

  if (!usuario) {
    throw new Error("Usuário não encontrado.");
  }

  if (typeof ativo !== "boolean") {
    throw new Error(
      "O campo ativo deve ser verdadeiro ou falso."
    );
  }

  if (
    Number(usuario.id) ===
      Number(usuarioLogadoId) &&
    ativo === false
  ) {
    throw new Error(
      "Você não pode desativar sua própria conta."
    );
  }

  usuario.ativo = ativo;

  await usuario.save();

  return {
    id: usuario.id,
    nome: usuario.nome,
    cpf: usuario.cpf,
    email: usuario.email,
    ativo: usuario.ativo,
    perfil: usuario.perfil,
  };
}

module.exports = {
  cadastrarUsuario,
  listarUsuarios,
  editarUsuario,
  alterarStatusUsuario,
};