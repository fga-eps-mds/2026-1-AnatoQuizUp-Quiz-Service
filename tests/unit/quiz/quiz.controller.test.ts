import type { RespostaQuestaoQuizDto } from "@/modules/quiz/dto/resposta_questao_quiz_dto";
import type { QuizService } from "@/modules/quiz/quiz.service";
import type { Request, Response, NextFunction } from "express";
import { QuizController } from "@/modules/quiz/quiz.controller";

import { DIFICULDADE_API, TIPO_QUESTAO_API } from "@/modules/questoes/dto/question.types";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { MENSAGENS } from "@/shared/constants/mensagens";

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
      buscarQuestoesQuiz: jest.fn(),
      responderQuestaoQuiz: jest.fn(),
      buscarQuantidadeDeQuestoesPorTema: jest.fn(),
    } as unknown as jest.Mocked<QuizService>;
    controller = new QuizController(quizService);
    jest.clearAllMocks();
  });

  test("filtrar deve encaminhar os parametros de query para o service", async () => {
    const mockResposta = {
      dados: [criarQuestaoResposta()],
      metadados: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };

    quizService.buscarQuestoesQuiz.mockResolvedValue(mockResposta);

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

    expect(quizService.buscarQuestoesQuiz).toHaveBeenCalledWith(
      expect.objectContaining({
        tema: "Cardio",
        dificuldade: "MEDIA",
      }),
    );

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(mockResposta);
  });

  test("deve chamar next quando o service lançar erro ao buscar questoes do quiz", async () => {
    const erro = new Error("Erro no serviço");

    quizService.buscarQuestoesQuiz.mockRejectedValue(erro);

    const request = {
      query: {
        tema: "Cardio",
      },
    } as unknown as Request;

    const { response } = criarResponseMock();
    const nextMock = jest.fn();

    await controller.buscarQuestoesQuiz(request, response, nextMock);

    expect(nextMock).toHaveBeenCalledWith(erro);
  });

  test("deve responder questão do quiz com sucesso", async () => {
    const body = {
      questaoId: "questao-1",
      resposta: "A",
    };

    const feedbackMock = {
      correcao: true,
      saibaMais: "A",
    };

    const request = {
      body,
      usuario: {
        id: "usuario-1",
      },
    } as Request;

    quizService.responderQuestaoQuiz.mockResolvedValue(feedbackMock);

    const { response, status, json } = criarResponseMock();

    await controller.responderQuestaoQuiz(request, response, next);

    expect(quizService.responderQuestaoQuiz).toHaveBeenCalledWith(body, "usuario-1");
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(feedbackMock);
  });

  test("deve chamar next quando service lançar error ao buscar questoes para quiz", async () => {
    const error = new ErroAplicacao({
      codigoStatus: 401,
      codigo: CodigoDeErro.NAO_AUTORIZADO,
      mensagem: MENSAGENS.usuarioAutenticadoEncontrado,
    });
    quizService.responderQuestaoQuiz.mockRejectedValue(error);

    const { response } = criarResponseMock();
    const nextMock = jest.fn();
    const request = {} as Request;
    await controller.responderQuestaoQuiz(request, response, nextMock);

    expect(nextMock).toHaveBeenCalledWith(error);
  });

  test("deve retornar status 200 e quantidade de questões por tema", async () => {
    const quantidadeMock = [
      {
        nome: "Português",
        totalQuestoes: 4,
        porDificuldade: {
          FACIL: 2,
          MEDIA: 1,
          DIFICIL: 1,
        },
      },
    ];
    quizService.buscarQuantidadeDeQuestoesPorTema.mockResolvedValue(quantidadeMock);

    const request = {} as Request;
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await controller.buscarQuantidadeDeQuestoesPorTema(request, response, next);

    expect(quizService.buscarQuantidadeDeQuestoesPorTema).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      quantidadeDeQuestoesPorTema: quantidadeMock,
    });
  });

  test("deve chamar next quando service lançar error ao buscar quantidade de questoes por tema", async () => {
    const error = new ErroAplicacao({
      codigoStatus: 401,
      codigo: CodigoDeErro.TEMAS_NAO_ENCONTRADOS,
      mensagem: MENSAGENS.temasNaoEncontrados,
    });
    quizService.buscarQuantidadeDeQuestoesPorTema.mockRejectedValue(error);

    const { response } = criarResponseMock();
    const nextMock = jest.fn();
    const request = {} as Request;
    await controller.buscarQuantidadeDeQuestoesPorTema(request, response, nextMock);

    expect(nextMock).toHaveBeenCalledWith(error);
  });
});
