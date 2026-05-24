import { StatusTurma } from '@prisma/client';

import type { TurmaRepository } from '@/modules/turma/turma.repository';
import { TurmaService } from '@/modules/turma/turma.service';
import { PAPEIS } from '@/shared/constants/papeis';
import { ErroAplicacao } from '@/shared/errors/erro-aplicacao';

const mockTurmaRepository = {
  listarComFiltros: jest.fn(),
  listarPorAluno: jest.fn(),
  buscarPorId: jest.fn(),
  buscarPorCodigo: jest.fn(),
  buscarVinculoAtivoAluno: jest.fn(),
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
  const alunoId = 'aluno-123';
  const adminId = 'admin-1';
  const data = new Date('2026-01-01T00:00:00.000Z');

  const ctxProfessorDono = { id: professorDonoId, papel: PAPEIS.PROFESSOR };
  const ctxProfessorInvasor = { id: professorInvasorId, papel: PAPEIS.PROFESSOR };
  const ctxAluno = { id: alunoId, papel: PAPEIS.ALUNO };
  const ctxAdmin = { id: adminId, papel: PAPEIS.ADMINISTRADOR };

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

  const mockTurmaInativa = {
    ...mockTurma,
    status: StatusTurma.INATIVA,
  };

  const mockVinculo = {
    id: 'vinculo-123',
    turmaId: mockTurma.id,
    alunoId,
    criadoEm: data,
    atualizadoEm: data,
    excluidoEm: null,
  };

  beforeEach(() => {
    service = new TurmaService(mockTurmaRepository);
    jest.clearAllMocks();
  });

  describe('listar', () => {
    it('para PROFESSOR injeta professorId do contexto e chama listarComFiltros', async () => {
      mockTurmaRepository.listarComFiltros.mockResolvedValue([mockTurma] as never);

      const resultado = await service.listar(ctxProfessorDono, {
        status: StatusTurma.ATIVA,
        semestre: '2026.1',
        ano: 2026,
      });

      expect(resultado).toEqual([mockTurma]);
      expect(mockTurmaRepository.listarComFiltros).toHaveBeenCalledWith({
        professorId: professorDonoId,
        status: StatusTurma.ATIVA,
        semestre: '2026.1',
        ano: 2026,
      });
      expect(mockTurmaRepository.listarPorAluno).not.toHaveBeenCalled();
    });

    it('para ALUNO chama listarPorAluno com busca, semestre e ano', async () => {
      mockTurmaRepository.listarPorAluno.mockResolvedValue([mockTurma] as never);

      const resultado = await service.listar(ctxAluno, {
        busca: 'anat',
        semestre: '2026.1',
        ano: 2026,
      });

      expect(resultado).toEqual([mockTurma]);
      expect(mockTurmaRepository.listarPorAluno).toHaveBeenCalledWith(alunoId, {
        busca: 'anat',
        semestre: '2026.1',
        ano: 2026,
      });
      expect(mockTurmaRepository.listarComFiltros).not.toHaveBeenCalled();
    });

    it('para ALUNO rejeita filtro de status com 400', async () => {
      await expect(
        service.listar(ctxAluno, { status: StatusTurma.INATIVA }),
      ).rejects.toMatchObject({
        codigoStatus: 400,
        codigo: 'REQUISICAO_INVALIDA',
      });

      expect(mockTurmaRepository.listarPorAluno).not.toHaveBeenCalled();
      expect(mockTurmaRepository.listarComFiltros).not.toHaveBeenCalled();
    });

    it('para ADMINISTRADOR chama listarComFiltros sem injetar professorId', async () => {
      mockTurmaRepository.listarComFiltros.mockResolvedValue([mockTurma] as never);

      await service.listar(ctxAdmin, { status: StatusTurma.INATIVA });

      expect(mockTurmaRepository.listarComFiltros).toHaveBeenCalledWith({
        status: StatusTurma.INATIVA,
      });
      expect(mockTurmaRepository.listarPorAluno).not.toHaveBeenCalled();
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
    it('PROFESSOR dono recebe a turma', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);

      const resultado = await service.obterPorId('turma-123', ctxProfessorDono);

      expect(resultado).toEqual(mockTurma);
      expect(mockTurmaRepository.buscarPorId).toHaveBeenCalledWith('turma-123');
    });

    it('lanca 404 quando a turma nao for encontrada', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.obterPorId('id-inexistente', ctxProfessorDono)).rejects.toMatchObject({
        codigo: 'NAO_ENCONTRADO',
        codigoStatus: 404,
      });
    });

    it('PROFESSOR de outra turma recebe 403', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);

      await expect(service.obterPorId('turma-123', ctxProfessorInvasor)).rejects.toMatchObject({
        codigo: 'PROIBIDO',
        codigoStatus: 403,
      });
    });

    it('ADMINISTRADOR acessa qualquer turma sem validacao adicional', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);

      const resultado = await service.obterPorId('turma-123', ctxAdmin);

      expect(resultado).toEqual(mockTurma);
      expect(mockTurmaRepository.buscarVinculoAtivoAluno).not.toHaveBeenCalled();
    });

    it('ALUNO vinculado a turma ATIVA recebe a turma', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.buscarVinculoAtivoAluno.mockResolvedValue(mockVinculo as never);

      const resultado = await service.obterPorId(mockTurma.id, ctxAluno);

      expect(resultado).toEqual(mockTurma);
      expect(mockTurmaRepository.buscarVinculoAtivoAluno).toHaveBeenCalledWith(
        mockTurma.id,
        alunoId,
      );
    });

    it('ALUNO sem vinculo recebe 404 (sem vazar existencia da turma)', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.buscarVinculoAtivoAluno.mockResolvedValue(null);

      await expect(service.obterPorId(mockTurma.id, ctxAluno)).rejects.toMatchObject({
        codigo: 'NAO_ENCONTRADO',
        codigoStatus: 404,
      });
    });

    it('ALUNO em turma INATIVA recebe 404 mesmo com vinculo ativo', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurmaInativa as never);
      mockTurmaRepository.buscarVinculoAtivoAluno.mockResolvedValue(mockVinculo as never);

      await expect(service.obterPorId(mockTurmaInativa.id, ctxAluno)).rejects.toMatchObject({
        codigo: 'NAO_ENCONTRADO',
        codigoStatus: 404,
      });
    });
  });

  describe('atualizar', () => {
    it('professor dono atualiza turma', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.atualizar.mockResolvedValue({ ...mockTurma, nome: 'Turma B' } as never);

      const resultado = await service.atualizar(mockTurma.id, ctxProfessorDono, { nome: 'Turma B' });

      expect(resultado.nome).toBe('Turma B');
      expect(mockTurmaRepository.atualizar).toHaveBeenCalledWith(mockTurma.id, { nome: 'Turma B' });
      expect(mockTurmaRepository.buscarPorCodigo).not.toHaveBeenCalled();
    });

    it('valida duplicidade quando o codigo for alterado', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.buscarPorCodigo.mockResolvedValue({ ...mockTurma, id: 'outra-turma' } as never);

      await expect(service.atualizar(mockTurma.id, ctxProfessorDono, { codigo: 'ANAT-02' }))
        .rejects
        .toMatchObject({
          codigo: 'CONFLITO',
          codigoStatus: 409,
        });

      expect(mockTurmaRepository.atualizar).not.toHaveBeenCalled();
    });

    it('professor de outra turma nao consegue atualizar', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);

      await expect(service.atualizar(mockTurma.id, ctxProfessorInvasor, { nome: 'Turma B' }))
        .rejects
        .toThrow(ErroAplicacao);

      expect(mockTurmaRepository.atualizar).not.toHaveBeenCalled();
    });
  });

  describe('deletar', () => {
    it('professor dono deleta logicamente', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.deletarLogico.mockResolvedValue(undefined);

      await service.deletar(mockTurma.id, ctxProfessorDono);

      expect(mockTurmaRepository.deletarLogico).toHaveBeenCalledWith(mockTurma.id);
    });

    it('professor invasor nao consegue deletar', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);

      await expect(service.deletar(mockTurma.id, ctxProfessorInvasor)).rejects.toThrow(ErroAplicacao);

      expect(mockTurmaRepository.deletarLogico).not.toHaveBeenCalled();
    });
  });

  describe('alunos da turma', () => {
    it('professor dono lista alunos vinculados', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.listarAlunos.mockResolvedValue([mockVinculo] as never);

      const resultado = await service.listarAlunos(mockTurma.id, ctxProfessorDono);

      expect(resultado).toEqual([mockVinculo]);
      expect(mockTurmaRepository.listarAlunos).toHaveBeenCalledWith(mockTurma.id);
    });

    it('professor invasor nao lista alunos', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);

      await expect(service.listarAlunos(mockTurma.id, ctxProfessorInvasor)).rejects.toThrow(ErroAplicacao);

      expect(mockTurmaRepository.listarAlunos).not.toHaveBeenCalled();
    });

    it('cria novo vinculo quando o aluno ainda nao estiver vinculado', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.buscarVinculoAluno.mockResolvedValue(null);
      mockTurmaRepository.criarVinculoAluno.mockResolvedValue(mockVinculo as never);

      const resultado = await service.vincularAluno(mockTurma.id, ctxProfessorDono, mockVinculo.alunoId);

      expect(resultado).toEqual(mockVinculo);
      expect(mockTurmaRepository.criarVinculoAluno).toHaveBeenCalledWith(mockTurma.id, mockVinculo.alunoId);
    });

    it('reativa vinculo removido logicamente', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.buscarVinculoAluno.mockResolvedValue({
        ...mockVinculo,
        excluidoEm: new Date('2026-02-01T00:00:00.000Z'),
      } as never);
      mockTurmaRepository.reativarVinculoAluno.mockResolvedValue(mockVinculo as never);

      const resultado = await service.vincularAluno(mockTurma.id, ctxProfessorDono, mockVinculo.alunoId);

      expect(resultado).toEqual(mockVinculo);
      expect(mockTurmaRepository.reativarVinculoAluno).toHaveBeenCalledWith(mockVinculo.id);
    });

    it('rejeita vinculo ativo duplicado', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.buscarVinculoAluno.mockResolvedValue(mockVinculo as never);

      await expect(service.vincularAluno(mockTurma.id, ctxProfessorDono, mockVinculo.alunoId))
        .rejects
        .toMatchObject({
          codigo: 'CONFLITO',
          codigoStatus: 409,
        });
    });

    it('desvincula aluno com delete logico', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.buscarVinculoAluno.mockResolvedValue(mockVinculo as never);
      mockTurmaRepository.desvincularAluno.mockResolvedValue(undefined);

      await service.desvincularAluno(mockTurma.id, ctxProfessorDono, mockVinculo.alunoId);

      expect(mockTurmaRepository.desvincularAluno).toHaveBeenCalledWith(mockVinculo.id);
    });

    it('retorna 404 ao desvincular aluno sem vinculo ativo', async () => {
      mockTurmaRepository.buscarPorId.mockResolvedValue(mockTurma as never);
      mockTurmaRepository.buscarVinculoAluno.mockResolvedValue(null);

      await expect(service.desvincularAluno(mockTurma.id, ctxProfessorDono, mockVinculo.alunoId))
        .rejects
        .toMatchObject({
          codigo: 'NAO_ENCONTRADO',
          codigoStatus: 404,
        });
    });
  });
});
