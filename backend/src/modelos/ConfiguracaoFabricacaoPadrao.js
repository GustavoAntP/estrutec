const { DataTypes } = require("sequelize");
const sequelize = require("../configuracoes/banco");

const ConfiguracaoFabricacaoPadrao =
  sequelize.define(
    "ConfiguracaoFabricacaoPadrao",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      fck_mpa: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0,
      },

      taxa_armadura_kg_m3: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      consumo_cimento_kg_m3: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      consumo_areia_m3_m3: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 0,
      },

      consumo_brita_m3_m3: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 0,
      },

      consumo_agua_l_m3: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      neoprene_m2_por_viga: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 0,
      },

      preco_cimento_rs_kg: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0,
      },

      preco_areia_rs_m3: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0,
      },

      preco_brita_rs_m3: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0,
      },

      preco_agua_rs_l: {
        type: DataTypes.DECIMAL(12, 6),
        allowNull: false,
        defaultValue: 0,
      },

      preco_aco_rs_kg: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0,
      },

      preco_neoprene_rs_m2: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName:
        "configuracoes_fabricacao_padrao",
      timestamps: true,
      createdAt: "criado_em",
      updatedAt: "atualizado_em",
    }
  );

module.exports =
  ConfiguracaoFabricacaoPadrao;