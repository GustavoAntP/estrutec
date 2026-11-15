const { DataTypes } = require("sequelize");
const sequelize = require("../configuracoes/banco");
const Projeto = require("./Projeto");

const PrecoFabricacao = sequelize.define(
  "PrecoFabricacao",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    projeto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: Projeto,
        key: "id",
      },
    },

    preco_cimento_kg: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
    },

    preco_areia_m3: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    preco_brita_m3: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    preco_agua_l: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
    },

    preco_aco_kg: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    preco_neoprene_m2: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
  },
  {
    tableName: "precos_fabricacao",
    timestamps: true,
    createdAt: "criado_em",
    updatedAt: "atualizado_em",
  }
);

Projeto.hasOne(PrecoFabricacao, {
  foreignKey: "projeto_id",
  as: "precosFabricacao",
});

PrecoFabricacao.belongsTo(Projeto, {
  foreignKey: "projeto_id",
  as: "projeto",
});

module.exports = PrecoFabricacao;