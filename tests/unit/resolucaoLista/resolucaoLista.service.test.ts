import { ResolucaoListaService } from '../../../src/modules/resolucaoLista/resolucaoLista.service';
import type { ResolucaoListaRepository } from '../../../src/modules/resolucaoLista/resolucaoLista.repository';
import { ErroAplicacao } from '@/shared/errors/erro-aplicacao';
import { AlternativaQuestao, StatusResolucaoLista } from '@prisma/client';

describe('ResolucaoListaService', () => {
  let service: ResolucaoListaService;
  let repository: jest.Mocked<ResolucaoListaRepository>;

  const FAKE_NOW = new Date('2026-06-04T12:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(FAKE_NOW);

    repository = {
      buscarListasDoAluno: jest.fn(),
      buscarListaComQuestoes: jest.fn(),
      salvarResposta: jest.fn(),
      submeterLista: jest.fn(),
    } as unknown as jest.Mocked<ResolucaoListaRepository>;

    service = new ResolucaoListaService(repository);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('listarParaAluno', () => {
    it('deve listar as listas mapeadas com status PENDENTE', async () => {
      const mockListas = [{
        id: 'lista-1',
        prazo: null,
        gabaritoLiberado: false,
        listaQuestao: {
          nome: 'Simulado',
          itens: [{ questao: { tema: { nome: 'Anatomia' } } }],
        },
        resolucoes: [],
      }];
      repository.buscarListasDoAluno.mockResolvedValue(mockListas as never);

      const result = await service.listarParaAluno('aluno-1');

      expect(repository.buscarListasDoAluno).toHaveBeenCalledWith('aluno-1', undefined);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        listaTurmaId: 'lista-1',
        nome: 'Simulado',
        temas: ['Anatomia'],
        quantidadeQuestoes: 1,
        prazo: null,
        status: 'PENDENTE',
        gabaritoLiberado: false,
      });
    });

    it('deve calcular o status como RESPONDIDA se submetida', async () => {
      const mockListas = [{
        id: 'lista-1',
        prazo: null,
        gabaritoLiberado: true,
        listaQuestao: { nome: 'Simulado', itens: [] },
        resolucoes: [{ status: StatusResolucaoLista.SUBMETIDA }],
      }];
      repository.buscarListasDoAluno.mockResolvedValue(mockListas as never);

      const result = await service.listarParaAluno('aluno-1');

      expect(result[0].status).toBe('RESPONDIDA');
    });

    it('deve calcular o status como EXPIRADA se o prazo passou', async () => {
      const mockListas = [{
        id: 'lista-1',
        prazo: new Date('2026-06-01T12:00:00Z'),
        gabaritoLiberado: false,
        listaQuestao: { nome: 'Simulado', itens: [] },
        resolucoes: [{ status: StatusResolucaoLista.EM_ANDAMENTO }],
      }];
      repository.buscarListasDoAluno.mockResolvedValue(mockListas as never);

      const result = await service.listarParaAluno('aluno-1');

      expect(result[0].status).toBe('EXPIRADA');
    });

    it('deve filtrar as listas pelo status fornecido', async () => {
      const mockListas = [
        {
          id: 'lista-1',
          prazo: null,
          listaQuestao: { nome: 'Simulado 1', itens: [] },
          resolucoes: [],
        },
        {
          id: 'lista-2',
          prazo: null,
          listaQuestao: { nome: 'Simulado 2', itens: [] },
          resolucoes: [{ status: StatusResolucaoLista.SUBMETIDA }],
        },
      ];
      repository.buscarListasDoAluno.mockResolvedValue(mockListas as never);

      const result = await service.listarParaAluno('aluno-1', 'RESPONDIDA');

      expect(result).toHaveLength(1);
      expect(result[0].listaTurmaId).toBe('lista-2');
    });
  });

  describe('buscarDetalhesDaLista', () => {
    it('deve lancar ErroAplicacao 404 se a lista nao for encontrada', async () => {
      repository.buscarListaComQuestoes.mockResolvedValue(null);

      await expect(service.buscarDetalhesDaLista('aluno-1', 'lista-1')).rejects.toThrow(ErroAplicacao);
      await expect(service.buscarDetalhesDaLista('aluno-1', 'lista-1')).rejects.toMatchObject({
        codigoStatus: 404,
      });
    });

    it('deve retornar detalhes da lista escondendo o gabarito', async () => {
      const mockLista = {
        id: 'lista-1',
        gabaritoLiberado: false,
        prazo: null,
        listaQuestao: {
          nome: 'Lista 1',
          itens: [
            {
              questao: {
                id: 'q-1',
                enunciado: 'Pergunta?',
                urlImagem: null,
                tema: { nome: 'Tema 1' },
                tipoQuestao: 'MULTIPLA_ESCOLHA',
                alternativas: {
                  alternativaA: 'A', alternativaB: 'B', alternativaC: 'C', alternativaD: 'D', alternativaE: 'E',
                },
                respostaCorreta: 'A',
                saibaMais: 'Detalhe',
              },
            },
          ],
        },
        resolucoes: [
          {
            status: StatusResolucaoLista.EM_ANDAMENTO,
            respostas: [{ questaoId: 'q-1', respostaMarcada: 'B' }],
          },
        ],
      };
      repository.buscarListaComQuestoes.mockResolvedValue(mockLista as never);

      const result = await service.buscarDetalhesDaLista('aluno-1', 'lista-1');

      expect(result.questoes[0]).not.toHaveProperty('respostaCorreta');
      expect(result.questoes[0]).not.toHaveProperty('saibaMais');
      expect(result.questoes[0].respostaMarcada).toBe('B');
    });

    it('deve retornar detalhes da lista com gabarito liberado', async () => {
      const mockLista = {
        id: 'lista-1',
        gabaritoLiberado: true,
        prazo: null,
        listaQuestao: {
          nome: 'Lista 1',
          itens: [
            {
              questao: {
                id: 'q-1',
                enunciado: 'Pergunta?',
                urlImagem: null,
                tema: { nome: 'Tema 1' },
                tipoQuestao: 'MULTIPLA_ESCOLHA',
                alternativas: null,
                respostaCorreta: 'A',
                saibaMais: 'Detalhe',
              },
            },
          ],
        },
        resolucoes: [],
      };
      repository.buscarListaComQuestoes.mockResolvedValue(mockLista as never);

      const result = await service.buscarDetalhesDaLista('aluno-1', 'lista-1');

      expect(result.questoes[0].respostaCorreta).toBe('A');
      expect(result.questoes[0].saibaMais).toBe('Detalhe');
      expect(result.questoes[0].respostaMarcada).toBeNull();
    });
  });

  describe('registrarAutosave', () => {
    it('deve lancar 404 se a lista nao existir', async () => {
      repository.buscarListaComQuestoes.mockResolvedValue(null);

      await expect(service.registrarAutosave('a', 'l', 'q', AlternativaQuestao.A)).rejects.toMatchObject({
        codigoStatus: 404,
      });
    });

    it('deve lancar 403 se o prazo ja expirou', async () => {
      repository.buscarListaComQuestoes.mockResolvedValue({
        prazo: new Date('2026-06-01T12:00:00Z'),
      } as never);

      await expect(service.registrarAutosave('a', 'l', 'q', AlternativaQuestao.A)).rejects.toMatchObject({
        codigoStatus: 403,
      });
    });

    it('deve lancar 409 se a lista ja foi submetida', async () => {
      repository.buscarListaComQuestoes.mockResolvedValue({
        prazo: null,
        resolucoes: [{ status: StatusResolucaoLista.SUBMETIDA }],
      } as never);

      await expect(service.registrarAutosave('a', 'l', 'q', AlternativaQuestao.A)).rejects.toMatchObject({
        codigoStatus: 409,
      });
    });

    it('deve chamar o repository para salvar a resposta', async () => {
      repository.buscarListaComQuestoes.mockResolvedValue({
        prazo: null,
        resolucoes: [{ status: StatusResolucaoLista.EM_ANDAMENTO }],
      } as never);

      await service.registrarAutosave('a', 'l', 'q', AlternativaQuestao.A);

      expect(repository.salvarResposta).toHaveBeenCalledWith('a', 'l', 'q', AlternativaQuestao.A);
    });
  });

  describe('submeterLista', () => {
    it('deve lancar 404 se a lista nao existir', async () => {
      repository.buscarListaComQuestoes.mockResolvedValue(null);

      await expect(service.submeterLista('a', 'l')).rejects.toMatchObject({
        codigoStatus: 404,
      });
    });

    it('deve lancar 403 se o prazo ja expirou', async () => {
      repository.buscarListaComQuestoes.mockResolvedValue({
        prazo: new Date('2026-06-01T12:00:00Z'),
      } as never);

      await expect(service.submeterLista('a', 'l')).rejects.toMatchObject({
        codigoStatus: 403,
      });
    });

    it('deve lancar 409 se a lista ja foi submetida', async () => {
      repository.buscarListaComQuestoes.mockResolvedValue({
        prazo: null,
        resolucoes: [{ status: StatusResolucaoLista.SUBMETIDA }],
      } as never);

      await expect(service.submeterLista('a', 'l')).rejects.toMatchObject({
        codigoStatus: 409,
      });
    });

    it('deve lancar 400 se nao houver resolucao previa', async () => {
      repository.buscarListaComQuestoes.mockResolvedValue({
        prazo: null,
        resolucoes: [],
      } as never);

      await expect(service.submeterLista('a', 'l')).rejects.toMatchObject({
        codigoStatus: 400,
      });
    });

    it('deve chamar o repository para submeter a lista', async () => {
      repository.buscarListaComQuestoes.mockResolvedValue({
        prazo: null,
        resolucoes: [{ status: StatusResolucaoLista.EM_ANDAMENTO }],
      } as never);

      await service.submeterLista('a', 'l');

      expect(repository.submeterLista).toHaveBeenCalledWith('a', 'l');
    });
  });
});