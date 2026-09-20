const Projeto = require("../modelos/Projeto");
const { Op } = require("sequelize");

async function cadastrarProjeto(dados, usuarioId) {
  const {
    codigo,
    nome,
    cliente,
    responsavel,
    origem,
    destino,
    prazo,
    bdi,
    observacoes,
  } = dados;

  if (!codigo || !nome || !cliente || !destino) {
    throw new Error(
      "Código, nome do projeto, cliente e destino são obrigatórios."
    );
  }

  const projetoExistente = await Projeto.findOne({
    where: {
      codigo: codigo.trim(),
    },
  });

  if (projetoExistente) {
    throw new Error("Já existe um projeto com este código.");
  }

  const projeto = await Projeto.create({
    codigo: codigo.trim(),
    nome: nome.trim(),
    cliente: cliente.trim(),
    responsavel: responsavel?.trim() || null,
    origem: origem?.trim() || null,
    destino: destino.trim(),
    prazo: prazo || null,
    bdi: bdi ?? 0,
    observacoes: observacoes?.trim() || null,
    usuario_id: usuarioId,
  });

  return projeto;
}

async function listarProjetos(usuarioId) {
  const projetos = await Projeto.findAll({
    where: {
      usuario_id: usuarioId,
    },
    order: [["criado_em", "DESC"]],
  });

  return projetos;
}

async function buscarProjetoPorId(id, usuarioId) {
  const projeto = await Projeto.findOne({
    where: {
      id,
      usuario_id: usuarioId,
    },
  });

  if (!projeto) {
    throw new Error("Projeto não encontrado.");
  }

  return projeto;
}

async function atualizarProjeto(id, dados, usuarioId) {
  const projeto = await Projeto.findOne({
    where: {
      id,
      usuario_id: usuarioId,
    },
  });

  if (!projeto) {
    throw new Error("Projeto não encontrado.");
  }

  const {
    codigo,
    nome,
    cliente,
    responsavel,
    origem,
    destino,
    prazo,
    bdi,
    observacoes,
  } = dados;

  if (codigo) {
    const projetoComMesmoCodigo = await Projeto.findOne({
      where: {
        codigo: codigo.trim(),
        id: {
          [Op.ne]: id,
        },
      },
    });

    if (projetoComMesmoCodigo) {
      throw new Error("Já existe outro projeto com este código.");
    }
  }

  await projeto.update({
    codigo: codigo?.trim() ?? projeto.codigo,
    nome: nome?.trim() ?? projeto.nome,
    cliente: cliente?.trim() ?? projeto.cliente,
    responsavel:
      responsavel !== undefined
        ? responsavel?.trim() || null
        : projeto.responsavel,

    origem:
      origem !== undefined
        ? origem?.trim() || null
        : projeto.origem,

    destino: destino?.trim() ?? projeto.destino,

    prazo:
      prazo !== undefined
        ? prazo || null
        : projeto.prazo,

    bdi:
      bdi !== undefined
        ? bdi
        : projeto.bdi,

    observacoes:
      observacoes !== undefined
        ? observacoes?.trim() || null
        : projeto.observacoes,
  });

  return projeto;
}

async function excluirProjeto(id, usuarioId) {
  const projeto = await Projeto.findOne({
    where: {
      id,
      usuario_id: usuarioId,
    },
  });

  if (!projeto) {
    throw new Error("Projeto não encontrado.");
  }

  await projeto.destroy();

  return true;
}

module.exports = {
  cadastrarProjeto,
  listarProjetos,
  buscarProjetoPorId,
  atualizarProjeto,
  excluirProjeto,
};