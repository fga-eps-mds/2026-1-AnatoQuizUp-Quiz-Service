import type { NextFunction, Request, Response } from "express";

import { MENSAGENS } from "@/shared/constants/mensagens";
import type { RespostaApiSucesso, RespostaPaginada } from "@/shared/types/api.types";

import type { ListarQuestoesQueryDto, RespostaQuestaoDto } from "./dto/question.types";
import type { QuestionService } from "./questoes.service";

// Controller HTTP de questoes: CRUD com upload de imagem; delega ao service e
// padroniza respostas/erros (erros via next para o middleware central).
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  /**
   * GET lista paginada de questoes.
   *
   * @param request Requisicao com a paginacao na query.
   * @param response Resposta paginada com as questoes.
   * @param next Repasse de erro ao middleware central.
   */
  listar = async (
    request: Request<unknown, unknown, unknown, ListarQuestoesQueryDto>,
    response: Response<RespostaPaginada<RespostaQuestaoDto>>,
    next: NextFunction,
  ) => {
    try {
      const questoes = await this.questionService.listar(request.query);

      return response.status(200).json(questoes);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET busca uma questao por id.
   *
   * @param request Requisicao com o id da questao na rota.
   * @param response Resposta com a questao encontrada.
   * @param next Repasse de erro ao middleware central.
   */
  buscarPorId = async (
    request: Request<{ id: string }>,
    response: Response<RespostaApiSucesso<RespostaQuestaoDto>>,
    next: NextFunction,
  ) => {
    try {
      const questao = await this.questionService.buscarPorId(request.params.id);

      return response.status(200).json({
        mensagem: MENSAGENS.questaoEncontrada,
        dados: questao,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET lista paginada com filtros (tema/dificuldade/tipo).
   *
   * @param request Requisicao com os filtros na query.
   * @param response Resposta paginada com as questoes filtradas.
   * @param next Repasse de erro ao middleware central.
   */
  filtrar = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const questoes = await this.questionService.filtrar(request.query);
      return response.status(200).json(questoes);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST cria questao; a imagem vem em request.file (multipart) e o autor do token.
   *
   * @param request Requisicao com os dados no corpo e a imagem em request.file.
   * @param response Resposta com a questao criada (201).
   * @param next Repasse de erro ao middleware central.
   */
  criar = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const dadosQuestao = request.body;
      const arquivoImagem = request.file;
      const usuarioId = request.usuario?.id ?? "";

      const questao = await this.questionService.criar(dadosQuestao, arquivoImagem, usuarioId);

      return response.status(201).json({
        mensagem: "Questão criada com sucesso!",
        dados: questao,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PUT atualiza questao; reconstroi as alternativas quando vem "achatadas" no form-data.
   *
   * @param request Requisicao com o id na rota, dados no corpo e imagem opcional.
   * @param response Resposta com a questao atualizada.
   * @param next Repasse de erro ao middleware central.
   */
  atualizar = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const id = request.params.id as string;

      // 1. Fazemos a cópia do body para não mutar o objeto original
      const dadosQuestao = { ...request.body };

      // 2. Reconstruímos as alternativas caso elas venham "achatadas" na edição
      if (!dadosQuestao.alternativas) {
        // Verifica se existe alguma chave começando com "alternativas["
        const temAlternativas = Object.keys(dadosQuestao).some((key) =>
          key.startsWith("alternativas["),
        );

        if (temAlternativas) {
          dadosQuestao.alternativas = {};
          for (const key in dadosQuestao) {
            const match = key.match(/^alternativas\[([A-E])\]$/);
            if (match) {
              const letra = match[1];
              dadosQuestao.alternativas[letra] = dadosQuestao[key];
              delete dadosQuestao[key];
            }
          }
        }
      }

      const arquivoImagem = request.file;
      const usuarioId = request.usuario?.id ?? "";

      const questao = await this.questionService.atualizar(
        id,
        dadosQuestao,
        arquivoImagem,
        usuarioId,
      );

      return response.status(200).json({
        mensagem: MENSAGENS.questaoAtualizada,
        dados: questao,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * DELETE remove (desativa) uma questao por id.
   *
   * @param request Requisicao com o id da questao na rota.
   * @param response Resposta confirmando a remocao.
   * @param next Repasse de erro ao middleware central.
   */
  remover = async (
    request: Request<{ id: string }>,
    response: Response<RespostaApiSucesso<RespostaQuestaoDto>>,
    next: NextFunction,
  ) => {
    try {
      const questao = await this.questionService.remover(request.params.id);

      return response.status(200).json({
        mensagem: MENSAGENS.questaoRemovida,
        dados: questao,
      });
    } catch (error) {
      return next(error);
    }
  };
}
