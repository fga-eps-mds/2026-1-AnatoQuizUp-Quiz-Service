import type { NextFunction, Request, Response } from "express";

import { MENSAGENS } from "@/shared/constants/mensagens";
import type { RespostaApiSucesso, RespostaPaginada } from "@/shared/types/api.types";

import type { ListarQuestoesQueryDto, RespostaQuestaoDto } from "./dto/question.types";
import type { QuestionService } from "./questoes.service";

export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

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

  filtrar = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const questoes = await this.questionService.filtrar(request.query);
      return response.status(200).json(questoes);
    } catch (error) {
      return next(error);
    }
  };

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
