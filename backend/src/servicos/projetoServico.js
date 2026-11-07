const Projeto = require("../modelos/Projeto");
const ClienteEmpresa = require("../modelos/ClienteEmpresa");
const { Op } = require("sequelize");

async function buscarClienteEmpresa(clienteEmpresaId) {
  if (!clienteEmpresaId) {
    return null;
  }

  const clienteEmpresa =
    await ClienteEmpresa.findByPk(
      clienteEmpresaId
    );

  if (!clienteEmpresa) {
    throw new Error(
      "Empresa cliente não encontrada."
    );
  }

  if (!clienteEmpresa.ativo) {
    throw new Error(
      "A empresa cliente selecionada está inativa."
    );
  }

  return clienteEmpresa;
}

async function cadastrarProjeto(
  dados,
  usuarioId
) {
  const {
    codigo,
    nome,
    cliente,
    cliente_empresa_id,
    responsavel,
    origem,
    destino,
    prazo,
    bdi,
    observacoes,
  } = dados;

  if (
    !codigo ||
    !nome ||
    !destino
  ) {
    throw new Error(
      "Código, nome do projeto e destino são obrigatórios."
    );
  }

  if (
    !cliente_empresa_id &&
    !cliente
  ) {
    throw new Error(
      "Informe uma empresa cliente."
    );
  }

  const projetoExistente =
    await Projeto.findOne({
      where: {
        codigo: codigo.trim(),
      },
    });

  if (projetoExistente) {
    throw new Error(
      "Já existe um projeto com este código."
    );
  }

  let clienteEmpresa = null;

  if (cliente_empresa_id) {
    clienteEmpresa =
      await buscarClienteEmpresa(
        cliente_empresa_id
      );
  }

  const nomeCliente =
    clienteEmpresa
      ? clienteEmpresa.nome_fantasia ||
        clienteEmpresa.razao_social
      : cliente.trim();

  const projeto =
    await Projeto.create({
      codigo: codigo.trim(),

      nome: nome.trim(),

      cliente: nomeCliente,

      cliente_empresa_id:
        clienteEmpresa
          ? clienteEmpresa.id
          : null,

      responsavel:
        responsavel?.trim() || null,

      origem:
        origem?.trim() || null,

      destino:
        destino.trim(),

      prazo:
        prazo || null,

      bdi:
        bdi ?? 0,

      observacoes:
        observacoes?.trim() || null,

      usuario_id:
        usuarioId,
    });

  return projeto;
}

async function listarProjetos(
  usuarioId
) {
  const projetos =
    await Projeto.findAll({
      where: {
        usuario_id: usuarioId,
      },

      include: [
        {
          model: ClienteEmpresa,
          as: "clienteEmpresa",

          attributes: [
            "id",
            "razao_social",
            "nome_fantasia",
            "cnpj",
          ],

          required: false,
        },
      ],

      order: [
        ["criado_em", "DESC"],
      ],
    });

  return projetos;
}

async function buscarProjetoPorId(
  id,
  usuarioId
) {
  const projeto =
    await Projeto.findOne({
      where: {
        id,
        usuario_id: usuarioId,
      },

      include: [
        {
          model: ClienteEmpresa,
          as: "clienteEmpresa",

          attributes: [
            "id",
            "razao_social",
            "nome_fantasia",
            "cnpj",
            "email",
            "telefone",
            "cidade",
            "estado",
          ],

          required: false,
        },
      ],
    });

  if (!projeto) {
    throw new Error(
      "Projeto não encontrado."
    );
  }

  return projeto;
}

async function atualizarProjeto(
  id,
  dados,
  usuarioId
) {
  const projeto =
    await Projeto.findOne({
      where: {
        id,
        usuario_id: usuarioId,
      },
    });

  if (!projeto) {
    throw new Error(
      "Projeto não encontrado."
    );
  }

  const {
    codigo,
    nome,
    cliente,
    cliente_empresa_id,
    responsavel,
    origem,
    destino,
    prazo,
    bdi,
    observacoes,
  } = dados;

  if (codigo) {
    const projetoComMesmoCodigo =
      await Projeto.findOne({
        where: {
          codigo: codigo.trim(),

          id: {
            [Op.ne]: id,
          },
        },
      });

    if (projetoComMesmoCodigo) {
      throw new Error(
        "Já existe outro projeto com este código."
      );
    }
  }

  let novoClienteEmpresaId =
    projeto.cliente_empresa_id;

  let novoNomeCliente =
    projeto.cliente;

  if (
    cliente_empresa_id !==
    undefined
  ) {
    if (cliente_empresa_id) {
      const clienteEmpresa =
        await buscarClienteEmpresa(
          cliente_empresa_id
        );

      novoClienteEmpresaId =
        clienteEmpresa.id;

      novoNomeCliente =
        clienteEmpresa.nome_fantasia ||
        clienteEmpresa.razao_social;
    } else {
      novoClienteEmpresaId = null;

      if (cliente) {
        novoNomeCliente =
          cliente.trim();
      }
    }
  } else if (cliente) {
    novoNomeCliente =
      cliente.trim();
  }

  await projeto.update({
    codigo:
      codigo?.trim() ??
      projeto.codigo,

    nome:
      nome?.trim() ??
      projeto.nome,

    cliente:
      novoNomeCliente,

    cliente_empresa_id:
      novoClienteEmpresaId,

    responsavel:
      responsavel !== undefined
        ? responsavel?.trim() ||
          null
        : projeto.responsavel,

    origem:
      origem !== undefined
        ? origem?.trim() ||
          null
        : projeto.origem,

    destino:
      destino?.trim() ??
      projeto.destino,

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
        ? observacoes?.trim() ||
          null
        : projeto.observacoes,
  });

  return buscarProjetoPorId(
    projeto.id,
    usuarioId
  );
}

async function excluirProjeto(
  id,
  usuarioId
) {
  const projeto =
    await Projeto.findOne({
      where: {
        id,
        usuario_id: usuarioId,
      },
    });

  if (!projeto) {
    throw new Error(
      "Projeto não encontrado."
    );
  }

  await projeto.destroy();

  return true;
}

async function reabrirProjeto(
  projetoId,
  usuarioId
) {
  const projeto =
    await Projeto.findOne({
      where: {
        id: projetoId,
        usuario_id: usuarioId,
      },
    });

  if (!projeto) {
    throw new Error(
      "Projeto não encontrado."
    );
  }

  if (
    projeto.status !==
    "FINALIZADO"
  ) {
    throw new Error(
      "Somente projetos finalizados podem ser reabertos."
    );
  }

  await projeto.update({
    status:
      "MONTAGEM_CALCULADA",
  });

  return projeto;
}

module.exports = {
  cadastrarProjeto,
  listarProjetos,
  buscarProjetoPorId,
  atualizarProjeto,
  excluirProjeto,
  reabrirProjeto,
};