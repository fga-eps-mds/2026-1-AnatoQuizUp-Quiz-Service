import { TurmaService } from '@/modules/turma/turma.service';
import { TurmaRepository } from '@/modules/turma/turma.repository';
import { ErroAplicacao } from '@/shared/errors/erro-aplicacao';
import { StatusTurma } from '@prisma/client';

const mockTurmaRepository = {
  listarComFiltros: jest.fn(),
  buscarPorId: jest.fn(),
  deletarLogico: jest.fn(),
} as unknown as jest.Mocked<TurmaRepository>;

describe('TurmaService', () => {
  let service: TurmaService;

  const professorDonoId = 'prof-123';
  const professorInvasorId = 'prof-malicioso-999';

  const mockTurma = {
    id: 'turma-123',
    codigo: 'ANAT-01',
    nome: 'Anatomia Sistêmica',
    semestre: '1',
    ano: 2026,
    descricao: 'Turma de teste',
    status: StatusTurma.ATIVA,
    professorId: professorDonoId, 
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    excluidoEm: null,
    _count: { alunos: 5 },
  };

  beforeEach(() => {
    service = new TurmaService(mockTurmaRepository);
    jest.clearAllMocks();
  });

  describe('listar', () => {
    it('deve chamar o repository com os filtros corretos e retornar os dados', async () => {
      mockTurmaRepository.listarComFiltros.mockResolvedValue([mockTurma] as any);

      const filtros = { professorId: professorDonoId, status: StatusTurma.ATIVA };
      const resultado = await service.listar(filtros);

      expect(resultado).toEqual([mockTurma]);
      expect(mockTurmaRepository.listarComFiltros).toHaveBeenCalledTimes(1);
      expect(mockTurmaRepository.listarComFiltros).toHaveBeenCalledWith(filtros);
    });
  });

  describe('obterPorId', () => {
    it('deve retornar a turma quando ela existir e pertencer ao professor', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as any);

      const resultado = await service.obterPorId('turma-123', professorDonoId);

      expect(resultado).toEqual(mockTurma);
      expect(mockTurmaRepository.buscarPorId).toHaveBeenCalledWith('turma-123');
    });

    it('deve lançar ErroAplicacao (404) quando a turma não for encontrada', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.obterPorId('id-inexistente', professorDonoId))
        .rejects
        .toThrow(ErroAplicacao);

      await expect(service.obterPorId('id-inexistente', professorDonoId))
        .rejects
        .toMatchObject({
          codigo: 'NAO_ENCONTRADO',
          codigoStatus: 404,
        });
    });

    it('deve lançar ErroAplicacao (403) quando o professor tentar acessar turma de outro', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as any);

      await expect(service.obterPorId('turma-123', professorInvasorId))
        .rejects
        .toThrow(ErroAplicacao);

      await expect(service.obterPorId('turma-123', professorInvasorId))
        .rejects
        .toMatchObject({
          codigo: 'PROIBIDO',
          codigoStatus: 403,
        });
    });
  });

  describe('deletar', () => {
    it('deve buscar a turma e chamar a deleção lógica do repository se o professor for o dono', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as any);
      mockTurmaRepository.deletarLogico.mockResolvedValue(undefined);

      await service.deletar('turma-123', professorDonoId);

      expect(mockTurmaRepository.buscarPorId).toHaveBeenCalledWith('turma-123');
      expect(mockTurmaRepository.deletarLogico).toHaveBeenCalledWith('turma-123');
      expect(mockTurmaRepository.deletarLogico).toHaveBeenCalledTimes(1);
    });

    it('NÃO deve chamar a deleção lógica se a validação do dono falhar', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as any);

      await expect(service.deletar('turma-123', professorInvasorId))
        .rejects
        .toThrow(ErroAplicacao);

      expect(mockTurmaRepository.deletarLogico).not.toHaveBeenCalled();
    });
  });
});