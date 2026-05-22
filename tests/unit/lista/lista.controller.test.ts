import type { Request, Response, NextFunction } from 'express';
import { ListaQuestaoController } from '../../../src/modules/lista/lista.controller';
import type { ListaQuestaoService } from '../../../src/modules/lista/lista.service';

describe('ListaQuestaoController', () => {
  let controller: ListaQuestaoController;
  let mockService: jest.Mocked<ListaQuestaoService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockService = {
      buscarLista: jest.fn(),
      listarMinhasListas: jest.fn(),
      deletarLista: jest.fn(),
      gerarEstatisticasTurma: jest.fn(),
      listarListasDaTurma: jest.fn(),
    } as unknown as jest.Mocked<ListaQuestaoService>;

    controller = new ListaQuestaoController(mockService);

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('buscar', () => {
    it('deve retornar 200 e a lista com sucesso', async () => {
      mockReq = { params: { id: '1' } };
      mockService.buscarLista.mockResolvedValue({ id: '1' } as never);

      await controller.buscar(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        mensagem: 'Lista recuperada com sucesso.',
        dados: { id: '1' }
      });
    });

    it('deve chamar next em caso de erro', async () => {
      mockReq = { params: { id: '1' } };
      const erro = new Error('Erro');
      mockService.buscarLista.mockRejectedValue(erro);

      await controller.buscar(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(erro);
    });
  });

  describe('listarDoUsuario', () => {
    it('deve retornar 200 e as listas do professor', async () => {
      // ADICIONAMOS O OBJETO query AQUI:
      mockReq = { 
        usuario: { id: 'prof-1' },
        query: { busca: 'Anatomia', status: 'PUBLICADA' }
      } as unknown as Partial<Request>;
      
      mockService.listarMinhasListas.mockResolvedValue([{ id: '1', nome: 'Lista 1' }] as never);

      await controller.listarDoUsuario(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.listarMinhasListas).toHaveBeenCalledWith('prof-1', { busca: 'Anatomia', status: 'PUBLICADA' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        mensagem: 'Listas recuperadas com sucesso.',
        dados: [{ id: '1', nome: 'Lista 1' }]
      });
    });

    it('deve chamar next em caso de erro', async () => {
      // ADICIONAMOS O OBJETO query VAZIO AQUI:
      mockReq = { 
        usuario: { id: 'prof-1' },
        query: {} 
      } as unknown as Partial<Request>;
      
      const erro = new Error('Erro');
      mockService.listarMinhasListas.mockRejectedValue(erro);

      await controller.listarDoUsuario(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(erro);
    });
  });

  describe('listarPorTurma', () => {
    it('deve retornar 200 e as listas da turma com sucesso', async () => {
      mockReq = { params: { turmaId: 'turma-1' } } as unknown as Partial<Request>;
      const mockListas = [{ id: '1', nome: 'Lista 1' }];
      mockService.listarListasDaTurma.mockResolvedValue(mockListas as never);

      await controller.listarPorTurma(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        mensagem: 'Listas da turma recuperadas com sucesso.',
        dados: mockListas
      });
    });

    it('deve chamar next em caso de erro', async () => {
      mockReq = { params: { turmaId: 'turma-1' } } as unknown as Partial<Request>;
      const erro = new Error('Erro inesperado');
      mockService.listarListasDaTurma.mockRejectedValue(erro);

      await controller.listarPorTurma(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(erro);
    });
  });

  describe('deletar', () => {
    it('deve retornar 200 ao deletar com sucesso', async () => {
      mockReq = { params: { id: '1' }, usuario: { id: 'prof-1' } } as unknown as Partial<Request>;
      mockService.deletarLista.mockResolvedValue(undefined);

      await controller.deletar(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        mensagem: 'Lista deletada com sucesso.',
        dados: null
      });
    });

    it('deve chamar next em caso de erro', async () => {
      mockReq = { params: { id: '1' }, usuario: { id: 'prof-1' } } as unknown as Partial<Request>;
      const erro = new Error('Erro');
      mockService.deletarLista.mockRejectedValue(erro);

      await controller.deletar(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(erro);
    });
  });

  describe('estatisticas', () => {
    it('deve retornar 200 e os dados de estatística', async () => {
      mockReq = { params: { id: '1', turmaId: 't1' } };
      const mockEstatistica = { totalAlunos: 10 };
      mockService.gerarEstatisticasTurma.mockResolvedValue(mockEstatistica as never);

      await controller.estatisticas(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        mensagem: 'Estatísticas geradas com sucesso.',
        dados: mockEstatistica
      });
    });

    it('deve chamar next em caso de erro', async () => {
      mockReq = { params: { id: '1', turmaId: 't1' } };
      const erro = new Error('Erro');
      mockService.gerarEstatisticasTurma.mockRejectedValue(erro);

      await controller.estatisticas(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(erro);
    });
  });
});