import { Router } from 'express';
import { ListaQuestaoController } from './lista.controller';
import { ListaQuestaoService } from './lista.service';
import { ListaQuestaoRepository } from './lista.repository';
import { PAPEIS } from '@/shared/constants/papeis';
import { middlewareAutenticacao } from '@/shared/middlewares/autenticacao.middleware';
import { middlewarePapeis } from '@/shared/middlewares/papeis.middleware';
import { validarRequisicao } from '@/shared/middlewares/validacao.middleware';
import { schemaParametroId, schemaEstatisticasParams, schemaParametroTurmaId, schemaListarListas } from './lista.schemas';

const listaQuestaoRouter = Router();

const listaQuestaoRepository = new ListaQuestaoRepository();
const listaQuestaoService = new ListaQuestaoService(listaQuestaoRepository);
const listaQuestaoController = new ListaQuestaoController(listaQuestaoService);

listaQuestaoRouter.use(middlewareAutenticacao);
listaQuestaoRouter.use(middlewarePapeis(PAPEIS.PROFESSOR));

listaQuestaoRouter.get(
  '/',
  validarRequisicao(schemaListarListas, 'query'),
  listaQuestaoController.listarDoUsuario
);

listaQuestaoRouter.get(
  '/turma/:turmaId',
  validarRequisicao(schemaParametroTurmaId, 'params'),
  listaQuestaoController.listarPorTurma
);

listaQuestaoRouter.get(
  '/:id',
  validarRequisicao(schemaParametroId, 'params'),
  listaQuestaoController.buscar
);

listaQuestaoRouter.delete(
  '/:id',
  validarRequisicao(schemaParametroId, 'params'),
  listaQuestaoController.deletar
);

listaQuestaoRouter.get(
  '/:id/estatisticas/turma/:turmaId',
  validarRequisicao(schemaEstatisticasParams, 'params'),
  listaQuestaoController.estatisticas
);

export { listaQuestaoRouter };