import { ResolucaoListaRepository } from '../../../src/modules/resolucaoLista/resolucaoLista.repository';
import { prisma } from '@/config/db';
import { AlternativaQuestao, StatusResolucaoLista } from '@prisma/client';

jest.mock('@/config/db', () => ({
  prisma: {
    listaTurma: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    resolucaoLista: {
      upsert: jest.fn(),
      update: jest.fn(),
    },
    resolucaoQuestaoLista: {
      upsert: jest.fn(),
    },
  },
}));

describe('ResolucaoListaRepository', () => {
  let repository: ResolucaoListaRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new ResolucaoListaRepository();
  });

  describe('buscarListasDoAluno', () => {
    it('deve buscar listas do aluno sem termo de busca', async () => {
      const mockResult = [{ id: 'lista-1' }];
      (prisma.listaTurma.findMany as jest.Mock).mockResolvedValue(mockResult);

      const result = await repository.buscarListasDoAluno('aluno-1');

      expect(prisma.listaTurma.findMany).toHaveBeenCalledWith({
        where: {
          turma: {
            alunos: { some: { alunoId: 'aluno-1' } },
            status: 'ATIVA',
          },
          listaQuestao: {
            nome: undefined,
          },
        },
        include: {
          listaQuestao: {
            include: {
              itens: { include: { questao: { include: { tema: true } } } },
            },
          },
          resolucoes: {
            where: { alunoId: 'aluno-1' },
          },
        },
        orderBy: { prazo: 'asc' },
      });
      expect(result).toEqual(mockResult);
    });

    it('deve buscar listas do aluno com termo de busca', async () => {
      const mockResult = [{ id: 'lista-1' }];
      (prisma.listaTurma.findMany as jest.Mock).mockResolvedValue(mockResult);

      const result = await repository.buscarListasDoAluno('aluno-1', 'Anatomia');

      expect(prisma.listaTurma.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            turma: {
              alunos: { some: { alunoId: 'aluno-1' } },
              status: 'ATIVA',
            },
            listaQuestao: {
              nome: { contains: 'Anatomia', mode: 'insensitive' },
            },
          },
        })
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('buscarListaComQuestoes', () => {
    it('deve buscar lista detalhada do aluno', async () => {
      const mockResult = { id: 'lista-turma-1' };
      (prisma.listaTurma.findFirst as jest.Mock).mockResolvedValue(mockResult);

      const result = await repository.buscarListaComQuestoes('aluno-1', 'lista-turma-1');

      expect(prisma.listaTurma.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'lista-turma-1',
          turma: {
            alunos: { some: { alunoId: 'aluno-1' } },
            status: 'ATIVA',
          },
        },
        include: {
          listaQuestao: {
            include: {
              itens: {
                orderBy: { ordem: 'asc' },
                include: {
                  questao: {
                    include: { alternativas: true, tema: true },
                  },
                },
              },
            },
          },
          resolucoes: {
            where: { alunoId: 'aluno-1' },
            include: { respostas: true },
          },
        },
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('salvarResposta', () => {
    it('deve fazer upsert da resolucaoLista e da resposta', async () => {
      const mockResolucaoLista = { id: 'resolucao-1' };
      const mockResposta = { id: 'resposta-1' };

      (prisma.resolucaoLista.upsert as jest.Mock).mockResolvedValue(mockResolucaoLista);
      (prisma.resolucaoQuestaoLista.upsert as jest.Mock).mockResolvedValue(mockResposta);

      const result = await repository.salvarResposta(
        'aluno-1',
        'lista-turma-1',
        'questao-1',
        AlternativaQuestao.A
      );

      expect(prisma.resolucaoLista.upsert).toHaveBeenCalledWith({
        where: { alunoId_listaTurmaId: { alunoId: 'aluno-1', listaTurmaId: 'lista-turma-1' } },
        update: {},
        create: {
          alunoId: 'aluno-1',
          listaTurmaId: 'lista-turma-1',
          status: StatusResolucaoLista.EM_ANDAMENTO,
        },
      });

      expect(prisma.resolucaoQuestaoLista.upsert).toHaveBeenCalledWith({
        where: {
          resolucaoListaId_questaoId: {
            resolucaoListaId: 'resolucao-1',
            questaoId: 'questao-1',
          },
        },
        update: { respostaMarcada: AlternativaQuestao.A },
        create: {
          resolucaoListaId: 'resolucao-1',
          questaoId: 'questao-1',
          respostaMarcada: AlternativaQuestao.A,
        },
      });

      expect(result).toEqual(mockResposta);
    });
  });

  describe('submeterLista', () => {
    it('deve atualizar o status para SUBMETIDA e registrar a data de submissao', async () => {
      const mockResolucaoLista = { id: 'resolucao-1', status: StatusResolucaoLista.SUBMETIDA };
      
      (prisma.resolucaoLista.update as jest.Mock).mockResolvedValue(mockResolucaoLista);

      const result = await repository.submeterLista('aluno-1', 'lista-turma-1');

      expect(prisma.resolucaoLista.update).toHaveBeenCalledWith({
        where: { alunoId_listaTurmaId: { alunoId: 'aluno-1', listaTurmaId: 'lista-turma-1' } },
        data: {
          status: StatusResolucaoLista.SUBMETIDA,
          submissaoEm: expect.any(Date),
        },
      });

      expect(result).toEqual(mockResolucaoLista);
    });
  });
});