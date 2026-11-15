const { DataTypes } = require("sequelize");
const sequelize = require("../configuracoes/banco");
const LogisticaProjeto = require("./LogisticaProjeto");

const LogisticaPropria = sequelize.define(
  "LogisticaPropria",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    logistica_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: LogisticaProjeto,
        key: "id",
      },
    },

    distancia_ida_km: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    considerar_ida_volta: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    quantidade_viagens: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    cavalo_mecanico: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    carreta: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    capacidade_pecas: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    capacidade_peso_kg: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },

    consumo_carregado_km_l: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },

    consumo_vazio_km_l: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },

    preco_diesel_l: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    pedagios: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    custo_motorista_por_viagem: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    alimentacao_motorista_por_viagem: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    manutencao_por_km: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 0,
    },

    custo_carregamento_por_viagem: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    custo_descarregamento_por_viagem: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    seguro: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    outros_custos: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "logisticas_proprias",
    timestamps: true,
    createdAt: "criado_em",
    updatedAt: "atualizado_em",
  }
);

LogisticaProjeto.hasOne(LogisticaPropria, {
  foreignKey: "logistica_id",
  as: "freteProprio",
});

LogisticaPropria.belongsTo(LogisticaProjeto, {
  foreignKey: "logistica_id",
  as: "logistica",
});

module.exports = LogisticaPropria;