const {
  DataTypes,
} = require("sequelize");

const sequelize =
  require("../configuracoes/banco");

const RecuperacaoSenha =
  sequelize.define(
    "RecuperacaoSenha",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      token_hash: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },

      expira_em: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      utilizado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName:
        "recuperacoes_senha",

      timestamps: true,

      underscored: true,
    }
  );

module.exports =
  RecuperacaoSenha;