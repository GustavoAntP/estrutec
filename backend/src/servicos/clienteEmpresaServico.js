const { Op } = require("sequelize");
const ClienteEmpresa = require("../modelos/ClienteEmpresa");

async function cadastrarClienteEmpresa(dados) {
  const {
    razao_social,
    nome_fantasia,
    cnpj,
    email,
    telefone,
    cidade,
    estado,
  } = dados;

  if (!razao_social) {
    throw new Error(
      "A razão social é obrigatória."
    );
  }

  let cnpjLimpo = null;

  if (cnpj) {
    cnpjLimpo = cnpj.replace(/\D/g, "");

    if (cnpjLimpo.length !== 14) {
      throw new Error(
        "CNPJ deve conter 14 números."
      );
    }

    const clienteExistente =
      await ClienteEmpresa.findOne({
        where: {
          cnpj: cnpjLimpo,
        },
      });

    if (clienteExistente) {
      throw new Error(
        "Já existe uma empresa cadastrada com este CNPJ."
      );
    }
  }

  const cliente =
    await ClienteEmpresa.create({
      razao_social:
        razao_social.trim(),

      nome_fantasia:
        nome_fantasia?.trim() || null,

      cnpj: cnpjLimpo,

      email:
        email?.trim().toLowerCase() ||
        null,

      telefone:
        telefone?.trim() || null,

      cidade:
        cidade?.trim() || null,

      estado:
        estado
          ? estado.trim().toUpperCase()
          : null,
    });

  return cliente;
}

async function listarClientesEmpresas() {
  const clientes =
    await ClienteEmpresa.findAll({
      order: [
        ["razao_social", "ASC"],
      ],
    });

  return clientes;
}

async function editarClienteEmpresa(
  id,
  dados
) {
  const cliente =
    await ClienteEmpresa.findByPk(id);

  if (!cliente) {
    throw new Error(
      "Empresa cliente não encontrada."
    );
  }

  const {
    razao_social,
    nome_fantasia,
    cnpj,
    email,
    telefone,
    cidade,
    estado,
  } = dados;

  if (!razao_social) {
    throw new Error(
      "A razão social é obrigatória."
    );
  }

  let cnpjLimpo = null;

  if (cnpj) {
    cnpjLimpo =
      cnpj.replace(/\D/g, "");

    if (cnpjLimpo.length !== 14) {
      throw new Error(
        "CNPJ deve conter 14 números."
      );
    }

    const clienteExistente =
      await ClienteEmpresa.findOne({
        where: {
          id: {
            [Op.ne]: cliente.id,
          },

          cnpj: cnpjLimpo,
        },
      });

    if (clienteExistente) {
      throw new Error(
        "Já existe outra empresa cadastrada com este CNPJ."
      );
    }
  }

  cliente.razao_social =
    razao_social.trim();

  cliente.nome_fantasia =
    nome_fantasia?.trim() || null;

  cliente.cnpj =
    cnpjLimpo;

  cliente.email =
    email?.trim().toLowerCase() ||
    null;

  cliente.telefone =
    telefone?.trim() || null;

  cliente.cidade =
    cidade?.trim() || null;

  cliente.estado =
    estado
      ? estado.trim().toUpperCase()
      : null;

  await cliente.save();

  return cliente;
}

async function excluirClienteEmpresa(id) {
  const cliente =
    await ClienteEmpresa.findByPk(id);

  if (!cliente) {
    throw new Error(
      "Empresa cliente não encontrada."
    );
  }

  await cliente.destroy();

  return {
    mensagem:
      "Empresa cliente excluída com sucesso!",
  };
}

module.exports = {
  cadastrarClienteEmpresa,
  listarClientesEmpresas,
  editarClienteEmpresa,
  excluirClienteEmpresa,
};