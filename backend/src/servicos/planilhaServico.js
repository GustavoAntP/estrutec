const ExcelJS = require("exceljs");

//Células com fórmulas no Excel retornam objetos { formula, result } no ExcelJS e são descartadas como null, ignorando linhas inteiras da planilha.
function converterNumero(valor) {
  if (typeof valor === "number") {
    return valor;
  }

  if (typeof valor === "string") {
    const numero = Number(
      valor
        .trim()
        .replace(",", ".")
    );

    return Number.isNaN(numero) ? null : numero;
  }

  return null;
}

//Pilares sem a palavra "RETANGULAR" no nome viram "OUTRA", gerando status "PENDENTE_AREA_SECAO" e bloqueando o cálculo de materiais em 
function identificarElemento(nome) {
  const texto = String(nome).trim().toUpperCase();

  if (texto.includes("PILAR")) {
    return {
      tipo: "PILAR",
      secao: texto.includes("RETANGULAR")
        ? "RETANGULAR"
        : "OUTRA",
      aplicacao: null,
    };
  }

  if (texto.includes("VIGA")) {
    let secao = "OUTRA";

    if (texto.includes("SEÇÃO I")) {
      secao = "I";
    } else if (texto.includes("SEÇÃO T")) {
      secao = "T";
    } else if (texto.includes("RETANGULAR")) {
      secao = "RETANGULAR";
    }

    return {
      tipo: "VIGA",
      secao,
      aplicacao: texto.includes("PROTENSÃO")
        ? "PROTENSAO"
        : null,
    };
  }

  return {
    tipo: "OUTRO",
    secao: null,
    aplicacao: null,
  };
}

async function processarPlanilha(arquivo) {
  if (!arquivo) {
    throw new Error("Planilha não enviada.");
  }

  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(arquivo.buffer);

  if (workbook.worksheets.length === 0) {
    throw new Error("A planilha não possui nenhuma aba.");
  }

  const planilha =
    workbook.getWorksheet("Página1") ||
    workbook.worksheets[0];

  const elementos = [];
  const erros = [];

  planilha.eachRow(
    {
      includeEmpty: false,
    },
    (linha, numeroLinha) => {
      const nomeAplicacao = linha.getCell(1).value;

      const largura = converterNumero(
        linha.getCell(2).value
      );

      const altura = converterNumero(
        linha.getCell(3).value
      );

      const comprimento = converterNumero(
        linha.getCell(4).value
      );

      const quantidade = converterNumero(
        linha.getCell(5).value
      );

      // Ignora títulos e cabeçalhos
      if (
        !nomeAplicacao ||
        largura === null ||
        altura === null ||
        comprimento === null ||
        quantidade === null
      ) {
        return;
      }

      const identificacao =
        identificarElemento(nomeAplicacao);

      const errosElemento = [];

      if (largura <= 0) {
        errosElemento.push("Largura inválida.");
      }

      if (altura <= 0) {
        errosElemento.push("Altura inválida.");
      }

      if (comprimento <= 0) {
        errosElemento.push("Comprimento inválido.");
      }

      if (
        quantidade <= 0 ||
        !Number.isInteger(quantidade)
      ) {
        errosElemento.push("Quantidade inválida.");
      }

      if (identificacao.tipo === "OUTRO") {
        errosElemento.push(
          "Tipo de elemento não reconhecido."
        );
      }

      const elemento = {
        linhaOrigem: numeroLinha,

        nomeAplicacao: String(
          nomeAplicacao
        ).trim(),

        tipo: identificacao.tipo,
        secao: identificacao.secao,
        aplicacao: identificacao.aplicacao,

        largura,
        altura,
        comprimento,
        quantidade,

        valido: errosElemento.length === 0,
        erros: errosElemento,
      };

      elementos.push(elemento);

      if (errosElemento.length > 0) {
        erros.push({
          linha: numeroLinha,
          erros: errosElemento,
        });
      }
    }
  );

  if (elementos.length === 0) {
    throw new Error(
      "Nenhum elemento estrutural válido foi encontrado na planilha."
    );
  }

  const resumo = {
    totalLinhas: elementos.length,

    totalPecas: elementos.reduce(
      (total, elemento) =>
        total + elemento.quantidade,
      0
    ),

    pilares: elementos.filter(
      (elemento) => elemento.tipo === "PILAR"
    ).length,

    vigas: elementos.filter(
      (elemento) => elemento.tipo === "VIGA"
    ).length,

    elementosComErro: erros.length,
  };

  return {
    nomeArquivo: arquivo.originalname,
    tamanho: arquivo.size,
    nomePlanilha: planilha.name,
    resumo,
    elementos,
    erros,
  };
}

module.exports = {
  processarPlanilha,
};