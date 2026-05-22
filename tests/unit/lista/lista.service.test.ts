import { ListaQuestaoService } from '../../../src/modules/lista/lista.service';
import type { ListaQuestaoRepository } from '../../../src/modules/lista/lista.repository';
import { ErroAplicacao } from '@/shared/errors/erro-aplicacao';

describe('ListaQuestaoService', () => {
  let service: ListaQuestaoService;
  let mockRepository: jest.Mocked<ListaQuestaoRepository>;

  beforeEach(() => {
    mockRepository = {
      buscarPorId: jest.fn(),
      listarDoProfessor: jest.fn(),
      deletar: jest.fn(),
      buscarEstatisticasTurma: jest.fn(),
      listarPorTurma: jest.fn(),
    } as unknown as jest.Mocked<ListaQuestaoRepository>;

    service = new ListaQuestaoService(mockRepository);
  });

  describe('buscarLista', () => {
    it('deve retornar a lista quando encontrada', async () => {
      const mockLista = { id: '1' };
      mockRepository.buscarPorId.mockResolvedValue(mockLista as never);

      const resultado = await service.buscarLista('1');
      expect(resultado).toEqual(mockLista);
    });

    it('deve lançar ErroAplicacao se a lista não for encontrada', async () => {
      mockRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.buscarLista('1')).rejects.toThrow(ErroAplicacao);
      await expect(service.buscarLista('1')).rejects.toMatchObject({
        codigo: 'NAO_ENCONTRADO'
      });
    });
  });

  describe('listarMinhasListas', () => {
    it('deve retornar as listas do professor formatadas corretamente', async () => {
      const mockData = new Date();
      const mockBanco = [
        { 
          id: '1', 
          nome: 'Lista Teste', 
          criadoEm: mockData, 
          atualizadoEm: mockData,
          _count: { itens: 5 },
          turmas: [{ turma: { id: 't1', nome: 'Turma A' } }]
        }
      ];
      
      mockRepository.listarDoProfessor.mockResolvedValue(mockBanco as never);
      
      const resultado = await service.listarMinhasListas('prof-1', { status: 'PUBLICADA' });
      
      expect(mockRepository.listarDoProfessor).toHaveBeenCalledWith('prof-1', { status: 'PUBLICADA' });
      expect(resultado).toEqual([{
        id: '1',
        nome: 'Lista Teste',
        quantidadeQuestoes: 5,
        status: 'PUBLICADA',
        turmas: [{ id: 't1', nome: 'Turma A' }],
        criadoEm: mockData,
        atualizadoEm: mockData,
      }]);
    });
  });

  describe('deletarLista', () => {
    it('deve deletar se o professor for o dono da lista', async () => {
      mockRepository.buscarPorId.mockResolvedValue({ id: '1', criadoPorId: 'prof-1' } as never);
      await service.deletarLista('1', 'prof-1');
      expect(mockRepository.deletar).toHaveBeenCalledWith('1');
    });

    it('deve lançar ErroAplicacao PROIBIDO se o professor não for o dono', async () => {
      mockRepository.buscarPorId.mockResolvedValue({ id: '1', criadoPorId: 'prof-2' } as never);
      await expect(service.deletarLista('1', 'prof-1')).rejects.toThrow(ErroAplicacao);
    });
  });

  describe('listarListasDaTurma', () => {
    it('deve retornar as listas vinculadas à turma', async () => {
      const mockListas = [{ id: '1' }];
      mockRepository.listarPorTurma.mockResolvedValue(mockListas as never);
      
      const resultado = await service.listarListasDaTurma('turma-1');
      
      expect(mockRepository.listarPorTurma).toHaveBeenCalledWith('turma-1');
      expect(resultado).toEqual(mockListas);
    });
  });

  describe('gerarEstatisticasTurma', () => {
    it('deve calcular estatísticas corretamente com acertos e erros', async () => {
      mockRepository.buscarPorId.mockResolvedValue({ id: '1' } as never);
      
      const mockEstatisticasBase = {
        alunosIds: ['aluno-1', 'aluno-2', 'aluno-3'], // aluno-3 não respondeu nada
        resolucoes: [
          { usuarioId: 'aluno-1', respostaMarcada: 'A', questao: { respostaCorreta: 'A' } }, // Acerto
          { usuarioId: 'aluno-1', respostaMarcada: 'B', questao: { respostaCorreta: 'A' } }, // Erro
          { usuarioId: 'aluno-2', respostaMarcada: 'C', questao: { respostaCorreta: 'C' } }, // Acerto
        ]
      };
      
      mockRepository.buscarEstatisticasTurma.mockResolvedValue(mockEstatisticasBase as never);

      const resultado = await service.gerarEstatisticasTurma('1', 'turma-1');

      expect(resultado.totalAlunos).toBe(3);
      expect(resultado.alunosParticipantes).toBe(2);
      
      // Verifica aluno 1 (1 acerto, 1 erro = 50%)
      expect(resultado.estatisticasAlunos[0]).toEqual({
        alunoId: 'aluno-1',
        totalRespondidas: 2,
        acertos: 1,
        erros: 1,
        taxaAcerto: 50
      });

      // Verifica aluno 3 (0 respostas = 0%)
      expect(resultado.estatisticasAlunos[2]).toEqual({
        alunoId: 'aluno-3',
        totalRespondidas: 0,
        acertos: 0,
        erros: 0,
        taxaAcerto: 0
      });
    });
  });
});