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

// Montagem das dependencias do modulo de resolucao de listas.
const resolucaoListaRepository = new ResolucaoListaRepository();
const resolucaoListaService = new ResolucaoListaService(resolucaoListaRepository);
const resolucaoListaController = new ResolucaoListaController(resolucaoListaService);

const resolucaoListaRouter = Router();

// Resolucao de listas e atividade do aluno: restrito ao papel ALUNO.
resolucaoListaRouter.use(middlewarePapeis(PAPEIS.ALUNO));

// GET listas atribuidas ao aluno (bind preserva o "this" do controller).
resolucaoListaRouter.get(
  "/",
  validarRequisicao(schemaListarListas, "query"),
  resolucaoListaController.listar.bind(resolucaoListaController)
);

// GET detalhe de uma lista para resolucao.
resolucaoListaRouter.get(
  "/:id",
  validarRequisicao(schemaBuscarListaPorId, "params"),
  resolucaoListaController.buscarPorId.bind(resolucaoListaController)
);

// POST salva progresso parcial (autosave) sem submeter.
resolucaoListaRouter.post(
  "/:id/autosave",
  validarRequisicao(schemaSalvarProgresso, "body"),
  resolucaoListaController.autosave.bind(resolucaoListaController)
);

// POST submete a lista definitivamente para correcao.
resolucaoListaRouter.post(
  "/:id/submeter",
  validarRequisicao(schemaSubmeterLista, "params"),
  resolucaoListaController.submeter.bind(resolucaoListaController)
);

// GET exporta em PDF a lista resolvida pelo aluno.
resolucaoListaRouter.get(
  '/:listaTurmaId/pdf',
  resolucaoListaController.downloadPdf
);

export { resolucaoListaRouter };