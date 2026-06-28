import { Router } from 'express';

import { PAPEIS } from '@/shared/constants/papeis';
import { middlewareAutenticacao } from '@/shared/middlewares/autenticacao.middleware';
import { middlewarePapeis } from '@/shared/middlewares/papeis.middleware';
import { validarRequisicao } from '@/shared/middlewares/validacao.middleware';

import { ListaQuestaoController } from './lista.controller';
import { ListaQuestaoRepository } from './lista.repository';
import { ListaQuestaoService } from './lista.service';
import {
  schemaAtualizarVinculoListaTurma,
  schemaAtualizarLista,
  schemaCriarLista,
  schemaEstatisticasParams,
  schemaListarListas,
  schemaParametroId,
  schemaParametroListaQuestao,
  schemaParametroListaTurma,
  schemaParametroTurmaId,
  schemaReordenarQuestoes,
  schemaVincularQuestoes,
  schemaVincularTurmas,
} from './lista.schemas';

const listaQuestaoRouter = Router();

// Montagem manual das dependencias do modulo (repository -> service -> controller).
const listaQuestaoRepository = new ListaQuestaoRepository();
const listaQuestaoService = new ListaQuestaoService(listaQuestaoRepository);
const listaQuestaoController = new ListaQuestaoController(listaQuestaoService);

// Todas as rotas de gestao de listas exigem autenticacao e papel de professor.
listaQuestaoRouter.use(middlewareAutenticacao);
listaQuestaoRouter.use(middlewarePapeis(PAPEIS.PROFESSOR));

// POST cria uma nova lista de questoes.
listaQuestaoRouter.post(
  '/',
  validarRequisicao(schemaCriarLista),
  listaQuestaoController.criar,
);

// GET lista as listas do professor logado (com filtros na query).
listaQuestaoRouter.get(
  '/',
  validarRequisicao(schemaListarListas, 'query'),
  listaQuestaoController.listarDoUsuario,
);

// GET vinculos lista<->turma de uma turma especifica.
listaQuestaoRouter.get(
  '/turma/:turmaId/vinculos',
  validarRequisicao(schemaParametroTurmaId, 'params'),
  listaQuestaoController.listarVinculosDaTurma,
);

// GET listas vinculadas a uma turma.
listaQuestaoRouter.get(
  '/turma/:turmaId',
  validarRequisicao(schemaParametroTurmaId, 'params'),
  listaQuestaoController.listarPorTurma,
);

// PATCH atualiza dados basicos da lista (valida params e corpo).
listaQuestaoRouter.patch(
  '/:id',
  validarRequisicao(schemaParametroId, 'params'),
  validarRequisicao(schemaAtualizarLista),
  listaQuestaoController.atualizar,
);

// POST vincula questoes a uma lista.
listaQuestaoRouter.post(
  '/:id/questoes',
  validarRequisicao(schemaParametroId, 'params'),
  validarRequisicao(schemaVincularQuestoes),
  listaQuestaoController.vincularQuestoes,
);

// PATCH reordena as questoes dentro da lista.
listaQuestaoRouter.patch(
  '/:id/questoes/ordem',
  validarRequisicao(schemaParametroId, 'params'),
  validarRequisicao(schemaReordenarQuestoes),
  listaQuestaoController.reordenarQuestoes,
);

// DELETE remove o vinculo de uma questao com a lista.
listaQuestaoRouter.delete(
  '/:id/questoes/:questaoId',
  validarRequisicao(schemaParametroListaQuestao, 'params'),
  listaQuestaoController.desvincularQuestao,
);

// POST vincula a lista a uma ou mais turmas (atribuicao).
listaQuestaoRouter.post(
  '/:id/turmas',
  validarRequisicao(schemaParametroId, 'params'),
  validarRequisicao(schemaVincularTurmas),
  listaQuestaoController.vincularTurmas,
);

// PATCH atualiza um vinculo lista<->turma (ex.: prazo).
listaQuestaoRouter.patch(
  '/:id/turmas/:turmaId',
  validarRequisicao(schemaParametroListaTurma, 'params'),
  validarRequisicao(schemaAtualizarVinculoListaTurma),
  listaQuestaoController.atualizarVinculo,
);

// DELETE desvincula a lista de uma turma.
listaQuestaoRouter.delete(
  '/:id/turmas/:turmaId',
  validarRequisicao(schemaParametroListaTurma, 'params'),
  listaQuestaoController.desvincularTurma,
);

// GET estatisticas da lista em uma turma especifica.
listaQuestaoRouter.get(
  '/:id/estatisticas/turma/:turmaId',
  validarRequisicao(schemaEstatisticasParams, 'params'),
  listaQuestaoController.estatisticas,
);

// GET detalhe de uma lista pelo id (rota generica fica apos as especificas).
listaQuestaoRouter.get(
  '/:id',
  validarRequisicao(schemaParametroId, 'params'),
  listaQuestaoController.buscar,
);

// DELETE remove a lista.
listaQuestaoRouter.delete(
  '/:id',
  validarRequisicao(schemaParametroId, 'params'),
  listaQuestaoController.deletar,
);

// GET exporta a lista em PDF (reaplica autenticacao por seguranca).
listaQuestaoRouter.get(
  '/:id/pdf',
  middlewareAutenticacao,
  listaQuestaoController.downloadPdf
);

export { listaQuestaoRouter };
