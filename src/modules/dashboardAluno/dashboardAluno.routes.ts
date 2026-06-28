import { Router } from "express";

import { PAPEIS } from "@/shared/constants/papeis";
import { middlewarePapeis } from "@/shared/middlewares/papeis.middleware";

import { DashboardAlunoController } from "./dashboardAluno.controller";
import { DashboardAlunoRepository } from "./dashboardAluno.repository";
import { DashboardAlunoService } from "./dashboardAluno.service";

// Montagem das dependencias do dashboard do aluno.
const dashboardAlunoRepository = new DashboardAlunoRepository();
const dashboardAlunoService = new DashboardAlunoService(dashboardAlunoRepository);
const dashboardAlunoController = new DashboardAlunoController(dashboardAlunoService);

const dashboardAlunoRouter = Router();

// GET dashboard do proprio aluno (restrito ao papel ALUNO).
dashboardAlunoRouter.get(
  "/",
  middlewarePapeis(PAPEIS.ALUNO),
  dashboardAlunoController.obterDashboard,
);

export { dashboardAlunoRouter };
