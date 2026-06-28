import type { NextFunction, Request, Response } from "express";

import { STATUS } from "@/shared/constants/status";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";
import type { PayloadAutenticacao } from "@/shared/types/autenticacao.types";
import { verificarTokenJwt } from "@/shared/utils/jwt";

// Extrai o token Bearer do cabecalho Authorization, validando o formato.
function obterTokenDoCabecalho(request: Request): string {
  const campoAuthorization = request.headers.authorization;

  // Sem cabecalho Authorization nao ha como autenticar.
  if (!campoAuthorization) {
    throw new ErroAplicacao({
      mensagem: "Token nao fornecido",
      codigo: CodigoDeErro.NENHUM_TOKEN_FORNECIDO,
      codigoStatus: 401,
    });
  }

  // Aceita apenas o esquema Bearer.
  if (!campoAuthorization.startsWith("Bearer ")) {
    throw new ErroAplicacao({
      mensagem: "Token invalido",
      codigo: CodigoDeErro.TOKEN_INVALIDO,
      codigoStatus: 401,
    });
  }

  return campoAuthorization.replace("Bearer ", "");
}

// Bloqueia usuarios que nao estejam com status ATIVO.
function validarStatusUsuario(status: string): void {
  if (status === STATUS.ATIVO) return;

  throw new ErroAplicacao({
    mensagem: "Usuario sem status ativo",
    codigo: CodigoDeErro.PROIBIDO,
    codigoStatus: 403,
  });
}

// Middleware de autenticacao: valida o JWT e anexa o usuario a request.
export function middlewareAutenticacao(request: Request, _response: Response, next: NextFunction) {
  const token = obterTokenDoCabecalho(request);
  const payload: PayloadAutenticacao = verificarTokenJwt(token);

  validarStatusUsuario(payload.status);

  // Disponibiliza os dados do usuario para os controllers seguintes.
  request.usuario = {
    id: payload.id,
    email: payload.email,
    papel: payload.papel,
    status: payload.status,
  };

  return next();
}
