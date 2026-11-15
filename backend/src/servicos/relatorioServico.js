const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const Projeto = require("../modelos/Projeto");
const ElementoProjeto = require("../modelos/ElementoProjeto");
const LogisticaProjeto = require("../modelos/LogisticaProjeto");
const LogisticaPropria = require("../modelos/LogisticaPropria");

const fabricacaoServico = require("./fabricacaoServico");
const logisticaServico = require("./logisticaServico");
const montagemServico = require("./montagemServico");
const resumoFinanceiroServico = require("./resumoFinanceiroServico");

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarNumero(valor, casas = 2) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function formatarData(data) {
  if (!data) {
    return "-";
  }

  return new Date(
    `${data}T12:00:00`
  ).toLocaleDateString("pt-BR");
}

function formatarDataHora(data = new Date()) {
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escaparHtml(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "-";
  }

  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function linhaVazia(
  colspan,
  texto = "Nenhum registro encontrado."
) {
  return `
    <tr>
      <td colspan="${colspan}" class="vazio">
        ${escaparHtml(texto)}
      </td>
    </tr>
  `;
}

function obterVolumeTotalElemento(elemento) {
  /*
    No Estrutec, area_secao atualmente armazena
    o volume total calculado do elemento:
    largura × altura × comprimento × quantidade.
  */
  if (
    elemento.area_secao !== null &&
    elemento.area_secao !== undefined &&
    elemento.area_secao !== ""
  ) {
    return Number(elemento.area_secao);
  }

  const largura =
    Number(elemento.largura || 0);

  const altura =
    Number(elemento.altura || 0);

  const comprimento =
    Number(elemento.comprimento || 0);

  const quantidade =
    Number(elemento.quantidade || 0);

  return (
    largura *
    altura *
    comprimento *
    quantidade
  );
}

function obterPesoTotalElemento(elemento) {
  return (
    Number(
      elemento.peso_unitario_kg || 0
    ) *
    Number(
      elemento.quantidade || 0
    )
  );
}

async function gerarRelatorioFinal(
  projetoId,
  usuarioId
) {
  const projeto =
    await Projeto.findOne({
      where: {
        id: projetoId,
        usuario_id: usuarioId,
      },
    });

  if (!projeto) {
    throw new Error(
      "Projeto não encontrado."
    );
  }

  if (
    projeto.status !==
    "FINALIZADO"
  ) {
    throw new Error(
      "O projeto deve estar finalizado antes de gerar o relatório."
    );
  }

  /*
    Carrega os cálculos utilizando os mesmos
    serviços usados pelas telas do Estrutec.
  */
  const [
    resumo,
    fabricacao,
    logistica,
    montagem,
    elementos,
  ] = await Promise.all([
    resumoFinanceiroServico
      .calcularResumoFinanceiro(
        projetoId,
        usuarioId
      ),

    fabricacaoServico
      .calcularCustos(
        projetoId,
        usuarioId
      ),

    logisticaServico
      .calcularCustoLogistica(
        projetoId,
        usuarioId
      ),

    montagemServico
      .calcularCustos(
        projetoId,
        usuarioId
      ),

    ElementoProjeto.findAll({
      where: {
        projeto_id: projetoId,
      },

      order: [
        ["tipo", "ASC"],
        ["id", "ASC"],
      ],
    }),
  ]);

  /*
    Dados salvos da frota própria.
    Mantemos o snapshot do projeto, evitando
    depender do cadastro global atual.
  */
  let freteProprio = null;

  if (
    logistica.tipoFrete ===
    "PROPRIO"
  ) {
    const configuracaoLogistica =
      await LogisticaProjeto.findOne({
        where: {
          projeto_id: projetoId,
        },
      });

    if (
      configuracaoLogistica
    ) {
      freteProprio =
        await LogisticaPropria.findOne({
          where: {
            logistica_id:
              configuracaoLogistica.id,
          },
        });
    }
  }

  /*
    Totais físicos dos elementos.
  */
  const totalVolumeElementos =
    elementos.reduce(
      (total, elemento) =>
        total +
        obterVolumeTotalElemento(
          elemento
        ),
      0
    );

  const totalPesoElementos =
    elementos.reduce(
      (total, elemento) =>
        total +
        obterPesoTotalElemento(
          elemento
        ),
      0
    );

  /*
    Tabela de elementos.
  */
  const linhasElementos =
    elementos.length > 0
      ? elementos
          .map((elemento) => {
            const volumeTotal =
              obterVolumeTotalElemento(
                elemento
              );

            const pesoTotal =
              obterPesoTotalElemento(
                elemento
              );

            return `
              <tr>
                <td>
                  <strong>
                    ${escaparHtml(
                      elemento.nome_aplicacao ||
                        elemento.tipo
                    )}
                  </strong>
                </td>

                <td>
                  ${escaparHtml(
                    elemento.tipo
                  )}
                </td>

                <td>
                  ${escaparHtml(
                    elemento.secao
                  )}
                </td>

                <td class="valor">
                  ${formatarNumero(
                    elemento.comprimento,
                    3
                  )}
                </td>

                <td class="centralizado">
                  ${Number(
                    elemento.quantidade ||
                      0
                  )}
                </td>

                <td class="valor">
                  ${formatarNumero(
                    volumeTotal,
                    4
                  )}
                </td>

                <td class="valor">
                  ${formatarNumero(
                    elemento.peso_unitario_kg,
                    2
                  )}
                </td>

                <td class="valor">
                  ${formatarNumero(
                    pesoTotal,
                    2
                  )}
                </td>
              </tr>
            `;
          })
          .join("")
      : linhaVazia(
          8,
          "Nenhum elemento pré-moldado cadastrado."
        );

  /*
    Materiais de fabricação.
  */
  const materiaisFabricacao =
    Object.entries(
      fabricacao.materiais || {}
    );

  const linhasMateriais =
    materiaisFabricacao.length > 0
      ? materiaisFabricacao
          .map(
            ([
              nome,
              material,
            ]) => {
              const nomeMaterial =
                nome
                  .charAt(0)
                  .toUpperCase() +
                nome.slice(1);

              return `
                <tr>
                  <td>
                    ${escaparHtml(
                      nomeMaterial
                    )}
                  </td>

                  <td class="valor">
                    ${formatarNumero(
                      material.quantidade
                    )}
                    ${escaparHtml(
                      material.unidade ||
                        ""
                    )}
                  </td>

                  <td class="valor">
                    ${
                      material.precoUnitario !==
                        undefined &&
                      material.precoUnitario !==
                        null
                        ? formatarMoeda(
                            material.precoUnitario
                          )
                        : "-"
                    }
                  </td>

                  <td class="valor">
                    ${formatarMoeda(
                      material.custo
                    )}
                  </td>
                </tr>
              `;
            }
          )
          .join("")
      : linhaVazia(
          4,
          "Nenhum material calculado."
        );

  /*
    Equipamentos de montagem.
  */
  const equipamentos =
    montagem.equipamentos
      ?.detalhes || [];

  const linhasEquipamentos =
    equipamentos.length > 0
      ? equipamentos
          .map(
            (equipamento) => `
              <tr>
                <td>
                  ${escaparHtml(
                    equipamento.nome
                  )}
                </td>

                <td class="centralizado">
                  ${Number(
                    equipamento.quantidade ||
                      0
                  )}
                </td>

                <td>
                  ${escaparHtml(
                    equipamento.tipoCobranca
                  )}
                </td>

                <td class="valor">
                  ${formatarNumero(
                    equipamento.tempoUso
                  )}
                </td>

                <td class="valor">
                  ${formatarMoeda(
                    equipamento.valorUnitario
                  )}
                </td>

                <td class="valor">
                  ${formatarMoeda(
                    equipamento.custoTotal
                  )}
                </td>
              </tr>
            `
          )
          .join("")
      : linhaVazia(
          6,
          "Nenhum equipamento informado."
        );

  /*
    Equipes de montagem.
  */
  const equipes =
    montagem.equipes
      ?.detalhes || [];

  const linhasEquipes =
    equipes.length > 0
      ? equipes
          .map(
            (equipe) => `
              <tr>
                <td>
                  ${escaparHtml(
                    equipe.funcao
                  )}
                </td>

                <td class="centralizado">
                  ${Number(
                    equipe
                      .quantidadeTrabalhadores ||
                      0
                  )}
                </td>

                <td class="centralizado">
                  ${formatarNumero(
                    equipe.quantidadeDias
                  )}
                </td>

                <td class="valor">
                  ${formatarMoeda(
                    equipe
                      .custoDiarioPorTrabalhador
                  )}
                </td>

                <td class="valor">
                  ${formatarMoeda(
                    equipe.custoTotal
                  )}
                </td>
              </tr>
            `
          )
          .join("")
      : linhaVazia(
          5,
          "Nenhuma equipe informada."
        );

  /*
    Logo oficial da Estrutec.
  */
  const caminhoLogo =
    path.join(
      __dirname,
      "../assets/estrutec-logo.png"
    );

  let logoBase64 = "";

  if (
    fs.existsSync(
      caminhoLogo
    )
  ) {
    logoBase64 = fs
      .readFileSync(
        caminhoLogo
      )
      .toString("base64");
  }

  const logoHtml =
    logoBase64
      ? `
        <img
          src="data:image/png;base64,${logoBase64}"
          class="logo-relatorio"
          alt="Estrutec"
        />
      `
      : `
        <div class="logo-texto">
          ESTRUTEC
        </div>
      `;

  const dataEmissao =
    formatarDataHora();

  /*
    O campo cliente continua sendo mantido
    como snapshot no projeto.
  */
  const clienteProjeto =
    projeto.cliente ||
    "-";

  const detalheLogistica =
    logistica.detalhes ||
    {};

  const transporte =
    detalheLogistica.transporte ||
    {};

  const combustivel =
    detalheLogistica.combustivel ||
    {};

  const custosLogistica =
    detalheLogistica.custos ||
    {};

  const html = `
    <!DOCTYPE html>

    <html lang="pt-BR">

    <head>
      <meta charset="UTF-8">

      <style>
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family:
            Arial,
            Helvetica,
            sans-serif;

          color: #171717;
          font-size: 9.5px;
          line-height: 1.35;
        }

        .capa {
          border-bottom:
            3px solid #F97316;

          padding-bottom: 18px;
          margin-bottom: 24px;
        }

        .capa-topo {
          display: flex;
          align-items: center;

          justify-content:
            space-between;

          gap: 24px;
        }

        .logo-relatorio {
          max-width: 170px;
          max-height: 75px;

          object-fit:
            contain;
        }

        .logo-texto {
          font-size: 28px;
          font-weight: 800;

          letter-spacing:
            1px;
        }

        .capa-identificacao {
          text-align: right;
        }

        .capa-identificacao span {
          display: block;

          color: #78716C;
          font-size: 9px;
        }

        .capa-identificacao strong {
          display: block;

          margin-top: 4px;

          font-size: 12px;
        }

        .capa h1 {
          margin:
            20px 0 4px;

          font-size: 24px;
          color: #171717;
        }

        .capa p {
          margin: 0;

          color: #78716C;
          font-size: 11px;
        }

        .selo-finalizado {
          display:
            inline-block;

          margin-top: 12px;

          padding:
            5px 9px;

          border-radius:
            20px;

          color: #15803D;

          background:
            #F0FDF4;

          border:
            1px solid #BBF7D0;

          font-size: 8px;

          font-weight: 700;

          text-transform:
            uppercase;

          letter-spacing:
            0.6px;
        }

        h2 {
          margin:
            24px 0 10px;

          padding-bottom:
            6px;

          border-bottom:
            2px solid #E7E5E4;

          color: #171717;

          font-size: 15px;

          page-break-after:
            avoid;
        }

        h3 {
          margin:
            17px 0 8px;

          color: #44403C;

          font-size: 11.5px;

          page-break-after:
            avoid;
        }

        table {
          width: 100%;

          border-collapse:
            collapse;
        }

        th,
        td {
          padding:
            6px 7px;

          border:
            1px solid #E7E5E4;

          vertical-align:
            middle;
        }

        th {
          background:
            #FAFAF9;

          color:
            #57534E;

          font-size:
            8.5px;

          font-weight:
            700;

          text-align:
            left;

          text-transform:
            uppercase;

          letter-spacing:
            0.25px;
        }

        tr {
          page-break-inside:
            avoid;
        }

        thead {
          display:
            table-header-group;
        }

        .dados td:first-child {
          width: 28%;

          color:
            #57534E;

          font-weight:
            700;

          background:
            #FAFAF9;
        }

        .valor {
          text-align: right;

          white-space:
            nowrap;
        }

        .centralizado {
          text-align:
            center;
        }

        .total {
          font-weight:
            700;

          background:
            #FFF7ED;
        }

        .vazio {
          padding: 16px;

          text-align:
            center;

          color:
            #78716C;
        }

        .resumo-cards {
          display: flex;

          gap: 9px;

          margin-top:
            12px;

          page-break-inside:
            avoid;
        }

        .card {
          flex: 1;

          min-width: 0;

          border:
            1px solid #E7E5E4;

          border-radius:
            6px;

          padding: 10px;

          background:
            #FFFFFF;
        }

        .card span {
          display: block;

          color:
            #78716C;

          font-size:
            8px;
        }

        .card strong {
          display: block;

          margin-top:
            4px;

          color:
            #171717;

          font-size:
            13px;
        }

        .card.destaque {
          border-color:
            #FED7AA;

          background:
            #FFF7ED;
        }

        .observacoes {
          margin-top:
            12px;

          padding:
            10px 12px;

          border:
            1px solid #E7E5E4;

          border-left:
            3px solid #F97316;

          border-radius:
            4px;

          background:
            #FAFAF9;

          line-height:
            1.5;

          page-break-inside:
            avoid;
        }

        .observacoes strong {
          color:
            #44403C;
        }

        .quebra {
          page-break-before:
            always;
        }

        .valor-final {
          margin-top:
            22px;

          padding:
            18px;

          background:
            #FFF7ED;

          text-align:
            right;

          page-break-inside:
            avoid;
        }

        .valor-final span {
          display: block;

          color:
            #9A3412;

          font-size:
            9px;

          font-weight:
            700;

          letter-spacing:
            0.5px;
        }

        .valor-final strong {
          display: block;

          margin-top:
            5px;

          color:
            #171717;

          font-size:
            22px;
        }

        .assinaturas {
          display: flex;

          gap: 50px;

          margin-top:
            55px;

          page-break-inside:
            avoid;
        }

        .assinatura {
          flex: 1;

          padding-top:
            8px;

          border-top:
            1px solid #44403C;

          text-align:
            center;

          color:
            #57534E;

          font-size:
            9px;
        }

        .rodape-corpo {
          margin-top:
            28px;

          text-align:
            center;

          color:
            #A8A29E;

          font-size:
            8px;
        }

        @page {
          size: A4;
        }
      </style>
    </head>

    <body>

      <section class="capa">

      <div class="capa-topo">

        <div
          class="capa-identificacao"
          style="margin-left: auto;"
        >
            <span>
              Código do projeto
            </span>

            <strong>
              ${escaparHtml(
                projeto.codigo
              )}
            </strong>

            <span
              style="
                margin-top: 7px;
              "
            >
              Emitido em
              ${dataEmissao}
            </span>
          </div>

        </div>

        <h1>
          Relatório Final do Orçamento
        </h1>

        <p>
          Orçamentação e planejamento
          de estruturas pré-moldadas
        </p>

        <span
          class="selo-finalizado"
        >
          Projeto finalizado
        </span>

      </section>


      <!-- DADOS DO PROJETO -->

      <h2>
        1. Dados do Projeto
      </h2>

      <table class="dados">

        <tr>
          <td>
            Código
          </td>

          <td>
            ${escaparHtml(
              projeto.codigo
            )}
          </td>
        </tr>

        <tr>
          <td>
            Projeto
          </td>

          <td>
            ${escaparHtml(
              projeto.nome
            )}
          </td>
        </tr>

        <tr>
          <td>
            Empresa cliente
          </td>

          <td>
            ${escaparHtml(
              clienteProjeto
            )}
          </td>
        </tr>

        <tr>
          <td>
            Responsável
          </td>

          <td>
            ${escaparHtml(
              projeto.responsavel ||
                "-"
            )}
          </td>
        </tr>

        <tr>
          <td>
            Origem
          </td>

          <td>
            ${escaparHtml(
              projeto.origem ||
                "-"
            )}
          </td>
        </tr>

        <tr>
          <td>
            Destino
          </td>

          <td>
            ${escaparHtml(
              projeto.destino ||
                "-"
            )}
          </td>
        </tr>

        <tr>
          <td>
            Prazo
          </td>

          <td>
            ${formatarData(
              projeto.prazo
            )}
          </td>
        </tr>

        <tr>
          <td>
            Status
          </td>

          <td>
            Finalizado
          </td>
        </tr>

      </table>

      ${
        projeto.observacoes
          ? `
            <div
              class="observacoes"
            >
              <strong>
                Observações do projeto
              </strong>

              <br><br>

              ${escaparHtml(
                projeto.observacoes
              )}
            </div>
          `
          : ""
      }


      <!-- ELEMENTOS -->

      <h2>
        2. Elementos Pré-Moldados
      </h2>

      <table>

        <thead>
          <tr>
            <th>
              Elemento
            </th>

            <th>
              Tipo
            </th>

            <th>
              Seção
            </th>

            <th>
              Comp. (m)
            </th>

            <th>
              Qtde.
            </th>

            <th>
              Volume total (m³)
            </th>

            <th>
              Peso unit. (kg)
            </th>

            <th>
              Peso total (kg)
            </th>
          </tr>
        </thead>

        <tbody>
          ${linhasElementos}
        </tbody>

      </table>


      <div
        class="resumo-cards"
      >

        <div class="card">

          <span>
            Total de peças
          </span>

          <strong>
            ${
              fabricacao.resumo
                ?.totalPecas ||
              0
            }
          </strong>

        </div>


        <div class="card">

          <span>
            Total de vigas
          </span>

          <strong>
            ${
              fabricacao.resumo
                ?.totalVigas ||
              0
            }
          </strong>

        </div>


        <div class="card">

          <span>
            Volume calculado
          </span>

          <strong>
            ${formatarNumero(
              totalVolumeElementos,
              3
            )}
            m³
          </strong>

        </div>


        <div class="card">

          <span>
            Peso total estimado
          </span>

          <strong>
            ${formatarNumero(
              totalPesoElementos,
              2
            )}
            kg
          </strong>

        </div>

      </div>


      <div class="quebra">
      </div>


      <!-- FABRICAÇÃO -->

      <h2>
        3. Fabricação
      </h2>


      <div
        class="resumo-cards"
      >

        <div class="card">

          <span>
            Volume de concreto
          </span>

          <strong>
            ${formatarNumero(
              fabricacao.resumo
                ?.volumeConcretoM3,
              3
            )}
            m³
          </strong>

        </div>


        <div
          class="card destaque"
        >

          <span>
            Custo total da fabricação
          </span>

          <strong>
            ${formatarMoeda(
              fabricacao
                .custoTotalFabricacao
            )}
          </strong>

        </div>

      </div>


      <h3>
        3.1 Materiais e insumos
      </h3>

      <table>

        <thead>
          <tr>

            <th>
              Material
            </th>

            <th>
              Quantidade
            </th>

            <th>
              Preço Unitário
            </th>

            <th>
              Custo
            </th>

          </tr>
        </thead>

        <tbody>

          ${linhasMateriais}

          <tr class="total">

            <td colspan="3">
              Custo Total da Fabricação
            </td>

            <td class="valor">
              ${formatarMoeda(
                fabricacao
                  .custoTotalFabricacao
              )}
            </td>

          </tr>

        </tbody>

      </table>


      <!-- LOGÍSTICA -->

      <h2>
        4. Logística
      </h2>

      ${
        logistica.tipoFrete ===
        "TERCEIRIZADO"
          ? `

            <div
              class="resumo-cards"
            >

              <div class="card">

                <span>
                  Modalidade
                </span>

                <strong>
                  Frete terceirizado
                </strong>

              </div>


              <div
                class="card destaque"
              >

                <span>
                  Custo total
                </span>

                <strong>
                  ${formatarMoeda(
                    logistica
                      .custoLogistica
                  )}
                </strong>

              </div>

            </div>


            <h3>
              4.1 Cotação da transportadora
            </h3>


            <table class="dados">

              <tr>

                <td>
                  Transportadora
                </td>

                <td>
                  ${escaparHtml(
                    detalheLogistica
                      .empresa ||
                      "-"
                  )}
                </td>

              </tr>


              <tr>

                <td>
                  Número da cotação
                </td>

                <td>
                  ${escaparHtml(
                    detalheLogistica
                      .numeroCotacao ||
                      "-"
                  )}
                </td>

              </tr>


              <tr>

                <td>
                  Validade da cotação
                </td>

                <td>
                  ${formatarData(
                    detalheLogistica
                      .validadeCotacao
                  )}
                </td>

              </tr>


              <tr class="total">

                <td>
                  Custo da logística
                </td>

                <td>
                  ${formatarMoeda(
                    logistica
                      .custoLogistica
                  )}
                </td>

              </tr>

            </table>


            ${
              detalheLogistica
                .observacoes
                ? `

                  <div
                    class="observacoes"
                  >

                    <strong>
                      Observações da logística
                    </strong>

                    <br><br>

                    ${escaparHtml(
                      detalheLogistica
                        .observacoes
                    )}

                  </div>

                `
                : ""
            }

          `
          : `

            <div
              class="resumo-cards"
            >

              <div class="card">

                <span>
                  Modalidade
                </span>

                <strong>
                  Frota própria
                </strong>

              </div>


              <div class="card">

                <span>
                  Quantidade de viagens
                </span>

                <strong>
                  ${Number(
                    transporte
                      .quantidadeViagens ||
                      0
                  )}
                </strong>

              </div>


              <div
                class="card destaque"
              >

                <span>
                  Custo total
                </span>

                <strong>
                  ${formatarMoeda(
                    logistica
                      .custoLogistica
                  )}
                </strong>

              </div>

            </div>


            <h3>
              4.1 Frota utilizada
            </h3>


            <table class="dados">

              <tr>

                <td>
                  Cavalo mecânico
                </td>

                <td>
                  ${escaparHtml(
                    transporte
                      .cavaloMecanico ||
                      freteProprio
                        ?.cavalo_mecanico ||
                      "-"
                  )}
                </td>

              </tr>


              <tr>

                <td>
                  Carreta
                </td>

                <td>
                  ${escaparHtml(
                    transporte
                      .carreta ||
                      freteProprio
                        ?.carreta ||
                      "-"
                  )}
                </td>

              </tr>


              <tr>

                <td>
                  Capacidade de peças
                </td>

                <td>
                  ${
                    freteProprio
                      ?.capacidade_pecas ??
                    "-"
                  }
                </td>

              </tr>


              <tr>

                <td>
                  Capacidade de peso
                </td>

                <td>
                  ${
                    freteProprio
                      ?.capacidade_peso_kg
                      ? `${formatarNumero(
                          freteProprio
                            .capacidade_peso_kg
                        )} kg`
                      : "-"
                  }
                </td>

              </tr>

            </table>


            <h3>
              4.2 Planejamento do transporte
            </h3>


            <table class="dados">

              <tr>

                <td>
                  Quantidade de viagens
                </td>

                <td>
                  ${Number(
                    transporte
                      .quantidadeViagens ||
                      0
                  )}
                </td>

              </tr>


              <tr>

                <td>
                  Distância de ida
                </td>

                <td>
                  ${formatarNumero(
                    transporte
                      .distanciaIdaKm
                  )}
                  km
                </td>

              </tr>


              <tr>

                <td>
                  Considerar ida e volta
                </td>

                <td>
                  ${
                    transporte
                      .considerarIdaVolta
                      ? "Sim"
                      : "Não"
                  }
                </td>

              </tr>


              <tr>

                <td>
                  Quilometragem carregado
                </td>

                <td>
                  ${formatarNumero(
                    transporte
                      .kmCarregado
                  )}
                  km
                </td>

              </tr>


              <tr>

                <td>
                  Quilometragem vazio
                </td>

                <td>
                  ${formatarNumero(
                    transporte
                      .kmVazio
                  )}
                  km
                </td>

              </tr>


              <tr class="total">

                <td>
                  Quilometragem total
                </td>

                <td>
                  ${formatarNumero(
                    transporte
                      .kmTotal
                  )}
                  km
                </td>

              </tr>

            </table>


            <h3>
              4.3 Consumo de combustível
            </h3>


            <table class="dados">

              <tr>

                <td>
                  Consumo carregado
                </td>

                <td>
                  ${formatarNumero(
                    combustivel
                      .consumoCarregadoKmL
                  )}
                  km/L
                </td>

              </tr>


              <tr>

                <td>
                  Consumo vazio
                </td>

                <td>
                  ${formatarNumero(
                    combustivel
                      .consumoVazioKmL
                  )}
                  km/L
                </td>

              </tr>


              <tr>

                <td>
                  Litros carregado
                </td>

                <td>
                  ${formatarNumero(
                    combustivel
                      .litrosCarregado
                  )}
                  L
                </td>

              </tr>


              <tr>

                <td>
                  Litros vazio
                </td>

                <td>
                  ${formatarNumero(
                    combustivel
                      .litrosVazio
                  )}
                  L
                </td>

              </tr>


              <tr>

                <td>
                  Litros totais
                </td>

                <td>
                  ${formatarNumero(
                    combustivel
                      .litrosTotal
                  )}
                  L
                </td>

              </tr>


              <tr>

                <td>
                  Preço do diesel
                </td>

                <td>
                  ${formatarMoeda(
                    combustivel
                      .precoDieselL
                  )}
                  / L
                </td>

              </tr>


              <tr class="total">

                <td>
                  Custo de combustível
                </td>

                <td>
                  ${formatarMoeda(
                    combustivel
                      .custoCombustivel
                  )}
                </td>

              </tr>

            </table>


            <h3>
              4.4 Composição dos custos da logística
            </h3>


            <table>

              <thead>

                <tr>

                  <th>
                    Item
                  </th>

                  <th class="valor">
                    Valor
                  </th>

                </tr>

              </thead>


              <tbody>

                <tr>

                  <td>
                    Combustível
                  </td>

                  <td class="valor">
                    ${formatarMoeda(
                      custosLogistica
                        .combustivel
                    )}
                  </td>

                </tr>


                <tr>

                  <td>
                    Manutenção
                  </td>

                  <td class="valor">
                    ${formatarMoeda(
                      custosLogistica
                        .manutencao
                    )}
                  </td>

                </tr>


                <tr>

                  <td>
                    Motorista
                  </td>

                  <td class="valor">
                    ${formatarMoeda(
                      custosLogistica
                        .motorista
                    )}
                  </td>

                </tr>


                <tr>

                  <td>
                    Alimentação do motorista
                  </td>

                  <td class="valor">
                    ${formatarMoeda(
                      custosLogistica
                        .alimentacao
                    )}
                  </td>

                </tr>


                <tr>

                  <td>
                    Pedágios
                  </td>

                  <td class="valor">
                    ${formatarMoeda(
                      custosLogistica
                        .pedagios
                    )}
                  </td>

                </tr>


                <tr>

                  <td>
                    Carregamento
                  </td>

                  <td class="valor">
                    ${formatarMoeda(
                      custosLogistica
                        .carregamento
                    )}
                  </td>

                </tr>


                <tr>

                  <td>
                    Descarregamento
                  </td>

                  <td class="valor">
                    ${formatarMoeda(
                      custosLogistica
                        .descarregamento
                    )}
                  </td>

                </tr>


                <tr>

                  <td>
                    Seguro
                  </td>

                  <td class="valor">
                    ${formatarMoeda(
                      custosLogistica
                        .seguro
                    )}
                  </td>

                </tr>


                <tr>

                  <td>
                    Outros custos
                  </td>

                  <td class="valor">
                    ${formatarMoeda(
                      custosLogistica
                        .outrosCustos
                    )}
                  </td>

                </tr>


                <tr>

                  <td>
                    Custo por viagem
                  </td>

                  <td class="valor">
                    ${formatarMoeda(
                      detalheLogistica
                        .custoPorViagem
                    )}
                  </td>

                </tr>


                <tr class="total">

                  <td>
                    Custo Total da Logística
                  </td>

                  <td class="valor">
                    ${formatarMoeda(
                      logistica
                        .custoLogistica
                    )}
                  </td>

                </tr>

              </tbody>

            </table>


            ${
              freteProprio
                ?.observacoes
                ? `

                  <div
                    class="observacoes"
                  >

                    <strong>
                      Observações da logística
                    </strong>

                    <br><br>

                    ${escaparHtml(
                      freteProprio
                        .observacoes
                    )}

                  </div>

                `
                : ""
            }

          `
      }


      <div class="quebra">
      </div>


      <!-- MONTAGEM -->

      <h2>
        5. Montagem
      </h2>


      <div
        class="resumo-cards"
      >

        <div class="card">

          <span>
            Equipamentos
          </span>

          <strong>
            ${Number(
              montagem
                .equipamentos
                ?.quantidade ||
                0
            )}
          </strong>

        </div>


        <div class="card">

          <span>
            Equipes
          </span>

          <strong>
            ${Number(
              montagem
                .equipes
                ?.quantidade ||
                0
            )}
          </strong>

        </div>


        <div
          class="card destaque"
        >

          <span>
            Custo total da montagem
          </span>

          <strong>
            ${formatarMoeda(
              montagem
                .custoTotalMontagem
            )}
          </strong>

        </div>

      </div>


      <h3>
        5.1 Equipamentos utilizados
      </h3>


      <table>

        <thead>

          <tr>

            <th>
              Equipamento
            </th>

            <th>
              Qtde.
            </th>

            <th>
              Cobrança
            </th>

            <th>
              Tempo
            </th>

            <th>
              Valor Unit.
            </th>

            <th>
              Total
            </th>

          </tr>

        </thead>


        <tbody>

          ${linhasEquipamentos}

          <tr class="total">

            <td colspan="5">
              Total de Equipamentos
            </td>

            <td class="valor">
              ${formatarMoeda(
                montagem
                  .equipamentos
                  ?.custoTotal
              )}
            </td>

          </tr>

        </tbody>

      </table>


      <h3>
        5.2 Equipe de montagem
      </h3>


      <table>

        <thead>

          <tr>

            <th>
              Função / Equipe
            </th>

            <th>
              Trabalhadores
            </th>

            <th>
              Dias
            </th>

            <th>
              Custo Diário
            </th>

            <th>
              Total
            </th>

          </tr>

        </thead>


        <tbody>

          ${linhasEquipes}

          <tr class="total">

            <td colspan="4">
              Total da Equipe
            </td>

            <td class="valor">
              ${formatarMoeda(
                montagem
                  .equipes
                  ?.custoTotal
              )}
            </td>

          </tr>

        </tbody>

      </table>


      <h3>
        5.3 Custos gerais
      </h3>


      <table class="dados">

        <tr>

          <td>
            Hospedagem
          </td>

          <td>
            ${formatarMoeda(
              montagem
                .custosGerais
                ?.hospedagem
            )}
          </td>

        </tr>


        <tr>

          <td>
            Alimentação
          </td>

          <td>
            ${formatarMoeda(
              montagem
                .custosGerais
                ?.alimentacao
            )}
          </td>

        </tr>


        <tr>

          <td>
            Transporte da equipe
          </td>

          <td>
            ${formatarMoeda(
              montagem
                .custosGerais
                ?.transporteEquipe
            )}
          </td>

        </tr>


        <tr>

          <td>
            Outros custos
          </td>

          <td>
            ${formatarMoeda(
              montagem
                .custosGerais
                ?.outrosCustos
            )}
          </td>

        </tr>


        <tr class="total">

          <td>
            Custo Total da Montagem
          </td>

          <td>
            ${formatarMoeda(
              montagem
                .custoTotalMontagem
            )}
          </td>

        </tr>

      </table>


      <div class="quebra">
      </div>


      <!-- RESUMO -->

      <h2>
        6. Resumo Financeiro
      </h2>


      <table>

        <thead>

          <tr>

            <th>
              Etapa
            </th>

            <th class="valor">
              Valor
            </th>

          </tr>

        </thead>


        <tbody>

          <tr>

            <td>
              Fabricação
            </td>

            <td class="valor">
              ${formatarMoeda(
                resumo
                  .custos
                  .fabricacao
              )}
            </td>

          </tr>


          <tr>

            <td>
              Logística
            </td>

            <td class="valor">
              ${formatarMoeda(
                resumo
                  .custos
                  .logistica
              )}
            </td>

          </tr>


          <tr>

            <td>
              Montagem
            </td>

            <td class="valor">
              ${formatarMoeda(
                resumo
                  .custos
                  .montagem
              )}
            </td>

          </tr>


          <tr class="total">

            <td>
              Custo Direto
            </td>

            <td class="valor">
              ${formatarMoeda(
                resumo
                  .custos
                  .custoDireto
              )}
            </td>

          </tr>


          <tr>

            <td>
              BDI
              (${formatarNumero(
                resumo
                  .bdi
                  .percentual
              )}%)
            </td>

            <td class="valor">
              ${formatarMoeda(
                resumo
                  .bdi
                  .valor
              )}
            </td>

          </tr>

        </tbody>

      </table>


      <div class="valor-final">

        <span>
          VALOR FINAL DO PROJETO
        </span>

        <strong>
          ${formatarMoeda(
            resumo.valorFinal
          )}
        </strong>

      </div>


      <div class="assinaturas">

        <div class="assinatura">
          Responsável pelo orçamento
        </div>

        <div class="assinatura">
          Cliente / Responsável
        </div>

      </div>


      <div class="rodape-corpo">

        Relatório gerado pelo
        sistema Estrutec.

        Os valores apresentados
        correspondem aos dados
        registrados neste projeto.

      </div>

    </body>

    </html>
  `;


  /*
    GERAÇÃO DO PDF
  */
  const navegador =
    await puppeteer.launch({
      headless: true,
    });

  try {
    const pagina =
      await navegador.newPage();

    await pagina.setContent(
      html,
      {
        waitUntil:
          "networkidle0",
      }
    );

    const pdf =
      await pagina.pdf({
        format: "A4",

        printBackground:
          true,

        displayHeaderFooter:
          true,


        /*
          CABEÇALHO DE TODAS
          AS PÁGINAS
        */
        headerTemplate: `
          <div
            style="
              width: 100%;
              padding:
                5px 18mm 0 18mm;

              display: flex;
              align-items: center;

              justify-content:
                space-between;

              font-family:
                Arial,
                Helvetica,
                sans-serif;
            "
          >

            ${
              logoBase64
                ? `
                  <img
                    src="data:image/png;base64,${logoBase64}"
                    style="
                      max-width: 105px;
                      max-height: 45px;
                      object-fit: contain;
                    "
                  />
                `
                : `
                  <strong
                    style="
                      font-size: 12px;
                      color: #171717;
                    "
                  >
                    ESTRUTEC
                  </strong>
                `
            }

            <div
              style="
                font-size: 8px;
                color: #78716C;
                text-align: right;
              "
            >
              Relatório Final —
              ${escaparHtml(
                projeto.codigo
              )}
            </div>

          </div>
        `,


        /*
          RODAPÉ COM PAGINAÇÃO
        */
        footerTemplate: `
          <div
            style="
              width: 100%;

              padding:
                0 18mm;

              display: flex;

              justify-content:
                space-between;

              font-family:
                Arial,
                Helvetica,
                sans-serif;

              font-size: 8px;

              color:
                #78716C;
            "
          >

            <span>
              Sistema Estrutec
            </span>

            <span>
              Página

              <span
                class="pageNumber"
              ></span>

              de

              <span
                class="totalPages"
              ></span>
            </span>

          </div>
        `,

        margin: {
          top: "24mm",
          right: "15mm",
          bottom: "22mm",
          left: "15mm",
        },
      });

    return Buffer.from(pdf);
  } finally {
    await navegador.close();
  }
}


module.exports = {
  gerarRelatorioFinal,
};