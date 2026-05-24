import type { NextFunction, Request, Response } from 'express';

import { ListaQuestaoController } from '../../../src/modules/lista/lista.controller';
import type { ListaQuestaoService } from '../../../src/modules/lista/lista.service';

describe('ListaQuestaoController', () => {
  let controller: ListaQuestaoController;
  let mockService: jest.Mocked<ListaQuestaoService>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockService = {
      criarLista: jest.fn(),
      atualizarLista: jest.fn(),
      buscarLista: jest.fn(),
      listarMinhasListas: jest.fn(),
      listarListasDaTurma: jest.fn(),
      deletarLista: jest.fn(),
      vincularQuestoes: jest.fn(),
      desvincularQuestao: jest.fn(),
      reordenarQuestoes: jest.fn(),
      vincularTurmas: jest.fn(),
      desvincularTurma: jest.fn(),
      gerarEstatisticasTurma: jest.fn(),
    } as unknown as jest.Mocked<ListaQuestaoService>;

    controller = new ListaQuestaoController(mockService);

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  const request = (overrides: Partial<Request>) =>
    ({
      usuario: { id: 'prof-1' },
      params: {},
      query: {},
      body: {},
      ...overrides,
    }) as Request;

  it('deve criar uma lista para o professor autenticado', async () => {
    const body = { nome: 'Lista 1', questoesIds: ['q1'], turmasIds: ['t1'] };
    const lista = { id: 'lista-1', nome: 'Lista 1' };
    mockService.criarLista.mockResolvedValue(lista as never);

    await controller.criar(request({ body }), mockRes as Response, mockNext);

    expect(mockService.criarLista).toHaveBeenCalledWith(body, 'prof-1');
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      mensagem: 'Lista criada com sucesso.',
      dados: lista,
    });
  });

  it('deve atualizar uma lista do professor autenticado', async () => {
    const body = { nome: 'Lista atualizada' };
    const lista = { id: 'lista-1', nome: 'Lista atualizada' };
    mockService.atualizarLista.mockResolvedValue(lista as never);

    await controller.atualizar(
      request({ params: { id: 'lista-1' }, body }),
      mockRes as Response,
      mockNext,
    );

    expect(mockService.atualizarLista).toHaveBeenCalledWith('lista-1', 'prof-1', body);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('deve buscar uma lista do professor autenticado', async () => {
    const lista = { id: 'lista-1' };
    mockService.buscarLista.mockResolvedValue(lista as never);

    await controller.buscar(request({ params: { id: 'lista-1' } }), mockRes as Response, mockNext);

    expect(mockService.buscarLista).toHaveBeenCalledWith('lista-1', 'prof-1');
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      mensagem: 'Lista recuperada com sucesso.',
      dados: lista,
    });
  });

  it('deve listar listas do professor com filtros', async () => {
    const listas = [{ id: 'lista-1', nome: 'Lista 1' }];
    const query = { busca: 'Anatomia', status: 'PUBLICADA' };
    mockService.listarMinhasListas.mockResolvedValue(listas as never);

    await controller.listarDoUsuario(request({ query }), mockRes as Response, mockNext);

    expect(mockService.listarMinhasListas).toHaveBeenCalledWith('prof-1', query);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('deve listar listas de uma turma do professor', async () => {
    const listas = [{ id: 'lista-1' }];
    mockService.listarListasDaTurma.mockResolvedValue(listas as never);

    await controller.listarPorTurma(
      request({ params: { turmaId: 'turma-1' } }),
      mockRes as Response,
      mockNext,
    );

    expect(mockService.listarListasDaTurma).toHaveBeenCalledWith('turma-1', 'prof-1');
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('deve listar com sucesso sem passar filtros na query', async () => {
    mockReq = { 
      usuario: { id: 'prof-1' },
      query: {} 
    } as unknown as Request;
    
    mockService.listarMinhasListas.mockResolvedValue([]);

    await controller.listarDoUsuario(mockReq as Request, mockRes as Response, mockNext);

    expect(mockService.listarMinhasListas).toHaveBeenCalledWith('prof-1', {});
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('deve deletar uma lista do professor autenticado', async () => {
    mockService.deletarLista.mockResolvedValue(undefined);

    await controller.deletar(request({ params: { id: 'lista-1' } }), mockRes as Response, mockNext);

    expect(mockService.deletarLista).toHaveBeenCalledWith('lista-1', 'prof-1');
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('deve vincular questoes a uma lista', async () => {
    const body = { questoesIds: ['q1', 'q2'] };
    const lista = { id: 'lista-1' };
    mockService.vincularQuestoes.mockResolvedValue(lista as never);

    await controller.vincularQuestoes(
      request({ params: { id: 'lista-1' }, body }),
      mockRes as Response,
      mockNext,
    );

    expect(mockService.vincularQuestoes).toHaveBeenCalledWith('lista-1', 'prof-1', body);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('deve desvincular uma questao da lista', async () => {
    const lista = { id: 'lista-1' };
    mockService.desvincularQuestao.mockResolvedValue(lista as never);

    await controller.desvincularQuestao(
      request({ params: { id: 'lista-1', questaoId: 'q1' } }),
      mockRes as Response,
      mockNext,
    );

    expect(mockService.desvincularQuestao).toHaveBeenCalledWith('lista-1', 'q1', 'prof-1');
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('deve reordenar questoes da lista', async () => {
    const body = { questoesIds: ['q2', 'q1'] };
    const lista = { id: 'lista-1' };
    mockService.reordenarQuestoes.mockResolvedValue(lista as never);

    await controller.reordenarQuestoes(
      request({ params: { id: 'lista-1' }, body }),
      mockRes as Response,
      mockNext,
    );

    expect(mockService.reordenarQuestoes).toHaveBeenCalledWith('lista-1', 'prof-1', body);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('deve vincular turmas a uma lista', async () => {
    const body = { turmasIds: ['turma-1'] };
    const lista = { id: 'lista-1' };
    mockService.vincularTurmas.mockResolvedValue(lista as never);

    await controller.vincularTurmas(
      request({ params: { id: 'lista-1' }, body }),
      mockRes as Response,
      mockNext,
    );

    expect(mockService.vincularTurmas).toHaveBeenCalledWith('lista-1', 'prof-1', body);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('deve desvincular uma turma da lista', async () => {
    const lista = { id: 'lista-1' };
    mockService.desvincularTurma.mockResolvedValue(lista as never);

    await controller.desvincularTurma(
      request({ params: { id: 'lista-1', turmaId: 'turma-1' } }),
      mockRes as Response,
      mockNext,
    );

    expect(mockService.desvincularTurma).toHaveBeenCalledWith('lista-1', 'turma-1', 'prof-1');
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('deve gerar estatisticas da lista em uma turma', async () => {
    const estatisticas = { totalAlunos: 10 };
    mockService.gerarEstatisticasTurma.mockResolvedValue(estatisticas as never);

    await controller.estatisticas(
      request({ params: { id: 'lista-1', turmaId: 'turma-1' } }),
      mockRes as Response,
      mockNext,
    );

    expect(mockService.gerarEstatisticasTurma).toHaveBeenCalledWith(
      'lista-1',
      'turma-1',
      'prof-1',
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('deve chamar next em caso de erro', async () => {
    const erro = new Error('Erro');
    mockService.buscarLista.mockRejectedValue(erro);

    await controller.buscar(request({ params: { id: 'lista-1' } }), mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(erro);
  });
  
  it('deve chamar next em caso de erro no método criar', async () => {
    const erro = new Error('Erro ao criar');
    mockService.criarLista.mockRejectedValue(erro);
    await controller.criar(request({ body: {} }), mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(erro);
  });

  it('deve chamar next em caso de erro no método atualizar', async () => {
    const erro = new Error('Erro ao atualizar');
    mockService.atualizarLista.mockRejectedValue(erro);
    await controller.atualizar(request({ params: { id: 'lista-1' }, body: {} }), mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(erro);
  });

  it('deve chamar next em caso de erro no método listarDoUsuario', async () => {
    const erro = new Error('Erro ao listar');
    mockService.listarMinhasListas.mockRejectedValue(erro);
    await controller.listarDoUsuario(request({ query: {} }), mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(erro);
  });

  it('deve chamar next em caso de erro no método listarPorTurma', async () => {
    const erro = new Error('Erro ao listar por turma');
    mockService.listarListasDaTurma.mockRejectedValue(erro);
    await controller.listarPorTurma(request({ params: { turmaId: 'turma-1' } }), mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(erro);
  });

  it('deve chamar next em caso de erro no método deletar', async () => {
    const erro = new Error('Erro ao deletar');
    mockService.deletarLista.mockRejectedValue(erro);
    await controller.deletar(request({ params: { id: 'lista-1' } }), mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(erro);
  });

  it('deve chamar next em caso de erro no método vincularQuestoes', async () => {
    const erro = new Error('Erro ao vincular questoes');
    mockService.vincularQuestoes.mockRejectedValue(erro);
    await controller.vincularQuestoes(request({ params: { id: 'lista-1' }, body: {} }), mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(erro);
  });

  it('deve chamar next em caso de erro no método desvincularQuestao', async () => {
    const erro = new Error('Erro ao desvincular questao');
    mockService.desvincularQuestao.mockRejectedValue(erro);
    await controller.desvincularQuestao(request({ params: { id: 'lista-1', questaoId: 'q1' } }), mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(erro);
  });

  it('deve chamar next em caso de erro no método reordenarQuestoes', async () => {
    const erro = new Error('Erro ao reordenar');
    mockService.reordenarQuestoes.mockRejectedValue(erro);
    await controller.reordenarQuestoes(request({ params: { id: 'lista-1' }, body: {} }), mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(erro);
  });

  it('deve chamar next em caso de erro no método vincularTurmas', async () => {
    const erro = new Error('Erro ao vincular turmas');
    mockService.vincularTurmas.mockRejectedValue(erro);
    await controller.vincularTurmas(request({ params: { id: 'lista-1' }, body: {} }), mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(erro);
  });

  it('deve chamar next em caso de erro no método desvincularTurma', async () => {
    const erro = new Error('Erro ao desvincular turma');
    mockService.desvincularTurma.mockRejectedValue(erro);
    await controller.desvincularTurma(request({ params: { id: 'lista-1', turmaId: 'turma-1' } }), mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(erro);
  });

  it('deve chamar next em caso de erro no método estatisticas', async () => {
    const erro = new Error('Erro ao gerar estatisticas');
    mockService.gerarEstatisticasTurma.mockRejectedValue(erro);
    await controller.estatisticas(request({ params: { id: 'lista-1', turmaId: 'turma-1' } }), mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(erro);
  });
});
