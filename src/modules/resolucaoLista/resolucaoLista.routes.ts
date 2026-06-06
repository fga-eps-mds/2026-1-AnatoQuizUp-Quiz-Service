import { Router } from "express";

import { PAPEIS } from "@/shared/constants/papeis";
import { middlewarePapeis } from "@/shared/middlewares/papeis.middleware";
import { validarRequisicao } from "@/shared/middlewares/validacao.middleware";

import { ResolucaoListaController } from "./resolucaoLista.controller";
import { ResolucaoListaRepository } from "./resolucaoLista.repository";
import { ResolucaoListaService } from "./resolucaoLista.service";

import {
  schemaListarListas,
  schemaBuscarListaPorId,
  schemaSalvarProgresso,
  schemaSubmeterLista
} from "./resolucaoLista.schemas";

const resolucaoListaRepository = new ResolucaoListaRepository();
const resolucaoListaService = new ResolucaoListaService(resolucaoListaRepository);
const resolucaoListaController = new ResolucaoListaController(resolucaoListaService);

const resolucaoListaRouter = Router();

resolucaoListaRouter.use(middlewarePapeis(PAPEIS.ALUNO));

resolucaoListaRouter.get(
  "/",
  validarRequisicao(schemaListarListas, "query"),
  resolucaoListaController.listar.bind(resolucaoListaController)
);

resolucaoListaRouter.get(
  "/:id",
  validarRequisicao(schemaBuscarListaPorId, "params"),
  resolucaoListaController.buscarPorId.bind(resolucaoListaController)
);

resolucaoListaRouter.post(
  "/:id/autosave",
  validarRequisicao(schemaSalvarProgresso, "body"),
  resolucaoListaController.autosave.bind(resolucaoListaController)
);

resolucaoListaRouter.post(
  "/:id/submeter",
  validarRequisicao(schemaSubmeterLista, "params"),
  resolucaoListaController.submeter.bind(resolucaoListaController)
);

resolucaoListaRouter.get(
  '/:listaTurmaId/pdf',
  resolucaoListaController.downloadPdf
);

export { resolucaoListaRouter };