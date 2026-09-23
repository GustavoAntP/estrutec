const { DataTypes } = require("sequelize");
const sequelize = require("../configuracoes/banco");
const Projeto = require("./Projeto");

const ElementoProjeto = sequelize.define(
  "ElementoProjeto",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    projeto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Projeto,
        key: "id",
      },
    },

    linha_origem: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    nome_aplicacao: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    tipo: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    secao: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    aplicacao: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    largura: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },

    altura: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },

    comprimento: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },

    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    area_secao: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    peso_unitario_kg: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
  },
  {
    tableName: "elementos_projeto",
    timestamps: true,
    createdAt: "criado_em",
    updatedAt: "atualizado_em",
  }
);

Projeto.hasMany(ElementoProjeto, {
  foreignKey: "projeto_id",
  as: "elementos",
});

ElementoProjeto.belongsTo(Projeto, {
  foreignKey: "projeto_id",
  as: "projeto",
});

module.exports = ElementoProjeto;