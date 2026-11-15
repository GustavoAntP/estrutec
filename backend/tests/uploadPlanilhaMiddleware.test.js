const express = require("express");
const request = require("supertest");

const uploadPlanilha = require("../src/middlewares/uploadPlanilhaMiddleware");
const tratamentoErrosMiddleware = require("../src/middlewares/tratamentoErrosMiddleware");

describe("Seguranca no upload de planilhas", () => {
  let app;

  beforeEach(() => {
    app = express();

    app.post(
      "/projetos/1/importar-planilha",
      uploadPlanilha.single("arquivo"),
      (req, res) => {
        return res.status(200).json({
          mensagem: "Arquivo recebido com sucesso.",
          nome: req.file.originalname,
          tamanho: req.file.size,
        });
      }
    );

    app.use(tratamentoErrosMiddleware);
  });

  test("deve aceitar uma planilha XLSX dentro do limite permitido", async () => {
    const arquivo = Buffer.from("Conteudo de teste");

    const resposta = await request(app)
      .post("/projetos/1/importar-planilha")
      .attach("arquivo", arquivo, "planilha.xlsx");

    expect(resposta.status).toBe(200);
    expect(resposta.body.mensagem).toBe(
      "Arquivo recebido com sucesso."
    );
    expect(resposta.body.nome).toBe("planilha.xlsx");
  });

test("deve rejeitar arquivos maiores que 8 MB com HTTP 413", async () => {
  const arquivoGrande = Buffer.alloc(8_000_001);

  const resposta = await request(app)
    .post("/projetos/1/importar-planilha")
    .attach("arquivo", arquivoGrande, "planilha.xlsx");

  expect(resposta.status).toBe(413);
  expect(resposta.body.erro).toBe(
    "O arquivo excede o tamanho máximo permitido de 8 MB."
  );
});

  test("deve rejeitar arquivos que nao sejam XLSX", async () => {
    const arquivo = Buffer.from("Arquivo invalido");

    const resposta = await request(app)
      .post("/projetos/1/importar-planilha")
      .attach("arquivo", arquivo, "documento.pdf");

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toContain(
      "Apenas arquivos Excel"
    );
  });

  test("deve rejeitar o envio de mais de um arquivo", async () => {
    const arquivo = Buffer.from("Conteudo de teste");

    const resposta = await request(app)
      .post("/projetos/1/importar-planilha")
      .attach("arquivo", arquivo, "planilha1.xlsx")
      .attach("arquivo", arquivo, "planilha2.xlsx");

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe(
      "Erro ao enviar o arquivo."
    );
  });
});