import {
  RankingService,
  compararPontuacoes,
} from "../../../src/modules/ranking/ranking.service";
import { RankingRepository } from "../../../src/modules/ranking/ranking.repository";
import type { PontuacaoUsuario } from "../../../src/modules/ranking/ranking.types";

jest.mock("../../../src/modules/ranking/ranking.repository");

describe("RankingService.obterPontuacoes", () => {
  let service: RankingService;
  let repositoryMock: jest.Mocked<RankingRepository>;

  beforeEach(() => {
    repositoryMock = new RankingRepository() as jest.Mocked<RankingRepository>;
    service = new RankingService(repositoryMock);
  });

  it("converte bigint para number, formata a data e ordena por acertos", async () => {
    repositoryMock.agregarPontuacoes.mockResolvedValue([
      { usuarioId: "u1", acertos: 2n, respondidas: 4n, ultimaAtividade: new Date("2026-01-01T00:00:00.000Z") },
      { usuarioId: "u2", acertos: 5n, respondidas: 6n, ultimaAtividade: null },
    ]);

    const resultado = await service.obterPontuacoes();

    expect(resultado[0]).toEqual({
      usuarioId: "u2",
      totalAcertos: 5,
      totalRespondidas: 6,
      ultimaAtividade: null,
    });
    expect(resultado[1]).toEqual({
      usuarioId: "u1",
      totalAcertos: 2,
      totalRespondidas: 4,
      ultimaAtividade: "2026-01-01T00:00:00.000Z",
    });
  });

  it("repassa a lista de ids ao repositorio", async () => {
    repositoryMock.agregarPontuacoes.mockResolvedValue([]);

    await service.obterPontuacoes(["a", "b"]);

    expect(repositoryMock.agregarPontuacoes).toHaveBeenCalledWith(["a", "b"]);
  });
});

describe("compararPontuacoes", () => {
  const base: PontuacaoUsuario = {
    usuarioId: "x",
    totalAcertos: 0,
    totalRespondidas: 0,
    ultimaAtividade: null,
  };

  it("coloca quem tem mais acertos na frente", () => {
    expect(compararPontuacoes({ ...base, totalAcertos: 1 }, { ...base, totalAcertos: 2 })).toBeGreaterThan(0);
    expect(compararPontuacoes({ ...base, totalAcertos: 3 }, { ...base, totalAcertos: 2 })).toBeLessThan(0);
  });

  it("desempata por menos questoes respondidas", () => {
    const a = { ...base, totalAcertos: 2, totalRespondidas: 5 };
    const b = { ...base, totalAcertos: 2, totalRespondidas: 3 };
    expect(compararPontuacoes(a, b)).toBeGreaterThan(0);
  });

  it("desempata pela atividade mais antiga e trata null como infinito", () => {
    const antiga = { ...base, ultimaAtividade: "2026-01-01T00:00:00.000Z" };
    const recente = { ...base, ultimaAtividade: "2026-02-01T00:00:00.000Z" };
    expect(compararPontuacoes(antiga, recente)).toBeLessThan(0);
    expect(compararPontuacoes(antiga, { ...base })).toBeLessThan(0);
    expect(compararPontuacoes({ ...base }, antiga)).toBeGreaterThan(0);
    expect(compararPontuacoes({ ...antiga }, { ...antiga })).toBe(0);
  });
});
