import { Router } from 'express';

import { PAPEIS } from '@/shared/constants/papeis';
import { middlewareAutenticacao } from '@/shared/middlewares/autenticacao.middleware';
import { middlewarePapeis } from '@/shared/middlewares/papeis.middleware';
import { validarRequisicao } from '@/shared/middlewares/validacao.middleware';

import { ListaQuestaoController } from './lista.controller';
import { ListaQuestaoRepository } from './lista.repository';
import { ListaQuestaoService } from './lista.service';
import {
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

const listaQuestaoRepository = new ListaQuestaoRepository();
const listaQuestaoService = new ListaQuestaoService(listaQuestaoRepository);
const listaQuestaoController = new ListaQuestaoController(listaQuestaoService);

listaQuestaoRouter.use(middlewareAutenticacao);
listaQuestaoRouter.use(middlewarePapeis(PAPEIS.PROFESSOR));

listaQuestaoRouter.post(
  '/',
  validarRequisicao(schemaCriarLista),
  listaQuestaoController.criar,
);

listaQuestaoRouter.get(
  '/',
  validarRequisicao(schemaListarListas, 'query'),
  listaQuestaoController.listarDoUsuario,
);

listaQuestaoRouter.get(
  '/turma/:turmaId',
  validarRequisicao(schemaParametroTurmaId, 'params'),
  listaQuestaoController.listarPorTurma,
);

listaQuestaoRouter.patch(
  '/:id',
  validarRequisicao(schemaParametroId, 'params'),
  validarRequisicao(schemaAtualizarLista),
  listaQuestaoController.atualizar,
);

listaQuestaoRouter.post(
  '/:id/questoes',
  validarRequisicao(schemaParametroId, 'params'),
  validarRequisicao(schemaVincularQuestoes),
  listaQuestaoController.vincularQuestoes,
);

listaQuestaoRouter.patch(
  '/:id/questoes/ordem',
  validarRequisicao(schemaParametroId, 'params'),
  validarRequisicao(schemaReordenarQuestoes),
  listaQuestaoController.reordenarQuestoes,
);

listaQuestaoRouter.delete(
  '/:id/questoes/:questaoId',
  validarRequisicao(schemaParametroListaQuestao, 'params'),
  listaQuestaoController.desvincularQuestao,
);

listaQuestaoRouter.post(
  '/:id/turmas',
  validarRequisicao(schemaParametroId, 'params'),
  validarRequisicao(schemaVincularTurmas),
  listaQuestaoController.vincularTurmas,
);

listaQuestaoRouter.delete(
  '/:id/turmas/:turmaId',
  validarRequisicao(schemaParametroListaTurma, 'params'),
  listaQuestaoController.desvincularTurma,
);

listaQuestaoRouter.get(
  '/:id/estatisticas/turma/:turmaId',
  validarRequisicao(schemaEstatisticasParams, 'params'),
  listaQuestaoController.estatisticas,
);

listaQuestaoRouter.get(
  '/:id',
  validarRequisicao(schemaParametroId, 'params'),
  listaQuestaoController.buscar,
);

listaQuestaoRouter.delete(
  '/:id',
  validarRequisicao(schemaParametroId, 'params'),
  listaQuestaoController.deletar,
);

export { listaQuestaoRouter };
