import type { Request, Response, NextFunction } from 'express';
import { ResolucaoListaController } from '../../../src/modules/resolucaoLista/resolucaoLista.controller';
import type { ResolucaoListaService } from '../../../src/modules/resolucaoLista/resolucaoLista.service';
import { ErroAplicacao } from '@/shared/errors/erro-aplicacao';

jest.mock('../../../src/modules/resolucaoLista/resolucaoLista.service');

describe('ResolucaoListaController', () => {
  let controller: ResolucaoListaController;
  let service: jest.Mocked<ResolucaoListaService>;
  
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    service = {
      listarParaAluno: jest.fn(),
      buscarDetalhesDaLista: jest.fn(),
      registrarAutosave: jest.fn(),
      submeterLista: jest.fn(),
    } as unknown as jest.Mocked<ResolucaoListaService>;

    controller = new ResolucaoListaController(service);

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  const mockRequest = (overrides?: Record<string, unknown>) => {
    req = {
      usuario: { id: 'aluno-id-123', perfil: 'ALUNO' },
      query: {},
      params: {},
      body: {},
      ...overrides,
    } as unknown as Request;
  };

  describe('listar', () => {
    it('deve retornar 200 e as listas com sucesso', async () => {
      mockRequest({ query: { status: 'PENDENTE', busca: 'Tórax' } });
      const mockListas = [{ id: 'lista-1', nome: 'Lista 1' }];
      service.listarParaAluno.mockResolvedValue(mockListas as never);

      await controller.listar(req as Request, res as Response, next);

      expect(service.listarParaAluno).toHaveBeenCalledWith('aluno-id-123', 'PENDENTE', 'Tórax');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: "Listas recuperadas com sucesso.",
        dados: mockListas,
      });
    });

    it('deve chamar next com ErroAplicacao 401 se o usuario nao estiver autenticado', async () => {
      mockRequest({ usuario: undefined });

      await controller.listar(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ErroAplicacao));
      const erro = (next as jest.Mock).mock.calls[0][0] as ErroAplicacao;
      expect(erro.codigoStatus).toBe(401);
      expect(erro.message).toBe('Usuário não autenticado.');
    });

    it('deve chamar next com o erro lancado pelo servico', async () => {
      mockRequest();
      const erroServico = new Error('Erro no banco');
      service.listarParaAluno.mockRejectedValue(erroServico);

      await controller.listar(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(erroServico);
    });
  });

  describe('buscarPorId', () => {
    it('deve retornar 200 e os detalhes da lista com sucesso', async () => {
      mockRequest({ params: { id: 'lista-abc' } });
      const mockDetalhes = { id: 'lista-abc', nome: 'Lista ABC' };
      service.buscarDetalhesDaLista.mockResolvedValue(mockDetalhes as never);

      await controller.buscarPorId(req as Request, res as Response, next);

      expect(service.buscarDetalhesDaLista).toHaveBeenCalledWith('aluno-id-123', 'lista-abc');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: "Detalhes da lista recuperados com sucesso.",
        dados: mockDetalhes,
      });
    });

    it('deve chamar next com ErroAplicacao 401 se o usuario nao estiver autenticado', async () => {
      mockRequest({ usuario: undefined });

      await controller.buscarPorId(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ErroAplicacao));
    });

    it('deve chamar next com o erro lancado pelo servico', async () => {
      mockRequest({ params: { id: 'lista-abc' } });
      const erroServico = new Error('Lista não encontrada');
      service.buscarDetalhesDaLista.mockRejectedValue(erroServico);

      await controller.buscarPorId(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(erroServico);
    });
  });

  describe('autosave', () => {
    it('deve retornar 200 ao salvar o progresso com sucesso', async () => {
      mockRequest({
        params: { id: 'lista-xyz' },
        body: { questaoId: 'questao-123', alternativaMarcada: 'A' },
      });
      service.registrarAutosave.mockResolvedValue(undefined);

      await controller.autosave(req as Request, res as Response, next);

      expect(service.registrarAutosave).toHaveBeenCalledWith('aluno-id-123', 'lista-xyz', 'questao-123', 'A');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: "Progresso salvo automaticamente.",
        dados: null,
      });
    });

    it('deve chamar next com ErroAplicacao 401 se o usuario nao estiver autenticado', async () => {
      mockRequest({ usuario: undefined });

      await controller.autosave(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ErroAplicacao));
    });

    it('deve chamar next com o erro lancado pelo servico', async () => {
      mockRequest({
        params: { id: 'lista-xyz' },
        body: { questaoId: 'questao-123', alternativaMarcada: 'A' },
      });
      const erroServico = new ErroAplicacao({ codigoStatus: 403, codigo: 'PROIBIDO', mensagem: 'Prazo expirado' });
      service.registrarAutosave.mockRejectedValue(erroServico);

      await controller.autosave(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(erroServico);
    });
  });

  describe('submeter', () => {
    it('deve retornar 200 ao submeter a lista com sucesso', async () => {
      mockRequest({
        params: { id: 'lista-xyz' },
      });
      service.submeterLista.mockResolvedValue(undefined);

      await controller.submeter(req as Request, res as Response, next);

      expect(service.submeterLista).toHaveBeenCalledWith('aluno-id-123', 'lista-xyz');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: "Lista submetida com sucesso!",
        dados: null,
      });
    });

    it('deve chamar next com ErroAplicacao 401 se o usuario nao estiver autenticado', async () => {
      mockRequest({ usuario: undefined });

      await controller.submeter(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ErroAplicacao));
    });

    it('deve chamar next com o erro lancado pelo servico', async () => {
      mockRequest({
        params: { id: 'lista-xyz' },
      });
      const erroServico = new ErroAplicacao({ codigoStatus: 409, codigo: 'CONFLITO', mensagem: 'Esta lista já foi submetida.' });
      service.submeterLista.mockRejectedValue(erroServico);

      await controller.submeter(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(erroServico);
    });
  });
});