<div align="center">

<img src="frontend/src/app/icon.png" alt="Logo ESTRUTEC" width="100"/>

# ESTRUTEC

### Sistema de Orçamentação e Planejamento de Estruturas Pré-Moldadas

**Engenharia de Software**

</div>

---

## 📌 Sobre o projeto

O **ESTRUTEC** é um sistema web desenvolvido para auxiliar empresas do setor de construção civil no gerenciamento, planejamento e orçamento de projetos que utilizam estruturas pré-moldadas de concreto.

A plataforma centraliza informações relacionadas aos projetos, permitindo organizar o processo de fabricação, calcular custos, planejar operações logísticas e estimar despesas de montagem.

O objetivo é proporcionar maior organização, rastreabilidade e eficiência na elaboração de orçamentos e no planejamento das atividades.

O sistema foi desenvolvido como parte de um **Trabalho de Conclusão de Curso (TCC) em Engenharia de Software**.

## 🎯 Objetivos

O ESTRUTEC busca:

- Centralizar as informações dos projetos.
- Automatizar cálculos e estimativas de custos.
- Auxiliar no planejamento da fabricação de estruturas.
- Organizar recursos e operações logísticas.
- Estimar custos de equipamentos e equipes de montagem.
- Gerar relatórios para acompanhamento e análise financeira.
- Reduzir processos manuais e facilitar a tomada de decisões.

## ⚙️ Funcionalidades

### 📁 Gerenciamento de projetos

Permite cadastrar, consultar e gerenciar projetos de estruturas pré-moldadas.

O sistema organiza os dados necessários para as etapas de planejamento e orçamento.

### 📊 Importação de planilhas

Possibilita importar informações de projetos a partir de planilhas, facilitando o cadastramento dos elementos estruturais e reduzindo a necessidade de preenchimento manual.

### 🏗️ Planejamento de fabricação

Auxilia na definição dos recursos necessários para a fabricação das estruturas.

Inclui configurações de materiais, quantidades e preços utilizados nos cálculos de custos.

### 🚛 Planejamento logístico

Permite organizar o transporte das estruturas pré-moldadas.

O sistema contempla operações com frota própria e transporte terceirizado, considerando veículos, equipamentos e custos envolvidos.

### 👷 Planejamento de montagem

Auxilia na organização dos recursos necessários à montagem das estruturas.

Permite considerar equipes, equipamentos e despesas associadas à execução dos serviços.

### 💰 Resumo financeiro

Consolida os custos das diferentes etapas do projeto, permitindo visualizar e analisar os valores estimados.

### 📄 Relatórios

Disponibiliza recursos para geração de relatórios relacionados aos projetos e aos seus custos.

### 🔐 Autenticação e administração

O sistema possui autenticação de usuários e funcionalidades administrativas para gerenciamento de informações e cadastros.

---

## 🛠️ Tecnologias utilizadas

O ESTRUTEC utiliza uma arquitetura web com frontend, backend e banco de dados relacional.

| Camada | Tecnologias |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Estilização | Tailwind CSS |
| Backend | Node.js, Express |
| Banco de dados | PostgreSQL |
| ORM | Sequelize |
| Autenticação | JWT, bcrypt |
| Planilhas | ExcelJS |
| Documentos | Puppeteer |
| Testes | Jest, Supertest, Testing Library |
| Integração contínua | GitHub Actions |
| Qualidade de código | SonarQube Cloud |
| Infraestrutura | Amazon Web Services (AWS) |
| Monitoramento | Amazon CloudWatch |
| Servidor web | NGINX |
| HTTPS e DNS | Cloudflare |

## 🏛️ Arquitetura do sistema

A aplicação utiliza uma arquitetura dividida em três componentes principais.

**Frontend:** responsável pela interface visual e interação com os usuários.

**Backend:** responsável pelas regras de negócio, autenticação, processamento de informações e comunicação com o banco de dados.

**Banco de dados:** responsável pelo armazenamento persistente das informações do sistema.

### Arquitetura de produção

```text
                USUÁRIO
                   |
                   v
          CLOUDFLARE / HTTPS
                   |
                   v
             AWS EC2
                   |
                 NGINX
                   |
          +--------+--------+
          |                 |
          v                 v
     NEXT.JS             EXPRESS
   Frontend :3000      Backend :3001
                            |
                            v
                      SEQUELIZE ORM
                            |
                            v
                    AWS RDS PostgreSQL
```

O NGINX atua como proxy reverso, encaminhando as requisições para os serviços da aplicação.

O banco de dados PostgreSQL é hospedado no Amazon RDS, com acesso restrito aos recursos autorizados da infraestrutura.

---

## 📂 Estrutura do repositório

```text
estrutec/
|
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── backend/
│   ├── src/
│   │   ├── configuracoes/
│   │   ├── controladores/
│   │   ├── middlewares/
│   │   ├── modelos/
│   │   ├── rotas/
│   │   ├── servicos/
│   │   └── utilitarios/
│   │
│   ├── tests/
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── estilos/
│   │   └── servicos/
│   │
│   ├── tests/
│   ├── package.json
│   └── package-lock.json
│
├── sonar-project.properties
└── README.md
```

---

## 💻 Instalação e execução local

### Pré-requisitos

Para executar o projeto localmente, é necessário ter instalado:

- Node.js, preferencialmente versão 24.
- npm.
- PostgreSQL.
- Git.

### 1. Clonar o repositório

```bash
git clone https://github.com/GustavoAntP/estrutec.git

cd estrutec
```

### 2. Configurar o PostgreSQL

Crie um banco de dados local para o projeto.

Exemplo:

```sql
CREATE DATABASE estrutec;
```

### 3. Configurar o backend

Acesse o diretório:

```bash
cd backend
```

Instale as dependências:

```bash
npm ci
```

Crie o arquivo `.env` utilizando como referência o arquivo `.env.example`.

Configure as variáveis necessárias:

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=estrutec
DB_USER=postgres
DB_PASSWORD=sua_senha_local

JWT_SECRET=sua_chave_secreta

CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

Gere uma chave JWT segura utilizando:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Utilize o valor gerado em `JWT_SECRET`.

Para iniciar o backend:

```bash
npm run dev
```

Por padrão, a API será disponibilizada em:

`http://localhost:3001`

A inicialização realiza a conexão com o PostgreSQL e a sincronização dos modelos Sequelize.

### 4. Configurar o frontend

Em outro terminal, acesse:

```bash
cd frontend
```

Instale as dependências:

```bash
npm ci
```

Crie o arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Inicie o frontend:

```bash
npm run dev
```

A aplicação estará disponível em:

`http://localhost:3000`

**Importante:** não compartilhe credenciais reais e não envie arquivos `.env` contendo senhas ou tokens para o GitHub.

---

## 🧪 Testes automatizados

O ESTRUTEC possui testes automatizados para validar regras de negócio, funcionalidades e componentes da aplicação.

A estratégia de testes prioriza o backend, responsável pelo processamento e pelas regras de negócio.

### Resultados da validação — Novembro de 2026

| Indicador | Backend | Frontend |
|---|---:|---:|
| Testes aprovados | 1.393 | 241 |
| Suítes aprovadas | 38 | 9 |
| Cobertura de código | 91,73% | 56,67% |
| Ferramenta principal | Jest | Jest |

**Total: 1.634 testes automatizados aprovados.**

Os resultados apresentados correspondem às execuções realizadas durante a validação do projeto e podem variar conforme novas alterações.

### Executar testes do backend

```bash
cd backend

npm test -- --coverage
```

### Executar testes do frontend

```bash
cd frontend

npm run test:coverage
```

### Validar a compilação do frontend

```bash
npm run build
```

A compilação também realiza verificações relacionadas ao TypeScript e à geração das páginas da aplicação.

---

## 🔄 Integração contínua e qualidade de código

O projeto utiliza **GitHub Actions** para automatizar a validação das alterações.

O workflow está localizado em:

`.github/workflows/ci.yml`

### Pipeline de integração contínua

O pipeline contempla:

1. Instalação das dependências.
2. Execução dos testes automatizados do backend.
3. Geração do relatório de cobertura do backend.
4. Execução dos testes automatizados do frontend.
5. Geração do relatório de cobertura do frontend.
6. Compilação de produção do Next.js.
7. Análise de qualidade com SonarQube Cloud.

O SonarQube utiliza os relatórios de cobertura para auxiliar na avaliação da qualidade do código.

### Quality Gate

Durante a validação do projeto, o **Quality Gate do SonarQube Cloud foi aprovado**.

A análise contempla indicadores relacionados a problemas de código, confiabilidade, segurança, duplicações e cobertura.

### Estratégia de branches

O desenvolvimento utiliza duas branches principais:

**`dev`:** utilizada para implementação, correções e validações iniciais.

**`main`:** utilizada para manter a versão estável e aprovada do sistema.

As alterações são desenvolvidas na `dev` e integradas à `main` por meio de Pull Requests.

O pipeline realiza a integração contínua, enquanto a implantação na AWS é executada separadamente.

---

## ☁️ Infraestrutura e implantação

O ESTRUTEC está hospedado na **Amazon Web Services (AWS)**.

A infraestrutura utiliza:

**Amazon EC2:** hospeda o frontend Next.js, o backend Express e o NGINX.

**Amazon RDS:** disponibiliza o banco de dados PostgreSQL.

**NGINX:** realiza o encaminhamento das requisições HTTP para os serviços internos.

**Cloudflare:** participa da configuração de DNS e HTTPS.

**systemd:** gerencia os serviços do frontend e backend no Ubuntu.

### Serviços da aplicação

```text
estrutec-backend.service
estrutec-frontend.service
nginx.service
```

A atualização de produção é realizada de maneira controlada, com preparação de uma nova versão, compilação, preservação da instalação anterior e reinicialização dos serviços necessários.

A aplicação não possui, atualmente, uma etapa de deploy automático no workflow de integração contínua.

---

## 📈 Monitoramento

A infraestrutura utiliza o **Amazon CloudWatch** para acompanhar métricas operacionais.

O dashboard `ESTRUTEC-Monitoramento` reúne informações como:

| Recurso | Métrica |
|---|---|
| EC2 | Utilização de CPU |
| EC2 | Tráfego de rede |
| EC2 | Integridade da instância |
| RDS | Utilização de CPU |
| RDS | Conexões com o PostgreSQL |
| RDS | Armazenamento disponível |

Também foram configurados alarmes para:

- Utilização elevada de CPU na EC2.
- Falhas de integridade da instância.
- Armazenamento disponível abaixo do limite estabelecido no RDS.

---

## 🔐 Segurança e backups

O projeto utiliza diferentes mecanismos de proteção.

Entre as medidas implementadas estão:

- Autenticação baseada em JWT.
- Hash de senhas com bcrypt.
- Configuração de CORS.
- Middlewares de autenticação e autorização.
- Utilização de Helmet no backend.
- Limitação de tentativas em rotas de autenticação.
- Variáveis de ambiente para configurações sensíveis.
- Acesso não público ao banco PostgreSQL no RDS.
- Regras de grupos de segurança na AWS.
- HTTPS na comunicação com a aplicação.

### Auditoria de dependências

Foi realizada uma auditoria utilizando `npm audit` nos projetos frontend e backend.

Após as correções de novembro de 2026:

| Indicador | Frontend | Backend |
|---|---:|---:|
| Vulnerabilidades críticas identificadas | 0 | 0 |
| Vulnerabilidades altas identificadas | 0 | 0 |
| Vulnerabilidades de produção identificadas | 0 | 3 moderadas |

As ocorrências moderadas restantes são acompanhadas para avaliação de compatibilidade e futuras atualizações.

Esses resultados representam a auditoria realizada naquele momento e não garantem ausência de vulnerabilidades.

### Backups

O banco de dados Amazon RDS possui backups automáticos habilitados, com retenção configurada para um dia.

Durante as atualizações de produção, também são preservadas cópias locais das versões anteriores da aplicação para auxiliar em eventuais procedimentos de recuperação.

---

## 📌 Status do projeto

**Status:** Em desenvolvimento e validação acadêmica.

O sistema possui uma versão funcional implantada na AWS.

`https://estrutec.app.br/`

As etapas de testes automatizados, integração contínua, análise de qualidade, monitoramento e implantação foram implementadas.

O projeto continua sujeito a melhorias, correções e validações de suas funcionalidades.

---

## 🎓 Contexto acadêmico

O ESTRUTEC é desenvolvido no contexto do curso de **Engenharia de Software da Faculdade Católica de Santa Catarina**.

O projeto aplica conceitos de:

- Engenharia de requisitos.
- Desenvolvimento de aplicações web.
- Arquitetura de software.
- Modelagem de banco de dados.
- Testes automatizados.
- Integração contínua.
- Qualidade e segurança de software.
- Computação em nuvem.
- Monitoramento de sistemas.

---

<div align="center">

**ESTRUTEC — Tecnologia aplicada ao planejamento e à gestão de estruturas pré-moldadas.**

</div>
