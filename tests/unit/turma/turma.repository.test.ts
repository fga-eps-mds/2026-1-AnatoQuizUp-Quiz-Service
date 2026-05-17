import { StatusTurma } from '@prisma/client';

import { prisma } from '@/config/db';
import { TurmaRepository } from '@/modules/turma/turma.repository';

jest.mock('@/config/db', () => ({
  prisma: {
    turma: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    turmaAluno: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('TurmaRepository', () => {
  let repository: TurmaRepository;

  const data = new Date('2026-01-01T00:00:00.000Z');
  const includeContagemAlunosAtivos = {
    _count: {
      select: {
        alunos: {
          where: { excluidoEm: null },
        },
      },
    },
  };
  const selectVinculoAluno = {
    id: true,
    turmaId: true,
    alunoId: true,
    criadoEm: true,
    atualizadoEm: true,
  };

  const mockTurmaComContagem = {
    id: 'turma-123',
    codigo: 'ANAT-01',
    nome: 'Anatomia Sistemica',
    semestre: '2026.1',
    ano: 2026,
    descricao: 'Turma de teste',
    status: StatusTurma.ATIVA,
    professorId: 'prof-123',
    criadoEm: data,
    atualizadoEm: data,
    excluidoEm: null,
    _count: { alunos: 5 },
  };

  const mockVinculo = {
    id: 'vinculo-123',
    turmaId: 'turma-123',
    alunoId: 'aluno-123',
    criadoEm: data,
    atualizadoEm: data,
  };

  beforeEach(() => {
    repository = new TurmaRepository();
    jest.clearAllMocks();
  });

  describe('turmas', () => {
    it('deve buscar turma por id com contagem apenas de alunos ativos', async () => {
      (prisma.turma.findUnique as jest.Mock).mockResolvedValue(mockTurmaComContagem);

      const resultado = await repository.buscarPorId('turma-123');

      expect(resultado).toEqual(mockTurmaComContagem);
      expect(prisma.turma.findUnique).toHaveBeenCalledWith({
        where: { id: 'turma-123', excluidoEm: null },
        include: includeContagemAlunosAtivos,
      });
    });

    it('deve buscar turma por codigo', async () => {
      (prisma.turma.findUnique as jest.Mock).mockResolvedValue(mockTurmaComContagem);

      const resultado = await repository.buscarPorCodigo('ANAT-01');

      expect(resultado).toEqual(mockTurmaComContagem);
      expect(prisma.turma.findUnique).toHaveBeenCalledWith({
        where: { codigo: 'ANAT-01' },
      });
    });

    it('deve listar turmas aplicando filtros de professor, status, semestre, ano e busca', async () => {
      (prisma.turma.findMany as jest.Mock).mockResolvedValue([mockTurmaComContagem]);

      const resultado = await repository.listarComFiltros({
        professorId: 'prof-123',
        status: StatusTurma.ATIVA,
        semestre: '2026.1',
        ano: 2026,
        busca: 'Anatomia',
      });

      expect(resultado).toEqual([mockTurmaComContagem]);
      expect(prisma.turma.findMany).toHaveBeenCalledWith({
        where: {
          excluidoEm: null,
          professorId: 'prof-123',
          status: 'ATIVA',
          semestre: '2026.1',
          ano: 2026,
          OR: [
            { nome: { contains: 'Anatomia', mode: 'insensitive' } },
            { codigo: { contains: 'Anatomia', mode: 'insensitive' } },
          ],
        },
        orderBy: { criadoEm: 'desc' },
        include: includeContagemAlunosAtivos,
      });
    });

    it('deve criar turma com contagem de alunos ativos', async () => {
      (prisma.turma.create as jest.Mock).mockResolvedValue(mockTurmaComContagem);

      const dataCriacao = {
        codigo: 'ANAT-01',
        nome: 'Anatomia Sistemica',
        semestre: '2026.1',
        ano: 2026,
        descricao: 'Turma de teste',
        professorId: 'prof-123',
      };

      const resultado = await repository.criar(dataCriacao);

      expect(resultado).toEqual(mockTurmaComContagem);
      expect(prisma.turma.create).toHaveBeenCalledWith({
        data: dataCriacao,
        include: includeContagemAlunosAtivos,
      });
    });

    it('deve atualizar turma com contagem de alunos ativos', async () => {
      (prisma.turma.update as jest.Mock).mockResolvedValue(mockTurmaComContagem);

      const resultado = await repository.atualizar('turma-123', { nome: 'Turma B' });

      expect(resultado).toEqual(mockTurmaComContagem);
      expect(prisma.turma.update).toHaveBeenCalledWith({
        where: { id: 'turma-123' },
        data: { nome: 'Turma B' },
        include: includeContagemAlunosAtivos,
      });
    });

    it('deve deletar logicamente a turma', async () => {
      (prisma.turma.update as jest.Mock).mockResolvedValue(true);

      await repository.deletarLogico('turma-123');

      expect(prisma.turma.update).toHaveBeenCalledWith({
        where: { id: 'turma-123' },
        data: {
          excluidoEm: expect.any(Date),
          status: 'INATIVA',
        },
      });
    });
  });

  describe('alunos da turma', () => {
    it('deve listar apenas vinculos ativos', async () => {
      (prisma.turmaAluno.findMany as jest.Mock).mockResolvedValue([mockVinculo]);

      const resultado = await repository.listarAlunos('turma-123');

      expect(resultado).toEqual([mockVinculo]);
      expect(prisma.turmaAluno.findMany).toHaveBeenCalledWith({
        where: {
          turmaId: 'turma-123',
          excluidoEm: null,
        },
        orderBy: { criadoEm: 'desc' },
        select: selectVinculoAluno,
      });
    });

    it('deve buscar vinculo por turma e aluno', async () => {
      (prisma.turmaAluno.findUnique as jest.Mock).mockResolvedValue(mockVinculo);

      const resultado = await repository.buscarVinculoAluno('turma-123', 'aluno-123');

      expect(resultado).toEqual(mockVinculo);
      expect(prisma.turmaAluno.findUnique).toHaveBeenCalledWith({
        where: {
          turmaId_alunoId: {
            turmaId: 'turma-123',
            alunoId: 'aluno-123',
          },
        },
      });
    });

    it('deve criar vinculo de aluno', async () => {
      (prisma.turmaAluno.create as jest.Mock).mockResolvedValue(mockVinculo);

      const resultado = await repository.criarVinculoAluno('turma-123', 'aluno-123');

      expect(resultado).toEqual(mockVinculo);
      expect(prisma.turmaAluno.create).toHaveBeenCalledWith({
        data: {
          turmaId: 'turma-123',
          alunoId: 'aluno-123',
        },
        select: selectVinculoAluno,
      });
    });

    it('deve reativar vinculo de aluno', async () => {
      (prisma.turmaAluno.update as jest.Mock).mockResolvedValue(mockVinculo);

      const resultado = await repository.reativarVinculoAluno('vinculo-123');

      expect(resultado).toEqual(mockVinculo);
      expect(prisma.turmaAluno.update).toHaveBeenCalledWith({
        where: { id: 'vinculo-123' },
        data: { excluidoEm: null },
        select: selectVinculoAluno,
      });
    });

    it('deve desvincular aluno com delete logico', async () => {
      (prisma.turmaAluno.update as jest.Mock).mockResolvedValue(mockVinculo);

      await repository.desvincularAluno('vinculo-123');

      expect(prisma.turmaAluno.update).toHaveBeenCalledWith({
        where: { id: 'vinculo-123' },
        data: { excluidoEm: expect.any(Date) },
      });
    });
  });
});
