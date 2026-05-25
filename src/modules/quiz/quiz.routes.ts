import { Router } from "express";

import { PAPEIS } from "@/shared/constants/papeis";
import { middlewarePapeis } from "@/shared/middlewares/papeis.middleware";
import { QuizController } from "./quiz.controller";
import { QuizService } from "./quiz.service";
import { QuizRepository } from "./quiz.repository";
import { validarRequisicao } from "@/shared/middlewares/validacao.middleware";
import {
  schemaBuscarQuestaoQuiz,
  schemaResponderQuestaoQuiz,
  schemaHistoricoQuizQuestoesUsuario,
} from "./quiz.schemas";

const quizRepository = new QuizRepository();
const quizService = new QuizService(quizRepository);
const quizController = new QuizController(quizService);

const quizRouter = Router();

quizRouter.use(middlewarePapeis(PAPEIS.ALUNO, PAPEIS.ADMINISTRADOR, PAPEIS.PROFESSOR));

quizRouter.get(
  "/",
  validarRequisicao(schemaBuscarQuestaoQuiz, "query"),
  quizController.buscarQuestoesQuiz,
);

quizRouter.post(
  "/responder",
  validarRequisicao(schemaResponderQuestaoQuiz, "body"),
  quizController.responderQuestaoQuiz,
);

quizRouter.get("/quantidade_por_tema", quizController.buscarQuantidadeDeQuestoesPorTema);

quizRouter.get(
  "/historico",
  validarRequisicao(schemaHistoricoQuizQuestoesUsuario, "query"),
  quizController.buscarHistorico,
);

export { quizRouter };
