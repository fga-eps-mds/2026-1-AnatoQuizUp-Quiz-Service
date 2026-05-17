import { StatusTurma } from '@prisma/client';

import type { TurmaRepository } from '@/modules/turma/turma.repository';
import { TurmaService } from '@/modules/turma/turma.service';
import { ErroAplicacao } from '@/shared/errors/erro-aplicacao';

const mockTurmaRepository = {
  listarComFiltros: jest.fn(),
  buscarPorId: jest.fn(),
  buscarPorCodigo: jest.fn(),
  criar: jest.fn(),
  atualizar: jest.fn(),
  deletarLogico: jest.fn(),
  listarAlunos: jest.fn(),
  buscarVinculoAluno: jest.fn(),
  criarVinculoAluno: jest.fn(),
  reativarVinculoAluno: jest.fn(),
  desvincularAluno: jest.fn(),
} as unknown as jest.Mocked<TurmaRepository>;

describe('TurmaService', () => {
  let service: TurmaService;

  const professorDonoId = 'prof-123';
  const professorInvasorId = 'prof-999';
  const data = new Date('2026-01-01T00:00:00.000Z');

  const mockTurma = {
    id: 'turma-123',
    codigo: 'ANAT-01',
    nome: 'Anatomia Sistemica',
    semestre: '2026.1',
    ano: 2026,
    descricao: 'Turma de teste',
    status: StatusTurma.ATIVA,
    professorId: professorDonoId,
    criadoEm: data,
    atualizadoEm: data,
    excluidoEm: null,
    _count: { alunos: 5 },
  };

  const mockVinculo = {
    id: 'vinculo-123',
    turmaId: mockTurma.id,
    alunoId: 'aluno-123',
    criadoEm: data,
    atualizadoEm: data,
    excluidoEm: null,
  };

  beforeEach(() => {
    service = new TurmaService(mockTurmaRepository);
    jest.clearAllMocks();
  });

  describe('listar', () => {
    it('deve chamar o repository com os filtros corretos', async () => {
      mockTurmaRepository.listarComFiltros.mockResolvedValue([mockTurma] as never);

      const filtros = {
        professorId: professorDonoId,
        status: StatusTurma.ATIVA,
        semestre: '2026.1',
        ano: 2026,
      };
      const resultado = await service.listar(filtros);

      expect(resultado).toEqual([mockTurma]);
      expect(mockTurmaRepository.listarComFiltros).toHaveBeenCalledWith(filtros);
    });
  });

  describe('criar', () => {
    it('deve criar a turma usando o professor autenticado como dono', async () => {
      mockTurmaRepository.buscarPorCodigo.mockResolvedValue(null);
      mockTurmaRepository.criar.mockResolvedValue(mockTurma as never);

      const payload = {
        codigo: 'ANAT-01',
        nome: 'Anatomia Sistemica',
        semestre: '2026.1',
        ano: 2026,
        descricao: 'Turma de teste',
      };

      const resultado = await service.criar(payload, professorDonoId);

      expect(resultado).toEqual(mockTurma);
      expect(mockTurmaRepository.criar).toHaveBeenCalledWith({
        ...payload,
        professorId: professorDonoId,
      });
    });

    it('deve lancar conflito quando o codigo ja existir', async () => {
      mockTurmaRepository.buscarPorCodigo.mockResolvedValue(mockTurma as never);

      await expect(service.criar({
        codigo: 'ANAT-01',
        nome: 'Anatomia Sistemica',
        semestre: '2026.1',
        ano: 2026,
        descricao: 'Turma de teste',
      }, professorDonoId)).rejects.toMatchObject({
        codigo: 'CONFLITO',
        codigoStatus: 409,
      });

      expect(mockTurmaRepository.criar).not.toHaveBeenCalled();
    });
  });

  describe('obterPorId', () => {
    it('deve retornar a turma quando ela existir e pertencer ao professor', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);

      const resultado = await service.obterPorId('turma-123', professorDonoId);

      expect(resultado).toEqual(mockTurma);
      expect(mockTurmaRepository.buscarPorId).toHaveBeenCalledWith('turma-123');
    });

    it('deve lancar 404 quando a turma nao for encontrada', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.obterPorId('id-inexistente', professorDonoId)).rejects.toMatchObject({
        codigo: 'NAO_ENCONTRADO',
        codigoStatus: 404,
      });
    });

    it('deve lancar 403 quando o professor tentar acessar turma de outro professor', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);

      await expect(service.obterPorId('turma-123', professorInvasorId)).rejects.toMatchObject({
        codigo: 'PROIBIDO',
        codigoStatus: 403,
      });
    });
  });

  describe('atualizar', () => {
    it('deve atualizar apenas turma propria', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.atualizar.mockResolvedValue({ ...mockTurma, nome: 'Turma B' } as never);

      const resultado = await service.atualizar(mockTurma.id, professorDonoId, { nome: 'Turma B' });

      expect(resultado.nome).toBe('Turma B');
      expect(mockTurmaRepository.atualizar).toHaveBeenCalledWith(mockTurma.id, { nome: 'Turma B' });
      expect(mockTurmaRepository.buscarPorCodigo).not.toHaveBeenCalled();
    });

    it('deve validar duplicidade quando o codigo for alterado', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.buscarPorCodigo.mockResolvedValue({ ...mockTurma, id: 'outra-turma' } as never);

      await expect(service.atualizar(mockTurma.id, professorDonoId, { codigo: 'ANAT-02' }))
        .rejects
        .toMatchObject({
          codigo: 'CONFLITO',
          codigoStatus: 409,
        });

      expect(mockTurmaRepository.atualizar).not.toHaveBeenCalled();
    });

    it('nao deve atualizar se a turma pertencer a outro professor', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);

      await expect(service.atualizar(mockTurma.id, professorInvasorId, { nome: 'Turma B' }))
        .rejects
        .toThrow(ErroAplicacao);

      expect(mockTurmaRepository.atualizar).not.toHaveBeenCalled();
    });
  });

  describe('deletar', () => {
    it('deve deletar logicamente apenas turma propria', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.deletarLogico.mockResolvedValue(undefined);

      await service.deletar(mockTurma.id, professorDonoId);

      expect(mockTurmaRepository.deletarLogico).toHaveBeenCalledWith(mockTurma.id);
    });

    it('nao deve deletar se a turma pertencer a outro professor', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);

      await expect(service.deletar(mockTurma.id, professorInvasorId)).rejects.toThrow(ErroAplicacao);

      expect(mockTurmaRepository.deletarLogico).not.toHaveBeenCalled();
    });
  });

  describe('alunos da turma', () => {
    it('deve listar alunos vinculados apenas apos validar posse da turma', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.listarAlunos.mockResolvedValue([mockVinculo] as never);

      const resultado = await service.listarAlunos(mockTurma.id, professorDonoId);

      expect(resultado).toEqual([mockVinculo]);
      expect(mockTurmaRepository.listarAlunos).toHaveBeenCalledWith(mockTurma.id);
    });

    it('nao deve listar alunos de turma de outro professor', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);

      await expect(service.listarAlunos(mockTurma.id, professorInvasorId)).rejects.toThrow(ErroAplicacao);

      expect(mockTurmaRepository.listarAlunos).not.toHaveBeenCalled();
    });

    it('deve criar novo vinculo quando o aluno ainda nao estiver vinculado', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.buscarVinculoAluno.mockResolvedValue(null);
      mockTurmaRepository.criarVinculoAluno.mockResolvedValue(mockVinculo as never);

      const resultado = await service.vincularAluno(mockTurma.id, professorDonoId, mockVinculo.alunoId);

      expect(resultado).toEqual(mockVinculo);
      expect(mockTurmaRepository.criarVinculoAluno).toHaveBeenCalledWith(mockTurma.id, mockVinculo.alunoId);
    });

    it('deve reativar vinculo removido logicamente', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.buscarVinculoAluno.mockResolvedValue({
        ...mockVinculo,
        excluidoEm: new Date('2026-02-01T00:00:00.000Z'),
      } as never);
      mockTurmaRepository.reativarVinculoAluno.mockResolvedValue(mockVinculo as never);

      const resultado = await service.vincularAluno(mockTurma.id, professorDonoId, mockVinculo.alunoId);

      expect(resultado).toEqual(mockVinculo);
      expect(mockTurmaRepository.reativarVinculoAluno).toHaveBeenCalledWith(mockVinculo.id);
    });

    it('deve rejeitar vinculo ativo duplicado', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.buscarVinculoAluno.mockResolvedValue(mockVinculo as never);

      await expect(service.vincularAluno(mockTurma.id, professorDonoId, mockVinculo.alunoId))
        .rejects
        .toMatchObject({
          codigo: 'CONFLITO',
          codigoStatus: 409,
        });
    });

    it('deve desvincular aluno com delete logico', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.buscarVinculoAluno.mockResolvedValue(mockVinculo as never);
      mockTurmaRepository.desvincularAluno.mockResolvedValue(undefined);

      await service.desvincularAluno(mockTurma.id, professorDonoId, mockVinculo.alunoId);

      expect(mockTurmaRepository.desvincularAluno).toHaveBeenCalledWith(mockVinculo.id);
    });

    it('deve retornar 404 ao desvincular aluno sem vinculo ativo', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.buscarVinculoAluno.mockResolvedValue(null);

      await expect(service.desvincularAluno(mockTurma.id, professorDonoId, mockVinculo.alunoId))
        .rejects
        .toMatchObject({
          codigo: 'NAO_ENCONTRADO',
          codigoStatus: 404,
        });
    });
  });
});
