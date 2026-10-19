"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  apiAutenticada,
} from "@/servicos/api";

type EquipamentoMontagem = {
  id: number;
  nome: string;
  quantidade: number;
  tipo_cobranca: "HORA" | "DIA";
  tempo_uso: string | number;
  valor_unitario: string | number;
  custo_mobilizacao: string | number;
  custo_desmobilizacao: string | number;
  observacoes?: string | null;
};

type EquipeMontagem = {
  id: number;
  funcao: string;
  quantidade_trabalhadores: number;
  quantidade_dias: number;
  custo_diario_por_trabalhador: string | number;
  observacoes?: string | null;
};

type CustosMontagem = {
  equipamentos: {
    quantidade: number;
    custoTotal: number;
    detalhes: {
      id: number;
      nome: string;
      quantidade: number;
      tipoCobranca: "HORA" | "DIA";
      tempoUso: number;
      valorUnitario: number;
      custoUso: number;
      custoMobilizacao: number;
      custoDesmobilizacao: number;
      custoTotal: number;
    }[];
  };

  equipes: {
    quantidade: number;
    custoTotal: number;
    detalhes: {
      id: number;
      funcao: string;
      quantidadeTrabalhadores: number;
      quantidadeDias: number;
      custoDiarioPorTrabalhador: number;
      custoTotal: number;
    }[];
  };

  custosGerais: {
    hospedagem: number;
    alimentacao: number;
    transporteEquipe: number;
    outrosCustos: number;
    total: number;
  };

  custoTotalMontagem: number;
};

export default function MontagemPage() {
  const router = useRouter();

  const params =
    useParams<{ id: string }>();

  const id = params.id;

  const [custoHospedagem, setCustoHospedagem] =
    useState("");

  const [custoAlimentacao, setCustoAlimentacao] =
    useState("");

  const [
    custoTransporteEquipe,
    setCustoTransporteEquipe,
  ] = useState("");

  const [outrosCustos, setOutrosCustos] =
    useState("");

  const [observacoes, setObservacoes] =
    useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  const [equipamentos, setEquipamentos] =
    useState<EquipamentoMontagem[]>([]);

  const [nomeEquipamento, setNomeEquipamento] =
    useState("");

  const [quantidadeEquipamento, setQuantidadeEquipamento] =
    useState("1");

  const [tipoCobranca, setTipoCobranca] =
    useState<"HORA" | "DIA">("DIA");

  const [tempoUso, setTempoUso] =
    useState("");

  const [valorUnitario, setValorUnitario] =
    useState("");

  const [custoMobilizacao, setCustoMobilizacao] =
    useState("");

  const [custoDesmobilizacao, setCustoDesmobilizacao] =
    useState("");

  const [observacoesEquipamento, setObservacoesEquipamento] =
    useState("");

  const [salvandoEquipamento, setSalvandoEquipamento] =
    useState(false);

  const [sucessoEquipamento, setSucessoEquipamento] =
    useState("");

  const [equipes, setEquipes] =
    useState<EquipeMontagem[]>([]);

  const [funcaoEquipe, setFuncaoEquipe] =
    useState("");

  const [
    quantidadeTrabalhadores,
    setQuantidadeTrabalhadores,
    ] = useState("1");

  const [quantidadeDias, setQuantidadeDias] =
    useState("");

  const [
    custoDiarioTrabalhador,
    setCustoDiarioTrabalhador,
    ] = useState("");

  const [
    observacoesEquipe,
    setObservacoesEquipe,
    ] = useState("");

  const [salvandoEquipe, setSalvandoEquipe] =
    useState(false);

  const [sucessoEquipe, setSucessoEquipe] =
    useState("");

  const [custosMontagem, setCustosMontagem] =
    useState<CustosMontagem | null>(null);

  const [calculandoMontagem, setCalculandoMontagem] =
    useState(false);

  const [confirmandoMontagem, setConfirmandoMontagem] =
    useState(false);

  const [montagemConfirmada, setMontagemConfirmada] =
    useState(false);

  const [sucessoConfirmacao, setSucessoConfirmacao] =
    useState("");

  const [erroCalculo, setErroCalculo] =
    useState("");

    useEffect(() => {
        carregarMontagem();
        carregarEquipamentos();
        carregarEquipes();
    }, [id]);

  async function carregarMontagem() {
    try {
      setCarregando(true);
      setErro("");

      const resposta =
        await apiAutenticada(
          `/projetos/${id}/montagem`
        );

      if (resposta.status === 401) {
        localStorage.removeItem(
          "estrutec_token"
        );

        router.push("/login");
        return;
      }

      if (resposta.status === 404) {
        return;
      }

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        setErro(
          dados.erro ||
            "Não foi possível carregar a montagem."
        );

        return;
      }

      const montagem =
        dados.montagem || dados;

      setCustoHospedagem(
        String(
          montagem.custo_hospedagem ??
            ""
        )
      );

      setCustoAlimentacao(
        String(
          montagem.custo_alimentacao ??
            ""
        )
      );

      setCustoTransporteEquipe(
        String(
          montagem.custo_transporte_equipe ??
            ""
        )
      );

      setOutrosCustos(
        String(
          montagem.outros_custos ??
            ""
        )
      );

      setObservacoes(
        montagem.observacoes || ""
      );
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function salvarMontagem() {
    setErro("");
    setSucesso("");
    setSalvando(true);

    try {
      const resposta =
        await apiAutenticada(
          `/projetos/${id}/montagem`,
          {
            method: "PUT",

            body: JSON.stringify({
              custoHospedagem:
                Number(
                  custoHospedagem || 0
                ),

              custoAlimentacao:
                Number(
                  custoAlimentacao || 0
                ),

              custoTransporteEquipe:
                Number(
                  custoTransporteEquipe || 0
                ),

              outrosCustos:
                Number(
                  outrosCustos || 0
                ),

              observacoes:
                observacoes || null,
            }),
          }
        );

      const dados =
        await resposta.json();

      if (resposta.status === 401) {
        localStorage.removeItem(
          "estrutec_token"
        );

        router.push("/login");
        return;
      }

      if (!resposta.ok) {
        setErro(
          dados.erro ||
            "Não foi possível salvar a montagem."
        );

        return;
      }

      setSucesso(
        dados.mensagem ||
          "Dados da montagem salvos com sucesso!"
      );

      await carregarMontagem();
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <main style={estilos.centralizado}>
        Carregando montagem...
      </main>
    );
  }

  async function carregarEquipamentos() {
    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/montagem/equipamentos`
        );

        if (resposta.status === 401) {
        localStorage.removeItem(
            "estrutec_token"
        );

        router.push("/login");
        return;
        }

        if (!resposta.ok) {
        return;
        }

        const dados = await resposta.json();

        setEquipamentos(
        dados.equipamentos || dados || []
        );
    } catch {
        // A página continua funcionando.
    }
   }

   async function adicionarEquipamento() {
    if (!nomeEquipamento.trim()) {
        setErro(
        "Informe o nome do equipamento."
        );
        return;
    }

    if (
        Number(quantidadeEquipamento) <= 0 ||
        Number(tempoUso) <= 0 ||
        Number(valorUnitario) < 0
    ) {
        setErro(
        "Confira quantidade, tempo de uso e valor unitário."
        );
        return;
    }

    setErro("");
    setSucessoEquipamento("");
    setSalvandoEquipamento(true);

    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/montagem/equipamentos`,
        {
            method: "POST",

            body: JSON.stringify({
            nome: nomeEquipamento,

            quantidade:
                Number(quantidadeEquipamento),

            tipoCobranca,

            tempoUso:
                Number(tempoUso),

            valorUnitario:
                Number(valorUnitario),

            custoMobilizacao:
                Number(custoMobilizacao || 0),

            custoDesmobilizacao:
                Number(custoDesmobilizacao || 0),

            observacoes:
                observacoesEquipamento || null,
            }),
        }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
        setErro(
            dados.erro ||
            "Não foi possível adicionar o equipamento."
        );
        return;
        }

        setSucessoEquipamento(
        "Equipamento adicionado com sucesso!"
        );

        setNomeEquipamento("");
        setQuantidadeEquipamento("1");
        setTipoCobranca("DIA");
        setTempoUso("");
        setValorUnitario("");
        setCustoMobilizacao("");
        setCustoDesmobilizacao("");
        setObservacoesEquipamento("");

        await carregarEquipamentos();
    } catch {
        setErro(
        "Não foi possível conectar ao servidor."
        );
    } finally {
        setSalvandoEquipamento(false);
    }
    }

    function calcularCustoEquipamento(
        equipamento: EquipamentoMontagem
        ) {
        return (
            Number(equipamento.quantidade) *
            Number(equipamento.tempo_uso) *
            Number(equipamento.valor_unitario) +
            Number(equipamento.custo_mobilizacao || 0) +
            Number(equipamento.custo_desmobilizacao || 0)
        );
        }

        function formatarMoeda(valor: number) {
        return new Intl.NumberFormat(
            "pt-BR",
            {
            style: "currency",
            currency: "BRL",
            }
        ).format(valor);
    }

    async function carregarEquipes() {
    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/montagem/equipes`
        );

        if (resposta.status === 401) {
        localStorage.removeItem(
            "estrutec_token"
        );

        router.push("/login");
        return;
        }

        if (!resposta.ok) {
        return;
        }

        const dados = await resposta.json();

        setEquipes(
        dados.equipes || dados || []
        );
    } catch {
        // A página continua funcionando.
    }
    }

  async function adicionarEquipe() {
    if (!funcaoEquipe.trim()) {
        setErro(
        "Informe a função da equipe."
        );

        return;
    }

    if (
        Number(quantidadeTrabalhadores) <= 0 ||
        Number(quantidadeDias) <= 0 ||
        Number(custoDiarioTrabalhador) < 0
    ) {
        setErro(
        "Confira a quantidade de trabalhadores, dias e custo diário."
        );

        return;
    }

    setErro("");
    setSucessoEquipe("");
    setSalvandoEquipe(true);

    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/montagem/equipes`,
        {
            method: "POST",

            body: JSON.stringify({
            funcao: funcaoEquipe,

            quantidadeTrabalhadores:
                Number(
                quantidadeTrabalhadores
                ),

            quantidadeDias:
                Number(quantidadeDias),

            custoDiarioPorTrabalhador:
                Number(
                custoDiarioTrabalhador
                ),

            observacoes:
                observacoesEquipe || null,
            }),
        }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
        setErro(
            dados.erro ||
            "Não foi possível adicionar a equipe."
        );

        return;
        }

        setSucessoEquipe(
        "Equipe adicionada com sucesso!"
        );

        setFuncaoEquipe("");
        setQuantidadeTrabalhadores("1");
        setQuantidadeDias("");
        setCustoDiarioTrabalhador("");
        setObservacoesEquipe("");

        await carregarEquipes();
    } catch {
        setErro(
        "Não foi possível conectar ao servidor."
        );
    } finally {
        setSalvandoEquipe(false);
    }
    }

    function calcularCustoEquipe(
    equipe: EquipeMontagem
    ) {
    return (
        Number(
        equipe.quantidade_trabalhadores
        ) *
        Number(equipe.quantidade_dias) *
        Number(
        equipe.custo_diario_por_trabalhador
        )
    );
    }

    async function calcularCustosMontagem() {
    setCalculandoMontagem(true);
    setErroCalculo("");
    setCustosMontagem(null);

    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/montagem/custos`,
        {
            cache: "no-store",
        }
        );

        if (resposta.status === 401) {
        localStorage.removeItem(
            "estrutec_token"
        );

        router.push("/login");
        return;
        }

        const dados = await resposta.json();

        if (!resposta.ok) {
        setErroCalculo(
            dados.erro ||
            "Não foi possível calcular os custos da montagem."
        );

        return;
        }

        setCustosMontagem({
        equipamentos: dados.equipamentos,
        equipes: dados.equipes,
        custosGerais: dados.custosGerais,
        custoTotalMontagem:
            dados.custoTotalMontagem,
        });
    } catch {
        setErroCalculo(
        "Não foi possível conectar ao servidor."
        );
    } finally {
        setCalculandoMontagem(false);
    }
    }

    async function confirmarMontagem() {
    if (!custosMontagem) {
        setErroCalculo(
        "Calcule a montagem antes de confirmar."
        );

        return;
    }

    setErroCalculo("");
    setSucessoConfirmacao("");
    setConfirmandoMontagem(true);

    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/montagem/confirmar`,
        {
            method: "POST",
        }
        );

        if (resposta.status === 401) {
        localStorage.removeItem(
            "estrutec_token"
        );

        router.push("/login");
        return;
        }

        const dados = await resposta.json();

        if (!resposta.ok) {
        setErroCalculo(
            dados.erro ||
            "Não foi possível confirmar a montagem."
        );

        return;
        }

        setMontagemConfirmada(true);

        setSucessoConfirmacao(
        dados.mensagem ||
            "Montagem confirmada com sucesso!"
        );
    } catch {
        setErroCalculo(
        "Não foi possível conectar ao servidor."
        );
    } finally {
        setConfirmandoMontagem(false);
    }
    }

  return (
    <main style={estilos.pagina}>
      <header style={estilos.cabecalho}>
        <div>
          <h1 style={estilos.logo}>
            ESTRUTEC
          </h1>

          <p style={estilos.subtitulo}>
            Montagem
          </p>
        </div>

        <button
          type="button"
          style={estilos.botaoVoltar}
          onClick={() =>
            router.push(
              `/projetos/${id}`
            )
          }
        >
          ← Voltar ao projeto
        </button>
      </header>

      <section style={estilos.conteudo}>
        <div style={estilos.card}>
          <h2 style={estilos.titulo}>
            Custos Gerais da Montagem
          </h2>

          <p style={estilos.descricao}>
            Informe os custos gerais
            relacionados à execução da
            montagem dos elementos
            pré-moldados.
          </p>

          <div style={estilos.gridFormulario}>
            <div style={estilos.campo}>
              <label>
                Hospedagem (R$)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={custoHospedagem}
                onChange={(evento) =>
                  setCustoHospedagem(
                    evento.target.value
                  )
                }
                style={estilos.input}
              />
            </div>

            <div style={estilos.campo}>
              <label>
                Alimentação (R$)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={custoAlimentacao}
                onChange={(evento) =>
                  setCustoAlimentacao(
                    evento.target.value
                  )
                }
                style={estilos.input}
              />
            </div>

            <div style={estilos.campo}>
              <label>
                Transporte da equipe (R$)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  custoTransporteEquipe
                }
                onChange={(evento) =>
                  setCustoTransporteEquipe(
                    evento.target.value
                  )
                }
                style={estilos.input}
              />
            </div>

            <div style={estilos.campo}>
              <label>
                Outros custos (R$)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={outrosCustos}
                onChange={(evento) =>
                  setOutrosCustos(
                    evento.target.value
                  )
                }
                style={estilos.input}
              />
            </div>
          </div>

          <div style={estilos.campoObservacao}>
            <label>
              Observações
            </label>

            <textarea
              value={observacoes}
              onChange={(evento) =>
                setObservacoes(
                  evento.target.value
                )
              }
              rows={4}
              style={estilos.textarea}
              placeholder="Observações sobre a montagem..."
            />
          </div>

          {erro && (
            <div style={estilos.erro}>
              {erro}
            </div>
          )}

          {sucesso && (
            <div style={estilos.sucesso}>
              {sucesso}
            </div>
          )}

          <div style={estilos.acoes}>
            <button
              type="button"
              onClick={salvarMontagem}
              disabled={salvando}
              style={estilos.botaoSalvar}
            >
              {salvando
                ? "Salvando..."
                : "Salvar custos gerais"}
            </button>
          </div>
        </div>

        <div style={estilos.cardSecundario}>
            <h2 style={estilos.titulo}>
                Equipamentos de Montagem
            </h2>

            <p style={estilos.descricao}>
                Cadastre os equipamentos utilizados
                durante a montagem da estrutura.
            </p>

            <div style={estilos.gridFormulario}>
                <div style={estilos.campo}>
                <label>Equipamento *</label>

                <input
                    value={nomeEquipamento}
                    onChange={(evento) =>
                    setNomeEquipamento(
                        evento.target.value
                    )
                    }
                    placeholder="Ex.: Guindaste"
                    style={estilos.input}
                />
                </div>

                <div style={estilos.campo}>
                <label>Quantidade *</label>

                <input
                    type="number"
                    min="1"
                    value={quantidadeEquipamento}
                    onChange={(evento) =>
                    setQuantidadeEquipamento(
                        evento.target.value
                    )
                    }
                    style={estilos.input}
                />
                </div>

                <div style={estilos.campo}>
                <label>Tipo de cobrança *</label>

                <select
                    value={tipoCobranca}
                    onChange={(evento) =>
                    setTipoCobranca(
                        evento.target.value as
                        | "HORA"
                        | "DIA"
                    )
                    }
                    style={estilos.input}
                >
                    <option value="DIA">
                    Por dia
                    </option>

                    <option value="HORA">
                    Por hora
                    </option>
                </select>
                </div>

                <div style={estilos.campo}>
                <label>
                    {tipoCobranca === "DIA"
                    ? "Dias de uso *"
                    : "Horas de uso *"}
                </label>

                <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={tempoUso}
                    onChange={(evento) =>
                    setTempoUso(
                        evento.target.value
                    )
                    }
                    style={estilos.input}
                />
                </div>

                <div style={estilos.campo}>
                <label>
                    Valor unitário (R$) *
                </label>

                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={valorUnitario}
                    onChange={(evento) =>
                    setValorUnitario(
                        evento.target.value
                    )
                    }
                    style={estilos.input}
                />
                </div>

                <div style={estilos.campo}>
                <label>
                    Mobilização (R$)
                </label>

                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={custoMobilizacao}
                    onChange={(evento) =>
                    setCustoMobilizacao(
                        evento.target.value
                    )
                    }
                    style={estilos.input}
                />
                </div>

                <div style={estilos.campo}>
                <label>
                    Desmobilização (R$)
                </label>

                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={custoDesmobilizacao}
                    onChange={(evento) =>
                    setCustoDesmobilizacao(
                        evento.target.value
                    )
                    }
                    style={estilos.input}
                />
                </div>
            </div>

            <div style={estilos.campoObservacao}>
                <label>
                Observações do equipamento
                </label>

                <textarea
                value={observacoesEquipamento}
                onChange={(evento) =>
                    setObservacoesEquipamento(
                    evento.target.value
                    )
                }
                rows={3}
                style={estilos.textarea}
                />
            </div>

            {sucessoEquipamento && (
                <div style={estilos.sucesso}>
                {sucessoEquipamento}
                </div>
            )}

            <div style={estilos.acoes}>
                <button
                type="button"
                onClick={adicionarEquipamento}
                disabled={salvandoEquipamento}
                style={estilos.botaoSalvar}
                >
                {salvandoEquipamento
                    ? "Adicionando..."
                    : "Adicionar equipamento"}
                </button>
            </div>

            {equipamentos.length > 0 && (
                <div style={estilos.tabelaContainer}>
                <table style={estilos.tabela}>
                    <thead>
                    <tr>
                        <th style={estilos.th}>
                        Equipamento
                        </th>

                        <th style={estilos.th}>
                        Qtd.
                        </th>

                        <th style={estilos.th}>
                        Cobrança
                        </th>

                        <th style={estilos.th}>
                        Uso
                        </th>

                        <th style={estilos.th}>
                        Valor
                        </th>

                        <th style={estilos.th}>
                        Custo calculado
                        </th>
                    </tr>
                    </thead>

                    <tbody>
                    {equipamentos.map(
                        (equipamento) => (
                        <tr key={equipamento.id}>
                            <td style={estilos.td}>
                            {equipamento.nome}
                            </td>

                            <td style={estilos.td}>
                            {equipamento.quantidade}
                            </td>

                            <td style={estilos.td}>
                            {equipamento.tipo_cobranca}
                            </td>

                            <td style={estilos.td}>
                            {equipamento.tempo_uso}
                            </td>

                            <td style={estilos.td}>
                            {formatarMoeda(
                                Number(
                                equipamento.valor_unitario
                                )
                            )}
                            </td>

                            <td style={estilos.td}>
                            <strong>
                                {formatarMoeda(
                                calcularCustoEquipamento(
                                    equipamento
                                )
                                )}
                            </strong>
                            </td>
                        </tr>
                        )
                    )}
                    </tbody>
                </table>
                </div>
            )}
            </div>

            <div style={estilos.cardSecundario}>
                <h2 style={estilos.titulo}>
                    Equipe de Montagem
                </h2>

                <p style={estilos.descricao}>
                    Cadastre os profissionais envolvidos
                    na montagem e seus respectivos custos.
                </p>

                <div style={estilos.gridFormulario}>
                    <div style={estilos.campo}>
                    <label>
                        Função *
                    </label>

                    <input
                        value={funcaoEquipe}
                        onChange={(evento) =>
                        setFuncaoEquipe(
                            evento.target.value
                        )
                        }
                        placeholder="Ex.: Montador"
                        style={estilos.input}
                    />
                    </div>

                    <div style={estilos.campo}>
                    <label>
                        Quantidade de trabalhadores *
                    </label>

                    <input
                        type="number"
                        min="1"
                        value={quantidadeTrabalhadores}
                        onChange={(evento) =>
                        setQuantidadeTrabalhadores(
                            evento.target.value
                        )
                        }
                        style={estilos.input}
                    />
                    </div>

                    <div style={estilos.campo}>
                    <label>
                        Quantidade de dias *
                    </label>

                    <input
                        type="number"
                        min="1"
                        value={quantidadeDias}
                        onChange={(evento) =>
                        setQuantidadeDias(
                            evento.target.value
                        )
                        }
                        style={estilos.input}
                    />
                    </div>

                    <div style={estilos.campo}>
                    <label>
                        Custo diário por trabalhador (R$) *
                    </label>

                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={custoDiarioTrabalhador}
                        onChange={(evento) =>
                        setCustoDiarioTrabalhador(
                            evento.target.value
                        )
                        }
                        style={estilos.input}
                    />
                    </div>
                </div>

                <div style={estilos.campoObservacao}>
                    <label>
                    Observações da equipe
                    </label>

                    <textarea
                    value={observacoesEquipe}
                    onChange={(evento) =>
                        setObservacoesEquipe(
                        evento.target.value
                        )
                    }
                    rows={3}
                    style={estilos.textarea}
                    />
                </div>

                {sucessoEquipe && (
                    <div style={estilos.sucesso}>
                    {sucessoEquipe}
                    </div>
                )}

                <div style={estilos.acoes}>
                    <button
                    type="button"
                    onClick={adicionarEquipe}
                    disabled={salvandoEquipe}
                    style={estilos.botaoSalvar}
                    >
                    {salvandoEquipe
                        ? "Adicionando..."
                        : "Adicionar equipe"}
                    </button>
                </div>

                {equipes.length > 0 && (
                    <div style={estilos.tabelaContainer}>
                    <table style={estilos.tabela}>
                        <thead>
                        <tr>
                            <th style={estilos.th}>
                            Função
                            </th>

                            <th style={estilos.th}>
                            Trabalhadores
                            </th>

                            <th style={estilos.th}>
                            Dias
                            </th>

                            <th style={estilos.th}>
                            Custo diário
                            </th>

                            <th style={estilos.th}>
                            Custo total
                            </th>
                        </tr>
                        </thead>

                        <tbody>
                        {equipes.map((equipe) => (
                            <tr key={equipe.id}>
                            <td style={estilos.td}>
                                {equipe.funcao}
                            </td>

                            <td style={estilos.td}>
                                {
                                equipe.quantidade_trabalhadores
                                }
                            </td>

                            <td style={estilos.td}>
                                {equipe.quantidade_dias}
                            </td>

                            <td style={estilos.td}>
                                {formatarMoeda(
                                Number(
                                    equipe.custo_diario_por_trabalhador
                                )
                                )}
                            </td>

                            <td style={estilos.td}>
                                <strong>
                                {formatarMoeda(
                                    calcularCustoEquipe(
                                    equipe
                                    )
                                )}
                                </strong>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                )}
                </div>

                <div style={estilos.cardSecundario}>
                <div style={estilos.cabecalhoCalculo}>
                    <div>
                    <h2 style={estilos.titulo}>
                        Cálculo da Montagem
                    </h2>

                    <p style={estilos.descricao}>
                        Calcule o custo total considerando
                        equipamentos, equipe e custos gerais.
                    </p>
                    </div>

                    <button
                    type="button"
                    onClick={calcularCustosMontagem}
                    disabled={calculandoMontagem}
                    style={estilos.botaoCalcular}
                    >
                    {calculandoMontagem
                        ? "Calculando..."
                        : "Calcular montagem"}
                    </button>
                </div>

                {erroCalculo && (
                    <div style={estilos.erro}>
                    {erroCalculo}
                    </div>
                )}

                {custosMontagem && (
                    <>
                    <div style={estilos.resumoCalculo}>
                        <div style={estilos.indicador}>
                        <span>Equipamentos</span>

                        <strong>
                            {formatarMoeda(
                            custosMontagem.equipamentos
                                .custoTotal
                            )}
                        </strong>

                        <small>
                            {
                            custosMontagem.equipamentos
                                .quantidade
                            }{" "}
                            cadastrado(s)
                        </small>
                        </div>

                        <div style={estilos.indicador}>
                        <span>Equipe</span>

                        <strong>
                            {formatarMoeda(
                            custosMontagem.equipes
                                .custoTotal
                            )}
                        </strong>

                        <small>
                            {
                            custosMontagem.equipes
                                .quantidade
                            }{" "}
                            função(ões)
                        </small>
                        </div>

                        <div style={estilos.indicador}>
                        <span>Custos gerais</span>

                        <strong>
                            {formatarMoeda(
                            custosMontagem.custosGerais
                                .total
                            )}
                        </strong>
                        </div>
                    </div>

                    <h3 style={estilos.subtituloTabela}>
                        Detalhamento dos Custos
                    </h3>

                    <div style={estilos.tabelaContainer}>
                        <table style={estilos.tabela}>
                        <thead>
                            <tr>
                            <th style={estilos.th}>
                                Item
                            </th>

                            <th style={estilos.th}>
                                Custo
                            </th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr>
                            <td style={estilos.td}>
                                Equipamentos
                            </td>

                            <td style={estilos.td}>
                                {formatarMoeda(
                                custosMontagem.equipamentos
                                    .custoTotal
                                )}
                            </td>
                            </tr>

                            <tr>
                            <td style={estilos.td}>
                                Equipe de montagem
                            </td>

                            <td style={estilos.td}>
                                {formatarMoeda(
                                custosMontagem.equipes
                                    .custoTotal
                                )}
                            </td>
                            </tr>

                            <tr>
                            <td style={estilos.td}>
                                Hospedagem
                            </td>

                            <td style={estilos.td}>
                                {formatarMoeda(
                                custosMontagem.custosGerais
                                    .hospedagem
                                )}
                            </td>
                            </tr>

                            <tr>
                            <td style={estilos.td}>
                                Alimentação
                            </td>

                            <td style={estilos.td}>
                                {formatarMoeda(
                                custosMontagem.custosGerais
                                    .alimentacao
                                )}
                            </td>
                            </tr>

                            <tr>
                            <td style={estilos.td}>
                                Transporte da equipe
                            </td>

                            <td style={estilos.td}>
                                {formatarMoeda(
                                custosMontagem.custosGerais
                                    .transporteEquipe
                                )}
                            </td>
                            </tr>

                            <tr>
                            <td style={estilos.td}>
                                Outros custos
                            </td>

                            <td style={estilos.td}>
                                {formatarMoeda(
                                custosMontagem.custosGerais
                                    .outrosCustos
                                )}
                            </td>
                            </tr>
                        </tbody>
                        </table>
                    </div>

                    <div style={estilos.totalMontagem}>
                        <span>
                        CUSTO TOTAL DA MONTAGEM
                        </span>

                        <strong>
                        {formatarMoeda(
                            custosMontagem.custoTotalMontagem
                        )}
                        </strong>
                    </div>
                    <div style={estilos.confirmacaoMontagem}>
                    {montagemConfirmada ? (
                        <>
                        <div style={estilos.sucessoConfirmacao}>
                            {sucessoConfirmacao}
                        </div>

                        <button
                            type="button"
                            style={estilos.botaoContinuar}
                            onClick={() =>
                            router.push(
                                `/projetos/${id}/resumo`
                            )
                            }
                        >
                            Continuar para resumo financeiro →
                        </button>
                        </>
                    ) : (
                        <button
                        type="button"
                        onClick={confirmarMontagem}
                        disabled={confirmandoMontagem}
                        style={estilos.botaoConfirmar}
                        >
                        {confirmandoMontagem
                            ? "Confirmando..."
                            : "Confirmar montagem"}
                        </button>
                    )}
                    </div>
                    </>
                )}
                </div>
      </section>
    </main>
  );
}

const estilos = {
  pagina: {
    minHeight: "100vh",
    background: "#f4f6f8",
    fontFamily: "Arial, sans-serif",
  },

  centralizado: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
  },

  cabecalho: {
    minHeight: "80px",
    background: "#ffffff",
    borderBottom:
      "1px solid #e5e7eb",
    padding: "16px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    margin: 0,
    fontSize: "24px",
  },

  subtitulo: {
    margin: "4px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  botaoVoltar: {
    background: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    padding: "10px 15px",
    cursor: "pointer",
  },

  conteudo: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "35px 40px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "30px",
  },

  titulo: {
    margin: 0,
    fontSize: "22px",
  },

  descricao: {
    margin: "7px 0 22px",
    color: "#6b7280",
    fontSize: "14px",
  },

  gridFormulario: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },

  campo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
    fontSize: "13px",
    fontWeight: 600,
  },

  input: {
    height: "43px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    padding: "0 11px",
    fontSize: "14px",
  },

  campoObservacao: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
    fontSize: "13px",
    fontWeight: 600,
  },

  textarea: {
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    padding: "12px",
    fontFamily: "Arial, sans-serif",
    resize: "vertical" as const,
  },

  erro: {
    marginTop: "18px",
    background: "#fee2e2",
    color: "#991b1b",
    padding: "11px",
    borderRadius: "6px",
    fontSize: "13px",
  },

  sucesso: {
    marginTop: "18px",
    background: "#dcfce7",
    color: "#166534",
    padding: "11px",
    borderRadius: "6px",
    fontSize: "13px",
  },

  acoes: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "flex-end",
  },

  botaoSalvar: {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "12px 18px",
    fontWeight: 600,
    cursor: "pointer",
  },
  cardSecundario: {
  marginTop: "20px",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "30px",
    },

    tabelaContainer: {
    marginTop: "25px",
    overflowX: "auto" as const,
    },

    tabela: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "13px",
    },

    th: {
    textAlign: "left" as const,
    padding: "12px",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    },

    td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    },

    cabecalhoCalculo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    },

    botaoCalcular: {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "12px 18px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    },

    resumoCalculo: {
    marginTop: "20px",
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    },

    indicador: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "7px",
    padding: "15px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    },

    subtituloTabela: {
    margin: "25px 0 10px",
    fontSize: "16px",
    },

    totalMontagem: {
    marginTop: "20px",
    padding: "18px",
    background: "#111827",
    color: "#ffffff",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "16px",
    },
    confirmacaoMontagem: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "15px",
    },

    botaoConfirmar: {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "12px 18px",
    fontWeight: 600,
    cursor: "pointer",
    },

    sucessoConfirmacao: {
    marginRight: "auto",
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "6px",
    padding: "11px 14px",
    fontSize: "13px",
    fontWeight: 600,
    },

    botaoContinuar: {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "12px 18px",
    fontWeight: 600,
    cursor: "pointer",
    },
};