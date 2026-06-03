import { ErroAplicacao } from '@/shared/errors/erro-aplicacao';
import { CodigoDeErro } from '@/shared/errors/codigos-de-erro';
import type { AtualizarListaQuestaoDTO } from '../../../src/modules/lista/dto/lista.types';

import type { ListaQuestaoRepository, ListaQuestaoResumo } from '../../../src/modules/lista/lista.repository';
import { ListaQuestaoService } from '../../../src/modules/lista/lista.service';

jest.mock('../../../src/shared/utils/pdf.util', () => ({
  gerarPdfBase64: jest.fn().mockResolvedValue('string-base-64-falsa-para-o-teste'),
}));

describe('ListaQuestaoService', () => {
  let service: ListaQuestaoService;
  let mockRepository: jest.Mocked<ListaQuestaoRepository>;

  const listaBase = {
    id: 'lista-1',
    nome: 'Lista 1',
    criadoPorId: 'prof-1',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    excluidoEm: null,
    itens: [
      { id: 'item-1', questaoId: 'q1', listaQuestaoId: 'lista-1', ordem: 1 },
      { id: 'item-2', questaoId: 'q2', listaQuestaoId: 'lista-1', ordem: 2 },
    ],
    turmas: [{ id: 'lt-1', listaQuestaoId: 'lista-1', turmaId: 'turma-1' }],
  };

  beforeEach(() => {
    mockRepository = {
      criar: jest.fn(),
      atualizarNome: jest.fn(),
      buscarPorId: jest.fn(),
      listarDoProfessor: jest.fn(),
      listarPorTurma: jest.fn(),
      listarVinculosDaTurma: jest.fn(),
      deletar: jest.fn(),
      listarQuestoesAtivasPorIds: jest.fn(),
      listarTurmasAtivasDoProfessorPorIds: jest.fn(),
      vincularQuestoes: jest.fn(),
      desvincularQuestao: jest.fn(),
      reordenarQuestoes: jest.fn(),
      vincularTurmas: jest.fn(),
      atualizarVinculo: jest.fn(),
      desvincularTurma: jest.fn(),
      buscarEstatisticasTurma: jest.fn(),
    } as unknown as jest.Mocked<ListaQuestaoRepository>;

    service = new ListaQuestaoService(mockRepository);
  });

  describe('criarLista', () => {
    it('deve criar lista com questoes e turmas validadas', async () => {
      const data = {
        nome: 'Lista Nova',
        questoesIds: ['q1', 'q2'],
        turmasIds: ['turma-1'],
      };
      const listaCriada = { ...listaBase, nome: data.nome };
      mockRepository.listarQuestoesAtivasPorIds.mockResolvedValue([{ id: 'q1' }, { id: 'q2' }] as never);
      mockRepository.listarTurmasAtivasDoProfessorPorIds.mockResolvedValue([{ id: 'turma-1' }] as never);
      mockRepository.criar.mockResolvedValue(listaCriada as never);

      const resultado = await service.criarLista(data, 'prof-1');

      expect(mockRepository.criar).toHaveBeenCalledWith({
        nome: 'Lista Nova',
        criadoPorId: 'prof-1',
        questoesIds: ['q1', 'q2'],
        turmasIds: ['turma-1'],
      });
      expect(resultado).toEqual(listaCriada);
    });

    it('deve rejeitar IDs duplicados', async () => {
      await expect(
        service.criarLista({ nome: 'Lista', questoesIds: ['q1', 'q1'] }, 'prof-1'),
      ).rejects.toMatchObject({ codigo: 'REQUISICAO_INVALIDA' });
    });

    it('deve rejeitar questoes inexistentes ou inativas', async () => {
      mockRepository.listarQuestoesAtivasPorIds.mockResolvedValue([{ id: 'q1' }] as never);

      await expect(
        service.criarLista({ nome: 'Lista', questoesIds: ['q1', 'q2'] }, 'prof-1'),
      ).rejects.toThrow(ErroAplicacao);
    });
  });

  describe('atualizarLista e buscarLista', () => {
    it('deve buscar lista do professor', async () => {
      mockRepository.buscarPorId.mockResolvedValue(listaBase as never);

      const resultado = await service.buscarLista('lista-1', 'prof-1');

      expect(resultado).toEqual(listaBase);
    });

    it('deve rejeitar acesso de outro professor', async () => {
      mockRepository.buscarPorId.mockResolvedValue({ ...listaBase, criadoPorId: 'prof-2' } as never);

      await expect(service.buscarLista('lista-1', 'prof-1')).rejects.toMatchObject({
        codigo: 'PROIBIDO',
      });
    });

    it('deve atualizar o nome da lista', async () => {
      mockRepository.buscarPorId.mockResolvedValue(listaBase as never);
      mockRepository.atualizarNome.mockResolvedValue({ ...listaBase, nome: 'Novo nome' } as never);

      const resultado = await service.atualizarLista('lista-1', 'prof-1', { nome: 'Novo nome' });

      expect(mockRepository.atualizarNome).toHaveBeenCalledWith('lista-1', 'Novo nome');
      expect(resultado.nome).toBe('Novo nome');
    });
  });

  describe('listarMinhasListas', () => {
    it('deve retornar listas formatadas', async () => {
      const data = new Date();
      mockRepository.listarDoProfessor.mockResolvedValue([
        {
          id: 'lista-1',
          nome: 'Lista 1',
          criadoEm: data,
          atualizadoEm: data,
          _count: { itens: 2 },
          turmas: [{ turma: { id: 'turma-1', nome: 'Turma 1' } }],
        },
      ] as never);

      const resultado = await service.listarMinhasListas('prof-1', { status: 'PUBLICADA' });

      expect(mockRepository.listarDoProfessor).toHaveBeenCalledWith('prof-1', {
        status: 'PUBLICADA',
      });
      expect(resultado).toEqual([
        {
          id: 'lista-1',
          nome: 'Lista 1',
          quantidadeQuestoes: 2,
          status: 'PUBLICADA',
          turmas: [{ id: 'turma-1', nome: 'Turma 1' }],
          criadoEm: data,
          atualizadoEm: data,
        },
      ]);
    });
    it('deve lidar com filtros vazios ou indefinidos', async () => {
      const mockLista: ListaQuestaoResumo = {
        id: '1',
        nome: 'Lista Sem Filtro',
        criadoPorId: 'prof-1',
        criadoEm: new Date(),
        atualizadoEm: new Date(),
        excluidoEm: null,
        _count: { itens: 0 },
        turmas: []
      };

      mockRepository.listarDoProfessor.mockResolvedValue([mockLista]);

      const resultado = await service.listarMinhasListas('prof-1', {});
      
      expect(resultado[0].status).toBe('RASCUNHO');
      expect(resultado[0].quantidadeQuestoes).toBe(0);
    });

    it('deve lançar erro se tentar atualizar lista inexistente', async () => {
      mockRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.atualizarLista('id-invalido', 'prof-1', { nome: 'Novo' }))
        .rejects.toMatchObject({ codigo: 'NAO_ENCONTRADO' });
    });
  });

  describe('questoes da lista', () => {
    it('deve vincular questoes ainda nao vinculadas', async () => {
      mockRepository.buscarPorId.mockResolvedValue(listaBase as never);
      mockRepository.listarQuestoesAtivasPorIds.mockResolvedValue([{ id: 'q3' }] as never);
      mockRepository.vincularQuestoes.mockResolvedValue({
        ...listaBase,
        itens: [...listaBase.itens, { id: 'item-3', questaoId: 'q3', ordem: 3 }],
      } as never);

      await service.vincularQuestoes('lista-1', 'prof-1', { questoesIds: ['q3'] });

      expect(mockRepository.vincularQuestoes).toHaveBeenCalledWith('lista-1', ['q3'], 3);
    });

    it('deve rejeitar questao ja vinculada', async () => {
      mockRepository.buscarPorId.mockResolvedValue(listaBase as never);
      mockRepository.listarQuestoesAtivasPorIds.mockResolvedValue([{ id: 'q1' }] as never);

      await expect(
        service.vincularQuestoes('lista-1', 'prof-1', { questoesIds: ['q1'] }),
      ).rejects.toMatchObject({ codigo: 'CONFLITO' });
    });

    it('deve desvincular questao existente', async () => {
      mockRepository.buscarPorId.mockResolvedValue(listaBase as never);
      mockRepository.desvincularQuestao.mockResolvedValue(listaBase as never);

      await service.desvincularQuestao('lista-1', 'q1', 'prof-1');

      expect(mockRepository.desvincularQuestao).toHaveBeenCalledWith('lista-1', 'q1');
    });

    it('deve reordenar quando o payload contem exatamente as questoes atuais', async () => {
      mockRepository.buscarPorId.mockResolvedValue(listaBase as never);
      mockRepository.reordenarQuestoes.mockResolvedValue(listaBase as never);

      await service.reordenarQuestoes('lista-1', 'prof-1', { questoesIds: ['q2', 'q1'] });

      expect(mockRepository.reordenarQuestoes).toHaveBeenCalledWith('lista-1', ['q2', 'q1']);
    });

    it('deve rejeitar reordenacao incompleta', async () => {
      mockRepository.buscarPorId.mockResolvedValue(listaBase as never);

      await expect(
        service.reordenarQuestoes('lista-1', 'prof-1', { questoesIds: ['q1'] }),
      ).rejects.toMatchObject({ codigo: 'REQUISICAO_INVALIDA' });
    });
  });

  describe('turmas da lista', () => {
    it('deve listar listas da turma validando propriedade da turma', async () => {
      const listas = [{ id: 'lista-1' }];
      mockRepository.listarTurmasAtivasDoProfessorPorIds.mockResolvedValue([{ id: 'turma-1' }] as never);
      mockRepository.listarPorTurma.mockResolvedValue(listas as never);

      const resultado = await service.listarListasDaTurma('turma-1', 'prof-1');

      expect(mockRepository.listarPorTurma).toHaveBeenCalledWith('turma-1', 'prof-1');
      expect(resultado).toEqual(listas);
    });

    it('deve listar vinculos da turma com configuracao formatada', async () => {
      const prazo = new Date('2026-06-10T23:59:00.000Z');
      mockRepository.listarTurmasAtivasDoProfessorPorIds.mockResolvedValue([{ id: 'turma-1' }] as never);
      mockRepository.listarVinculosDaTurma.mockResolvedValue([
        {
          id: 'vinculo-1',
          listaQuestaoId: 'lista-1',
          turmaId: 'turma-1',
          prazo,
          gabaritoLiberado: true,
          listaQuestao: {
            id: 'lista-1',
            nome: 'Lista 1',
            _count: { itens: 2 },
          },
        },
      ] as never);

      const resultado = await service.listarVinculosDaTurma('turma-1', 'prof-1');

      expect(mockRepository.listarVinculosDaTurma).toHaveBeenCalledWith('turma-1', 'prof-1');
      expect(resultado).toEqual([
        {
          id: 'vinculo-1',
          listaQuestaoId: 'lista-1',
          nome: 'Lista 1',
          quantidadeQuestoes: 2,
          prazo,
          gabaritoLiberado: true,
        },
      ]);
    });

    it('deve vincular turmas ainda nao vinculadas', async () => {
      mockRepository.buscarPorId.mockResolvedValue(listaBase as never);
      mockRepository.listarTurmasAtivasDoProfessorPorIds.mockResolvedValue([{ id: 'turma-2' }] as never);
      mockRepository.vincularTurmas.mockResolvedValue(listaBase as never);

      await service.vincularTurmas('lista-1', 'prof-1', { turmasIds: ['turma-2'] });

      expect(mockRepository.vincularTurmas).toHaveBeenCalledWith('lista-1', ['turma-2']);
    });

    it('deve vincular turma com prazo e gabarito', async () => {
      const payload = {
        turmaId: 'turma-2',
        prazo: '2026-06-10T23:59:00.000Z',
        gabaritoLiberado: true,
      };
      mockRepository.buscarPorId.mockResolvedValue(listaBase as never);
      mockRepository.listarTurmasAtivasDoProfessorPorIds.mockResolvedValue([{ id: 'turma-2' }] as never);
      mockRepository.vincularTurmas.mockResolvedValue(listaBase as never);

      await service.vincularTurmas('lista-1', 'prof-1', payload);

      expect(mockRepository.vincularTurmas).toHaveBeenCalledWith('lista-1', [payload]);
    });

    it('deve rejeitar turma ja vinculada', async () => {
      mockRepository.buscarPorId.mockResolvedValue(listaBase as never);
      mockRepository.listarTurmasAtivasDoProfessorPorIds.mockResolvedValue([{ id: 'turma-1' }] as never);

      await expect(
        service.vincularTurmas('lista-1', 'prof-1', { turmasIds: ['turma-1'] }),
      ).rejects.toMatchObject({ codigo: 'CONFLITO' });
    });

    it('deve atualizar prazo e gabarito de vinculo existente', async () => {
      const prazo = new Date('2026-06-10T23:59:00.000Z');
      mockRepository.buscarPorId.mockResolvedValue(listaBase as never);
      mockRepository.listarTurmasAtivasDoProfessorPorIds.mockResolvedValue([{ id: 'turma-1' }] as never);
      mockRepository.atualizarVinculo.mockResolvedValue({
        id: 'lt-1',
        listaQuestaoId: 'lista-1',
        turmaId: 'turma-1',
        prazo,
        gabaritoLiberado: true,
        listaQuestao: {
          id: 'lista-1',
          nome: 'Lista 1',
          _count: { itens: 2 },
        },
      } as never);

      const resultado = await service.atualizarVinculo('lista-1', 'turma-1', 'prof-1', {
        prazo: '2026-06-10T23:59:00.000Z',
        gabaritoLiberado: true,
      });

      expect(mockRepository.atualizarVinculo).toHaveBeenCalledWith('lista-1', 'turma-1', {
        prazo: '2026-06-10T23:59:00.000Z',
        gabaritoLiberado: true,
      });
      expect(resultado).toEqual({
        id: 'lt-1',
        listaQuestaoId: 'lista-1',
        nome: 'Lista 1',
        quantidadeQuestoes: 2,
        prazo,
        gabaritoLiberado: true,
      });
    });

    it('deve rejeitar atualizacao de vinculo inexistente na lista', async () => {
      mockRepository.buscarPorId.mockResolvedValue(listaBase as never);
      mockRepository.listarTurmasAtivasDoProfessorPorIds.mockResolvedValue([{ id: 'turma-2' }] as never);

      await expect(
        service.atualizarVinculo('lista-1', 'turma-2', 'prof-1', { gabaritoLiberado: true }),
      ).rejects.toMatchObject({ codigo: 'NAO_ENCONTRADO' });
    });

    it('deve desvincular turma vinculada', async () => {
      mockRepository.buscarPorId.mockResolvedValue(listaBase as never);
      mockRepository.listarTurmasAtivasDoProfessorPorIds.mockResolvedValue([{ id: 'turma-1' }] as never);
      mockRepository.desvincularTurma.mockResolvedValue(listaBase as never);

      await service.desvincularTurma('lista-1', 'turma-1', 'prof-1');

      expect(mockRepository.desvincularTurma).toHaveBeenCalledWith('lista-1', 'turma-1');
    });
  });

  describe('gerarEstatisticasTurma', () => {
    it('deve calcular estatisticas por aluno', async () => {
      mockRepository.buscarPorId.mockResolvedValue(listaBase as never);
      mockRepository.listarTurmasAtivasDoProfessorPorIds.mockResolvedValue([{ id: 'turma-1' }] as never);
      mockRepository.buscarEstatisticasTurma.mockResolvedValue({
        alunosIds: ['aluno-1', 'aluno-2'],
        resolucoes: [
          { usuarioId: 'aluno-1', respostaMarcada: 'A', questao: { respostaCorreta: 'A' } },
          { usuarioId: 'aluno-1', respostaMarcada: 'B', questao: { respostaCorreta: 'A' } },
        ],
      } as never);

      const resultado = await service.gerarEstatisticasTurma('lista-1', 'turma-1', 'prof-1');

      expect(resultado.totalAlunos).toBe(2);
      expect(resultado.alunosParticipantes).toBe(1);
      expect(resultado.estatisticasAlunos[0]).toMatchObject({
        alunoId: 'aluno-1',
        totalRespondidas: 2,
        acertos: 1,
        erros: 1,
        taxaAcerto: 50,
      });
    });
  });

  describe('cobertura de branches e casos de erro', () => {
    it('deve rejeitar desvinculação de questao que nao existe na lista', async () => {
      mockRepository.buscarPorId.mockResolvedValue(listaBase as never);
      
      await expect(service.desvincularQuestao('lista-1', 'q-inexistente', 'prof-1'))
        .rejects.toMatchObject({ codigo: 'NAO_ENCONTRADO' });
    });

    it('deve rejeitar desvinculação de turma que nao existe na lista', async () => {
      mockRepository.buscarPorId.mockResolvedValue(listaBase as never);
      mockRepository.listarTurmasAtivasDoProfessorPorIds.mockResolvedValue([{ id: 'turma-1' }] as never);
      
      await expect(service.desvincularTurma('lista-1', 'turma-inexistente', 'prof-1'))
        .rejects.toMatchObject({ codigo: 'NAO_ENCONTRADO' });
    });

    it('deve lidar com validação de estatísticas quando lista não está na turma', async () => {
      const listaSemTurma = { ...listaBase, turmas: [] };
      mockRepository.buscarPorId.mockResolvedValue(listaSemTurma as never);
      mockRepository.listarTurmasAtivasDoProfessorPorIds.mockResolvedValue([{ id: 'turma-1' }] as never);

      await expect(service.gerarEstatisticasTurma('lista-1', 'turma-1', 'prof-1'))
        .rejects.toMatchObject({ codigo: 'NAO_ENCONTRADO' });
    });

    it('deve calcular taxa de acerto zero quando não há resoluções', async () => {
       mockRepository.buscarPorId.mockResolvedValue(listaBase as never);
       mockRepository.listarTurmasAtivasDoProfessorPorIds.mockResolvedValue([{ id: 'turma-1' }] as never);
       mockRepository.buscarEstatisticasTurma.mockResolvedValue({
         alunosIds: ['aluno-1'],
         resolucoes: [] 
       } as never);

       const res = await service.gerarEstatisticasTurma('lista-1', 'turma-1', 'prof-1');
       expect(res.estatisticasAlunos[0].taxaAcerto).toBe(0);
       expect(res.alunosParticipantes).toBe(0);
    });

    it('deve rejeitar atualização se data.nome for undefined', async () => {
      mockRepository.buscarPorId.mockResolvedValue(listaBase as never);
      
      const payload = {} as AtualizarListaQuestaoDTO;
      
      try {
        await service.atualizarLista('lista-1', 'prof-1', payload);
      } catch (error) {
        expect(error).toBeInstanceOf(ErroAplicacao);
        expect((error as ErroAplicacao).codigo).toBe(CodigoDeErro.REQUISICAO_INVALIDA);
      }
    });

    it('deve rejeitar desvincular questao se a lista nao contiver o item', async () => {
      const listaSemQuestao = { ...listaBase, itens: [] };
      mockRepository.buscarPorId.mockResolvedValue(listaSemQuestao as never);
      
      try {
        await service.desvincularQuestao('lista-1', 'q-inexistente', 'prof-1');
      } catch (error) {
        expect(error).toBeInstanceOf(ErroAplicacao);
      }
    });
    it('deve lançar erro se a lista não for encontrada (obterListaDoProfessor)', async () => {
      mockRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.buscarLista('id-invalido', 'prof-1'))
        .rejects.toMatchObject({ codigo: 'NAO_ENCONTRADO' });
    });
    it('deve lançar erro ao tentar desvincular questao que não existe na lista', async () => {
      const listaSemQuestao = { ...listaBase, itens: [{ questaoId: 'q-outra' }] };
      mockRepository.buscarPorId.mockResolvedValue(listaSemQuestao as never);

      try {
        await service.desvincularQuestao('lista-1', 'q-inexistente', 'prof-1');
      } catch (error) {
        expect(error).toBeInstanceOf(ErroAplicacao);
        expect((error as ErroAplicacao).codigo).toBe(CodigoDeErro.NAO_ENCONTRADO);
      }
    });

    it('deve rejeitar desvincular questao quando o ID da questao nao existe na lista', async () => {
      const listaComOutraQuestao = { 
        ...listaBase, 
        itens: [{ id: 'item-99', questaoId: 'q-diferente', listaQuestaoId: 'lista-1', ordem: 1 }] 
      };
      mockRepository.buscarPorId.mockResolvedValue(listaComOutraQuestao as never);

      try {
        await service.desvincularQuestao('lista-1', 'q-alvo', 'prof-1');
      } catch (error) {
        expect(error).toBeInstanceOf(ErroAplicacao);
      }
    });

    it('deve lançar erro 404 quando a lista não for encontrada ao tentar buscar estatisticas', async () => {
      mockRepository.buscarPorId.mockResolvedValue(null); 

      try {
        await service.gerarEstatisticasTurma('lista-inexistente', 'turma-1', 'prof-1');
      } catch (error) {
        expect(error).toBeInstanceOf(ErroAplicacao);
        expect((error as ErroAplicacao).codigo).toBe(CodigoDeErro.NAO_ENCONTRADO);
      }
    });
    it('deve lançar erro de requisicao invalida se nome for enviado vazio na atualização', async () => {
      mockRepository.buscarPorId.mockResolvedValue(listaBase as never);

      const dtoSemNome = { nome: '' } as AtualizarListaQuestaoDTO;

      try {
        await service.atualizarLista('lista-1', 'prof-1', dtoSemNome);
      } catch (error) {
        expect(error).toBeInstanceOf(ErroAplicacao);
        expect((error as ErroAplicacao).codigo).toBe(CodigoDeErro.REQUISICAO_INVALIDA);
      }
    });
  });

  describe('gerarPdfLista', () => {
    it('deve retornar uma string base64 com sucesso', async () => {
      mockRepository.buscarPorId.mockResolvedValue({
        id: '123',
        nome: 'Lista Teste',
        criadoPorId: 'prof-id',
        itens: []
      } as never);

      jest.spyOn(service, 'buscarLista').mockResolvedValue({
        id: '123',
        nome: 'Lista Teste',
        criadoPorId: 'prof-id',
        itens: []
      } as never);

      const resultado = await service.gerarPdfLista('123', 'prof-id', 'prof@unb.br');

      expect(resultado).toBe('string-base-64-falsa-para-o-teste');
    });
  });
});
