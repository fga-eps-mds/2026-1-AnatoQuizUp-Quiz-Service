import type { NextFunction, Request, Response } from "express";
import type { RespostaQuestaoQuizDto } from "./dto/resposta_questao_quiz_dto";
import type { RespostaPaginada } from "@/shared/types/api.types";
import type { QuizService } from "./quiz.service";

export class QuizController {
    
    constructor(private readonly quizService: QuizService) {}

    buscar_questoes_quiz = async (request: Request, response: Response<RespostaPaginada<RespostaQuestaoQuizDto>>, next: NextFunction) => {
        try{
            const questoes_quiz = await this.quizService.buscar_questoes_quiz(request.query);
            return response.status(200).json(questoes_quiz);
        }
        catch (error) {
            return next(error);
        }
    }

}