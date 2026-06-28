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

// Montagem das dependencias do modulo de conquistas.
const conquistaRepository = new ConquistaRepository();

const conquistaService = new ConquistaService(conquistaRepository);

const conquistaController = new ConquistaController(conquistaService);

const conquistaRouter = Router();

// Atalhos de autorizacao reutilizados pelas rotas abaixo.
const apenasAluno = middlewarePapeis(PAPEIS.ALUNO);
const alunoOuAdministrador = middlewarePapeis(PAPEIS.ALUNO, PAPEIS.ADMINISTRADOR);

// GET catalogo de conquistas (aluno ou administrador).
conquistaRouter.get(
  "/",
  alunoOuAdministrador,
  validarRequisicao(schemaPaginacaoConquistas, "query"),
  conquistaController.listarConquistas,
);

// GET progresso do aluno em cada conquista.
conquistaRouter.get(
  "/meu-progresso",
  apenasAluno,
  validarRequisicao(schemaPaginacaoConquistas, "query"),
  conquistaController.listarMeuProgresso,
);

// GET progresso do aluno em uma conquista especifica.
conquistaRouter.get(
  "/meu-progresso/:id",
  apenasAluno,
  validarRequisicao(schemaDesbloqueioId, "params"),
  conquistaController.listarMeuProgressoEmConquista,
);

// GET conquistas ja desbloqueadas pelo aluno.
conquistaRouter.get(
  "/minhas",
  apenasAluno,
  validarRequisicao(schemaPaginacaoConquistas, "query"),
  conquistaController.listarMinhasConquistas,
);

// GET conquistas que o aluno escolheu destacar no perfil.
conquistaRouter.get("/destaques", apenasAluno, conquistaController.listarDestacadas);

// GET destaques de varios usuarios (para exibir em perfis/ranking).
conquistaRouter.get(
  "/usuarios/destaques",
  apenasAluno,
  validarRequisicao(schemaUsuariosIds, "query"),
  conquistaController.listarDestaquesUsuarios,
);

// PATCH liga/desliga o destaque de uma conquista desbloqueada.
conquistaRouter.patch(
  "/desbloqueios/:id/destaque",
  apenasAluno,
  validarRequisicao(schemaDesbloqueioId, "params"),
  validarRequisicao(schemaAlterarDestaqueConquista),
  conquistaController.alterarDestaque,
);

// GET detalhe de uma conquista (rota generica por ultimo).
conquistaRouter.get(
  "/:id",
  apenasAluno,
  validarRequisicao(schemaDesbloqueioId, "params"),
  conquistaController.buscarDetalhe,
);

export { conquistaRouter };
