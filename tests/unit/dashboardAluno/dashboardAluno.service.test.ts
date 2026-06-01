import { DashboardAlunoRepository } from "@/modules/dashboardAluno/dashboardAluno.repository";
import { DashboardAlunoService } from "@/modules/dashboardAluno/dashboardAluno.service";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

jest.mock("@/modules/dashboardAluno/dashboardAluno.repository");

type Resolucoes = Awaited<
  ReturnType<DashboardAlunoRepository["buscarResolucoesPorUsuario"]>
>;

const criarResolucoes = (
  itens: Array<{
    marcada: string;
    correta: string;
    temaId: string;
    temaNome: string;
  }>,
): Resolucoes =>
  itens.map((item) => ({
    respostaMarcada: item.marcada,
    questao: {
      respostaCorreta: item.correta,
      tema: { id: item.temaId, nome: item.temaNome },
    },
  })) as unknown as Resolucoes;

describe("DashboardAlunoService", () => {
  let service: DashboardAlunoService;
  let repositoryMock: jest.Mocked<DashboardAlunoRepository>;

  beforeEach(() => {
    repositoryMock = new DashboardAlunoRepository() as jest.Mocked<DashboardAlunoRepository>;
    service = new DashboardAlunoService(repositoryMock);
  });

  it("deve lancar 401 quando o usuarioId for undefined", async () => {
    await expect(service.obterDashboard(undefined)).rejects.toBeInstanceOf(ErroAplicacao);
    expect(repositoryMock.buscarResolucoesPorUsuario).not.toHaveBeenCalled();
  });

  it("deve lancar 401 quando o usuarioId for string vazia", async () => {
    await expect(service.obterDashboard("")).rejects.toMatchObject({ codigoStatus: 401 });
    expect(repositoryMock.buscarResolucoesPorUsuario).not.toHaveBeenCalled();
  });

  it("deve retornar estado vazio quando o aluno nao tem resolucoes", async () => {
    repositoryMock.buscarResolucoesPorUsuario.mockResolvedValue([]);

    const resultado = await service.obterDashboard("aluno-1");

    expect(resultado).toEqual({
      totalRespondidas: 0,
      totalAcertos: 0,
      totalErros: 0,
      taxaAcerto: 0,
      porTema: [],
    });
  });

  it("deve agregar metricas gerais e desempenho por tema ordenado por taxa decrescente", async () => {
    repositoryMock.buscarResolucoesPorUsuario.mockResolvedValue(
      criarResolucoes([
        { marcada: "A", correta: "A", temaId: "tema-1", temaNome: "Tórax" },
        { marcada: "B", correta: "A", temaId: "tema-1", temaNome: "Tórax" },
        { marcada: "C", correta: "C", temaId: "tema-1", temaNome: "Tórax" },
        { marcada: "A", correta: "A", temaId: "tema-2", temaNome: "Abdome" },
        { marcada: "B", correta: "B", temaId: "tema-2", temaNome: "Abdome" },
        { marcada: "A", correta: "B", temaId: "tema-3", temaNome: "Crânio" },
        { marcada: "C", correta: "D", temaId: "tema-3", temaNome: "Crânio" },
      ]),
    );

    const resultado = await service.obterDashboard("aluno-1");

    expect(resultado.totalRespondidas).toBe(7);
    expect(resultado.totalAcertos).toBe(4);
    expect(resultado.totalErros).toBe(3);
    expect(resultado.taxaAcerto).toBe(57);

    expect(resultado.porTema).toEqual([
      {
        temaId: "tema-2",
        nome: "Abdome",
        totalRespondidas: 2,
        acertos: 2,
        erros: 0,
        taxaAcerto: 100,
        status: "Tranquilo",
      },
      {
        temaId: "tema-1",
        nome: "Tórax",
        totalRespondidas: 3,
        acertos: 2,
        erros: 1,
        taxaAcerto: 67,
        status: "Atenção",
      },
      {
        temaId: "tema-3",
        nome: "Crânio",
        totalRespondidas: 2,
        acertos: 0,
        erros: 2,
        taxaAcerto: 0,
        status: "Crítico",
      },
    ]);
  });
});
