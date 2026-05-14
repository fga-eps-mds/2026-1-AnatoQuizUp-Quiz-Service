import type { NextFunction, Request, Response } from "express";

import { middlewareTokenInterno } from "@/shared/middlewares/token-interno.middleware";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

const TOKEN_TESTE = process.env.INTERNAL_TOKEN ?? "test-internal-token";

function montarRequisicao(headers: Record<string, string> = {}) {
  return {
    header(nome: string) {
      return headers[nome.toLowerCase()];
    },
  } as unknown as Request;
}

describe("middlewareTokenInterno", () => {
  it("rejeita request sem header X-Internal-Token", () => {
    const next: NextFunction = jest.fn();
    middlewareTokenInterno(montarRequisicao(), {} as Response, next);
    const erro = (next as jest.Mock).mock.calls[0][0];
    expect(erro).toBeInstanceOf(ErroAplicacao);
    expect(erro.codigo).toBe(CodigoDeErro.PROIBIDO);
    expect(erro.codigoStatus).toBe(403);
  });

  it("rejeita request com token divergente", () => {
    const next: NextFunction = jest.fn();
    middlewareTokenInterno(
      montarRequisicao({ "x-internal-token": "errado" }),
      {} as Response,
      next,
    );
    const erro = (next as jest.Mock).mock.calls[0][0];
    expect(erro).toBeInstanceOf(ErroAplicacao);
    expect(erro.codigoStatus).toBe(403);
  });

  it("aceita request com token correto", () => {
    const next: NextFunction = jest.fn();
    middlewareTokenInterno(
      montarRequisicao({ "x-internal-token": TOKEN_TESTE }),
      {} as Response,
      next,
    );
    expect(next).toHaveBeenCalledWith();
  });
});
