import { ListaQuestaoRepository } from '../../../src/modules/lista/lista.repository';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    listaQuestao: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    listaQuestaoItem: {
      findMany: jest.fn(),
    },
    turmaAluno: {
      findMany: jest.fn(),
    },
    resolucaoQuestao: {
      findMany: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

const mockPrisma = new PrismaClient() as unknown as PrismaMock;

describe('ListaQuestaoRepository', () => {
  let repository: ListaQuestaoRepository;

  beforeEach(() => {
    repository = new ListaQuestaoRepository();
    jest.clearAllMocks();
  });

  it('deve buscar uma lista por id', async () => {
    const mockLista = { id: '1', nome: 'Lista 1' };
    mockPrisma.listaQuestao.findUnique.mockResolvedValue(mockLista);

    const resultado = await repository.buscarPorId('1');

    expect(mockPrisma.listaQuestao.findUnique).toHaveBeenCalledWith({
      where: { id: '1', excluidoEm: null },
      include: expect.any(Object),
    });
    expect(resultado).toEqual(mockLista);
  });

  it('deve listar as listas do professor sem filtros adicionais', async () => {
    const mockListas = [{ id: '1', nome: 'Lista 1' }];
    mockPrisma.listaQuestao.findMany.mockResolvedValue(mockListas);

    const resultado = await repository.listarDoProfessor('prof-1');

    expect(mockPrisma.listaQuestao.findMany).toHaveBeenCalledWith({
      where: { criadoPorId: 'prof-1', excluidoEm: null },
      include: {
        _count: { select: { itens: true } },
        turmas: { include: { turma: true } },
      },
      orderBy: { criadoEm: 'desc' },
    });
    expect(resultado).toEqual(mockListas);
  });

  it('deve aplicar filtros de busca e status RASCUNHO', async () => {
    mockPrisma.listaQuestao.findMany.mockResolvedValue([]);

    await repository.listarDoProfessor('prof-1', { busca: 'Neuro', status: 'RASCUNHO' });

    expect(mockPrisma.listaQuestao.findMany).toHaveBeenCalledWith({
      where: { 
        criadoPorId: 'prof-1', 
        excluidoEm: null,
        nome: { contains: 'Neuro', mode: 'insensitive' },
        turmas: { none: {} }
      },
      include: {
        _count: { select: { itens: true } },
        turmas: { include: { turma: true } },
      },
      orderBy: { criadoEm: 'desc' },
    });
  });

  it('deve marcar uma lista como deletada (soft delete)', async () => {
    mockPrisma.listaQuestao.update.mockResolvedValue({ id: '1' });

    await repository.deletar('1');

    expect(mockPrisma.listaQuestao.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { excluidoEm: expect.any(Date) },
    });
  });

  it('deve buscar dados base para estatísticas da turma', async () => {
    mockPrisma.listaQuestaoItem.findMany.mockResolvedValue([{ questaoId: 'q1' }]);
    mockPrisma.turmaAluno.findMany.mockResolvedValue([{ alunoId: 'a1' }]);
    mockPrisma.resolucaoQuestao.findMany.mockResolvedValue([{ id: 'res1' }]);

    const resultado = await repository.buscarEstatisticasTurma('lista-1', 'turma-1');

    expect(mockPrisma.listaQuestaoItem.findMany).toHaveBeenCalledWith({ where: { listaQuestaoId: 'lista-1' }, select: { questaoId: true } });
    expect(mockPrisma.turmaAluno.findMany).toHaveBeenCalledWith({ where: { turmaId: 'turma-1' }, select: { alunoId: true } });
    expect(mockPrisma.resolucaoQuestao.findMany).toHaveBeenCalledWith({
      where: { questaoId: { in: ['q1'] }, usuarioId: { in: ['a1'] } },
      include: { questao: true },
    });

    expect(resultado).toEqual({
      alunosIds: ['a1'],
      resolucoes: [{ id: 'res1' }],
    });
  });

  it('deve listar as listas vinculadas a uma turma', async () => {
    const mockListas = [{ id: '1', nome: 'Lista Turma 1' }];
    mockPrisma.listaQuestao.findMany.mockResolvedValue(mockListas);

    const resultado = await repository.listarPorTurma('turma-1');

    expect(mockPrisma.listaQuestao.findMany).toHaveBeenCalledWith({
      where: {
        excluidoEm: null,
        turmas: {
          some: { turmaId: 'turma-1' },
        },
      },
      include: {
        itens: {
          include: { questao: true },
          orderBy: { ordem: 'asc' },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });
    expect(resultado).toEqual(mockListas);
  });
});