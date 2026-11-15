const { DataTypes } = require("sequelize");
const sequelize = require("../configuracoes/banco");
const Usuario = require("./Usuario");
const ClienteEmpresa = require("./ClienteEmpresa");

const Projeto = sequelize.define(
  "Projeto",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    codigo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    nome: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    cliente: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    cliente_empresa_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: ClienteEmpresa,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },

    responsavel: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    origem: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    destino: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    prazo: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    bdi: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },

    status: {
      type: DataTypes.ENUM(
        "RASCUNHO",
        "IMPORTACAO_PENDENTE",
        "FABRICACAO_CALCULADA",
        "LOGISTICA_CALCULADA",
        "MONTAGEM_CALCULADA",
        "FINALIZADO"
      ),
      allowNull: false,
      defaultValue: "RASCUNHO",
    },

    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Usuario,
        key: "id",
      },
    },
  },
  {
    tableName: "projetos",
    timestamps: true,
    createdAt: "criado_em",
    updatedAt: "atualizado_em",
  }
);

Usuario.hasMany(Projeto, {
  foreignKey: "usuario_id",
  as: "projetos",
});

Projeto.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario",
});

ClienteEmpresa.hasMany(Projeto, {
  foreignKey: "cliente_empresa_id",
  as: "projetos",
});

Projeto.belongsTo(ClienteEmpresa, {
  foreignKey: "cliente_empresa_id",
  as: "clienteEmpresa",
});

module.exports = Projeto;