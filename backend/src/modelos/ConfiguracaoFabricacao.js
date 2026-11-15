const { DataTypes } = require("sequelize");
const sequelize = require("../configuracoes/banco");
const Projeto = require("./Projeto");

const ConfiguracaoFabricacao = sequelize.define(
  "ConfiguracaoFabricacao",
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

    fck_mpa: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
    },

    taxa_armadura_kg_m3: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    desperdicio_percentual: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },

    consumo_cimento_kg_m3: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    consumo_areia_m3_m3: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
    },

    consumo_brita_m3_m3: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
    },

    consumo_agua_l_m3: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    neoprene_m2_por_viga: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
  },
  {
    tableName: "configuracoes_fabricacao",
    timestamps: true,
    createdAt: "criado_em",
    updatedAt: "atualizado_em",
  }
);

Projeto.hasOne(ConfiguracaoFabricacao, {
  foreignKey: "projeto_id",
  as: "configuracaoFabricacao",
});

ConfiguracaoFabricacao.belongsTo(Projeto, {
  foreignKey: "projeto_id",
  as: "projeto",
});

module.exports = ConfiguracaoFabricacao;