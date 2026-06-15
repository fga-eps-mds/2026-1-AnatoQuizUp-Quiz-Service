import { DashboardAlunoRepository } from "@/modules/dashboardAluno/dashboardAluno.repository";
import { DashboardAlunoService } from "@/modules/dashboardAluno/dashboardAluno.service";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

jest.mock("@/modules/dashboardAluno/dashboardAluno.repository");

describe("DashboardAlunoService", () => {
  let service: DashboardAlunoService;
  let repositoryMock: jest.Mocked<DashboardAlunoRepository>;

  beforeEach(() => {
    repositoryMock = new DashboardAlunoRepository() as jest.Mocked<DashboardAlunoRepository>;
    service = new DashboardAlunoService(repositoryMock);
  });

  it("deve lancar 401 quando o usuarioId for invalido (undefined ou string vazia)", async () => {
    await expect(service.obterDashboard(undefined)).rejects.toBeInstanceOf(ErroAplicacao);
    await expect(service.obterDashboard("")).rejects.toBeInstanceOf(ErroAplicacao);
  });

  it("deve retornar estado vazio quando o aluno nao tem historico de resolucoes nem listas", async () => {
    repositoryMock.buscarResolucoesPorUsuario.mockResolvedValue([]);
    repositoryMock.buscarListasDoUsuario.mockResolvedValue([]);

    const resultado = await service.obterDashboard("aluno-1");

    expect(resultado).toEqual({
      totalRespondidas: 0,
      totalAcertos: 0,
      totalErros: 0,
      taxaAcerto: 0,
      porTema: [],
      porLista: [],
    });
  });

  it("deve classificar os temas nos 3 status corretamente e ordenar por taxa decrescente", async () => {
    const mockResolucoes = [
      { respostaMarcada: "A", questao: { respostaCorreta: "A", tema: { id: "t1", nome: "TranquiloTema" } } },
      { respostaMarcada: "A", questao: { respostaCorreta: "A", tema: { id: "t2", nome: "AtencaoTema" } } },
      { respostaMarcada: "B", questao: { respostaCorreta: "A", tema: { id: "t2", nome: "AtencaoTema" } } },
      { respostaMarcada: "B", questao: { respostaCorreta: "A", tema: { id: "t3", nome: "CriticoTema" } } },
    ];

    repositoryMock.buscarResolucoesPorUsuario.mockResolvedValue(
      mockResolucoes as unknown as Awaited<ReturnType<DashboardAlunoRepository["buscarResolucoesPorUsuario"]>>
    );
    repositoryMock.buscarListasDoUsuario.mockResolvedValue([]);

    const resultado = await service.obterDashboard("aluno-1");

    expect(resultado.totalRespondidas).toBe(4);
    expect(resultado.totalAcertos).toBe(2);
    expect(resultado.totalErros).toBe(2);
    expect(resultado.taxaAcerto).toBe(50); 

    expect(resultado.porTema).toHaveLength(3);
    
    expect(resultado.porTema[0]).toMatchObject({ nome: "TranquiloTema", taxaAcerto: 100, status: "Tranquilo" });
    expect(resultado.porTema[1]).toMatchObject({ nome: "AtencaoTema", taxaAcerto: 50, status: "Atenção" });
    expect(resultado.porTema[2]).toMatchObject({ nome: "CriticoTema", taxaAcerto: 0, status: "Crítico" });
  });

  it("deve mapear corretamente o desempenho por lista validando prazos e submissoes", async () => {
    repositoryMock.buscarResolucoesPorUsuario.mockResolvedValue([]);
    
    const mockListas = [
      {
        id: "lista-1",
        prazo: new Date("2026-12-31T23:59:00Z"),
        listaQuestao: { nome: "Lista Respondida", _count: { itens: 2 } },
        resolucoes: [
          {
            status: "SUBMETIDA",
            submissaoEm: new Date("2026-06-14T10:00:00Z"),
            respostas: [
              { respostaMarcada: "A", questao: { respostaCorreta: "A" } }, // Acertou
              { respostaMarcada: "B", questao: { respostaCorreta: "C" } }  // Errou
            ]
          }
        ]
      },
      {
        id: "lista-2",
        prazo: null,
        listaQuestao: { nome: "Lista Pendente", _count: { itens: 5 } },
        resolucoes: []
      }
    ];

    repositoryMock.buscarListasDoUsuario.mockResolvedValue(
      mockListas as unknown as Awaited<ReturnType<DashboardAlunoRepository["buscarListasDoUsuario"]>>
    );

    const resultado = await service.obterDashboard("aluno-1");

    expect(resultado.porLista).toHaveLength(2);
    
    expect(resultado.porLista[0].status).toBe("SUBMETIDA");
    expect(resultado.porLista[0].acertos).toBe(1);
    expect(resultado.porLista[0].taxaAcerto).toBe(50);
    expect(resultado.porLista[0].submissaoEm).toBe("2026-06-14T10:00:00.000Z");
    expect(resultado.porLista[0].prazo).toBe("2026-12-31T23:59:00.000Z");
    
    expect(resultado.porLista[1].status).toBe("NAO_RESPONDEU");
    expect(resultado.porLista[1].acertos).toBe(0);
    expect(resultado.porLista[1].taxaAcerto).toBe(0);
    expect(resultado.porLista[1].submissaoEm).toBeNull();
    expect(resultado.porLista[1].prazo).toBeNull();
  });
});