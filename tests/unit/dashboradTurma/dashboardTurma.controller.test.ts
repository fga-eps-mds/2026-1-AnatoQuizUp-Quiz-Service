import type { Request, Response } from 'express';
import { TurmaDashboardController } from '../../../src/modules/dashboardTurma/dashboardTurma.controller';
import { TurmaDashboardService } from '../../../src/modules/dashboardTurma/dashboardTurma.service';
import type { TurmaDashboardRepository } from '../../../src/modules/dashboardTurma/dashboardTurma.repository';

jest.mock('../../../src/modules/dashboardTurma/dashboardTurma.service');

describe('TurmaDashboardController', () => {
  let controller: TurmaDashboardController;
  let serviceMock: jest.Mocked<TurmaDashboardService>;

  beforeEach(() => {
    const repoMock = {} as TurmaDashboardRepository;
    serviceMock = new TurmaDashboardService(repoMock) as jest.Mocked<TurmaDashboardService>;
    controller = new TurmaDashboardController(serviceMock);
  });

  const createMockResponse = (): Response => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  it('deve retornar 200 e os dados do dashboard com sucesso', async () => {
    const req = {
      params: { id: 'turma-123' },
      usuario: { id: 'prof-123' }
    } as unknown as Request;
    
    const res = createMockResponse();

    serviceMock.getMacroDashboard.mockResolvedValue({
      totalAlunos: 10,
      totalQuestoesRespondidas: 5,
      taxaMediaAcertos: 50,
      desempenhoPorTema: []
    });

    await controller.listarMacro(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      totalAlunos: 10,
      totalQuestoesRespondidas: 5,
      taxaMediaAcertos: 50,
      desempenhoPorTema: []
    });
  });

  it('deve retornar 401 se o professor não estiver autenticado', async () => {
    const req = {
      params: { id: 'turma-123' }
    } as unknown as Request;
    
    const res = createMockResponse();

    await controller.listarMacro(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Usuário não autenticado ou sessão expirada.' });
  });

  it('deve retornar 500 se o service lançar um erro', async () => {
    const req = {
      params: { id: 'turma-123' },
      usuario: { id: 'prof-123' }
    } as unknown as Request;
    
    const res = createMockResponse();

    serviceMock.getMacroDashboard.mockRejectedValue(new Error('Erro interno'));
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await controller.listarMacro(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao buscar dados do dashboard da turma.' });

    consoleSpy.mockRestore();
  });
});