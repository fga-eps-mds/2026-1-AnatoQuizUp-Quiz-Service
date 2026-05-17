import type { RespostaQuestaoQuizDto } from "@/modules/quiz/dto/resposta_questao_quiz_dto";
import type { QuizService } from "@/modules/quiz/quiz.service";
import type { Request, Response, NextFunction } from "express";
import { QuizController } from "@/modules/quiz/quiz.controller";

import { DIFICULDADE_API, TIPO_QUESTAO_API } from "@/modules/questoes/dto/question.types";

function criarQuestaoResposta(): RespostaQuestaoQuizDto {
  return {
    id: "questao-id",
    tema: { id: "tema-id", nome: "Cardio" },
    tipo: TIPO_QUESTAO_API.MULTIPLA_ESCOLHA,
    dificuldade: DIFICULDADE_API.MEDIA,
    imagem: null,
    enunciado: "Enunciado",
    alternativas: { A: "A", B: "B", C: "C", D: "D", E: "E" },
    status: "ATIVO",
  };
}

function criarResponseMock<T>() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));

  return {
    response: { status } as unknown as Response<T>,
    status,
    json,
  };
}

describe("Testa Quiz Controller", () => {
  const next = jest.fn() as NextFunction;
  let controller: QuizController;
  let quizService: jest.Mocked<QuizService>;

  beforeEach(() => {
    quizService = {
      buscar_questoes_quiz: jest.fn(),
    } as unknown as jest.Mocked<QuizService>;
    controller = new QuizController(quizService);
    jest.clearAllMocks();
  });

  test("filtrar deve encaminhar os parametros de query para o service", async () => {
    const mockResposta = {
      dados: [criarQuestaoResposta()],
      metadados: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };

    quizService.buscar_questoes_quiz.mockResolvedValue(mockResposta);

    const request = {
      query: {
        tema: "Cardio",
        dificuldade: "MEDIA",
        tipo: "MULTIPLA_ESCOLHA",
        page: "1",
        limit: "10",
      },
    } as unknown as Request;

    const { response, status, json } = criarResponseMock();

    await controller.buscarQuestoesQuiz(request, response, next);

    expect(quizService.buscar_questoes_quiz).toHaveBeenCalledWith(
      expect.objectContaining({
        tema: "Cardio",
        dificuldade: "MEDIA",
      }),
    );

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(mockResposta);
  });
});
