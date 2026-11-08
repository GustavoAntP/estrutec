# Descrição da Pull Request: Bootstrap de Administrador Inicial e Validação de CPF/CNPJ

## Contexto / Motivação
Em um banco de dados recém-inicializado, nenhum usuário conseguia realizar login na aplicação, visto que todas as rotas de cadastro de usuários exigem autenticação com perfil `ADMINISTRADOR` e não existia uma rotina de *bootstrap* (seed inicial) para criar o primeiro administrador.

Além disso:
- A validação matemática dos dígitos verificadores do **CPF** estava comentada em `usuarioServico.js` (tanto na criação quanto na edição de usuários);
- O cadastro e a edição de empresas clientes (`clienteEmpresaServico.js`) verificavam apenas se o **CNPJ** possuía 14 dígitos numéricos, permitindo o registro de CNPJs matematicamente inválidos ou com dígitos repetidos.

---

## O que foi feito

### 1. Rotina de Bootstrap do Super Admin (`backend/src/app.js` e `backend/.env.example`)
- Criada a função `garantirSuperAdmin()`, executada automaticamente na inicialização do servidor logo após `sequelize.sync()`.
- Caso a tabela `usuarios` esteja vazia (`Usuario.count() === 0`), é criado automaticamente um usuário com perfil `ADMINISTRADOR` e status `ativo: true`.
- As credenciais podem ser configuradas via variáveis de ambiente (`ADMIN_EMAIL`, `ADMIN_SENHA`, `ADMIN_CPF`), possuindo *fallbacks* seguros para ambiente de desenvolvimento (`admin@estrutec.com` / `123456` / `00000000000`).
- Documentadas as novas variáveis no arquivo `backend/.env.example`.

### 2. Reativação da Validação de CPF (`backend/src/servicos/usuarioServico.js`)
- Descomentada a verificação `if (!cpfValido(cpfLimpo))` nas funções `cadastrarUsuario` e `editarUsuario`, garantindo que CPFs com dígitos verificadores inválidos sejam rejeitados com erro `"CPF inválido."`.

### 3. Implementação e Aplicação da Validação de CNPJ (`backend/src/utilitarios/validadores.js` e `backend/src/servicos/clienteEmpresaServico.js`)
- Implementada e exportada a função `cnpjValido(cnpj)` em `validadores.js`, realizando:
  - Higienização de caracteres não numéricos e verificação de 14 dígitos;
  - Bloqueio de sequências com todos os dígitos repetidos (ex.: `00000000000000`, `11111111111111`);
  - Cálculo oficial dos dois dígitos verificadores (módulo 11 com pesos `5..2 / 9..2` e `6..2 / 9..2`).
- Aplicada a validação `cnpjValido(cnpjLimpo)` em `cadastrarClienteEmpresa` e `editarClienteEmpresa` (`clienteEmpresaServico.js`), lançando `"CNPJ inválido."` quando os dígitos verificadores não conferem.

---

## Arquivos Alterados
- `backend/src/app.js`
- `backend/.env.example`
- `backend/src/servicos/usuarioServico.js`
- `backend/src/utilitarios/validadores.js`
- `backend/src/servicos/clienteEmpresaServico.js`

---

## Como Testar
1. **Bootstrap do Administrador Inicial:**
   - Com o banco de dados vazio (sem registros na tabela `usuarios`), inicie o backend (`npm run dev` ou `npm start`).
   - Verifique no console a mensagem `"Usuário administrador inicial criado com sucesso!"` e realize login com `admin@estrutec.com` / `123456` (ou com os valores definidos em `ADMIN_EMAIL` e `ADMIN_SENHA` no `.env`).
2. **Validação de CPF:**
   - Tente cadastrar ou editar um usuário informando um CPF de 11 dígitos inválido (ex.: `123.456.789-00` ou `111.111.111-11`) e confirme que a API rejeita com `"CPF inválido."`.
   - Informe um CPF válido e confirme que o cadastro/edição ocorre normalmente.
3. **Validação de CNPJ:**
   - Tente cadastrar ou editar um cliente empresa com um CNPJ de 14 dígitos inválido (ex.: `12.345.678/0001-00` ou `11.111.111/1111-11`) e confirme que a API rejeita com `"CNPJ inválido."`.
   - Informe um CNPJ válido e confirme que o cadastro/edição é concluído com sucesso.

