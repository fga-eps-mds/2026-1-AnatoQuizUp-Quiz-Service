import type { Request, Response } from 'express';

import { TurmaController } from '@/modules/turma/turma.controller';
import type { TurmaService } from '@/modules/turma/turma.service';

const mockTurmaService = {
  criar: jest.fn(),
  listar: jest.fn(),
  obterPorId: jest.fn(),
  atualizar: jest.fn(),
  deletar: jest.fn(),
  listarAlunos: jest.fn(),
  vincularAluno: jest.fn(),
  desvincularAluno: jest.fn(),
} as unknown as jest.Mocked<TurmaService>;

describe('TurmaController', () => {
  let controller: TurmaController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    controller = new TurmaController(mockTurmaService);
    jest.clearAllMocks();

    mockReq = {
      usuario: { id: 'prof-123' },
      body: {},
      params: {},
      query: {},
    } as unknown as Request;

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;
  });

  describe('criar', () => {
    it('deve retornar 201 e a turma criada', async () => {
      const payload = {
        codigo: 'ANAT-01',
        nome: 'Turma A',
        semestre: '2026.1',
        ano: 2026,
        descricao: 'Turma de Anatomia',
      };
      const turma = { id: 'turma-1', ...payload };
      mockReq.body = payload;
      mockTurmaService.criar.mockResolvedValue(turma as never);

      await controller.criar(mockReq as Request, mockRes as Response);

      expect(mockTurmaService.criar).toHaveBeenCalledWith(payload, 'prof-123');
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        mensagem: 'Turma criada com sucesso.',
        dados: turma,
      });
    });
  });

  describe('listar', () => {
    it('deve retornar 200 e repassar filtros de listagem', async () => {
      const turmas = [{ id: 'turma-1', nome: 'Anatomia' }];
      mockTurmaService.listar.mockResolvedValue(turmas as never);
      mockReq.query = {
        status: 'ATIVA',
        busca: 'Anat',
        semestre: '2026.1',
        ano: 2026,
      } as unknown as Request['query'];

      await controller.listar(mockReq as Request, mockRes as Response);

      expect(mockTurmaService.listar).toHaveBeenCalledWith({
        professorId: 'prof-123',
        status: 'ATIVA',
        busca: 'Anat',
        semestre: '2026.1',
        ano: 2026,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        mensagem: 'Turmas listadas com sucesso.',
        dados: turmas,
      });
    });
  });

  describe('buscarPorId', () => {
    it('deve retornar 200 e a turma pesquisada', async () => {
      const turma = { id: 'turma-123', nome: 'Anatomia' };
      mockTurmaService.obterPorId.mockResolvedValue(turma as never);
      mockReq.params = { id: 'turma-123' };

      await controller.buscarPorId(mockReq as Request, mockRes as Response);

      expect(mockTurmaService.obterPorId).toHaveBeenCalledWith('turma-123', 'prof-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        mensagem: 'Turma encontrada com sucesso.',
        dados: turma,
      });
    });
  });

  describe('atualizar', () => {
    it('deve retornar 200 e a turma atualizada', async () => {
      const body = { nome: 'Turma B' };
      const turma = { id: 'turma-123', nome: 'Turma B' };
      mockReq.params = { id: 'turma-123' };
      mockReq.body = body;
      mockTurmaService.atualizar.mockResolvedValue(turma as never);

      await controller.atualizar(mockReq as Request, mockRes as Response);

      expect(mockTurmaService.atualizar).toHaveBeenCalledWith('turma-123', 'prof-123', body);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        mensagem: 'Turma atualizada com sucesso.',
        dados: turma,
      });
    });
  });

  describe('deletar', () => {
    it('deve retornar 204 apos a delecao logica', async () => {
      mockTurmaService.deletar.mockResolvedValue(undefined);
      mockReq.params = { id: 'turma-123' };

      await controller.deletar(mockReq as Request, mockRes as Response);

      expect(mockTurmaService.deletar).toHaveBeenCalledWith('turma-123', 'prof-123');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('alunos da turma', () => {
    it('deve listar alunos vinculados', async () => {
      const vinculos = [{ id: 'vinculo-1', turmaId: 'turma-123', alunoId: 'aluno-1' }];
      mockReq.params = { id: 'turma-123' };
      mockTurmaService.listarAlunos.mockResolvedValue(vinculos as never);

      await controller.listarAlunos(mockReq as Request, mockRes as Response);

      expect(mockTurmaService.listarAlunos).toHaveBeenCalledWith('turma-123', 'prof-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        mensagem: 'Alunos vinculados listados com sucesso.',
        dados: vinculos,
      });
    });

    it('deve vincular aluno e retornar 201', async () => {
      const vinculo = { id: 'vinculo-1', turmaId: 'turma-123', alunoId: 'aluno-1' };
      mockReq.params = { id: 'turma-123' };
      mockReq.body = { alunoId: 'aluno-1' };
      mockTurmaService.vincularAluno.mockResolvedValue(vinculo as never);

      await controller.vincularAluno(mockReq as Request, mockRes as Response);

      expect(mockTurmaService.vincularAluno).toHaveBeenCalledWith('turma-123', 'prof-123', 'aluno-1');
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        mensagem: 'Aluno vinculado à turma com sucesso.',
        dados: vinculo,
      });
    });

    it('deve desvincular aluno e retornar 204', async () => {
      mockReq.params = { id: 'turma-123', alunoId: 'aluno-1' };
      mockTurmaService.desvincularAluno.mockResolvedValue(undefined);

      await controller.desvincularAluno(mockReq as Request, mockRes as Response);

      expect(mockTurmaService.desvincularAluno).toHaveBeenCalledWith('turma-123', 'prof-123', 'aluno-1');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalledTimes(1);
    });
  });
});
