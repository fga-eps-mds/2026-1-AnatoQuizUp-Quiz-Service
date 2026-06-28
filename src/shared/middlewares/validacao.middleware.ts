import type { RequestHandler } from "express";

import { z } from "zod";

import type { ZodType } from "zod";

import { MENSAGENS } from "@/shared/constants/mensagens";

import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";

import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

// Parte da request que sera validada.
type AlvoValidacao = "body" | "query" | "params";

// Fabrica de middleware: valida body/query/params contra um schema Zod.
export function validarRequisicao<T>(
  schema: ZodType<T>,

  alvo: AlvoValidacao = "body",
): RequestHandler {
  return (request, _response, next) => {
    const validacao = schema.safeParse(request[alvo]);

    // Falha de validacao vira erro 400 com a arvore de erros do Zod.
    if (!validacao.success) {
      return next(
        new ErroAplicacao({
          codigoStatus: 400,

          codigo: CodigoDeErro.ERRO_DE_VALIDACAO,

          mensagem: MENSAGENS.erroValidacao,

          detalhes: z.treeifyError(validacao.error),
        }),
      );
    }

    // Substitui o alvo pelos dados ja validados/coeridos pelo schema.
    Object.defineProperty(request, alvo, {
      value: validacao.data,

      configurable: true,

      enumerable: true,

      writable: true,
    });

    return next();
  };
}
