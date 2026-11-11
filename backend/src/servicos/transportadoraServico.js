const { Op } = require("sequelize");
const Transportadora = require("../modelos/Transportadora");

async function cadastrarTransportadora(dados) {
  const {
    razao_social,
    nome_fantasia,
    cnpj,
    email,
    telefone,
    cidade,
    estado,
    observacoes,
  } = dados;

  if (!razao_social || !razao_social.trim()) {
    throw new Error("Informe a razão social da transportadora.");
  }

  let cnpjLimpo = null;

  if (cnpj) {
    cnpjLimpo = cnpj.replace(/\D/g, "");

    if (cnpjLimpo.length !== 14) {
      throw new Error("O CNPJ deve possuir 14 dígitos.");
    }

    const existente = await Transportadora.findOne({
      where: {
        cnpj: cnpjLimpo,
      },
    });

    if (existente) {
      throw new Error("Já existe uma transportadora com este CNPJ.");
    }
  }

  return Transportadora.create({
    razao_social: razao_social.trim(),
    nome_fantasia: nome_fantasia?.trim() || null,
    cnpj: cnpjLimpo,
    email: email?.trim().toLowerCase() || null,
    telefone: telefone?.trim() || null,
    cidade: cidade?.trim() || null,
    estado: estado?.trim().toUpperCase() || null,
    observacoes: observacoes?.trim() || null,
  });
}

async function listarTransportadoras() {
  return Transportadora.findAll({
    order: [["razao_social", "ASC"]],
  });
}

async function editarTransportadora(id, dados) {
  const transportadora = await Transportadora.findByPk(id);

  if (!transportadora) {
    throw new Error("Transportadora não encontrada.");
  }

  const {
    razao_social,
    nome_fantasia,
    cnpj,
    email,
    telefone,
    cidade,
    estado,
    observacoes,
  } = dados;

  if (!razao_social || !razao_social.trim()) {
    throw new Error("Informe a razão social da transportadora.");
  }

  let cnpjLimpo = null;

  if (cnpj) {
    cnpjLimpo = cnpj.replace(/\D/g, "");

    if (cnpjLimpo.length !== 14) {
      throw new Error("O CNPJ deve possuir 14 dígitos.");
    }

    const existente = await Transportadora.findOne({
      where: {
        cnpj: cnpjLimpo,
        id: {
          [Op.ne]: id,
        },
      },
    });

    if (existente) {
      throw new Error("Já existe uma transportadora com este CNPJ.");
    }
  }

  await transportadora.update({
    razao_social: razao_social.trim(),
    nome_fantasia: nome_fantasia?.trim() || null,
    cnpj: cnpjLimpo,
    email: email?.trim().toLowerCase() || null,
    telefone: telefone?.trim() || null,
    cidade: cidade?.trim() || null,
    estado: estado?.trim().toUpperCase() || null,
    observacoes: observacoes?.trim() || null,
  });

  return transportadora;
}

async function alterarStatusTransportadora(id, ativo) {
  const transportadora = await Transportadora.findByPk(id);

  if (!transportadora) {
    throw new Error("Transportadora não encontrada.");
  }

  await transportadora.update({
    ativo: Boolean(ativo),
  });

  return transportadora;
}

module.exports = {
  cadastrarTransportadora,
  listarTransportadoras,
  editarTransportadora,
  alterarStatusTransportadora,
};