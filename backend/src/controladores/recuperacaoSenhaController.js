const crypto =
  require("crypto");

const bcrypt =
  require("bcrypt");

const { Op } =
  require("sequelize");

const Usuario =
  require("../modelos/Usuario");

const RecuperacaoSenha =
  require("../modelos/RecuperacaoSenha");

const {
  enviarEmailRecuperacao,
} =
  require("../servicos/emailServico");

const MENSAGEM_PADRAO =
  "Se os dados informados estiverem cadastrados, enviaremos as instruções de recuperação para o e-mail associado à conta.";

async function solicitarRecuperacao(
  req,
  res
) {
  try {
    const {
      identificador,
    } = req.body;

    if (
      !identificador ||
      !identificador.trim()
    ) {
      return res.status(400).json({
        erro:
          "Informe seu CPF ou e-mail.",
      });
    }

    const valor =
      identificador.trim();

    const usuario =
      await Usuario.findOne({
        where: {
          [Op.or]: [
            {
              email: valor,
            },
            {
              cpf: valor,
            },
          ],
        },
      });

    /*
     * Não informamos se o usuário
     * existe ou não.
     */
    if (
      !usuario ||
      !usuario.ativo
    ) {
      return res.json({
        mensagem:
          MENSAGEM_PADRAO,
      });
    }

    /*
     * Invalida solicitações
     * anteriores ainda abertas.
     */
    await RecuperacaoSenha.update(
      {
        utilizado: true,
      },
      {
        where: {
          usuario_id:
            usuario.id,

          utilizado: false,
        },
      }
    );

    const token =
      crypto
        .randomBytes(32)
        .toString("hex");

    const tokenHash =
      crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const expiraEm =
      new Date(
        Date.now() +
          30 * 60 * 1000
      );

    await RecuperacaoSenha.create({
      usuario_id:
        usuario.id,

      token_hash:
        tokenHash,

      expira_em:
        expiraEm,

      utilizado:
        false,
    });

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:3000";

    const link =
      `${frontendUrl}/redefinir-senha?token=${token}`;

    try {
      await enviarEmailRecuperacao({
        destinatario:
          usuario.email,

        nome:
          usuario.nome,

        link,
      });
    } catch (erroEmail) {
      console.error(
        "Erro ao enviar e-mail de recuperação:",
        erroEmail
      );
    }

    return res.json({
      mensagem:
        MENSAGEM_PADRAO,
    });
  } catch (erro) {
    console.error(
      "Erro ao solicitar recuperação:",
      erro
    );

    return res.status(500).json({
      erro:
        "Não foi possível processar a solicitação.",
    });
  }
}
async function redefinirSenha(
  req,
  res
) {
  try {
    const {
      token,
      novaSenha,
    } = req.body;

    if (!token || !novaSenha) {
      return res.status(400).json({
        erro:
          "Token e nova senha são obrigatórios.",
      });
    }

    if (novaSenha.length < 8) {
      return res.status(400).json({
        erro:
          "A nova senha deve possuir pelo menos 8 caracteres.",
      });
    }

    const tokenHash =
      crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const recuperacao =
      await RecuperacaoSenha.findOne({
        where: {
          token_hash:
            tokenHash,

          utilizado:
            false,
        },
      });

    if (!recuperacao) {
      return res.status(400).json({
        erro:
          "O link de recuperação é inválido ou já foi utilizado.",
      });
    }

    if (
      new Date(
        recuperacao.expira_em
      ) < new Date()
    ) {
      await recuperacao.update({
        utilizado: true,
      });

      return res.status(400).json({
        erro:
          "O link de recuperação expirou. Solicite um novo link.",
      });
    }

    const usuario =
      await Usuario.findByPk(
        recuperacao.usuario_id
      );

    if (!usuario) {
      return res.status(400).json({
        erro:
          "Não foi possível redefinir a senha.",
      });
    }

    const senhaHash =
      await bcrypt.hash(
        novaSenha,
        10
      );

    await usuario.update({
      senha_hash:
        senhaHash,
    });

    await recuperacao.update({
      utilizado: true,
    });

    return res.json({
      mensagem:
        "Senha redefinida com sucesso.",
    });
  } catch (erro) {
    console.error(
      "Erro ao redefinir senha:",
      erro
    );

    return res.status(500).json({
      erro:
        "Não foi possível redefinir a senha.",
    });
  }
}

module.exports = {
  solicitarRecuperacao,
  redefinirSenha,
};