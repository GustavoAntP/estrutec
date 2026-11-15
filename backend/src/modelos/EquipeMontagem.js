const { DataTypes } = require("sequelize");
const sequelize = require("../configuracoes/banco");
const MontagemProjeto = require("./MontagemProjeto");

const EquipeMontagem = sequelize.define(
  "EquipeMontagem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    montagem_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: MontagemProjeto,
        key: "id",
      },
    },

    funcao: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    quantidade_trabalhadores: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    quantidade_dias: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    custo_diario_por_trabalhador: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "equipes_montagem",
    timestamps: true,
    createdAt: "criado_em",
    updatedAt: "atualizado_em",
  }
);

MontagemProjeto.hasMany(EquipeMontagem, {
  foreignKey: "montagem_id",
  as: "equipes",
});

EquipeMontagem.belongsTo(MontagemProjeto, {
  foreignKey: "montagem_id",
  as: "montagem",
});

module.exports = EquipeMontagem;