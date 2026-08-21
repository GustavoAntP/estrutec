const { DataTypes } = require("sequelize");
const sequelize = require("../configuracoes/banco");
const LogisticaProjeto = require("./LogisticaProjeto");

const LogisticaTerceirizada = sequelize.define(
  "LogisticaTerceirizada",
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

    empresa: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    numero_cotacao: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    validade_cotacao: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    valor_total: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },

    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "logisticas_terceirizadas",
    timestamps: true,
    createdAt: "criado_em",
    updatedAt: "atualizado_em",
  }
);

LogisticaProjeto.hasOne(LogisticaTerceirizada, {
  foreignKey: "logistica_id",
  as: "freteTerceirizado",
});

LogisticaTerceirizada.belongsTo(LogisticaProjeto, {
  foreignKey: "logistica_id",
  as: "logistica",
});

module.exports = LogisticaTerceirizada;