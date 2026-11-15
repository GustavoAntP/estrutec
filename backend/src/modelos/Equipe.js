const { DataTypes } = require("sequelize");
const sequelize = require("../configuracoes/banco");

const Equipe = sequelize.define(
  "Equipe",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    nome: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    quantidade_padrao: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    custo_diario_padrao: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "equipes",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Equipe;