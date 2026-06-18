import type { NextFunction, Request, Response } from "express";

import { MENSAGENS } from "@/shared/constants/mensagens";
import type { RespostaApiSucesso, RespostaPaginada } from "@/shared/types/api.types";

import type {
  AlterarDestaqueConquistaDto,
  ResumoConquistaDto,
  ResumoConquistaDesbloqueadaDto,
  PaginacaoQueryDto,
  ProgressoConquistaDto,
} from "./conquistas.dto.ts";

import type { ConquistaService } from "./conquistas.service";

export class ConquistaController {
  constructor(private readonly conquistaService: ConquistaService) {}

  listarConquistas = async (
    request: Request<unknown, unknown, unknown, PaginacaoQueryDto>,
    response: Response<RespostaPaginada<ResumoConquistaDto>>,
    next: NextFunction,
  ) => {
    try {
      const conquistas = await this.conquistaService.listarConquistas(request.query);

      return response.status(200).json(conquistas);
    } catch (error) {
      return next(error);
    }
  };

  listarMeuProgresso = async (
    request: Request<unknown, unknown, unknown, PaginacaoQueryDto>,
    response: Response<RespostaPaginada<ProgressoConquistaDto>>,
    next: NextFunction,
  ) => {
    try {
      const usuarioId = request.usuario?.id ?? "";

      const progresso = await this.conquistaService.listarProgressoUsuario(
        request.query,
        usuarioId,
      );

      return response.status(200).json(progresso);
    } catch (error) {
      return next(error);
    }
  };

  listarMeuProgressoEmConquista = async (
    request: Request<{ id: string }, unknown, unknown, unknown>,
    response: Response<ProgressoConquistaDto>,
    next: NextFunction,
  ) => {
    try {
      const usuarioId = request.usuario?.id ?? "";

      const progresso = await this.conquistaService.listarMeuProgressoEmConquista(
        usuarioId,
        request.params.id,
      );

      return response.status(200).json(progresso);
    } catch (error) {
      return next(error);
    }
  };

  listarMinhasConquistas = async (
    request: Request<unknown, unknown, unknown, PaginacaoQueryDto>,
    response: Response<RespostaPaginada<ResumoConquistaDesbloqueadaDto>>,
    next: NextFunction,
  ) => {
    try {
      const usuarioId = request.usuario?.id ?? "";

      const conquistas = await this.conquistaService.listarDesbloqueadasUsuario(
        request.query,
        usuarioId,
      );

      return response.status(200).json(conquistas);
    } catch (error) {
      return next(error);
    }
  };

  listarDestacadas = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const usuarioId = request.usuario?.id ?? "";

      const conquistas = await this.conquistaService.buscarConquistasDestacadas(usuarioId);

      return response.status(200).json({
        mensagem: "Conquistas destacadas encontradas.",
        dados: conquistas,
      });
    } catch (error) {
      return next(error);
    }
  };

  alterarDestaque = async (
    request: Request<{ id: string }, unknown, AlterarDestaqueConquistaDto>,
    response: Response<RespostaApiSucesso<{ sucesso: boolean }>>,
    next: NextFunction,
  ) => {
    try {
      const usuarioId = request.usuario?.id ?? "";

      const resultado = await this.conquistaService.alterarDestaque(
        usuarioId,
        request.params.id,
        request.body.destaque,
      );

      return response.status(200).json({
        mensagem: MENSAGENS.operacaoRealizadaComSucesso,
        dados: resultado,
      });
    } catch (error) {
      return next(error);
    }
  };
}
