const puppeteer = require("puppeteer");
const ElementoProjeto = require("../modelos/ElementoProjeto");
const fabricacaoServico = require("./fabricacaoServico");
const logisticaServico = require("./logisticaServico");
const montagemServico = require("./montagemServico");
const LogisticaProjeto = require("../modelos/LogisticaProjeto");
const LogisticaPropria = require("../modelos/LogisticaPropria");
const fs = require("fs");
const path = require("path");

const Projeto = require("../modelos/Projeto");
const resumoFinanceiroServico = require(
  "./resumoFinanceiroServico"
);

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
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

function formatarNumero(valor, casas = 2) {
  return Number(valor || 0).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    }
  );
}

function escaparHtml(valor) {
  if (valor === null || valor === undefined) {
    return "-";
  }

  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function gerarRelatorioFinal(
  projetoId,
  usuarioId
) {
  const projeto = await Projeto.findOne({
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

  if (projeto.status !== "FINALIZADO") {
    throw new Error(
      "O projeto deve estar finalizado antes de gerar o relatório."
    );
  }

  const resumo =
    await resumoFinanceiroServico
      .calcularResumoFinanceiro(
        projetoId,
        usuarioId
      );

  const fabricacao =
    await fabricacaoServico.calcularCustos(
        projetoId,
        usuarioId
    );

  const logistica =
    await logisticaServico.calcularCustoLogistica(
        projetoId,
        usuarioId
    );

    let freteProprio = null;

  if (logistica.tipoFrete === "PROPRIO") {
    const configuracaoLogistica =
      await LogisticaProjeto.findOne({
        where: {
          projeto_id: projetoId,
        },
      });

    if (configuracaoLogistica) {
      freteProprio =
        await LogisticaPropria.findOne({
          where: {
            logistica_id:
              configuracaoLogistica.id,
          },
        });
    }
  }

  const montagem =
    await montagemServico.calcularCustos(
        projetoId,
        usuarioId
    );

  const elementos =
    await ElementoProjeto.findAll({
        where: {
        projeto_id: projetoId,
        },
        order: [
        ["tipo", "ASC"],
        ["id", "ASC"],
        ],
    });

  const linhasElementos = elementos
  .map((elemento) => {
    return `
      <tr>
        <td>${escaparHtml(elemento.tipo)}</td>
        <td>${escaparHtml(elemento.secao)}</td>
        <td>${formatarNumero(elemento.largura, 3)}</td>
        <td>${formatarNumero(elemento.altura, 3)}</td>
        <td>${formatarNumero(elemento.comprimento, 3)}</td>
        <td class="centralizado">${elemento.quantidade}</td>
        <td class="valor">
          ${formatarNumero(
            elemento.peso_unitario_kg,
            2
          )}
        </td>
      </tr>
    `;
  })
  .join("");

  const materiaisFabricacao = Object.entries(
  fabricacao.materiais
  )
  .map(([nome, material]) => {
    return `
      <tr>
        <td>
          ${nome.charAt(0).toUpperCase() +
          nome.slice(1)}
        </td>

        <td class="valor">
          ${formatarNumero(material.quantidade)}
          ${material.unidade || ""}
        </td>

        <td class="valor">
          ${
            material.precoUnitario !== undefined
              ? formatarMoeda(
                  material.precoUnitario
                )
              : "-"
          }
        </td>

        <td class="valor">
          ${formatarMoeda(material.custo)}
        </td>
      </tr>
    `;
  })
  .join("");

  const linhasEquipamentos =
  montagem.equipamentos.detalhes
    .map((equipamento) => {
      return `
        <tr>
          <td>${escaparHtml(equipamento.nome)}</td>

          <td class="centralizado">
            ${equipamento.quantidade}
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
      `;
    })
    .join("");

  const linhasEquipes =
  montagem.equipes.detalhes
    .map((equipe) => {
      return `
        <tr>
          <td>${escaparHtml(equipe.funcao)}</td>

          <td class="centralizado">
            ${equipe.quantidadeTrabalhadores}
          </td>

          <td class="centralizado">
            ${formatarNumero(
              equipe.quantidadeDias
            )}
          </td>

          <td class="valor">
            ${formatarMoeda(
              equipe.custoDiarioPorTrabalhador
            )}
          </td>

          <td class="valor">
            ${formatarMoeda(
              equipe.custoTotal
            )}
          </td>
        </tr>
      `;
    })
    .join("");

    const caminhoLogo = path.join(
    __dirname,
    "../assets/LogoT.jpg"
    );

    const logoBase64 = fs
    .readFileSync(caminhoLogo)
    .toString("base64");

    const dataEmissao = formatarDataHora();

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
        font-family: Arial, sans-serif;
        margin: 0;
        color: #222;
        font-size: 10px;
        }

        .cabecalho {
        border-bottom: 3px solid #222;
        padding-bottom: 14px;
        margin-bottom: 22px;
        }

        .cabecalho h1 {
        margin: 0;
        font-size: 26px;
        }

        .cabecalho p {
        margin: 5px 0 0;
        color: #666;
        font-size: 11px;
        }

        h2 {
        font-size: 15px;
        margin-top: 24px;
        margin-bottom: 10px;
        border-bottom: 1px solid #aaa;
        padding-bottom: 5px;
        }

        h3 {
        font-size: 12px;
        margin-top: 18px;
        margin-bottom: 8px;
        }

        table {
        width: 100%;
        border-collapse: collapse;
        }

        th,
        td {
        padding: 6px;
        border: 1px solid #ddd;
        }

        th {
        background: #f1f1f1;
        text-align: left;
        }

        .dados td:first-child {
        font-weight: bold;
        width: 28%;
        }

        .valor {
        text-align: right;
        }

        .centralizado {
        text-align: center;
        }

        .total {
        font-weight: bold;
        background: #f5f5f5;
        }

        .bloco-resumo {
        display: flex;
        gap: 10px;
        margin-top: 12px;
        }

        .card {
        flex: 1;
        border: 1px solid #ddd;
        padding: 10px;
        }

        .card span {
        display: block;
        color: #666;
        font-size: 9px;
        }

        .card strong {
        display: block;
        margin-top: 4px;
        font-size: 14px;
        }

        .valor-final {
        margin-top: 25px;
        padding: 16px;
        border: 2px solid #222;
        text-align: right;
        page-break-inside: avoid;
        }

        .valor-final span {
        display: block;
        font-size: 11px;
        }

        .valor-final strong {
        font-size: 22px;
        }

        .quebra {
        page-break-before: always;
        }

        .evitar-quebra {
        page-break-inside: avoid;
        }

        .rodape {
        margin-top: 35px;
        text-align: center;
        color: #777;
        font-size: 9px;
        }

        @page {
        size: A4;
        }

        thead {
        display: table-header-group;
        }

        tfoot {
        display: table-footer-group;
        }

        tr {
        page-break-inside: avoid;
        }

        h2,
        h3 {
        page-break-after: avoid;
        }

        .secao {
        margin-bottom: 20px;
        }

        .informacao-relatorio {
        margin-top: 10px;
        font-size: 9px;
        color: #666;
        }

        .observacoes {
        margin-top: 12px;
        padding: 10px;
        border: 1px solid #ddd;
        background: #fafafa;
        line-height: 1.5;
        }

        .assinaturas {
        margin-top: 55px;
        display: flex;
        gap: 50px;
        page-break-inside: avoid;
        }

        .assinatura {
        flex: 1;
        text-align: center;
        padding-top: 8px;
        border-top: 1px solid #444;
        }
    </style>
    </head>

    <body>

    <div class="cabecalho">
    <h1>ESTRUTEC</h1>

    <p>
        Relatório de Orçamentação e Planejamento
        de Estruturas Pré-Moldadas
    </p>

    <div class="informacao-relatorio">
        Código: ${escaparHtml(projeto.codigo)}
        |
        Emitido em: ${dataEmissao}
    </div>
    </div>

    <h2>1. Dados do Projeto</h2>

    <table class="dados">
        <tr>
        <td>Código</td>
        <td>${escaparHtml(projeto.codigo)}</td>
        </tr>

        <tr>
        <td>Projeto</td>
        <td>${escaparHtml(projeto.nome)}</td>
        </tr>

        <tr>
        <td>Cliente</td>
        <td>${escaparHtml(projeto.cliente)}</td>
        </tr>

        <tr>
        <td>Responsável</td>
        <td>
            ${escaparHtml(
            projeto.responsavel || "-"
            )}
        </td>
        </tr>

        <tr>
        <td>Origem</td>
        <td>
            ${escaparHtml(projeto.origem || "-")}
        </td>
        </tr>

        <tr>
        <td>Destino</td>
        <td>
            ${escaparHtml(projeto.destino || "-")}
        </td>
        </tr>

        <tr>
        <td>Prazo</td>
        <td>${formatarData(projeto.prazo)}</td>
        </tr>

        <tr>
        <td>Status</td>
        <td>${escaparHtml(projeto.status)}</td>
        </tr>
    </table>

    ${
    projeto.observacoes
        ? `
        <div class="observacoes">
            <strong>Observações do projeto</strong>

            <br><br>

            ${escaparHtml(projeto.observacoes)}
        </div>
        `
        : ""
    }

    <h2>2. Elementos Pré-Moldados</h2>

    <table>
        <thead>
        <tr>
            <th>Tipo</th>
            <th>Seção</th>
            <th>B (m)</th>
            <th>H (m)</th>
            <th>Comp. (m)</th>
            <th>Qtde.</th>
            <th>Peso Unit. (kg)</th>
        </tr>
        </thead>

        <tbody>
        ${linhasElementos}
        </tbody>
    </table>

    <div class="bloco-resumo">
        <div class="card">
        <span>Total de peças</span>
        <strong>
            ${fabricacao.resumo.totalPecas}
        </strong>
        </div>

        <div class="card">
        <span>Total de vigas</span>
        <strong>
            ${fabricacao.resumo.totalVigas}
        </strong>
        </div>

        <div class="card">
        <span>Volume de concreto</span>
        <strong>
            ${formatarNumero(
            fabricacao.resumo.volumeConcretoM3,
            3
            )} m³
        </strong>
        </div>
    </div>

    <div class="quebra"></div>

    <h2>3. Fabricação</h2>

    <table>
        <thead>
        <tr>
            <th>Material</th>
            <th>Quantidade</th>
            <th>Preço Unitário</th>
            <th>Custo</th>
        </tr>
        </thead>

        <tbody>
        ${materiaisFabricacao}

        <tr class="total">
            <td colspan="3">
            Custo Total da Fabricação
            </td>

            <td class="valor">
            ${formatarMoeda(
                fabricacao.custoTotalFabricacao
            )}
            </td>
        </tr>
        </tbody>
    </table>

    <h2>4. Logística</h2>

    ${
        logistica.tipoFrete === "TERCEIRIZADO"
        ? `
            <table class="dados">
            <tr>
                <td>Tipo de frete</td>
                <td>Terceirizado</td>
            </tr>

            <tr>
                <td>Transportadora</td>
                <td>
                ${escaparHtml(
                    logistica.detalhes.empresa
                )}
                </td>
            </tr>

            <tr>
                <td>Validade da cotação</td>
                <td>
                ${formatarData(
                    logistica.detalhes
                    .validadeCotacao
                )}
                </td>
            </tr>

            <tr>
                <td>Custo da logística</td>
                <td>
                ${formatarMoeda(
                    logistica.custoLogistica
                )}
                </td>
            </tr>

            <tr>
                <td>Observações</td>
                <td>
                ${escaparHtml(
                    logistica.detalhes
                    .observacoes || "-"
                )}
                </td>
            </tr>
            </table>
        `
          : `
            <h3>4.1 Dados do Transporte</h3>

            <table class="dados">
              <tr>
                <td>Tipo de frete</td>
                <td>Próprio</td>
              </tr>

              <tr>
                <td>Cavalo mecânico</td>
                <td>
                  ${escaparHtml(
                    logistica.detalhes.transporte
                      .cavaloMecanico || "-"
                  )}
                </td>
              </tr>

              <tr>
                <td>Carreta</td>
                <td>
                  ${escaparHtml(
                    logistica.detalhes.transporte
                      .carreta || "-"
                  )}
                </td>
              </tr>

              <tr>
                <td>Capacidade de peças</td>
                <td>
                  ${
                    freteProprio?.capacidade_pecas
                      ?? "-"
                  }
                </td>
              </tr>

              <tr>
                <td>Capacidade de peso</td>
                <td>
                  ${
                    freteProprio?.capacidade_peso_kg
                      ? `${formatarNumero(
                          freteProprio
                            .capacidade_peso_kg
                        )} kg`
                      : "-"
                  }
                </td>
              </tr>

              <tr>
                <td>Quantidade de viagens</td>
                <td>
                  ${logistica.detalhes.transporte
                    .quantidadeViagens}
                </td>
              </tr>

              <tr>
                <td>Distância de ida</td>
                <td>
                  ${formatarNumero(
                    logistica.detalhes.transporte
                      .distanciaIdaKm
                  )} km
                </td>
              </tr>

              <tr>
                <td>Considerar ida e volta</td>
                <td>
                  ${
                    logistica.detalhes.transporte
                      .considerarIdaVolta
                      ? "Sim"
                      : "Não"
                  }
                </td>
              </tr>

              <tr>
                <td>Km carregado</td>
                <td>
                  ${formatarNumero(
                    logistica.detalhes.transporte
                      .kmCarregado
                  )} km
                </td>
              </tr>

              <tr>
                <td>Km vazio</td>
                <td>
                  ${formatarNumero(
                    logistica.detalhes.transporte
                      .kmVazio
                  )} km
                </td>
              </tr>

              <tr class="total">
                <td>Quilometragem total</td>
                <td>
                  ${formatarNumero(
                    logistica.detalhes.transporte
                      .kmTotal
                  )} km
                </td>
              </tr>
            </table>


            <h3>4.2 Combustível</h3>

            <table class="dados">
              <tr>
                <td>Consumo carregado</td>
                <td>
                  ${formatarNumero(
                    logistica.detalhes.combustivel
                      .consumoCarregadoKmL
                  )} km/L
                </td>
              </tr>

              <tr>
                <td>Consumo vazio</td>
                <td>
                  ${formatarNumero(
                    logistica.detalhes.combustivel
                      .consumoVazioKmL
                  )} km/L
                </td>
              </tr>

              <tr>
                <td>Litros carregado</td>
                <td>
                  ${formatarNumero(
                    logistica.detalhes.combustivel
                      .litrosCarregado
                  )} L
                </td>
              </tr>

              <tr>
                <td>Litros vazio</td>
                <td>
                  ${formatarNumero(
                    logistica.detalhes.combustivel
                      .litrosVazio
                  )} L
                </td>
              </tr>

              <tr>
                <td>Litros totais</td>
                <td>
                  ${formatarNumero(
                    logistica.detalhes.combustivel
                      .litrosTotal
                  )} L
                </td>
              </tr>

              <tr>
                <td>Preço do diesel</td>
                <td>
                  ${formatarMoeda(
                    logistica.detalhes.combustivel
                      .precoDieselL
                  )} / L
                </td>
              </tr>

              <tr class="total">
                <td>Custo de combustível</td>
                <td>
                  ${formatarMoeda(
                    logistica.detalhes.combustivel
                      .custoCombustivel
                  )}
                </td>
              </tr>
            </table>


            <h3>4.3 Custos do Frete</h3>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="valor">Valor</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>Combustível</td>
                  <td class="valor">
                    ${formatarMoeda(
                      logistica.detalhes.custos
                        .combustivel
                    )}
                  </td>
                </tr>

                <tr>
                  <td>Manutenção</td>
                  <td class="valor">
                    ${formatarMoeda(
                      logistica.detalhes.custos
                        .manutencao
                    )}
                  </td>
                </tr>

                <tr>
                  <td>Motorista</td>
                  <td class="valor">
                    ${formatarMoeda(
                      logistica.detalhes.custos
                        .motorista
                    )}
                  </td>
                </tr>

                <tr>
                  <td>Alimentação do motorista</td>
                  <td class="valor">
                    ${formatarMoeda(
                      logistica.detalhes.custos
                        .alimentacao
                    )}
                  </td>
                </tr>

                <tr>
                  <td>Pedágios</td>
                  <td class="valor">
                    ${formatarMoeda(
                      logistica.detalhes.custos
                        .pedagios
                    )}
                  </td>
                </tr>

                <tr>
                  <td>Carregamento</td>
                  <td class="valor">
                    ${formatarMoeda(
                      logistica.detalhes.custos
                        .carregamento
                    )}
                  </td>
                </tr>

                <tr>
                  <td>Descarregamento</td>
                  <td class="valor">
                    ${formatarMoeda(
                      logistica.detalhes.custos
                        .descarregamento
                    )}
                  </td>
                </tr>

                <tr>
                  <td>Seguro</td>
                  <td class="valor">
                    ${formatarMoeda(
                      logistica.detalhes.custos
                        .seguro
                    )}
                  </td>
                </tr>

                <tr>
                  <td>Outros custos</td>
                  <td class="valor">
                    ${formatarMoeda(
                      logistica.detalhes.custos
                        .outrosCustos
                    )}
                  </td>
                </tr>

                <tr>
                  <td>Custo por viagem</td>
                  <td class="valor">
                    ${formatarMoeda(
                      logistica.detalhes
                        .custoPorViagem
                    )}
                  </td>
                </tr>

                <tr class="total">
                  <td>Custo Total da Logística</td>
                  <td class="valor">
                    ${formatarMoeda(
                      logistica.custoLogistica
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            ${
              freteProprio?.observacoes
                ? `
                  <div class="observacoes">
                    <strong>
                      Observações da logística
                    </strong>

                    <br><br>

                    ${escaparHtml(
                      freteProprio.observacoes
                    )}
                  </div>
                `
                : ""
            }
          `
    }

    <div class="quebra"></div>

    <h2>5. Montagem</h2>

    <h3>5.1 Equipamentos</h3>

    <table>
        <thead>
        <tr>
            <th>Equipamento</th>
            <th>Qtde.</th>
            <th>Cobrança</th>
            <th>Tempo</th>
            <th>Valor Unit.</th>
            <th>Total</th>
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
                montagem.equipamentos.custoTotal
            )}
            </td>
        </tr>
        </tbody>
    </table>

    <h3>5.2 Equipe</h3>

    <table>
        <thead>
        <tr>
            <th>Função</th>
            <th>Trabalhadores</th>
            <th>Dias</th>
            <th>Custo Diário</th>
            <th>Total</th>
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
                montagem.equipes.custoTotal
            )}
            </td>
        </tr>
        </tbody>
    </table>

    <h3>5.3 Custos Gerais</h3>

    <table class="dados">
        <tr>
        <td>Hospedagem</td>
        <td>
            ${formatarMoeda(
            montagem.custosGerais.hospedagem
            )}
        </td>
        </tr>

        <tr>
        <td>Alimentação</td>
        <td>
            ${formatarMoeda(
            montagem.custosGerais.alimentacao
            )}
        </td>
        </tr>

        <tr>
        <td>Transporte da equipe</td>
        <td>
            ${formatarMoeda(
            montagem.custosGerais
                .transporteEquipe
            )}
        </td>
        </tr>

        <tr>
        <td>Outros custos</td>
        <td>
            ${formatarMoeda(
            montagem.custosGerais.outrosCustos
            )}
        </td>
        </tr>

        <tr class="total">
        <td>Custo Total da Montagem</td>
        <td>
            ${formatarMoeda(
            montagem.custoTotalMontagem
            )}
        </td>
        </tr>
    </table>

    <div class="quebra"></div>

    <h2>6. Resumo Financeiro</h2>

    <table>
        <thead>
        <tr>
            <th>Etapa</th>
            <th class="valor">Valor</th>
        </tr>
        </thead>

        <tbody>
        <tr>
            <td>Fabricação</td>
            <td class="valor">
            ${formatarMoeda(
                resumo.custos.fabricacao
            )}
            </td>
        </tr>

        <tr>
            <td>Logística</td>
            <td class="valor">
            ${formatarMoeda(
                resumo.custos.logistica
            )}
            </td>
        </tr>

        <tr>
            <td>Montagem</td>
            <td class="valor">
            ${formatarMoeda(
                resumo.custos.montagem
            )}
            </td>
        </tr>

        <tr class="total">
            <td>Custo Direto</td>
            <td class="valor">
            ${formatarMoeda(
                resumo.custos.custoDireto
            )}
            </td>
        </tr>

        <tr>
            <td>
            BDI (${formatarNumero(
                resumo.bdi.percentual
            )}%)
            </td>

            <td class="valor">
            ${formatarMoeda(
                resumo.bdi.valor
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

    <div class="rodape">
        Relatório gerado pelo sistema Estrutec.
    </div>

    </body>

    </html>
    `;

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
        waitUntil: "networkidle0",
      }
    );

    const pdf = await pagina.pdf({
    format: "A4",

    printBackground: true,

    displayHeaderFooter: true,

    headerTemplate: `
    <div style="
        width: 100%;
        padding: 6px 18mm 0 18mm;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: Arial, sans-serif;
    ">

        <img
        src="data:image/png;base64,${logoBase64}"
        style="
            max-width: 120px;
            max-height: 55px;
            object-fit: contain;
        "
        />

        <div style="
        font-size: 8px;
        color: #777;
        text-align: right;
        ">
        Estrutec — ${escaparHtml(projeto.codigo)}
        </div>

    </div>
    `,

    footerTemplate: `
        <div style="
        width: 100%;
        font-size: 8px;
        padding: 0 18mm;
        color: #777;
        display: flex;
        justify-content: space-between;
        ">

        <span>
            Sistema Estrutec
        </span>

        <span>
            Página
            <span class="pageNumber"></span>
            de
            <span class="totalPages"></span>
        </span>

        </div>
    `,

    margin: {
        top: "25mm",
        right: "18mm",
        bottom: "25mm",
        left: "18mm",
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