const {
  DataTypes,
} = require("sequelize");


const sequelize =
  require("../configuracoes/banco");

const ClienteEmpresa =
  sequelize.define(
    "ClienteEmpresa",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      razao_social: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      nome_fantasia: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },

      cnpj: {
        type: DataTypes.STRING(14),
        allowNull: true,
        unique: true,
      },

      email: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },

      telefone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      cidade: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      estado: {
        type: DataTypes.STRING(2),
        allowNull: true,
      },

      ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName:
        "clientes_empresas",

      timestamps: true,

      underscored: true,
    }
  );

module.exports =
  ClienteEmpresa;