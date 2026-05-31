import { TurmaDashboardRepository } from '../../../src/modules/dashboardTurma/dashboardTurma.repository';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mPrisma = {
    turmaAluno: {
      findMany: jest.fn(),
    },
    resolucaoQuestao: {
      findMany: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

describe('TurmaDashboardRepository', () => {
  let repository: TurmaDashboardRepository;
  let prismaMock: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    repository = new TurmaDashboardRepository();
    prismaMock = new PrismaClient() as jest.Mocked<PrismaClient>;
    jest.clearAllMocks();
  });

  it('deve buscar e retornar apenas os IDs dos alunos de uma turma', async () => {
    const mockMatriculas = [{ alunoId: 'aluno-1' }, { alunoId: 'aluno-2' }];
    (prismaMock.turmaAluno.findMany as jest.Mock).mockResolvedValue(mockMatriculas);

    const result = await repository.findAlunosByTurmaId('turma-123');

    expect(prismaMock.turmaAluno.findMany).toHaveBeenCalledWith({
      where: { turmaId: 'turma-123' },
      select: { alunoId: true },
    });
    expect(result).toEqual(['aluno-1', 'aluno-2']);
  });

  it('deve buscar as resolucoes dos alunos com os includes de questao e tema', async () => {
    const mockResolucoes = [{ id: 'res-1' }];
    (prismaMock.resolucaoQuestao.findMany as jest.Mock).mockResolvedValue(mockResolucoes);

    const result = await repository.findResolucoesByAlunos(['aluno-1', 'aluno-2']);

    expect(prismaMock.resolucaoQuestao.findMany).toHaveBeenCalledWith({
      where: { usuarioId: { in: ['aluno-1', 'aluno-2'] } },
      include: { questao: { include: { tema: true } } },
    });
    expect(result).toEqual(mockResolucoes);
  });
});