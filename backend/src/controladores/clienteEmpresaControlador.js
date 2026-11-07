const clienteEmpresaServico =
  require("../servicos/clienteEmpresaServico");

async function cadastrar(req, res) {
  try {
    const cliente =
      await clienteEmpresaServico
        .cadastrarClienteEmpresa(
          req.body
        );

    return res.status(201).json({
      mensagem:
        "Empresa cliente cadastrada com sucesso!",
      cliente,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function listar(req, res) {
  try {
    const clientes =
      await clienteEmpresaServico
        .listarClientesEmpresas();

    return res.status(200).json({
      clientes,
    });
  } catch (erro) {
    console.error(
      "Erro ao listar empresas clientes:",
      erro
    );

    return res.status(500).json({
      erro:
        "Não foi possível listar as empresas clientes.",
    });
  }
}

async function editar(req, res) {
  try {
    const cliente =
      await clienteEmpresaServico
        .editarClienteEmpresa(
          req.params.id,
          req.body
        );

    return res.status(200).json({
      mensagem:
        "Empresa cliente atualizada com sucesso!",
      cliente,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function editar(req, res) {
  try {
    const cliente =
      await clienteEmpresaServico
        .editarClienteEmpresa(
          req.params.id,
          req.body
        );

    return res.status(200).json({
      mensagem:
        "Empresa cliente atualizada com sucesso!",
      cliente,
    });
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

async function excluir(req, res) {
  try {
    const resultado =
      await clienteEmpresaServico
        .excluirClienteEmpresa(
          req.params.id
        );

    return res.status(200).json(
      resultado
    );
  } catch (erro) {
    return res.status(400).json({
      erro: erro.message,
    });
  }
}

module.exports = {
  cadastrar,
  listar,
  editar,
  excluir,
};