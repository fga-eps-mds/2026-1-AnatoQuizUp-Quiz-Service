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
  schemaUsuariosIds,
} from "./conquistas.schemas";

const conquistaRepository = new ConquistaRepository();

const conquistaService = new ConquistaService(conquistaRepository);

const conquistaController = new ConquistaController(conquistaService);

const conquistaRouter = Router();

const apenasAluno = middlewarePapeis(PAPEIS.ALUNO);
const alunoOuAdministrador = middlewarePapeis(PAPEIS.ALUNO, PAPEIS.ADMINISTRADOR);

conquistaRouter.get(
  "/",
  alunoOuAdministrador,
  validarRequisicao(schemaPaginacaoConquistas, "query"),
  conquistaController.listarConquistas,
);

conquistaRouter.get(
  "/meu-progresso",
  apenasAluno,
  validarRequisicao(schemaPaginacaoConquistas, "query"),
  conquistaController.listarMeuProgresso,
);

conquistaRouter.get(
  "/meu-progresso/:id",
  apenasAluno,
  validarRequisicao(schemaDesbloqueioId, "params"),
  conquistaController.listarMeuProgressoEmConquista,
);

conquistaRouter.get(
  "/minhas",
  apenasAluno,
  validarRequisicao(schemaPaginacaoConquistas, "query"),
  conquistaController.listarMinhasConquistas,
);

conquistaRouter.get("/destaques", apenasAluno, conquistaController.listarDestacadas);

conquistaRouter.get(
  "/usuarios/destaques",
  apenasAluno,
  validarRequisicao(schemaUsuariosIds, "query"),
  conquistaController.listarDestaquesUsuarios,
);

conquistaRouter.patch(
  "/desbloqueios/:id/destaque",
  apenasAluno,
  validarRequisicao(schemaDesbloqueioId, "params"),
  validarRequisicao(schemaAlterarDestaqueConquista),
  conquistaController.alterarDestaque,
);

conquistaRouter.get(
  "/:id",
  apenasAluno,
  validarRequisicao(schemaDesbloqueioId, "params"),
  conquistaController.buscarDetalhe,
);

export { conquistaRouter };
