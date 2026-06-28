import type { NextFunction, Request, Response } from "express";

import { env } from "@/config/env";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

const MENSAGEM_AUSENTE = "Token interno ausente. Acesso permitido somente via BFF.";
const MENSAGEM_INVALIDO = "Token interno invalido.";

// Garante que a chamada veio do BFF, comparando o header x-internal-token.
export function middlewareTokenInterno(request: Request, _response: Response, next: NextFunction) {
  const recebido = request.header("x-internal-token");

  // Header ausente: requisicao nao passou pelo BFF.
  if (!recebido) {
    return next(
      new ErroAplicacao({
        codigoStatus: 403,
        codigo: CodigoDeErro.PROIBIDO,
        mensagem: MENSAGEM_AUSENTE,
      }),
    );
  }

  // Token diferente do configurado: rejeita.
  if (recebido !== env.INTERNAL_TOKEN) {
    return next(
      new ErroAplicacao({
        codigoStatus: 403,
        codigo: CodigoDeErro.PROIBIDO,
        mensagem: MENSAGEM_INVALIDO,
      }),
    );
  }

  next();
}
