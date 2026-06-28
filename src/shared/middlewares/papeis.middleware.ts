import type { Request, Response, NextFunction } from "express";

import type { Papel } from "../constants/papeis";

import { CodigoDeErro } from "../errors/codigos-de-erro";

import { ErroAplicacao } from "../errors/erro-aplicacao";

// Fabrica de middleware de autorizacao: libera apenas os papeis informados.
export const middlewarePapeis = (...papeisPermitidos: Papel[]) => {
  return (request: Request, response: Response, next: NextFunction) => {
    const papel: Papel | undefined = request.usuario?.papel;

    // Sem papel na request significa que a autenticacao nao rodou antes.
    if (!papel) {
      throw new ErroAplicacao({
        codigoStatus: 403,

        codigo: CodigoDeErro.NAO_AUTORIZADO,

        mensagem: "Usuário não autenticado",
      });
    }

    // Papel presente mas fora da lista permitida: acesso negado.
    if (!papeisPermitidos.includes(papel)) {
      throw new ErroAplicacao({
        codigoStatus: 403,

        codigo: CodigoDeErro.NAO_AUTORIZADO,

        mensagem: "Acesso não autorizado",
      });
    }

    next();
  };
};
