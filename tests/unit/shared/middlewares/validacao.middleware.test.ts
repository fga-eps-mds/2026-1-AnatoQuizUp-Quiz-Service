import type { Request, Response } from "express";
import { z } from "zod";

import { validarRequisicao } from "@/shared/middlewares/validacao.middleware";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";

describe("validarRequisicao", () => {
  it("substitui o alvo validado pelos dados parseados", () => {
    const middleware = validarRequisicao(
      z.object({
        page: z.coerce.number().int().positive(),
      }),
      "query",
    );
    const request = {
      query: { page: "2" },
    } as unknown as Request;
    const response = {} as Response;
    const next = jest.fn();

    middleware(request, response, next);

    expect(request.query).toEqual({ page: 2 });
    expect(next).toHaveBeenCalledWith();
  });

  it("encaminha erro de validacao quando o payload e invalido", () => {
    const middleware = validarRequisicao(
      z.object({
        nome: z.string().min(1),
      }),
    );
    const request = {
      body: { nome: "" },
    } as Request;
    const response = {} as Response;
    const next = jest.fn();

    middleware(request, response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        codigoStatus: 400,
        codigo: CodigoDeErro.ERRO_DE_VALIDACAO,
      }),
    );
  });
});
