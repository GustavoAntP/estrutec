const { DataTypes } = require("sequelize");
const sequelize = require(
  "../configuracoes/banco"
);

const CavaloMecanico = sequelize.define(
  "CavaloMecanico",
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

    marca: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    modelo: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    consumo_carregado_km_l: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    consumo_vazio_km_l: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
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
    tableName: "cavalos_mecanicos",
    timestamps: true,
    underscored: true,
  }
);

module.exports = CavaloMecanico;