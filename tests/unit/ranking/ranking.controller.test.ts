import type { Request, Response } from "express";

import { RankingController } from "../../../src/modules/ranking/ranking.controller";
import { RankingService } from "../../../src/modules/ranking/ranking.service";
import { RankingRepository } from "../../../src/modules/ranking/ranking.repository";

jest.mock("../../../src/modules/ranking/ranking.service");

describe("RankingController.listarPontuacoes", () => {
  let controller: RankingController;
  let serviceMock: jest.Mocked<RankingService>;
  let req: { query: { usuarioIds: string[] } };
  let res: Partial<Response>;

  beforeEach(() => {
    serviceMock = new RankingService(
      {} as RankingRepository,
    ) as jest.Mocked<RankingService>;
    controller = new RankingController(serviceMock);

    req = { query: { usuarioIds: ["a", "b"] } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("responde 200 com os dados calculados", async () => {
    const dados = [
      { usuarioId: "a", totalAcertos: 1, totalRespondidas: 2, ultimaAtividade: null },
    ];
    serviceMock.obterPontuacoes.mockResolvedValue(dados);

    await controller.listarPontuacoes(req as unknown as Request, res as Response);

    expect(serviceMock.obterPontuacoes).toHaveBeenCalledWith(["a", "b"]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ dados });
  });

  it("responde 500 quando o service falha", async () => {
    serviceMock.obterPontuacoes.mockRejectedValue(new Error("boom"));
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await controller.listarPontuacoes(req as unknown as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Erro ao calcular pontuações do ranking.",
    });

    spy.mockRestore();
  });
});
