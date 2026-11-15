const { DataTypes } = require("sequelize");
const sequelize = require(
  "../configuracoes/banco"
);

const Carreta = sequelize.define(
  "Carreta",
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

    placa: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },

    tipo: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    capacidade_peso_kg: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    capacidade_pecas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "carretas",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Carreta;