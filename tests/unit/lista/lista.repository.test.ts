jest.mock('@/config/db', () => {
  const prisma = {
    listaQuestao: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    questao: {
      findMany: jest.fn(),
    },
    turma: {
      findMany: jest.fn(),
    },
    listaQuestaoItem: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    listaTurma: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    turmaAluno: {
      findMany: jest.fn(),
    },
    resolucaoQuestao: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((operacao) => {
      if (Array.isArray(operacao)) {
        return Promise.all(operacao);
      }

      return operacao(prisma);
    }),
  };

  return { prisma };
});

import { prisma } from '@/config/db';
import { ListaQuestaoRepository } from '../../../src/modules/lista/lista.repository';

const mockPrisma = prisma as never as {
  listaQuestao: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  questao: { findMany: jest.Mock };
  turma: { findMany: jest.Mock };
  listaQuestaoItem: {
    createMany: jest.Mock;
    deleteMany: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
  listaTurma: { createMany: jest.Mock; deleteMany: jest.Mock };
  turmaAluno: { findMany: jest.Mock };
  resolucaoQuestao: { findMany: jest.Mock };
  $transaction: jest.Mock;
};

describe('ListaQuestaoRepository', () => {
  let repository: ListaQuestaoRepository;

  beforeEach(() => {
    repository = new ListaQuestaoRepository();
    jest.clearAllMocks();
  });

  it('deve buscar uma lista por id', async () => {
    const lista = { id: 'lista-1', nome: 'Lista 1' };
    mockPrisma.listaQuestao.findFirst.mockResolvedValue(lista);

    const resultado = await repository.buscarPorId('lista-1');

    expect(mockPrisma.listaQuestao.findFirst).toHaveBeenCalledWith({
      where: { id: 'lista-1', excluidoEm: null },
      include: expect.objectContaining({
        itens: expect.any(Object),
        turmas: expect.any(Object),
      }),
    });
    expect(resultado).toEqual(lista);
  });

  it('deve listar as listas do professor com filtros', async () => {
    const listas = [{ id: 'lista-1', nome: 'Lista 1' }];
    mockPrisma.listaQuestao.findMany.mockResolvedValue(listas);

    const resultado = await repository.listarDoProfessor('prof-1', {
      busca: 'Neuro',
      status: 'RASCUNHO',
    });

    expect(mockPrisma.listaQuestao.findMany).toHaveBeenCalledWith({
      where: {
        criadoPorId: 'prof-1',
        excluidoEm: null,
        nome: { contains: 'Neuro', mode: 'insensitive' },
        turmas: { none: {} },
      },
      include: expect.objectContaining({
        _count: { select: { itens: true } },
        turmas: expect.any(Object),
      }),
      orderBy: { criadoEm: 'desc' },
    });
    expect(resultado).toEqual(listas);
  });

  it('deve listar listas vinculadas a turma do professor', async () => {
    const listas = [{ id: 'lista-1' }];
    mockPrisma.listaQuestao.findMany.mockResolvedValue(listas);

    const resultado = await repository.listarPorTurma('turma-1', 'prof-1');

    expect(mockPrisma.listaQuestao.findMany).toHaveBeenCalledWith({
      where: {
        criadoPorId: 'prof-1',
        excluidoEm: null,
        turmas: { some: { turmaId: 'turma-1' } },
      },
      include: expect.objectContaining({
        itens: expect.any(Object),
        turmas: expect.any(Object),
      }),
      orderBy: { criadoEm: 'desc' },
    });
    expect(resultado).toEqual(listas);
  });

  it('deve criar lista com itens e turmas', async () => {
    const lista = { id: 'lista-1' };
    mockPrisma.listaQuestao.create.mockResolvedValue(lista);

    const resultado = await repository.criar({
      nome: 'Lista 1',
      criadoPorId: 'prof-1',
      questoesIds: ['q1', 'q2'],
      turmasIds: ['turma-1'],
    });

    expect(mockPrisma.listaQuestao.create).toHaveBeenCalledWith({
      data: {
        nome: 'Lista 1',
        criadoPorId: 'prof-1',
        itens: {
          create: [
            { questaoId: 'q1', ordem: 1 },
            { questaoId: 'q2', ordem: 2 },
          ],
        },
        turmas: {
          create: [{ turmaId: 'turma-1' }],
        },
      },
      include: expect.any(Object),
    });
    expect(resultado).toEqual(lista);
  });

  it('deve atualizar nome e deletar logicamente uma lista', async () => {
    mockPrisma.listaQuestao.update.mockResolvedValueOnce({ id: 'lista-1', nome: 'Novo nome' });
    mockPrisma.listaQuestao.update.mockResolvedValueOnce({ id: 'lista-1' });

    await repository.atualizarNome('lista-1', 'Novo nome');
    await repository.deletar('lista-1');

    expect(mockPrisma.listaQuestao.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'lista-1' },
      data: { nome: 'Novo nome' },
      include: expect.any(Object),
    });
    expect(mockPrisma.listaQuestao.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'lista-1' },
      data: { excluidoEm: expect.any(Date) },
    });
  });

  it('deve validar questoes e turmas ativas', async () => {
    mockPrisma.questao.findMany.mockResolvedValue([{ id: 'q1' }]);
    mockPrisma.turma.findMany.mockResolvedValue([{ id: 'turma-1' }]);

    await repository.listarQuestoesAtivasPorIds(['q1']);
    await repository.listarTurmasAtivasDoProfessorPorIds(['turma-1'], 'prof-1');

    expect(mockPrisma.questao.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['q1'] }, excluidoEm: null, status: 'ATIVO' },
      select: { id: true },
    });
    expect(mockPrisma.turma.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['turma-1'] },
        professorId: 'prof-1',
        excluidoEm: null,
        status: 'ATIVA',
      },
      select: { id: true },
    });
  });

  it('deve vincular questoes e retornar a lista atualizada', async () => {
    mockPrisma.listaQuestaoItem.createMany.mockResolvedValue({ count: 2 });
    mockPrisma.listaQuestao.findFirst.mockResolvedValue({ id: 'lista-1' });

    await repository.vincularQuestoes('lista-1', ['q3', 'q4'], 3);

    expect(mockPrisma.listaQuestaoItem.createMany).toHaveBeenCalledWith({
      data: [
        { listaQuestaoId: 'lista-1', questaoId: 'q3', ordem: 3 },
        { listaQuestaoId: 'lista-1', questaoId: 'q4', ordem: 4 },
      ],
    });
  });

  it('deve desvincular questao e compactar ordem restante', async () => {
    mockPrisma.listaQuestaoItem.findMany.mockResolvedValue([{ id: 'item-2' }]);
    mockPrisma.listaQuestaoItem.update.mockResolvedValue({ id: 'item-2', ordem: 1 });
    mockPrisma.listaQuestao.findFirst.mockResolvedValue({ id: 'lista-1' });

    await repository.desvincularQuestao('lista-1', 'q1');

    expect(mockPrisma.listaQuestaoItem.deleteMany).toHaveBeenCalledWith({
      where: { listaQuestaoId: 'lista-1', questaoId: 'q1' },
    });
    expect(mockPrisma.listaQuestaoItem.update).toHaveBeenCalledWith({
      where: { id: 'item-2' },
      data: { ordem: 1 },
    });
  });

  it('deve reordenar questoes pela ordem recebida', async () => {
    mockPrisma.listaQuestaoItem.update.mockResolvedValue({});
    mockPrisma.listaQuestao.findFirst.mockResolvedValue({ id: 'lista-1' });

    await repository.reordenarQuestoes('lista-1', ['q2', 'q1']);

    expect(mockPrisma.listaQuestaoItem.update).toHaveBeenNthCalledWith(1, {
      where: { listaQuestaoId_questaoId: { listaQuestaoId: 'lista-1', questaoId: 'q2' } },
      data: { ordem: 1 },
    });
    expect(mockPrisma.listaQuestaoItem.update).toHaveBeenNthCalledWith(2, {
      where: { listaQuestaoId_questaoId: { listaQuestaoId: 'lista-1', questaoId: 'q1' } },
      data: { ordem: 2 },
    });
  });

  it('deve vincular e desvincular turmas', async () => {
    mockPrisma.listaTurma.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.listaTurma.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.listaQuestao.findFirst.mockResolvedValue({ id: 'lista-1' });

    await repository.vincularTurmas('lista-1', ['turma-1']);
    await repository.desvincularTurma('lista-1', 'turma-1');

    expect(mockPrisma.listaTurma.createMany).toHaveBeenCalledWith({
      data: [{ listaQuestaoId: 'lista-1', turmaId: 'turma-1' }],
    });
    expect(mockPrisma.listaTurma.deleteMany).toHaveBeenCalledWith({
      where: { listaQuestaoId: 'lista-1', turmaId: 'turma-1' },
    });
  });

  it('deve buscar dados base para estatisticas da turma', async () => {
    mockPrisma.listaQuestaoItem.findMany.mockResolvedValue([{ questaoId: 'q1' }]);
    mockPrisma.turmaAluno.findMany.mockResolvedValue([{ alunoId: 'a1' }]);
    mockPrisma.resolucaoQuestao.findMany.mockResolvedValue([{ id: 'res1' }]);

    const resultado = await repository.buscarEstatisticasTurma('lista-1', 'turma-1');

    expect(mockPrisma.listaQuestaoItem.findMany).toHaveBeenCalledWith({
      where: { listaQuestaoId: 'lista-1' },
      select: { questaoId: true },
    });
    expect(mockPrisma.turmaAluno.findMany).toHaveBeenCalledWith({
      where: { turmaId: 'turma-1', excluidoEm: null },
      select: { alunoId: true },
    });
    expect(mockPrisma.resolucaoQuestao.findMany).toHaveBeenCalledWith({
      where: { questaoId: { in: ['q1'] }, usuarioId: { in: ['a1'] } },
      include: { questao: true },
    });
    expect(resultado).toEqual({
      alunosIds: ['a1'],
      resolucoes: [{ id: 'res1' }],
    });
  });

  it('deve retornar array vazio se busca não encontrar resultados', async () => {
    mockPrisma.listaQuestao.findMany.mockResolvedValue([]);

    const resultado = await repository.listarDoProfessor('prof-1', { busca: 'inexistente' });

    expect(resultado).toEqual([]);
    expect(mockPrisma.listaQuestao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          nome: { contains: 'inexistente', mode: 'insensitive' }
        })
      })
    );
  });
  it('deve aplicar filtro de status PUBLICADA', async () => {
    mockPrisma.listaQuestao.findMany.mockResolvedValue([]);

    await repository.listarDoProfessor('prof-1', { status: 'PUBLICADA' });

    expect(mockPrisma.listaQuestao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          turmas: { some: {} } 
        })
      })
    );
  });
  it('deve lançar erro se a lista não for encontrada após vinculação (buscarPorIdObrigatorio)', async () => {
    mockPrisma.listaQuestaoItem.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.listaQuestao.findFirst.mockResolvedValue(null);

    await expect(repository.vincularQuestoes('lista-1', ['q1'], 1))
      .rejects.toThrow('Lista de questoes nao encontrada apos operacao.');
  });

  it('deve criar lista sem itens nem turmas', async () => {
    const lista = { id: 'lista-vazia' };
    mockPrisma.listaQuestao.create.mockResolvedValue(lista);

    const resultado = await repository.criar({
      nome: 'Lista Vazia',
      criadoPorId: 'prof-1',
      questoesIds: [],
      turmasIds: [],
    });

    expect(mockPrisma.listaQuestao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          itens: undefined,
          turmas: undefined,
        }),
      })
    );
    expect(resultado).toEqual(lista);
  });
});
