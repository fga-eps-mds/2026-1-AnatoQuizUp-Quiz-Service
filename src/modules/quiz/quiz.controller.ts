import type { NextFunction, Request, Response } from "express";
import type { RespostaQuestaoQuizDto } from "./dto/responses/resposta_questao_quiz_dto";
import type { RespostaPaginada } from "@/shared/types/api.types";
import type { QuizService } from "./quiz.service";
import type { ResponderQuestaoQuizDto } from "./dto/requests/responder_questao_quiz_dto";

// Controller HTTP do quiz livre: busca de questoes, resposta, saldo e historico.
// Delega ao service e devolve JSON; erros sao repassados ao middleware central via next.
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  /**
   * GET questoes do quiz de forma paginada, aplicando os filtros vindos na query.
   *
   * @param request Requisicao com tema/dificuldade/paginacao na query.
   * @param response Resposta paginada com as questoes do quiz.
   * @param next Repasse de erro ao middleware central.
   */
  buscarQuestoesQuiz = async (
    request: Request,
    response: Response<RespostaPaginada<RespostaQuestaoQuizDto>>,
    next: NextFunction,
  ) => {
    try {
      // Repassa a query (tema, paginacao) direto ao service, que valida e consulta.
      const questoes_quiz = await this.quizService.buscarQuestoesQuiz(request.query);
      return response.status(200).json(questoes_quiz);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST resposta de uma questao do quiz; usa o usuario autenticado para feedback/recompensa.
   *
   * @param request Requisicao com a resposta no corpo (usuario vem do token).
   * @param response Resposta com o feedback (correcao, moedas, conquistas).
   * @param next Repasse de erro ao middleware central.
   */
  responderQuestaoQuiz = async (
    request: Request<unknown, unknown, ResponderQuestaoQuizDto>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      // Service recebe a resposta, calcula acerto/erro e credita moedas quando aluno.
      const feedback = await this.quizService.responderQuestaoQuiz(
        request.body,
        request.usuario?.id ?? "",
        request.usuario?.papel,
      );
      return response.status(200).json(feedback);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET saldo atual de moedas do usuario logado (gamificacao).
   *
   * @param request Requisicao autenticada (usuario vem do token).
   * @param response Resposta com o saldo de moedas.
   * @param next Repasse de erro ao middleware central.
   */
  buscarSaldoMoedas = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const saldo = await this.quizService.buscarSaldoMoedas(request.usuario?.id ?? "");
      return response.status(200).json(saldo);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET contagem de questoes disponiveis por tema (para montar o quiz).
   *
   * @param request Requisicao HTTP.
   * @param response Resposta com a quantidade de questoes por tema.
   * @param next Repasse de erro ao middleware central.
   */
  buscarQuantidadeDeQuestoesPorTema = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const quantidadeDeQuestoesPorTema =
        await this.quizService.buscarQuantidadeDeQuestoesPorTema();
      // Encapsula em objeto para manter contrato estavel da resposta.
      return response.status(200).json({ quantidadeDeQuestoesPorTema });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET historico paginado de questoes ja respondidas pelo usuario.
   *
   * @param request Requisicao com a paginacao na query (usuario vem do token).
   * @param response Resposta paginada com o historico de resolucoes.
   * @param next Repasse de erro ao middleware central.
   */
  buscarHistorico = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const listaResolucaoQuestoesUsuario = await this.quizService.buscarHistorico(
        request.usuario?.id,
        request.query,
      );
      return response.status(200).json(listaResolucaoQuestoesUsuario);
    } catch (error) {
      return next(error);
    }
  };
}
