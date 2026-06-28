import type { NextFunction, Request, Response } from "express";

import type { DashboardAlunoDto } from "./dto/dashboardAluno.types";
import type { DashboardAlunoService } from "./dashboardAluno.service";

// Controller HTTP do dashboard do aluno: consolida o desempenho do proprio usuario.
export class DashboardAlunoController {
  constructor(private readonly service: DashboardAlunoService) {}

  /**
   * GET metricas do aluno autenticado (acertos por tema, listas, etc.).
   *
   * @param request Requisicao autenticada (usuario vem do token).
   * @param response Resposta com o dashboard consolidado do aluno.
   * @param next Repasse de erro ao middleware central.
   */
  obterDashboard = async (
    request: Request,
    response: Response<DashboardAlunoDto>,
    next: NextFunction,
  ) => {
    try {
      // O service monta o dashboard a partir do id do usuario logado.
      const dashboard = await this.service.obterDashboard(request.usuario?.id);
      return response.status(200).json(dashboard);
    } catch (error) {
      return next(error);
    }
  };
}
