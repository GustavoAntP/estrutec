const { DataTypes } = require("sequelize");
const sequelize = require("../configuracoes/banco");
const MontagemProjeto = require("./MontagemProjeto");

const EquipamentoMontagem = sequelize.define(
  "EquipamentoMontagem",
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

    nome: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    tipo_cobranca: {
      type: DataTypes.ENUM(
        "HORA",
        "DIA"
      ),
      allowNull: false,
    },

    tempo_uso: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    valor_unitario: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    custo_mobilizacao: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    custo_desmobilizacao: {
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
    tableName: "equipamentos_montagem",
    timestamps: true,
    createdAt: "criado_em",
    updatedAt: "atualizado_em",
  }
);

MontagemProjeto.hasMany(EquipamentoMontagem, {
  foreignKey: "montagem_id",
  as: "equipamentos",
});

EquipamentoMontagem.belongsTo(MontagemProjeto, {
  foreignKey: "montagem_id",
  as: "montagem",
});

module.exports = EquipamentoMontagem;