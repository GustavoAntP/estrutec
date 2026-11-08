require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcrypt");

// Sem JWT_SECRET o servidor subia normalmente e so quebrava no primeiro login,
// com um erro do jsonwebtoken que nao diz o que esta faltando.
if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET nao configurada. Copie backend/.env.example para backend/.env e preencha. " +
      "Gere uma com: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
  );
}

const sequelize = require("./configuracoes/banco");
// Modelos
const Usuario = require("./modelos/Usuario");
const Projeto = require("./modelos/Projeto");
const ElementoProjeto = require("./modelos/ElementoProjeto");
const ConfiguracaoFabricacao = require("./modelos/ConfiguracaoFabricacao");
const PrecoFabricacao = require("./modelos/PrecoFabricacao");
const LogisticaProjeto = require("./modelos/LogisticaProjeto");
const LogisticaTerceirizada = require("./modelos/LogisticaTerceirizada");
const LogisticaPropria = require("./modelos/LogisticaPropria");
const MontagemProjeto = require("./modelos/MontagemProjeto");
const EquipamentoMontagem = require("./modelos/EquipamentoMontagem");
const EquipeMontagem = require("./modelos/EquipeMontagem");
const recuperacaoSenhaRotas = require("./rotas/recuperacaoSenhaRotas");
const ClienteEmpresa = require("./modelos/ClienteEmpresa");

// Rotas
const usuarioRotas = require("./rotas/usuarioRotas");
const authRotas = require("./rotas/authRotas");
const projetoRotas = require("./rotas/projetoRotas");
const clienteEmpresaRotas = require("./rotas/clienteEmpresaRotas");

const app = express();

app.use(helmet());

// Apenas a origem do frontend, definida no .env
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  })
);

app.use(express.json());

// Protecao contra forca bruta nas rotas de autenticacao
const limiteAutenticacao = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    erro: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  },
});

app.use("/auth", limiteAutenticacao);
app.use("/usuarios", usuarioRotas);
app.use("/auth", authRotas);
app.use("/projetos", projetoRotas);
app.use("/auth",recuperacaoSenhaRotas);
app.use("/clientes", clienteEmpresaRotas);




app.get("/", (req, res) => {
  res.json({
    mensagem: "API do Estrutec funcionando!",
  });
});

// Tratamento centralizado de erros. Sem isto, o que escapa dos controladores
// (ex.: multer no upload de planilha) volta como HTML de stack trace.
app.use((erro, req, res, proximo) => {
  if (erro.name === "MulterError" || erro.status === 400) {
    return res.status(400).json({
      erro: erro.message,
    });
  }

  console.error("Erro nao tratado:", erro);

  res.status(500).json({
    erro: "Erro interno do servidor.",
  });
});

const PORTA = process.env.PORT || 3001;

async function garantirSuperAdmin() {
  const count = await Usuario.count();
  if (count === 0) {
    const senhaHash = await bcrypt.hash(process.env.ADMIN_SENHA || "123456", 10);
    await Usuario.create({
      nome: "Administrador Inicial",
      cpf: process.env.ADMIN_CPF || "00000000000",
      email: process.env.ADMIN_EMAIL || "admin@estrutec.com",
      senha_hash: senhaHash,
      perfil: "ADMINISTRADOR",
      ativo: true,
    });
    console.log("Usuário administrador inicial criado com sucesso!");
  }
}

async function iniciarServidor() {
  try {
    await sequelize.authenticate();
    console.log("Conexão com o PostgreSQL realizada com sucesso!");

    await sequelize.sync();
    console.log("Tabelas sincronizadas com sucesso!");

    await garantirSuperAdmin();

    app.listen(PORTA, () => {
      console.log(`Servidor Estrutec rodando na porta ${PORTA}`);
    });
  } catch (erro) {
    console.error("Erro ao conectar com o PostgreSQL:");
    console.error(erro);
  }
}

iniciarServidor();