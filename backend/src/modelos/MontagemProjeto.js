const { DataTypes } = require("sequelize");
const sequelize = require("../configuracoes/banco");
const Projeto = require("./Projeto");

const MontagemProjeto = sequelize.define(
  "MontagemProjeto",
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

    custo_hospedagem: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    custo_alimentacao: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    custo_transporte_equipe: {
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
    tableName: "montagens_projeto",
    timestamps: true,
    createdAt: "criado_em",
    updatedAt: "atualizado_em",
  }
);

Projeto.hasOne(MontagemProjeto, {
  foreignKey: "projeto_id",
  as: "montagem",
});

MontagemProjeto.belongsTo(Projeto, {
  foreignKey: "projeto_id",
  as: "projeto",
});

module.exports = MontagemProjeto;