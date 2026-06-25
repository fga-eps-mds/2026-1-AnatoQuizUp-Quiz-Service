import { Router } from 'express';

import { validarRequisicao } from '@/shared/middlewares/validacao.middleware';

import { RankingController } from './ranking.controller';
import { RankingRepository } from './ranking.repository';
import { schemaPontuacoesQuery } from './ranking.schemas';
import { RankingService } from './ranking.service';

const rankingRouter = Router();

const rankingRepository = new RankingRepository();
const rankingService = new RankingService(rankingRepository);
const rankingController = new RankingController(rankingService);

rankingRouter.get(
  '/pontuacoes',
  validarRequisicao(schemaPontuacoesQuery, 'query'),
  rankingController.listarPontuacoes,
);

export { rankingRouter };
