import type { Request, Response } from 'express';

import type { PontuacoesQuery } from './ranking.schemas';
import type { RankingService } from './ranking.service';

export class RankingController {
  constructor(private readonly service: RankingService) {}

  listarPontuacoes = async (
    req: Request<unknown, unknown, unknown, PontuacoesQuery>,
    res: Response,
  ) => {
    try {
      const usuarioIds = req.query.usuarioIds;
      const dados = await this.service.obterPontuacoes(usuarioIds);

      return res.status(200).json({ dados });
    } catch (error) {
      console.error('Erro no RankingController [pontuacoes]:', error);
      return res.status(500).json({ error: 'Erro ao calcular pontuações do ranking.' });
    }
  };
}
