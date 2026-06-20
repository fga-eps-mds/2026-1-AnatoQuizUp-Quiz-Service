import { Router } from "express";

import { PAPEIS } from "@/shared/constants/papeis";

import { middlewarePapeis } from "@/shared/middlewares/papeis.middleware";
import { validarRequisicao } from "@/shared/middlewares/validacao.middleware";

import { ConquistaController } from "./conquistas.controller";
import { ConquistaRepository } from "./conquistas.repository";
import { ConquistaService } from "./conquistas.service";

import {
  schemaAlterarDestaqueConquista,
  schemaDesbloqueioId,
  schemaPaginacaoConquistas,
} from "./conquistas.schemas";

const conquistaRepository = new ConquistaRepository();

const conquistaService = new ConquistaService(conquistaRepository);

const conquistaController = new ConquistaController(conquistaService);

const conquistaRouter = Router();

conquistaRouter.use(middlewarePapeis(PAPEIS.ALUNO, PAPEIS.ADMINISTRADOR));

conquistaRouter.get(
  "/",
  validarRequisicao(schemaPaginacaoConquistas, "query"),
  conquistaController.listarConquistas,
);

conquistaRouter.get(
  "/meu-progresso",
  validarRequisicao(schemaPaginacaoConquistas, "query"),
  conquistaController.listarMeuProgresso,
);

conquistaRouter.get(
  "/meu-progresso/:id",
  validarRequisicao(schemaDesbloqueioId, "params"),
  conquistaController.listarMeuProgressoEmConquista,
);

conquistaRouter.get(
  "/minhas",
  validarRequisicao(schemaPaginacaoConquistas, "query"),
  conquistaController.listarMinhasConquistas,
);

conquistaRouter.get("/destaques", conquistaController.listarDestacadas);

conquistaRouter.patch(
  "/desbloqueios/:id/destaque",
  validarRequisicao(schemaDesbloqueioId, "params"),
  validarRequisicao(schemaAlterarDestaqueConquista),
  conquistaController.alterarDestaque,
);

export { conquistaRouter };
