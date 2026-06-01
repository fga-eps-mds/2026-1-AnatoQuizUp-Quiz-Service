import { prisma } from "@/config/db";
import { DashboardAlunoRepository } from "@/modules/dashboardAluno/dashboardAluno.repository";

jest.mock("@/config/db", () => ({
  prisma: {
    resolucaoQuestao: {
      findMany: jest.fn(),
    },
  },
}));

const findManyMock = prisma.resolucaoQuestao.findMany as jest.Mock;

describe("DashboardAlunoRepository", () => {
  let repository: DashboardAlunoRepository;

  beforeEach(() => {
    repository = new DashboardAlunoRepository();
    jest.clearAllMocks();
  });

  it("deve buscar resolucoes nao excluidas do usuario com tema e gabarito", async () => {
    const resolucoes = [
      {
        respostaMarcada: "A",
        questao: { respostaCorreta: "A", tema: { id: "tema-1", nome: "Tórax" } },
      },
    ];
    findManyMock.mockResolvedValue(resolucoes);

    const resultado = await repository.buscarResolucoesPorUsuario("aluno-1");

    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        usuarioId: "aluno-1",
        excluidoEm: null,
        questao: { excluidoEm: null },
      },
      select: {
        respostaMarcada: true,
        questao: {
          select: {
            respostaCorreta: true,
            tema: { select: { id: true, nome: true } },
          },
        },
      },
    });
    expect(resultado).toBe(resolucoes);
  });

  it("deve retornar lista vazia quando o aluno nao tem resolucoes", async () => {
    findManyMock.mockResolvedValue([]);

    const resultado = await repository.buscarResolucoesPorUsuario("aluno-sem-historico");

    expect(resultado).toEqual([]);
  });
});
