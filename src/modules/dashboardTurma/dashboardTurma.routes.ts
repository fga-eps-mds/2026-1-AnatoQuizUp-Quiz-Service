import { Router } from 'express';
import { PAPEIS } from '@/shared/constants/papeis';
import { middlewarePapeis } from '@/shared/middlewares/papeis.middleware';
import { validarRequisicao } from '@/shared/middlewares/validacao.middleware';
import { TurmaDashboardRepository } from './dashboardTurma.repository';
import { TurmaDashboardService } from './dashboardTurma.service';
import { TurmaDashboardController } from './dashboardTurma.controller';
import { schemaParamsDashboard, schemaParamsListaDashboard } from './dashboardTruma.schemas'; 

const dashboardRouter = Router();

const turmaDashboardRepository = new TurmaDashboardRepository();
const turmaDashboardService = new TurmaDashboardService(turmaDashboardRepository);
const turmaDashboardController = new TurmaDashboardController(turmaDashboardService);

const apenasGestao = middlewarePapeis(PAPEIS.PROFESSOR, PAPEIS.ADMINISTRADOR);

dashboardRouter.get(
  '/:id/macro',
  apenasGestao,
  validarRequisicao(schemaParamsDashboard, 'params'),
  turmaDashboardController.listarMacro
);

dashboardRouter.get(
  '/:id/individual',
  apenasGestao,
  validarRequisicao(schemaParamsDashboard, 'params'),
  turmaDashboardController.listarIndividual
);

dashboardRouter.get(
  '/:id/listas',
  apenasGestao,
  validarRequisicao(schemaParamsDashboard, 'params'),
  turmaDashboardController.listarPorListas
);

dashboardRouter.get(
  '/:id/listas/:listaId',
  apenasGestao,
  validarRequisicao(schemaParamsListaDashboard, 'params'),
  turmaDashboardController.listarDesempenhoListaIndividual
);

export { dashboardRouter };
