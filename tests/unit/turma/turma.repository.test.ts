import { TurmaRepository } from '@/modules/turma/turma.repository'; 
import { prisma } from '@/config/db';
import { StatusTurma } from '@prisma/client';

jest.mock('@/config/db', () => ({
  prisma: {
    turma: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('TurmaRepository', () => {
  let repository: TurmaRepository;

  const mockTurmaComContagem = {
    id: 'turma-123',
    codigo: 'ANAT-01',
    nome: 'Anatomia Sistêmica',
    semestre: '1',
    ano: 2026,
    descricao: 'Turma de teste',
    status: StatusTurma.ATIVA,
    professorId: 'prof-123',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    excluidoEm: null,
    _count: { alunos: 5 },
  };

  beforeEach(() => {
    repository = new TurmaRepository();
    jest.clearAllMocks();
  });

  describe('buscarPorId', () => {
    it('deve retornar uma turma com contagem quando o ID existir', async () => {
      (prisma.turma.findUnique as jest.Mock).mockResolvedValue(mockTurmaComContagem);

      const resultado = await repository.buscarPorId('turma-123');

      expect(resultado).toEqual(mockTurmaComContagem);
      expect(prisma.turma.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.turma.findUnique).toHaveBeenCalledWith({
        where: { id: 'turma-123', excluidoEm: null },
        include: { _count: { select: { alunos: true } } },
      });
    });

    it('deve retornar null quando a turma não for encontrada', async () => {
      (prisma.turma.findUnique as jest.Mock).mockResolvedValue(null);

      const resultado = await repository.buscarPorId('id-inexistente');

      expect(resultado).toBeNull();
      expect(prisma.turma.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('listarComFiltros', () => {
    it('deve listar turmas sem o filtro de busca textual (OR undefined)', async () => {
      (prisma.turma.findMany as jest.Mock).mockResolvedValue([mockTurmaComContagem]);

      const filtros = { professorId: 'prof-123', status: StatusTurma.ATIVA };
      
      const resultado = await repository.listarComFiltros(filtros);

      expect(resultado).toEqual([mockTurmaComContagem]);
      expect(prisma.turma.findMany).toHaveBeenCalledWith({
        where: {
          excluidoEm: null,
          professorId: 'prof-123',
          status: 'ATIVA',
          OR: undefined, 
        },
        orderBy: { criadoEm: 'desc' },
        include: { _count: { select: { alunos: true } } },
      });
    });

    it('deve listar turmas aplicando o filtro de busca textual (OR preenchido)', async () => {
      (prisma.turma.findMany as jest.Mock).mockResolvedValue([mockTurmaComContagem]);

      const filtros = { 
        professorId: 'prof-123', 
        status: StatusTurma.ATIVA,
        busca: 'Anatomia' 
      };
      
      const resultado = await repository.listarComFiltros(filtros);

      expect(resultado).toEqual([mockTurmaComContagem]);
      expect(prisma.turma.findMany).toHaveBeenCalledWith({
        where: {
          excluidoEm: null,
          professorId: 'prof-123',
          status: 'ATIVA',
          OR: [
            { nome: { contains: 'Anatomia', mode: 'insensitive' } },
            { codigo: { contains: 'Anatomia', mode: 'insensitive' } }
          ], 
        },
        orderBy: { criadoEm: 'desc' },
        include: { _count: { select: { alunos: true } } },
      });
    });
  });

  describe('deletarLogico', () => {
    it('deve atualizar a turma preenchendo excluidoEm e mudando status para INATIVA', async () => {
      (prisma.turma.update as jest.Mock).mockResolvedValue(true); 

      await repository.deletarLogico('turma-123');

      expect(prisma.turma.update).toHaveBeenCalledTimes(1);
      expect(prisma.turma.update).toHaveBeenCalledWith({
        where: { id: 'turma-123' },
        data: {
          excluidoEm: expect.any(Date), 
          status: 'INATIVA',
        },
      });
    });
  });
});