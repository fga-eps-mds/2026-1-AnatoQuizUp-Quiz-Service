import { TurmaDashboardService } from '../../../src/modules/dashboardTurma/dashboardTurma.service';
import { TurmaDashboardRepository } from '../../../src/modules/dashboardTurma/dashboardTurma.repository';

jest.mock('../../../src/modules/dashboardTurma/dashboardTurma.repository');

describe('TurmaDashboardService', () => {
  let service: TurmaDashboardService;
  let repoMock: jest.Mocked<TurmaDashboardRepository>;

  beforeEach(() => {
    repoMock = new TurmaDashboardRepository() as jest.Mocked<TurmaDashboardRepository>;
    service = new TurmaDashboardService(repoMock);
  });

  it('deve retornar totais zerados quando a turma não tiver alunos', async () => {
    repoMock.findAlunosByTurmaId.mockResolvedValue([]);

    const result = await service.getMacroDashboard('turma-123', 'prof-123');

    expect(result).toEqual({
      totalAlunos: 0,
      totalQuestoesRespondidas: 0,
      taxaMediaAcertos: 0,
      desempenhoPorTema: []
    });
  });

  it('deve retornar totais de questoes zerados quando alunos nao tiverem resolucoes', async () => {
    repoMock.findAlunosByTurmaId.mockResolvedValue(['aluno-1', 'aluno-2']);
    repoMock.findResolucoesByAlunos.mockResolvedValue([]);

    const result = await service.getMacroDashboard('turma-123', 'prof-123');

    expect(result).toEqual({
      totalAlunos: 2,
      totalQuestoesRespondidas: 0,
      taxaMediaAcertos: 0,
      desempenhoPorTema: []
    });
  });

  it('deve calcular corretamente os totais e as taxas de acerto por tema e ordenar decrescente', async () => {
    repoMock.findAlunosByTurmaId.mockResolvedValue(['aluno-1', 'aluno-2']);
    
    const resolucoesMock = [
      { respostaMarcada: 'A', questao: { respostaCorreta: 'A', tema: { nome: 'Osso' } } },
      { respostaMarcada: 'B', questao: { respostaCorreta: 'A', tema: { nome: 'Osso' } } },
      { respostaMarcada: 'C', questao: { respostaCorreta: 'C', tema: { nome: 'Músculo' } } },
      { respostaMarcada: 'D', questao: { respostaCorreta: 'E', tema: { nome: 'Nervo' } } }
    ] as unknown as Awaited<ReturnType<TurmaDashboardRepository['findResolucoesByAlunos']>>;

    repoMock.findResolucoesByAlunos.mockResolvedValue(resolucoesMock);

    const result = await service.getMacroDashboard('turma-123', 'prof-123');

    expect(result.totalAlunos).toBe(2);
    expect(result.totalQuestoesRespondidas).toBe(4);
    expect(result.taxaMediaAcertos).toBe(50); 
    
    expect(result.desempenhoPorTema).toEqual([
      { nome: 'Músculo', totalRespondidas: 1, taxaAcerto: 100, status: 'Tranquilo' },
      { nome: 'Osso', totalRespondidas: 2, taxaAcerto: 50, status: 'Atenção' },
      { nome: 'Nervo', totalRespondidas: 1, taxaAcerto: 0, status: 'Crítico' }
    ]);
  });
});