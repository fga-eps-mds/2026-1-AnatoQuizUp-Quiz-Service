import { prisma } from "@/config/db";
import { DashboardAlunoRepository } from "@/modules/dashboardAluno/dashboardAluno.repository";

jest.mock("@/config/db", () => ({
  prisma: {
    resolucaoQuestao: { findMany: jest.fn() },
    listaTurma: { findMany: jest.fn() },
  },
}));

describe("DashboardAlunoRepository", () => {
  let repository: DashboardAlunoRepository;

  beforeEach(() => {
    repository = new DashboardAlunoRepository();
    jest.clearAllMocks();
  });

  it("deve buscar resolucoes nao excluidas do usuario com tema e gabarito", async () => {
    const resolucoes = [
      { respostaMarcada: "A", questao: { respostaCorreta: "A", tema: { id: "tema-1", nome: "Tórax" } } },
    ];
    (prisma.resolucaoQuestao.findMany as jest.Mock).mockResolvedValue(resolucoes);

    const resultado = await repository.buscarResolucoesPorUsuario("aluno-1");

    expect(prisma.resolucaoQuestao.findMany).toHaveBeenCalled();
    expect(resultado).toBe(resolucoes);
  });

  it("deve buscar as listas vinculadas a turma do usuario", async () => {
    const mockListas = [{ id: "lista-1", prazo: new Date() }];
    (prisma.listaTurma.findMany as jest.Mock).mockResolvedValue(mockListas);

    const resultado = await repository.buscarListasDoUsuario("aluno-1");

    expect(prisma.listaTurma.findMany).toHaveBeenCalledWith({
      where: { turma: { alunos: { some: { alunoId: "aluno-1" } } } },
      select: expect.any(Object),
      orderBy: { criadoEm: "desc" },
    });
    expect(resultado).toBe(mockListas);
  });
});