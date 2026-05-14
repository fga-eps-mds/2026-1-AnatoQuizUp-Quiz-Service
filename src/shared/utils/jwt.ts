import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

import { jwtSecretKey } from "../../config/env";
import { ErroAplicacao } from "../errors/erro-aplicacao";
import type { PayloadAutenticacao } from "../types/autenticacao.types";

export const verificarTokenJwt = (token: string, segredo: string = jwtSecretKey) => {
  try {
    const payload = jwt.verify(token, segredo) as PayloadAutenticacao;

    return payload;
  } catch (erro: unknown) {
    if (erro instanceof TokenExpiredError) {
      throw new ErroAplicacao({
        mensagem: "Token expirado",
        codigo: "TOKEN_EXPIRADO",
        codigoStatus: 401,
        detalhes: erro,
      });
    }

    if (erro instanceof JsonWebTokenError) {
      throw new ErroAplicacao({
        mensagem: "Token invalido",
        codigo: "TOKEN_INVALIDO",
        codigoStatus: 401,
        detalhes: erro,
      });
    }

    throw new ErroAplicacao({
      mensagem: "Falha na verificacao do token",
      codigo: "VERIFICACAO_TOKEN_FALHOU",
      codigoStatus: 401,
      detalhes: erro,
    });
  }
};

export const gerarTokenDeAcesso = (
  payload: PayloadAutenticacao,
  segredo: string = jwtSecretKey,
) => {
  return jwt.sign(payload, segredo, { expiresIn: "1h" });
};
