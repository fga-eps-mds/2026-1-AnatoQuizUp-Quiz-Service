jest.mock("@/config/db", () => ({
  prisma: { $queryRaw: jest.fn() },
}));

import { prisma } from "@/config/db";
import { RankingRepository } from "../../../src/modules/ranking/ranking.repository";

const mockQueryRaw = prisma.$queryRaw as unknown as jest.Mock;

describe("RankingRepository.agregarPontuacoes", () => {
  let repository: RankingRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new RankingRepository();
  });

  it("agrega todos os usuarios quando nao recebe ids", async () => {
    const linhas = [
      { usuarioId: "u1", acertos: 5n, respondidas: 6n, ultimaAtividade: new Date() },
    ];
    mockQueryRaw.mockResolvedValue(linhas);

    const resultado = await repository.agregarPontuacoes();

    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
    expect(resultado).toBe(linhas);
  });

  it("aplica o filtro de ids quando recebe uma lista", async () => {
    mockQueryRaw.mockResolvedValue([]);

    await repository.agregarPontuacoes(["a", "b"]);

    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
  });

  it("ignora o filtro quando a lista de ids esta vazia", async () => {
    mockQueryRaw.mockResolvedValue([]);

    await repository.agregarPontuacoes([]);

    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
  });
});
