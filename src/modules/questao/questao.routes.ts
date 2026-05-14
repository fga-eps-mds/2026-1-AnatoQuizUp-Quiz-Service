import { Router } from "express";

import { PAPEIS } from "@/shared/constants/papeis";
import { middlewarePapeis } from "@/shared/middlewares/papeis.middleware";
import { validarRequisicao } from "@/shared/middlewares/validacao.middleware";

import { QuestaoController } from "./questao.controller";
import { QuestaoRepository } from "./questao.repository";
import { QuestaoService } from "./questao.service";
import {
  schemaAtualizarQuestao,
  schemaBuscarQuestaoPorId,
  schemaCriarQuestao,
  schemaListarQuestoes,
  schemaFiltrarQuestoes,
} from "./questao.schemas";

const questionRepository = new QuestaoRepository();
const questionService = new QuestaoService(questionRepository);
const questionController = new QuestaoController(questionService);

const questaoRouter = Router();

questaoRouter.use(middlewarePapeis(PAPEIS.PROFESSOR, PAPEIS.ADMINISTRADOR));

questaoRouter.post("/", validarRequisicao(schemaCriarQuestao), questionController.criar);
questaoRouter.get(
  "/busca", 
  validarRequisicao(schemaFiltrarQuestoes, "query"), 
  questionController.filtrar
);

questaoRouter.get(
  "/",
  validarRequisicao(schemaListarQuestoes, "query"),
  questionController.listar,
);
questaoRouter.get(
  "/:id",
  validarRequisicao(schemaBuscarQuestaoPorId, "params"),
  questionController.buscarPorId,
);

questaoRouter.put(
  "/:id",
  validarRequisicao(schemaBuscarQuestaoPorId, "params"),
  validarRequisicao(schemaAtualizarQuestao),
  questionController.atualizar,
);
questaoRouter.delete(
  "/:id",
  validarRequisicao(schemaBuscarQuestaoPorId, "params"),
  questionController.remover,
);

export { questaoRouter };
