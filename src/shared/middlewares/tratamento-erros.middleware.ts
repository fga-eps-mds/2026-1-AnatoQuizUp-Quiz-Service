import { Prisma } from "@prisma/client";

import type { NextFunction, Request, Response } from "express";

import { logger } from "@/config/logger";

import { MENSAGENS } from "@/shared/constants/mensagens";

import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";

import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

import type { RespostaApiErro } from "@/shared/types/api.types";

// Middleware central de erros: traduz excecoes em respostas HTTP padronizadas.
export function middlewareTratamentoErros(
  erro: unknown,

  _request: Request,

  response: Response<RespostaApiErro>,

  next: NextFunction,
) {
  void next;

  // Erros de aplicacao ja carregam status e codigo proprios.
  if (erro instanceof ErroAplicacao) {
    return response.status(erro.codigoStatus).json({
      erro: {
        codigo: erro.codigo,

        mensagem: erro.message,

        detalhes: erro.detalhes,
      },
    });
  }

  // Erros conhecidos do Prisma viram 400 (requisicao invalida).
  if (erro instanceof Prisma.PrismaClientKnownRequestError) {
    return response.status(400).json({
      erro: {
        codigo: CodigoDeErro.REQUISICAO_INVALIDA,

        mensagem: erro.message,
      },
    });
  }

  // Qualquer outro erro e inesperado: registra e responde 500 generico.
  logger.error({ erro }, "Erro nao tratado na aplicacao.");

  return response.status(500).json({
    erro: {
      codigo: CodigoDeErro.ERRO_INTERNO,

      mensagem: MENSAGENS.erroInterno,
    },
  });
}
