import type { NextFunction, Request, Response } from "express";
import type { RespostaQuestaoQuizDto } from "./dto/resposta_questao_quiz_dto";
import type { RespostaPaginada } from "@/shared/types/api.types";
import type { QuizService } from "./quiz.service";
import type { ResponderQuestaoQuizDto } from "./dto/responder_questao_quiz_dto";

export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  buscarQuestoesQuiz = async (
    request: Request,
    response: Response<RespostaPaginada<RespostaQuestaoQuizDto>>,
    next: NextFunction,
  ) => {
    try {
      const questoes_quiz = await this.quizService.buscarQuestoesQuiz(request.query);
      return response.status(200).json(questoes_quiz);
    } catch (error) {
      return next(error);
    }
  };

  responderQuestaoQuiz = async (
    request: Request<unknown, unknown, ResponderQuestaoQuizDto>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const feedback = await this.quizService.responderQuestaoQuiz(
        request.body,
        request.usuario?.id ?? "",
      );
      return response.status(200).json(feedback);
    } catch (error) {
      return next(error);
    }
  };
}
