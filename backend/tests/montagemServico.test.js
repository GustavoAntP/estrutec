jest.mock('../src/modelos/Projeto', () => ({
  findOne: jest.fn(),
}));

jest.mock('../src/modelos/MontagemProjeto', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../src/modelos/EquipamentoMontagem', () => ({
  findAll: jest.fn(),
}));

jest.mock('../src/modelos/EquipeMontagem', () => ({
  findAll: jest.fn(),
}));

const Projeto = require('../src/modelos/Projeto');
const MontagemProjeto = require('../src/modelos/MontagemProjeto');
const EquipamentoMontagem = require('../src/modelos/EquipamentoMontagem');
const EquipeMontagem = require('../src/modelos/EquipeMontagem');

const {
  salvarMontagem,
  buscarMontagem,
  calcularCustos,
  confirmarMontagem,
} = require('../src/servicos/montagemServico');

const dadosValidos = {
  custoHospedagem: 100,
  custoAlimentacao: 80,
  custoTransporteEquipe: 60,
  outrosCustos: 40,
  observacoes: '  Montagem das vigas  ',
};

function criarMontagem(alteracoes = {}) {
  return {
    id: 20,
    projeto_id: 1,
    custo_hospedagem: '100',
    custo_alimentacao: '80',
    custo_transporte_equipe: '60',
    outros_custos: '40',
    observacoes: 'Montagem das vigas',
    update: jest.fn().mockImplementation(async function (dados) {
      Object.assign(this, dados);
    }),
    ...alteracoes,
  };
}

describe('Montagem de estruturas - Estrutec', () => {
  let projeto;

  beforeEach(() => {
    jest.resetAllMocks();

    projeto = {
      id: 1,
      usuario_id: 1,
      codigo: 'EST-001',
      nome: 'Projeto de Vigas',
      status: 'EM_ANDAMENTO',
      update: jest.fn().mockImplementation(async function (dados) {
        Object.assign(this, dados);
      }),
    };

    Projeto.findOne.mockResolvedValue(projeto);
    MontagemProjeto.findOne.mockResolvedValue(criarMontagem());
    MontagemProjeto.create.mockImplementation(async (dados) => ({ id: 20, ...dados }));

    EquipamentoMontagem.findAll.mockResolvedValue([
      {
        id: 100,
        nome: 'Guindaste',
        tipo_cobranca: 'DIA',
        quantidade: '2',
        tempo_uso: '3',
        valor_unitario: '100',
        custo_mobilizacao: '50',
        custo_desmobilizacao: '30',
      },
      {
        id: 101,
        nome: 'Plataforma',
        tipo_cobranca: 'DIA',
        quantidade: 1,
        tempo_uso: 2,
        valor_unitario: 40,
        custo_mobilizacao: 0,
        custo_desmobilizacao: 10,
      },
    ]);

    EquipeMontagem.findAll.mockResolvedValue([
      {
        id: 200,
        funcao: 'Montadores',
        quantidade_trabalhadores: '3',
        quantidade_dias: '2',
        custo_diario_por_trabalhador: '150',
      },
      {
        id: 201,
        funcao: 'Técnicos',
        quantidade_trabalhadores: 1,
        quantidade_dias: 2,
        custo_diario_por_trabalhador: 200,
      },
    ]);
  });

  test('Deve cadastrar a montagem de um projeto', async () => {
    MontagemProjeto.findOne.mockResolvedValue(null);
    const resultado = await salvarMontagem(1, 1, dadosValidos);

    expect(MontagemProjeto.create).toHaveBeenCalledWith({
      projeto_id: 1,
      custo_hospedagem: 100,
      custo_alimentacao: 80,
      custo_transporte_equipe: 60,
      outros_custos: 40,
      observacoes: 'Montagem das vigas',
    });
    expect(resultado.id).toBe(20);
    expect(resultado.custo_hospedagem).toBe(100);
  });

  test('Deve atualizar os dados de montagem existentes', async () => {
    const montagem = criarMontagem();
    MontagemProjeto.findOne.mockResolvedValue(montagem);

    const resultado = await salvarMontagem(1, 1, dadosValidos);

    expect(montagem.update).toHaveBeenCalledWith({
      custo_hospedagem: 100,
      custo_alimentacao: 80,
      custo_transporte_equipe: 60,
      outros_custos: 40,
      observacoes: 'Montagem das vigas',
    });
    expect(MontagemProjeto.create).not.toHaveBeenCalled();
    expect(resultado).toBe(montagem);
  });

  test('Deve considerar zero para custos opcionais ausentes', async () => {
    MontagemProjeto.findOne.mockResolvedValue(null);
    await salvarMontagem(1, 1, {});

    expect(MontagemProjeto.create).toHaveBeenCalledWith({
      projeto_id: 1,
      custo_hospedagem: 0,
      custo_alimentacao: 0,
      custo_transporte_equipe: 0,
      outros_custos: 0,
      observacoes: null,
    });
  });

  test('Deve converter valores numéricos em formato de texto', async () => {
    MontagemProjeto.findOne.mockResolvedValue(null);
    await salvarMontagem(1, 1, {
      custoHospedagem: '125.50',
      custoAlimentacao: '75',
      custoTransporteEquipe: null,
      outrosCustos: '0',
      observacoes: '   ',
    });

    expect(MontagemProjeto.create).toHaveBeenCalledWith(
      expect.objectContaining({
        custo_hospedagem: 125.5,
        custo_alimentacao: 75,
        custo_transporte_equipe: 0,
        outros_custos: 0,
        observacoes: null,
      })
    );
  });

  test.each(
    [
      ['hospedagem', 'custoHospedagem', 'Custo de hospedagem'],
      ['alimentação', 'custoAlimentacao', 'Custo de alimentação'],
      ['transporte da equipe', 'custoTransporteEquipe', 'Custo de transporte da equipe'],
      ['outros custos', 'outrosCustos', 'Outros custos'],
    ].flatMap(([nome, campo, rotulo]) => [
      [`${nome} negativo`, campo, rotulo, -1],
      [`${nome} não numérico`, campo, rotulo, 'abc'],
      [`${nome} infinito`, campo, rotulo, Infinity],
    ])
  )('Deve rejeitar %s', async (_, campo, rotulo, valor) => {
    await expect(
      salvarMontagem(1, 1, { ...dadosValidos, [campo]: valor })
    ).rejects.toThrow(`${rotulo} inválido.`);
    expect(MontagemProjeto.create).not.toHaveBeenCalled();
  });

  test('Não deve salvar montagem de projeto de outro usuário', async () => {
    Projeto.findOne.mockResolvedValue(null);

    await expect(salvarMontagem(1, 999, dadosValidos)).rejects.toThrow(
      'Projeto não encontrado.'
    );
    expect(Projeto.findOne).toHaveBeenCalledWith({
      where: { id: 1, usuario_id: 999 },
    });
    expect(MontagemProjeto.create).not.toHaveBeenCalled();
  });

  test('Deve consultar a montagem cadastrada', async () => {
    const resultado = await buscarMontagem(1, 1);

    expect(resultado.id).toBe(20);
    expect(MontagemProjeto.findOne).toHaveBeenCalledWith({
      where: { projeto_id: 1 },
    });
  });

  test('Deve rejeitar consulta sem montagem cadastrada', async () => {
    MontagemProjeto.findOne.mockResolvedValue(null);

    await expect(buscarMontagem(1, 1)).rejects.toThrow(
      'Montagem ainda não configurada para este projeto.'
    );
  });

  test('Não deve consultar montagem de projeto de outro usuário', async () => {
    Projeto.findOne.mockResolvedValue(null);

    await expect(buscarMontagem(1, 999)).rejects.toThrow(
      'Projeto não encontrado.'
    );
    expect(MontagemProjeto.findOne).not.toHaveBeenCalled();
  });

  test('Deve calcular os custos de equipamentos, equipes e gerais', async () => {
    const resultado = await calcularCustos(1, 1);

    // Guindaste: 2 * 3 * 100 + 50 + 30 = 680
    // Plataforma: 1 * 2 * 40 + 0 + 10 = 90
    expect(resultado.equipamentos.quantidade).toBe(2);
    expect(resultado.equipamentos.detalhes[0].custoUso).toBe(600);
    expect(resultado.equipamentos.detalhes[0].custoTotal).toBe(680);
    expect(resultado.equipamentos.detalhes[1].custoTotal).toBe(90);
    expect(resultado.equipamentos.custoTotal).toBe(770);

    // Montadores: 3 * 2 * 150 = 900
    // Técnicos: 1 * 2 * 200 = 400
    expect(resultado.equipes.quantidade).toBe(2);
    expect(resultado.equipes.detalhes[0].custoTotal).toBe(900);
    expect(resultado.equipes.detalhes[1].custoTotal).toBe(400);
    expect(resultado.equipes.custoTotal).toBe(1300);

    // Custos gerais: 100 + 80 + 60 + 40 = 280
    expect(resultado.custosGerais.total).toBe(280);
    expect(resultado.custoTotalMontagem).toBe(2350);

    expect(EquipamentoMontagem.findAll).toHaveBeenCalledWith({
      where: { montagem_id: 20 },
      order: [['id', 'ASC']],
    });
    expect(EquipeMontagem.findAll).toHaveBeenCalledWith({
      where: { montagem_id: 20 },
      order: [['id', 'ASC']],
    });
  });

  test('Deve calcular somente os custos gerais quando não há equipes ou equipamentos', async () => {
    EquipamentoMontagem.findAll.mockResolvedValue([]);
    EquipeMontagem.findAll.mockResolvedValue([]);

    const resultado = await calcularCustos(1, 1);

    expect(resultado.equipamentos.quantidade).toBe(0);
    expect(resultado.equipamentos.custoTotal).toBe(0);
    expect(resultado.equipes.quantidade).toBe(0);
    expect(resultado.equipes.custoTotal).toBe(0);
    expect(resultado.custoTotalMontagem).toBe(280);
  });

  test('Deve rejeitar cálculo sem configuração geral de montagem', async () => {
    MontagemProjeto.findOne.mockResolvedValue(null);

    await expect(calcularCustos(1, 1)).rejects.toThrow(
      'Configure primeiro os dados gerais da montagem.'
    );
    expect(EquipamentoMontagem.findAll).not.toHaveBeenCalled();
    expect(EquipeMontagem.findAll).not.toHaveBeenCalled();
  });

  test('Não deve calcular montagem de projeto de outro usuário', async () => {
    Projeto.findOne.mockResolvedValue(null);

    await expect(calcularCustos(1, 999)).rejects.toThrow(
      'Projeto não encontrado.'
    );
    expect(MontagemProjeto.findOne).not.toHaveBeenCalled();
  });

  test('Deve confirmar a montagem e atualizar o status do projeto', async () => {
    const resultado = await confirmarMontagem(1, 1);

    expect(projeto.update).toHaveBeenCalledWith({
      status: 'MONTAGEM_CALCULADA',
    });
    expect(resultado.projeto.status).toBe('MONTAGEM_CALCULADA');
    expect(resultado.custoTotalMontagem).toBe(2350);
  });

  test('Não deve confirmar montagem sem dados gerais cadastrados', async () => {
    MontagemProjeto.findOne.mockResolvedValue(null);

    await expect(confirmarMontagem(1, 1)).rejects.toThrow(
      'Configure primeiro os dados gerais da montagem.'
    );
    expect(projeto.update).not.toHaveBeenCalled();
  });

  test('Não deve confirmar montagem de projeto de outro usuário', async () => {
    Projeto.findOne.mockResolvedValue(null);

    await expect(confirmarMontagem(1, 999)).rejects.toThrow(
      'Projeto não encontrado.'
    );
    expect(projeto.update).not.toHaveBeenCalled();
  });
});
