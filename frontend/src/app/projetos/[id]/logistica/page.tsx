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

type TipoFrete =
  | "PROPRIO"
  | "TERCEIRIZADO"
  | "";

type SugestaoViagens = {
  totalPecas: number;
  pesoTotalKg?: number | null;

  capacidadePecas?: number | null;
  capacidadePesoKg?: number | null;

  viagensPorPecas?: number | null;
  viagensPorPeso?: number | null;

  quantidadeViagensSugerida?: number | null;

  criterioLimitante:
    | "PECAS"
    | "PESO"
    | "EMPATE"
    | "PESO_PENDENTE";

  elementosSemPeso?: unknown[];
};

type ElementoLogistica = {
  id: number;
  nome_aplicacao: string;
  tipo: string;
  secao: string;
  quantidade: number;
  comprimento: string | number;
  peso_unitario_kg?: string | number | null;
};

type CustosLogistica = {
  tipo: "PROPRIO" | "TERCEIRIZADO";

  distanciaTotalKm?: number;
  quantidadeViagens?: number;

  combustivel?: number;
  manutencao?: number;
  motorista?: number;
  alimentacao?: number;
  pedagios?: number;
  carregamento?: number;
  descarregamento?: number;
  seguro?: number;
  outrosCustos?: number;

  custoPorViagem?: number;

  custoTotalLogistica: number;
};

export default function LogisticaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [tipoFrete, setTipoFrete] = useState<TipoFrete>("");
  const [observacoes, setObservacoes] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [numeroCotacao, setNumeroCotacao] = useState("");
  const [validadeCotacao, setValidadeCotacao] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [observacoesTerceirizado, setObservacoesTerceirizado] = useState("");
  const [salvandoTerceirizado, setSalvandoTerceirizado] = useState(false);
  const [sucessoTerceirizado, setSucessoTerceirizado] = useState("");
  const [distanciaIda, setDistanciaIda] = useState("");
  const [idaVolta, setIdaVolta] = useState(true);
  const [quantidadeViagens, setQuantidadeViagens] = useState("");
  const [cavaloMecanico, setCavaloMecanico] = useState("");
  const [carreta, setCarreta] = useState("");
  const [capacidadePecas, setCapacidadePecas] = useState("");
  const [capacidadePeso, setCapacidadePeso] = useState("");
  const [consumoCarregado, setConsumoCarregado] = useState("");
  const [consumoVazio, setConsumoVazio] = useState("");
  const [precoDiesel, setPrecoDiesel] = useState("");
  const [pedagios, setPedagios] = useState("");
  const [custoMotorista, setCustoMotorista] = useState("");
  const [alimentacaoMotorista, setAlimentacaoMotorista] = useState("");
  const [manutencaoKm, setManutencaoKm] = useState("");
  const [carregamento, setCarregamento] = useState("");
  const [descarregamento, setDescarregamento] = useState("");
  const [seguro, setSeguro] = useState("");
  const [outrosCustos, setOutrosCustos] = useState("");
  const [observacoesProprio, setObservacoesProprio] = useState("");
  const [salvandoProprio, setSalvandoProprio] = useState(false);
  const [sucessoProprio, setSucessoProprio] = useState("");
  const [sugestao, setSugestao] = useState<SugestaoViagens | null>(null);
  const [calculandoSugestao, setCalculandoSugestao] = useState(false);
  const [aplicandoSugestao, setAplicandoSugestao] = useState(false);
  const [erroSugestao, setErroSugestao] = useState("");
  const [sucessoSugestao, setSucessoSugestao] = useState("");
  const [elementosSemPeso, setElementosSemPeso] = useState<ElementoLogistica[]>([]);
  const [pesos, setPesos] = useState<Record<number, string>>({});
  const [salvandoPeso, setSalvandoPeso] = useState<number | null>(null);
  const [sucessoPeso, setSucessoPeso] = useState("");
  const [custosLogistica, setCustosLogistica] = useState<CustosLogistica | null>(null);
  const [calculandoCustos, setCalculandoCustos] = useState(false);
  const [erroCustos, setErroCustos] = useState("");
  const [confirmandoLogistica, setConfirmandoLogistica] = useState(false);
  const [logisticaConfirmada, setLogisticaConfirmada] = useState(false);
  const [sucessoConfirmacao, setSucessoConfirmacao] = useState("");

  useEffect(() => {
    carregarLogistica();
    carregarFreteTerceirizado();
    carregarFreteProprio();
    carregarElementosSemPeso();
  }, [id]);

  async function carregarLogistica() {
    try {
      setCarregando(true);
      setErro("");

      const resposta =
        await apiAutenticada(
          `/projetos/${id}/logistica`
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
        return;
      }

      const logistica =
        dados.logistica || dados;

      setTipoFrete(
        logistica.tipo_frete || ""
      );

      setObservacoes(
        logistica.observacoes || ""
      );
    } catch {
      setErro(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function salvarTipoFrete() {
    if (!tipoFrete) {
      setErro(
        "Selecione o tipo de frete."
      );

      return;
    }

    setErro("");
    setSucesso("");
    setSalvando(true);

    try {
      const resposta =
        await apiAutenticada(
          `/projetos/${id}/logistica`,
          {
            method: "PUT",

            body: JSON.stringify({
              tipoFrete,
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
            "Não foi possível salvar a logística."
        );

        return;
      }

      setSucesso(
        dados.mensagem ||
          "Configuração de logística salva com sucesso!"
      );
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
        Carregando logística...
      </main>
    );
  }

  async function carregarFreteTerceirizado() {
    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/logistica/terceirizada`
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

        const dados = await resposta.json();

        if (!resposta.ok) {
        return;
        }

        const frete =
        dados.freteTerceirizado ||
        dados.terceirizada ||
        dados;

        setEmpresa(
        frete.empresa || ""
        );

        setNumeroCotacao(
        frete.numero_cotacao || ""
        );

        setValidadeCotacao(
        frete.validade_cotacao || ""
        );

        setValorTotal(
        String(
            frete.valor_total ?? ""
        )
        );

        setObservacoesTerceirizado(
        frete.observacoes || ""
        );
    } catch {
        // Nada ainda se não houver cotação cadastrada
    }
    }

    async function salvarFreteTerceirizado() {
    if (!empresa.trim()) {
        setErro(
        "Informe a transportadora."
        );

        return;
    }

    const valor = Number(valorTotal);

    if (
        !Number.isFinite(valor) ||
        valor < 0
    ) {
        setErro(
        "Informe um valor válido para o frete."
        );

        return;
    }

    setErro("");
    setSucessoTerceirizado("");
    setSalvandoTerceirizado(true);

    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/logistica/terceirizada`,
        {
            method: "PUT",

            body: JSON.stringify({
            empresa,

            numeroCotacao:
                numeroCotacao || null,

            validadeCotacao:
                validadeCotacao || null,

            valorTotal: valor,

            observacoes:
                observacoesTerceirizado ||
                null,
            }),
        }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
        setErro(
            dados.erro ||
            "Não foi possível salvar o frete terceirizado."
        );

        return;
        }

        setSucessoTerceirizado(
        dados.mensagem ||
            "Frete terceirizado salvo com sucesso!"
        );
    } catch {
        setErro(
        "Não foi possível conectar ao servidor."
        );
    } finally {
        setSalvandoTerceirizado(false);
    }
    }

    async function carregarFreteProprio() {
    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/logistica/propria`
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

        const dados = await resposta.json();

        if (!resposta.ok) {
        return;
        }

        const frete =
        dados.freteProprio || dados;

        setDistanciaIda(
        String(frete.distancia_ida_km ?? "")
        );

        setIdaVolta(
        frete.considerar_ida_volta ?? true
        );

        setQuantidadeViagens(
        String(frete.quantidade_viagens ?? "")
        );

        setCavaloMecanico(
        frete.cavalo_mecanico || ""
        );

        setCarreta(
        frete.carreta || ""
        );

        setCapacidadePecas(
        String(frete.capacidade_pecas ?? "")
        );

        setCapacidadePeso(
        String(frete.capacidade_peso_kg ?? "")
        );

        setConsumoCarregado(
        String(
            frete.consumo_carregado_km_l ?? ""
        )
        );

        setConsumoVazio(
        String(
            frete.consumo_vazio_km_l ?? ""
        )
        );

        setPrecoDiesel(
        String(frete.preco_diesel_l ?? "")
        );

        setPedagios(
        String(frete.pedagios ?? "")
        );

        setCustoMotorista(
        String(
            frete.custo_motorista_por_viagem ?? ""
        )
        );

        setAlimentacaoMotorista(
        String(
            frete.alimentacao_motorista_por_viagem ??
            ""
        )
        );

        setManutencaoKm(
        String(
            frete.manutencao_por_km ?? ""
        )
        );

        setCarregamento(
        String(
            frete.custo_carregamento_por_viagem ??
            ""
        )
        );

        setDescarregamento(
        String(
            frete.custo_descarregamento_por_viagem ??
            ""
        )
        );

        setSeguro(
        String(frete.seguro ?? "")
        );

        setOutrosCustos(
        String(frete.outros_custos ?? "")
        );

        setObservacoesProprio(
        frete.observacoes || ""
        );
    } catch {
        // Nenhum frete próprio cadastrado ainda.
    }
    }

    async function salvarFreteProprio() {
    setErro("");
    setSucessoProprio("");
    setSalvandoProprio(true);

    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/logistica/propria`,
        {
            method: "PUT",

            body: JSON.stringify({
            distanciaIdaKm:
                Number(distanciaIda),

            considerarIdaVolta:
                idaVolta,

            quantidadeViagens:
                Number(quantidadeViagens),

            cavaloMecanico,
            carreta,

            capacidadePecas:
                capacidadePecas
                ? Number(capacidadePecas)
                : null,

            capacidadePesoKg:
                capacidadePeso
                ? Number(capacidadePeso)
                : null,

            consumoCarregadoKmL:
                Number(consumoCarregado),

            consumoVazioKmL:
                Number(consumoVazio),

            precoDieselL:
                Number(precoDiesel),

            pedagios:
                Number(pedagios || 0),

            custoMotoristaPorViagem:
                Number(custoMotorista || 0),

            alimentacaoMotoristaPorViagem:
                Number(alimentacaoMotorista || 0),

            manutencaoPorKm:
                Number(manutencaoKm || 0),

            custoCarregamentoPorViagem:
                Number(carregamento || 0),

            custoDescarregamentoPorViagem:
                Number(descarregamento || 0),

            seguro:
                Number(seguro || 0),

            outrosCustos:
                Number(outrosCustos || 0),

            observacoes:
                observacoesProprio || null,
            }),
        }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
        setErro(
            dados.erro ||
            "Não foi possível salvar o frete próprio."
        );

        return;
        }

        setSucessoProprio(
        dados.mensagem ||
            "Frete próprio salvo com sucesso!"
        );
    } catch {
        setErro(
        "Não foi possível conectar ao servidor."
        );
    } finally {
        setSalvandoProprio(false);
    }
    }

    async function calcularSugestaoViagens() {
    setCalculandoSugestao(true);
    setErroSugestao("");
    setSucessoSugestao("");

    try {
    const resposta = await apiAutenticada(
    `/projetos/${id}/logistica/propria/sugestao-viagens`,
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
        setSugestao(null);

        setErroSugestao(
            dados.erro ||
            "Não foi possível calcular a sugestão de viagens."
        );

        return;
        }

        const viagensPorPecas =
        dados.calculo?.viagensPorPecas ??
        dados.viagensPorPecas ??
        null;

        const viagensPorPeso =
        dados.calculo?.viagensPorPeso ??
        dados.viagensPorPeso ??
        null;

        const quantidadeSugerida =
        dados.quantidadeViagensSugerida ??
        dados.calculo?.quantidadeViagensSugerida ??
        null;

        let criterio =
        dados.criterioLimitante;

        if (
        viagensPorPecas !== null &&
        viagensPorPeso !== null
        ) {
        if (
            viagensPorPecas === viagensPorPeso
        ) {
            criterio = "EMPATE";
        } else if (
            viagensPorPeso > viagensPorPecas
        ) {
            criterio = "PESO";
        } else {
            criterio = "PECAS";
        }
        }

        setSugestao({
        totalPecas: dados.totalPecas,

        pesoTotalKg:
            dados.pesoTotalKg ?? null,

        capacidadePecas:
            dados.capacidades?.pecas ??
            dados.capacidadePecas ??
            null,

        capacidadePesoKg:
            dados.capacidades?.pesoKg ??
            dados.capacidadePesoKg ??
            null,

        viagensPorPecas,
        viagensPorPeso,

        quantidadeViagensSugerida:
            quantidadeSugerida,

        criterioLimitante: criterio,

        elementosSemPeso:
            dados.elementosSemPeso || [],
        });
    } catch {
        setErroSugestao(
        "Não foi possível conectar ao servidor."
        );
    } finally {
        setCalculandoSugestao(false);
    }
    }

    async function aplicarSugestaoViagens() {
    setAplicandoSugestao(true);
    setErroSugestao("");
    setSucessoSugestao("");

    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/logistica/propria/aplicar-sugestao-viagens`,
        {
            method: "POST",
        }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
        setErroSugestao(
            dados.erro ||
            "Não foi possível aplicar a sugestão."
        );

        return;
        }

        const novaQuantidade =
        dados.quantidadeViagensAtual ??
        dados.quantidadeViagens ??
        dados.quantidadeViagensSugerida;

        if (novaQuantidade !== undefined) {
        setQuantidadeViagens(
            String(novaQuantidade)
        );
        }

        setSucessoSugestao(
        dados.mensagem ||
            "Quantidade de viagens atualizada com sucesso!"
        );

        await carregarFreteProprio();
        await calcularSugestaoViagens();
    } catch {
        setErroSugestao(
        "Não foi possível conectar ao servidor."
        );
    } finally {
        setAplicandoSugestao(false);
    }
    }

    async function carregarElementosSemPeso() {
    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/elementos`
        );

        if (!resposta.ok) {
        return;
        }

        const dados = await resposta.json();

        const elementos: ElementoLogistica[] =
        dados.elementos || [];

        const pendentes = elementos.filter(
        (elemento) =>
            elemento.peso_unitario_kg === null ||
            elemento.peso_unitario_kg === undefined ||
            Number(elemento.peso_unitario_kg) <= 0
        );

        setElementosSemPeso(pendentes);

        const pesosIniciais:
        Record<number, string> = {};

        pendentes.forEach((elemento) => {
        pesosIniciais[elemento.id] = "";
        });

        setPesos(pesosIniciais);
    } catch {
    }
    }

    async function salvarPesoElemento(
    elementoId: number
    ) {
    const peso = Number(
        pesos[elementoId]
    );

    if (
        !Number.isFinite(peso) ||
        peso <= 0
    ) {
        setErro(
        "Informe um peso unitário válido."
        );

        return;
    }

    setErro("");
    setSucessoPeso("");
    setSalvandoPeso(elementoId);

    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/elementos/${elementoId}`,
        {
            method: "PUT",

            body: JSON.stringify({
            pesoUnitarioKg: peso,
            }),
        }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
        setErro(
            dados.erro ||
            "Não foi possível salvar o peso."
        );

        return;
        }

        setSucessoPeso(
        "Peso do elemento salvo com sucesso!"
        );

        await carregarElementosSemPeso();

        setSugestao(null);

        await calcularSugestaoViagens();
    } catch {
        setErro(
        "Não foi possível conectar ao servidor."
        );
    } finally {
        setSalvandoPeso(null);
    }
    }

    async function calcularCustosLogistica() {
    setCalculandoCustos(true);
    setErroCustos("");
    setCustosLogistica(null);

    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/logistica/custos`,
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
        setErroCustos(
            dados.erro ||
            "Não foi possível calcular os custos da logística."
        );

        return;
        }

        const detalhes = dados.detalhes || {};

        const transporte =
        detalhes.transporte || {};

        const combustivel =
        detalhes.combustivel || {};

        const custos =
        detalhes.custos || {};

        setCustosLogistica({
        tipo: dados.tipoFrete,

        distanciaTotalKm:
            dados.detalhes.transporte.kmTotal,

        quantidadeViagens:
            dados.detalhes.transporte.quantidadeViagens,

        combustivel:
            dados.detalhes.custos.combustivel,

        manutencao:
            dados.detalhes.custos.manutencao,

        motorista:
            dados.detalhes.custos.motorista,

        alimentacao:
            dados.detalhes.custos.alimentacao,

        pedagios:
            dados.detalhes.custos.pedagios,

        carregamento:
            dados.detalhes.custos.carregamento,

        descarregamento:
            dados.detalhes.custos.descarregamento,

        seguro:
            dados.detalhes.custos.seguro,

        outrosCustos:
            dados.detalhes.custos.outrosCustos,

        custoPorViagem:
            dados.detalhes.custoPorViagem,

        custoTotalLogistica:
            dados.custoLogistica,
        });
    } catch {
        setErroCustos(
        "Não foi possível conectar ao servidor."
        );
    } finally {
        setCalculandoCustos(false);
    }
    }

    function formatarMoeda(valor?: number) {
    return new Intl.NumberFormat(
        "pt-BR",
        {
        style: "currency",
        currency: "BRL",
        }
    ).format(valor || 0);
    }

    async function confirmarLogistica() {
    if (!custosLogistica) {
        setErroCustos(
        "Calcule a logística antes de confirmar."
        );

        return;
    }

    setErroCustos("");
    setSucessoConfirmacao("");
    setConfirmandoLogistica(true);

    try {
        const resposta = await apiAutenticada(
        `/projetos/${id}/logistica/confirmar`,
        {
            method: "POST",
        }
        );

        const dados = await resposta.json();

        if (resposta.status === 401) {
        localStorage.removeItem(
            "estrutec_token"
        );

        router.push("/login");
        return;
        }

        if (!resposta.ok) {
        setErroCustos(
            dados.erro ||
            "Não foi possível confirmar a logística."
        );

        return;
        }

        setLogisticaConfirmada(true);

        setSucessoConfirmacao(
        dados.mensagem ||
            "Logística confirmada com sucesso!"
        );
    } catch {
        setErroCustos(
        "Não foi possível conectar ao servidor."
        );
    } finally {
        setConfirmandoLogistica(false);
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
            Logística
          </p>
        </div>

        <button
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
            Modalidade de Transporte
          </h2>

          <p style={estilos.descricao}>
            Selecione como será realizado o
            transporte dos elementos
            pré-moldados.
          </p>

          <div style={estilos.opcoes}>
            <button
              type="button"
              onClick={() =>
                setTipoFrete("PROPRIO")
              }
              style={{
                ...estilos.opcao,

                ...(tipoFrete === "PROPRIO"
                  ? estilos.opcaoSelecionada
                  : {}),
              }}
            >
              <strong>
                Frete Próprio
              </strong>

              <span>
                Transporte realizado com
                veículos da própria empresa.
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setTipoFrete(
                  "TERCEIRIZADO"
                )
              }
              style={{
                ...estilos.opcao,

                ...(tipoFrete ===
                "TERCEIRIZADO"
                  ? estilos.opcaoSelecionada
                  : {}),
              }}
            >
              <strong>
                Frete Terceirizado
              </strong>

              <span>
                Transporte contratado de uma
                transportadora.
              </span>
            </button>
          </div>

          <div style={estilos.campo}>
            <label htmlFor="observacoes">
              Observações
            </label>

            <textarea
              id="observacoes"
              value={observacoes}
              onChange={(evento) =>
                setObservacoes(
                  evento.target.value
                )
              }
              rows={4}
              style={estilos.textarea}
              placeholder="Observações sobre a logística..."
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
              onClick={salvarTipoFrete}
              disabled={
                salvando || !tipoFrete
              }
              style={estilos.botaoSalvar}
            >
              {salvando
                ? "Salvando..."
                : "Salvar modalidade"}
            </button>
          </div>
        </div>
        {tipoFrete === "TERCEIRIZADO" && (
        <div style={estilos.cardSecundario}>
            <div style={estilos.tituloArea}>
            <h2 style={estilos.titulo}>
                Frete Terceirizado
            </h2>

            <p style={estilos.descricao}>
                Informe os dados da cotação da
                transportadora.
            </p>
            </div>

            <div style={estilos.gridFormulario}>
            <div style={estilos.campo}>
                <label>
                Transportadora *
                </label>

                <input
                value={empresa}
                onChange={(evento) =>
                    setEmpresa(
                    evento.target.value
                    )
                }
                placeholder="Ex.: Transportadora ABC"
                style={estilos.input}
                />
            </div>

            <div style={estilos.campo}>
                <label>
                Nº da cotação
                </label>

                <input
                value={numeroCotacao}
                onChange={(evento) =>
                    setNumeroCotacao(
                    evento.target.value
                    )
                }
                placeholder="Ex.: COT-2026-001"
                style={estilos.input}
                />
            </div>

            <div style={estilos.campo}>
                <label>
                Validade da cotação
                </label>

                <input
                type="date"
                value={validadeCotacao}
                onChange={(evento) =>
                    setValidadeCotacao(
                    evento.target.value
                    )
                }
                style={estilos.input}
                />
            </div>

            <div style={estilos.campo}>
                <label>
                Valor total (R$) *
                </label>

                <input
                type="number"
                min="0"
                step="0.01"
                value={valorTotal}
                onChange={(evento) =>
                    setValorTotal(
                    evento.target.value
                    )
                }
                placeholder="Ex.: 18500"
                style={estilos.input}
                />
            </div>
            </div>

            <div style={estilos.campoObservacao}>
            <label>
                Observações da cotação
            </label>

            <textarea
                value={
                observacoesTerceirizado
                }
                onChange={(evento) =>
                setObservacoesTerceirizado(
                    evento.target.value
                )
                }
                rows={4}
                style={estilos.textarea}
            />
            </div>

            {sucessoTerceirizado && (
            <div style={estilos.sucesso}>
                {sucessoTerceirizado}
            </div>
            )}

            <div style={estilos.acoes}>
            <button
                type="button"
                onClick={
                salvarFreteTerceirizado
                }
                disabled={
                salvandoTerceirizado
                }
                style={estilos.botaoSalvar}
            >
                {salvandoTerceirizado
                ? "Salvando..."
                : "Salvar cotação"}
            </button>
            </div>
        </div>
        )}{tipoFrete === "PROPRIO" && (
        <div style={estilos.cardSecundario}>
            <div style={estilos.tituloArea}>
            <h2 style={estilos.titulo}>
                Frete Próprio
            </h2>

            <p style={estilos.descricao}>
                Informe os dados do conjunto de
                transporte e os custos da operação.
            </p>
            </div>

            <h3>Transporte</h3>

            <div style={estilos.gridFormulario}>
            <CampoLogistica
                titulo="Distância de ida (km)"
                valor={distanciaIda}
                alterar={setDistanciaIda}
            />

            <CampoLogistica
                titulo="Quantidade de viagens"
                valor={quantidadeViagens}
                alterar={setQuantidadeViagens}
            />

            <CampoLogistica
                titulo="Cavalo mecânico"
                valor={cavaloMecanico}
                alterar={setCavaloMecanico}
                tipo="text"
            />

            <CampoLogistica
                titulo="Carreta"
                valor={carreta}
                alterar={setCarreta}
                tipo="text"
            />

            <CampoLogistica
                titulo="Capacidade de peças"
                valor={capacidadePecas}
                alterar={setCapacidadePecas}
            />

            <CampoLogistica
                titulo="Capacidade de peso (kg)"
                valor={capacidadePeso}
                alterar={setCapacidadePeso}
            />
            </div>

            <label style={estilos.checkbox}>
            <input
                type="checkbox"
                checked={idaVolta}
                onChange={(evento) =>
                setIdaVolta(
                    evento.target.checked
                )
                }
            />

            Considerar viagem de ida e volta
            </label>

            <h3 style={estilos.subtituloSecao}>
            Combustível
            </h3>

            <div style={estilos.gridFormulario}>
            <CampoLogistica
                titulo="Consumo carregado (km/L)"
                valor={consumoCarregado}
                alterar={setConsumoCarregado}
            />

            <CampoLogistica
                titulo="Consumo vazio (km/L)"
                valor={consumoVazio}
                alterar={setConsumoVazio}
            />

            <CampoLogistica
                titulo="Preço do diesel (R$/L)"
                valor={precoDiesel}
                alterar={setPrecoDiesel}
            />
            </div>

            <h3 style={estilos.subtituloSecao}>
            Custos
            </h3>

            <div style={estilos.gridFormulario}>
            <CampoLogistica
                titulo="Pedágios por viagem (R$)"
                valor={pedagios}
                alterar={setPedagios}
            />

            <CampoLogistica
                titulo="Motorista por viagem (R$)"
                valor={custoMotorista}
                alterar={setCustoMotorista}
            />

            <CampoLogistica
                titulo="Alimentação por viagem (R$)"
                valor={alimentacaoMotorista}
                alterar={setAlimentacaoMotorista}
            />

            <CampoLogistica
                titulo="Manutenção (R$/km)"
                valor={manutencaoKm}
                alterar={setManutencaoKm}
            />

            <CampoLogistica
                titulo="Carregamento por viagem (R$)"
                valor={carregamento}
                alterar={setCarregamento}
            />

            <CampoLogistica
                titulo="Descarregamento por viagem (R$)"
                valor={descarregamento}
                alterar={setDescarregamento}
            />

            <CampoLogistica
                titulo="Seguro (R$)"
                valor={seguro}
                alterar={setSeguro}
            />

            <CampoLogistica
                titulo="Outros custos (R$)"
                valor={outrosCustos}
                alterar={setOutrosCustos}
            />
            </div>

            <div style={estilos.campoObservacao}>
            <label>
                Observações
            </label>

            <textarea
                value={observacoesProprio}
                onChange={(evento) =>
                setObservacoesProprio(
                    evento.target.value
                )
                }
                rows={4}
                style={estilos.textarea}
            />
            </div>

            {sucessoProprio && (
            <div style={estilos.sucesso}>
                {sucessoProprio}
            </div>
            )}

            <div style={estilos.acoes}>
            <button
                type="button"
                onClick={salvarFreteProprio}
                disabled={salvandoProprio}
                style={estilos.botaoSalvar}
            >
                {salvandoProprio
                ? "Salvando..."
                : "Salvar frete próprio"}
            </button>
            </div>
            {elementosSemPeso.length > 0 && (
            <div style={estilos.blocoPesos}>
                <div>
                <h3 style={estilos.tituloSugestao}>
                    Pesos Pendentes
                </h3>

                <p style={estilos.descricaoSugestao}>
                    Informe o peso unitário dos elementos
                    abaixo para calcular as viagens por peso.
                </p>
                </div>

                <div style={estilos.listaPesos}>
                {elementosSemPeso.map(
                    (elemento) => (
                    <div
                        key={elemento.id}
                        style={estilos.linhaPeso}
                    >
                        <div>
                        <strong>
                            {elemento.nome_aplicacao}
                        </strong>

                        <div style={estilos.detalhePeso}>
                            {elemento.tipo}
                            {" | "}
                            Seção {elemento.secao}
                            {" | "}
                            Quantidade:{" "}
                            {elemento.quantidade}
                            {" | "}
                            Comprimento:{" "}
                            {elemento.comprimento} m
                        </div>
                        </div>

                        <div style={estilos.campoPeso}>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Peso em kg"
                            value={
                            pesos[elemento.id] || ""
                            }
                            onChange={(evento) =>
                            setPesos({
                                ...pesos,
                                [elemento.id]:
                                evento.target.value,
                            })
                            }
                            style={estilos.inputPeso}
                        />

                        <button
                            type="button"
                            onClick={() =>
                            salvarPesoElemento(
                                elemento.id
                            )
                            }
                            disabled={
                            salvandoPeso === elemento.id
                            }
                            style={estilos.botaoSalvarPeso}
                        >
                            {salvandoPeso === elemento.id
                            ? "Salvando..."
                            : "Salvar"}
                        </button>
                        </div>
                    </div>
                    )
                )}
                </div>

                {sucessoPeso && (
                <div style={estilos.sucesso}>
                    {sucessoPeso}
                </div>
                )}
            </div>
            )}
            <div style={estilos.blocoSugestao}>
            <div style={estilos.cabecalhoSugestao}>
                <div>
                <h3 style={estilos.tituloSugestao}>
                    Sugestão de Viagens
                </h3>

                <p style={estilos.descricaoSugestao}>
                    O sistema calcula a quantidade mínima
                    de viagens considerando capacidade de
                    peças e peso.
                </p>
                </div>

                <button
                type="button"
                onClick={calcularSugestaoViagens}
                disabled={calculandoSugestao}
                style={estilos.botaoCalcular}
                >
                {calculandoSugestao
                    ? "Calculando..."
                    : "Calcular sugestão"}
                </button>
            </div>

            {erroSugestao && (
                <div style={estilos.erro}>
                {erroSugestao}
                </div>
            )}

            {sucessoSugestao && (
                <div style={estilos.sucesso}>
                {sucessoSugestao}
                </div>
            )}

            {sugestao && (
                <>
                <div style={estilos.resumoSugestao}>
                    <div style={estilos.indicadorSugestao}>
                    <span>Total de peças</span>

                    <strong>
                        {sugestao.totalPecas}
                    </strong>
                    </div>

                    <div style={estilos.indicadorSugestao}>
                    <span>Viagens por peças</span>

                    <strong>
                        {sugestao.viagensPorPecas ?? "-"}
                    </strong>
                    </div>

                    <div style={estilos.indicadorSugestao}>
                    <span>Viagens por peso</span>

                    <strong>
                        {sugestao.viagensPorPeso ?? "-"}
                    </strong>
                    </div>

                    <div style={estilos.indicadorDestaque}>
                    <span>Viagens sugeridas</span>

                    <strong>
                        {sugestao.quantidadeViagensSugerida ??
                        "-"}
                    </strong>
                    </div>
                </div>

                <div style={estilos.criterio}>
                    Critério limitante:{" "}
                    <strong>
                    {sugestao.criterioLimitante === "PECAS"
                        ? "Quantidade de peças"
                        : sugestao.criterioLimitante === "PESO"
                        ? "Peso"
                        : sugestao.criterioLimitante === "EMPATE"
                            ? "Peças e peso"
                            : "Peso pendente"}
                    </strong>
                </div>

                {sugestao.criterioLimitante ===
                    "PESO_PENDENTE" && (
                    <div style={estilos.avisoSugestao}>
                    Existem elementos sem peso unitário
                    cadastrado. O sistema não consegue
                    calcular a quantidade segura de
                    viagens por peso.
                    </div>
                )}
                </>
            )}
            </div>
            <div style={estilos.blocoCustos}>
            <div style={estilos.cabecalhoSugestao}>
                <div>
                <h3 style={estilos.tituloSugestao}>
                    Cálculo da Logística
                </h3>

                <p style={estilos.descricaoSugestao}>
                    Calcule o custo total do transporte
                    com base nos dados cadastrados.
                </p>
                </div>

                <button
                type="button"
                onClick={calcularCustosLogistica}
                disabled={calculandoCustos}
                style={estilos.botaoCalcular}
                >
                {calculandoCustos
                    ? "Calculando..."
                    : "Calcular logística"}
                </button>
            </div>

            {erroCustos && (
                <div style={estilos.erro}>
                {erroCustos}
                </div>
            )}

            {custosLogistica &&
                custosLogistica.tipo === "PROPRIO" && (
                <>
                    <div style={estilos.resumoCustos}>
                    <div style={estilos.indicadorSugestao}>
                        <span>Distância total</span>

                        <strong>
                        {custosLogistica.distanciaTotalKm ??
                            "-"}{" "}
                        km
                        </strong>
                    </div>

                    <div style={estilos.indicadorSugestao}>
                        <span>Viagens</span>

                        <strong>
                        {custosLogistica.quantidadeViagens ??
                            "-"}
                        </strong>
                    </div>

                    <div style={estilos.indicadorSugestao}>
                        <span>Custo por viagem</span>

                        <strong>
                        {formatarMoeda(
                            custosLogistica.custoPorViagem
                        )}
                        </strong>
                    </div>
                    </div>

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
                            Combustível
                            </td>
                            <td style={estilos.td}>
                            {formatarMoeda(
                                custosLogistica.combustivel
                            )}
                            </td>
                        </tr>

                        <tr>
                            <td style={estilos.td}>
                            Manutenção
                            </td>
                            <td style={estilos.td}>
                            {formatarMoeda(
                                custosLogistica.manutencao
                            )}
                            </td>
                        </tr>

                        <tr>
                            <td style={estilos.td}>
                            Motorista
                            </td>
                            <td style={estilos.td}>
                            {formatarMoeda(
                                custosLogistica.motorista
                            )}
                            </td>
                        </tr>

                        <tr>
                            <td style={estilos.td}>
                            Alimentação
                            </td>
                            <td style={estilos.td}>
                            {formatarMoeda(
                                custosLogistica.alimentacao
                            )}
                            </td>
                        </tr>

                        <tr>
                            <td style={estilos.td}>
                            Pedágios
                            </td>
                            <td style={estilos.td}>
                            {formatarMoeda(
                                custosLogistica.pedagios
                            )}
                            </td>
                        </tr>

                        <tr>
                            <td style={estilos.td}>
                            Carregamento
                            </td>
                            <td style={estilos.td}>
                            {formatarMoeda(
                                custosLogistica.carregamento
                            )}
                            </td>
                        </tr>

                        <tr>
                            <td style={estilos.td}>
                            Descarregamento
                            </td>
                            <td style={estilos.td}>
                            {formatarMoeda(
                                custosLogistica.descarregamento
                            )}
                            </td>
                        </tr>

                        <tr>
                            <td style={estilos.td}>
                            Seguro
                            </td>
                            <td style={estilos.td}>
                            {formatarMoeda(
                                custosLogistica.seguro
                            )}
                            </td>
                        </tr>

                        <tr>
                            <td style={estilos.td}>
                            Outros custos
                            </td>
                            <td style={estilos.td}>
                            {formatarMoeda(
                                custosLogistica.outrosCustos
                            )}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    </div>

                    <div style={estilos.totalLogistica}>
                    <span>
                        CUSTO TOTAL DA LOGÍSTICA
                    </span>

                    <strong>
                        {formatarMoeda(
                        custosLogistica.custoTotalLogistica
                        )}
                    </strong>
                    </div>
                    <div style={estilos.confirmacaoLogistica}>
                    {logisticaConfirmada ? (
                        <>
                        <div style={estilos.sucessoConfirmacao}>
                            {sucessoConfirmacao}
                        </div>

                        <button
                            type="button"
                            style={estilos.botaoContinuar}
                            onClick={() =>
                            router.push(
                                `/projetos/${id}/montagem`
                            )
                            }
                        >
                            Continuar para montagem →
                        </button>
                        </>
                    ) : (
                        <button
                        type="button"
                        onClick={confirmarLogistica}
                        disabled={confirmandoLogistica}
                        style={estilos.botaoConfirmar}
                        >
                        {confirmandoLogistica
                            ? "Confirmando..."
                            : "Confirmar logística"}
                        </button>
                    )}
                    </div>
                </>
                )}
            </div>
        </div>
        )}
      </section>
    </main>
  );
}

type CampoLogisticaProps = {
  titulo: string;
  valor: string;
  alterar: (valor: string) => void;
  tipo?: "number" | "text";
};

function CampoLogistica({
  titulo,
  valor,
  alterar,
  tipo = "number",
}: CampoLogisticaProps) {
  return (
    <div style={estilos.campo}>
      <label>
        {titulo}
      </label>

      <input
        type={tipo}
        min={
          tipo === "number"
            ? "0"
            : undefined
        }
        step={
          tipo === "number"
            ? "0.01"
            : undefined
        }
        value={valor}
        onChange={(evento) =>
          alterar(evento.target.value)
        }
        style={estilos.input}
      />
    </div>
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
    alignItems: "center",
    justifyContent: "space-between",
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

  cardSecundario: {
    marginTop: "20px",
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
    lineHeight: 1.5,
  },

  opcoes: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "15px",
    marginBottom: "25px",
  },

  opcao: {
    background: "#ffffff",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    padding: "20px",
    cursor: "pointer",
    textAlign: "left" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    fontSize: "14px",
  },

  opcaoSelecionada: {
    border: "2px solid #111827",
    background: "#f9fafb",
  },

  campo: {
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

  emBreve: {
    padding: "20px",
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    borderRadius: "7px",
    color: "#6b7280",
    textAlign: "center" as const,
  },
    tituloArea: {
    marginBottom: "20px",
    },

    gridFormulario: {
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
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
    checkbox: {
    marginTop: "18px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    cursor: "pointer",
    },

    subtituloSecao: {
    margin: "28px 0 15px",
    fontSize: "16px",
    },
    blocoSugestao: {
    marginTop: "30px",
    paddingTop: "25px",
    borderTop: "1px solid #e5e7eb",
    },

    cabecalhoSugestao: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    },

    tituloSugestao: {
    margin: 0,
    fontSize: "17px",
    },

    descricaoSugestao: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px",
    },

    botaoCalcular: {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "11px 16px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    },

    resumoSugestao: {
    marginTop: "20px",
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    },

    indicadorSugestao: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "7px",
    padding: "15px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    },

    indicadorDestaque: {
    background: "#f3f4f6",
    border: "2px solid #111827",
    borderRadius: "7px",
    padding: "15px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    },

    criterio: {
    marginTop: "15px",
    fontSize: "13px",
    },

    avisoSugestao: {
    marginTop: "15px",
    padding: "12px",
    background: "#fff7ed",
    color: "#9a3412",
    border: "1px solid #fed7aa",
    borderRadius: "7px",
    fontSize: "13px",
    },

    acoesSugestao: {
    marginTop: "18px",
    display: "flex",
    justifyContent: "flex-end",
    },

    botaoAplicar: {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "12px 18px",
    fontWeight: 600,
    cursor: "pointer",
    },
    blocoPesos: {
    marginTop: "30px",
    paddingTop: "25px",
    borderTop: "1px solid #e5e7eb",
    },

    listaPesos: {
    marginTop: "18px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
    },

    linhaPeso: {
    border: "1px solid #e5e7eb",
    borderRadius: "7px",
    padding: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    },

    detalhePeso: {
    marginTop: "5px",
    color: "#6b7280",
    fontSize: "12px",
    },

    campoPeso: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    },

    inputPeso: {
    width: "140px",
    height: "40px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    padding: "0 10px",
    },

    botaoSalvarPeso: {
    height: "40px",
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "0 14px",
    cursor: "pointer",
    fontWeight: 600,
    },
    blocoCustos: {
    marginTop: "30px",
    paddingTop: "25px",
    borderTop: "1px solid #e5e7eb",
    },

    resumoCustos: {
    marginTop: "20px",
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    },

    tabelaContainer: {
    marginTop: "20px",
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

    totalLogistica: {
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
    confirmacaoLogistica: {
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