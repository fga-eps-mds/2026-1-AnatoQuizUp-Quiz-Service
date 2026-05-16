import { Request, Response } from 'express';
import { TurmaController } from '@/modules/turma/turma.controller';
import { TurmaService } from '@/modules/turma/turma.service';

// Mock tipado do TurmaService
const mockTurmaService = {
  listar: jest.fn(),
  obterPorId: jest.fn(),
  deletar: jest.fn(),
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
      params: {},
      query: {},
    } as any;

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    } as any;
  });

  describe('listar', () => {
    it('deve retornar 200 e a lista de turmas na propriedade dados', async () => {
      const mockTurmas = [{ id: 'turma-1', nome: 'Anatomia' }];
      mockTurmaService.listar.mockResolvedValue(mockTurmas as any);

      mockReq.query = { status: 'ATIVA', busca: 'Anat' };

      await controller.listar(mockReq as Request, mockRes as Response);

      expect(mockTurmaService.listar).toHaveBeenCalledWith({
        professorId: 'prof-123',
        status: 'ATIVA',
        busca: 'Anat',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        mensagem: 'Turmas listadas com sucesso.',
        dados: mockTurmas,
      });
    });
  });

  describe('buscarPorId', () => {
    it('deve retornar 200 e a turma pesquisada', async () => {
      const mockTurma = { id: 'turma-123', nome: 'Anatomia' };
      mockTurmaService.obterPorId.mockResolvedValue(mockTurma as any);

      mockReq.params = { id: 'turma-123' };

      await controller.buscarPorId(mockReq as Request, mockRes as Response);

      expect(mockTurmaService.obterPorId).toHaveBeenCalledWith('turma-123', 'prof-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        mensagem: 'Turma encontrada com sucesso.',
        dados: mockTurma,
      });
    });
  });

  describe('deletar', () => {
    it('deve retornar 204 (No Content) após a deleção lógica no service', async () => {
      mockTurmaService.deletar.mockResolvedValue(undefined);

      mockReq.params = { id: 'turma-123' };

      await controller.deletar(mockReq as Request, mockRes as Response);

      expect(mockTurmaService.deletar).toHaveBeenCalledWith('turma-123', 'prof-123');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalledTimes(1);
    });
  });
});