import type { NextFunction, Request, Response } from "express";

import { MENSAGENS } from "@/shared/constants/mensagens";
import type { RespostaApiSucesso, RespostaPaginada } from "@/shared/types/api.types";

import type {
  AlterarDestaqueConquistaDto,
  ResumoConquistaDto,
  ResumoConquistaDesbloqueadaDto,
  PaginacaoQueryDto,
  ProgressoConquistaConsolidadoDto,
  ProgressoConquistaDto,
} from "./conquistas.dto.ts";

import type { ConquistaService } from "./conquistas.service";

// Query com a lista de ids de usuarios (consumida pelas rotas sociais).
type UsuariosIdsQuery = {
  usuarioIds: string[];
};

// Controller HTTP de conquistas: catalogo, progresso, desbloqueadas e destaques.
// Delega ao service e padroniza respostas; erros via next ao middleware central.
export class ConquistaController {
  constructor(private readonly conquistaService: ConquistaService) {}

  /**
   * GET catalogo paginado de todas as conquistas.
   *
   * @param request Requisicao com a paginacao na query.
   * @param response Resposta paginada com o resumo das conquistas.
   * @param next Repasse de erro ao middleware central.
   */
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

  /**
   * GET progresso consolidado do usuario em cada conquista (paginado).
   *
   * @param request Requisicao com a paginacao na query (usuario vem do token).
   * @param response Resposta paginada com o progresso consolidado.
   * @param next Repasse de erro ao middleware central.
   */
  listarMeuProgresso = async (
    request: Request<unknown, unknown, unknown, PaginacaoQueryDto>,
    response: Response<RespostaPaginada<ProgressoConquistaConsolidadoDto>>,
    next: NextFunction,
  ) => {
    try {
      const usuarioId = request.usuario?.id;

      const progresso = await this.conquistaService.listarProgressoUsuario(
        request.query,
        usuarioId,
      );

      return response.status(200).json(progresso);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET progresso do usuario em uma conquista especifica.
   *
   * @param request Requisicao com o id da conquista na rota.
   * @param response Resposta com o progresso na conquista.
   * @param next Repasse de erro ao middleware central.
   */
  listarMeuProgressoEmConquista = async (
    request: Request<{ id: string }, unknown, unknown, unknown>,
    response: Response<ProgressoConquistaDto>,
    next: NextFunction,
  ) => {
    try {
      const usuarioId = request.usuario?.id;

      const progresso = await this.conquistaService.listarMeuProgressoEmConquista(
        usuarioId,
        request.params.id,
      );

      return response.status(200).json(progresso);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET conquistas ja desbloqueadas pelo usuario (paginado).
   *
   * @param request Requisicao com a paginacao na query.
   * @param response Resposta paginada com as conquistas desbloqueadas.
   * @param next Repasse de erro ao middleware central.
   */
  listarMinhasConquistas = async (
    request: Request<unknown, unknown, unknown, PaginacaoQueryDto>,
    response: Response<RespostaPaginada<ResumoConquistaDesbloqueadaDto>>,
    next: NextFunction,
  ) => {
    try {
      const usuarioId = request.usuario?.id;

      const conquistas = await this.conquistaService.listarDesbloqueadasUsuario(
        request.query,
        usuarioId,
      );

      return response.status(200).json(conquistas);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET conquistas que o proprio usuario marcou como destaque no perfil.
   *
   * @param request Requisicao autenticada (usuario vem do token).
   * @param response Resposta com a lista de conquistas destacadas.
   * @param next Repasse de erro ao middleware central.
   */
  listarDestacadas = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const usuarioId = request.usuario?.id;

      const conquistas = await this.conquistaService.buscarConquistasDestacadas(usuarioId);

      return response.status(200).json({
        mensagem: "Conquistas destacadas encontradas.",
        dados: conquistas,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET destaques de varios usuarios de uma vez (uso social/ranking pelo BFF).
   *
   * @param request Requisicao com a lista de usuarioIds na query.
   * @param response Resposta com os destaques de cada usuario.
   * @param next Repasse de erro ao middleware central.
   */
  listarDestaquesUsuarios = async (
    request: Request<unknown, unknown, unknown, UsuariosIdsQuery>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const destaques = await this.conquistaService.listarDestaquesUsuarios(
        request.query.usuarioIds,
      );

      return response.status(200).json({
        mensagem: "Conquistas destacadas encontradas.",
        dados: destaques,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET detalhe consolidado (tiers, progresso, %) de uma conquista para o usuario.
   *
   * @param request Requisicao com o id da conquista na rota.
   * @param response Resposta com o detalhe consolidado da conquista.
   * @param next Repasse de erro ao middleware central.
   */
  buscarDetalhe = async (
    request: Request<{ id: string }>,
    response: Response<ProgressoConquistaConsolidadoDto>,
    next: NextFunction,
  ) => {
    try {
      const detalhe = await this.conquistaService.buscarDetalheConquista(
        request.usuario?.id,
        request.params.id,
      );

      return response.status(200).json(detalhe);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PATCH marca/desmarca uma conquista como destaque (limite de 3, validado no service).
   *
   * @param request Requisicao com o id na rota e o flag destaque no corpo.
   * @param response Resposta confirmando a operacao.
   * @param next Repasse de erro ao middleware central.
   */
  alterarDestaque = async (
    request: Request<{ id: string }, unknown, AlterarDestaqueConquistaDto>,
    response: Response<RespostaApiSucesso<{ sucesso: boolean }>>,
    next: NextFunction,
  ) => {
    try {
      const usuarioId = request.usuario?.id;

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
