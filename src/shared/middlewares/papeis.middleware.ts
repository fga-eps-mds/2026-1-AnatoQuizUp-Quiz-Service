import type { Request, Response, NextFunction } from "express";

import type { Papel } from "../constants/papeis";

import { CodigoDeErro } from "../errors/codigos-de-erro";

import { ErroAplicacao } from "../errors/erro-aplicacao";

export const middlewarePapeis = (...papeisPermitidos: Papel[]) => {
  return (request: Request, response: Response, next: NextFunction) => {
    const papel: Papel | undefined = request.usuario?.papel;

    if (!papel) {
      throw new ErroAplicacao({
        codigoStatus: 403,

        codigo: CodigoDeErro.NAO_AUTORIZADO,

        mensagem: "Usuário não autenticado",
      });
    }

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
