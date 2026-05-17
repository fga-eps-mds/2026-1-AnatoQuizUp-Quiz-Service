import type { NextFunction, Request, Response } from "express";

import { STATUS } from "@/shared/constants/status";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";
import type { PayloadAutenticacao } from "@/shared/types/autenticacao.types";
import { verificarTokenJwt } from "@/shared/utils/jwt";

function obterTokenDoCabecalho(request: Request): string {
  const campoAuthorization = request.headers.authorization;

  if (!campoAuthorization) {
    throw new ErroAplicacao({
      mensagem: "Token nao fornecido",
      codigo: CodigoDeErro.NENHUM_TOKEN_FORNECIDO,
      codigoStatus: 401,
    });
  }

  if (!campoAuthorization.startsWith("Bearer ")) {
    throw new ErroAplicacao({
      mensagem: "Token invalido",
      codigo: CodigoDeErro.TOKEN_INVALIDO,
      codigoStatus: 401,
    });
  }

  return campoAuthorization.replace("Bearer ", "");
}

function validarStatusUsuario(status: string): void {
  if (status === STATUS.ATIVO) return;

  throw new ErroAplicacao({
    mensagem: "Usuario sem status ativo",
    codigo: CodigoDeErro.PROIBIDO,
    codigoStatus: 403,
  });
}

export function middlewareAutenticacao(request: Request, _response: Response, next: NextFunction) {
  const token = obterTokenDoCabecalho(request);
  const payload: PayloadAutenticacao = verificarTokenJwt(token);

  validarStatusUsuario(payload.status);

  request.usuario = {
    id: payload.id,
    email: payload.email,
    papel: payload.papel,
    status: payload.status,
  };

  return next();
}
