import type { NextFunction, Request, Response } from "express";

import { MENSAGENS } from "@/shared/constants/mensagens";
import type { RespostaApiSucesso, RespostaPaginada } from "@/shared/types/api.types";

import type {
  CriarQuestaoDto,
  ListarQuestoesQueryDto,
  RespostaQuestaoDto,
} from "./dto/questao.types";
import type { QuestaoService } from "./questao.service";

export class QuestaoController {
  constructor(private readonly questionService: QuestaoService) {}

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

  criar = async (
    request: Request<unknown, unknown, CriarQuestaoDto>,
    response: Response<RespostaApiSucesso<RespostaQuestaoDto>>,
    next: NextFunction,
  ) => {
    try {
      const questao = await this.questionService.criar(request.body, request.usuario?.id ?? "");

      return response.status(201).json({
        mensagem: MENSAGENS.questaoCriada,
        dados: questao,
      });
    } catch (error) {
      return next(error);
    }
  };

  atualizar = async (request: Request, response: Response, next: NextFunction) => {
    try {
      
      const id = request.params.id as string; 
      
      const questao = await this.questionService.atualizar(
        id, 
        request.body, 
        request.usuario?.id ?? ""
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
