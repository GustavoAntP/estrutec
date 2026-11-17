require("dotenv").config();

const fs = require("node:fs");
const { Sequelize } = require("sequelize");

const usarSSL = process.env.NODE_ENV === "production";

const configuracaoSSL = usarSSL
  ? {
      ssl: {
        ca: fs.readFileSync(
          process.env.DB_SSL_CA_PATH,
          "utf8"
        ),
        rejectUnauthorized: true,
      },
    }
  : {};

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    dialect: "postgres",
    logging: false,
    dialectOptions: configuracaoSSL,
  }
);

module.exports = sequelize;