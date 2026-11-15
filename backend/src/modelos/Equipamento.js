const { DataTypes } = require("sequelize");
const sequelize = require("../configuracoes/banco");

const Equipamento = sequelize.define(
  "Equipamento",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    nome: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    tipo_cobranca: {
      type: DataTypes.ENUM(
        "HORA",
        "DIA"
      ),
      allowNull: false,
      defaultValue: "DIA",
    },

    valor_padrao: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    mobilizacao_padrao: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    desmobilizacao_padrao: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "equipamentos",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Equipamento;