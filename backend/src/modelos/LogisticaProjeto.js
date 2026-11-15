const { DataTypes } = require("sequelize");
const sequelize = require("../configuracoes/banco");
const Projeto = require("./Projeto");

const LogisticaProjeto = sequelize.define(
  "LogisticaProjeto",
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

    tipo_frete: {
      type: DataTypes.ENUM(
        "PROPRIO",
        "TERCEIRIZADO"
      ),
      allowNull: false,
    },

    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "logisticas_projeto",
    timestamps: true,
    createdAt: "criado_em",
    updatedAt: "atualizado_em",
  }
);

Projeto.hasOne(LogisticaProjeto, {
  foreignKey: "projeto_id",
  as: "logistica",
});

LogisticaProjeto.belongsTo(Projeto, {
  foreignKey: "projeto_id",
  as: "projeto",
});

module.exports = LogisticaProjeto;