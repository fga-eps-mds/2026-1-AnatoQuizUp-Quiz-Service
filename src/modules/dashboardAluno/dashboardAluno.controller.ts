import type { NextFunction, Request, Response } from "express";

import type { DashboardAlunoDto } from "./dto/dashboardAluno.types";
import type { DashboardAlunoService } from "./dashboardAluno.service";

export class DashboardAlunoController {
  constructor(private readonly service: DashboardAlunoService) {}

  obterDashboard = async (
    request: Request,
    response: Response<DashboardAlunoDto>,
    next: NextFunction,
  ) => {
    try {
      const dashboard = await this.service.obterDashboard(request.usuario?.id);
      return response.status(200).json(dashboard);
    } catch (error) {
      return next(error);
    }
  };
}
