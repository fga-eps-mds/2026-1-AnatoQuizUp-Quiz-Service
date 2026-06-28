import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

import { jwtSecretKey } from "../../config/env";
import { ErroAplicacao } from "../errors/erro-aplicacao";
import type { PayloadAutenticacao } from "../types/autenticacao.types";

// Verifica e decodifica o JWT, traduzindo falhas em ErroAplicacao 401.
export const verificarTokenJwt = (token: string, segredo: string = jwtSecretKey) => {
  try {
    const payload = jwt.verify(token, segredo) as PayloadAutenticacao;

    return payload;
  } catch (erro: unknown) {
    // Token valido porem expirado.
    if (erro instanceof TokenExpiredError) {
      throw new ErroAplicacao({
        mensagem: "Token expirado",
        codigo: "TOKEN_EXPIRADO",
        codigoStatus: 401,
        detalhes: erro,
      });
    }

    // Token malformado ou com assinatura invalida.
    if (erro instanceof JsonWebTokenError) {
      throw new ErroAplicacao({
        mensagem: "Token invalido",
        codigo: "TOKEN_INVALIDO",
        codigoStatus: 401,
        detalhes: erro,
      });
    }

    // Qualquer outra falha inesperada na verificacao.
    throw new ErroAplicacao({
      mensagem: "Falha na verificacao do token",
      codigo: "VERIFICACAO_TOKEN_FALHOU",
      codigoStatus: 401,
      detalhes: erro,
    });
  }
};

// Assina um token de acesso com validade de 1 hora.
export const gerarTokenDeAcesso = (
  payload: PayloadAutenticacao,
  segredo: string = jwtSecretKey,
) => {
  return jwt.sign(payload, segredo, { expiresIn: "1h" });
};
