import request from "supertest";
import type { Request, Response, NextFunction } from "express";
import express from "express";
import { 
  AlternativaQuestao, 
  StatusResolucaoLista, 
  TipoQuestao 
} from "@prisma/client";

// Tipagem para as respostas do Dashboard
interface ThemeResult {
  nome: string;
  taxaAcerto: number;
  status: string;
}

interface ListResult {
  nomeLista: string;
  status: string;
  acertos: number;
  taxaAcerto: number;
}

interface DashboardResponse {
  totalRespondidas: number;
  totalAcertos: number;
  totalErros: number;
  taxaAcerto: number;
  porTema: ThemeResult[];
  porLista: ListResult[];
}

interface AuthenticatedRequest extends Request {
  usuario?: { id: string; papel: string };
}

jest.mock("@/shared/middlewares/papeis.middleware", () => ({
  middlewarePapeis: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

import { prisma } from "@/config/db";
import { dashboardAlunoRouter } from "@/modules/dashboardAluno/dashboardAluno.routes";
import { middlewareTratamentoErros } from "@/shared/middlewares/tratamento-erros.middleware";

const app = express();
app.use(express.json());

const ALUNO_ID_MOCK = "aluno-teste-123";

app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.headers["x-sem-usuario"] === "true") {
    (req as AuthenticatedRequest).usuario = undefined;
  } else {
    (req as AuthenticatedRequest).usuario = {
      id: ALUNO_ID_MOCK,
      papel: "ALUNO",
    };
  }
  next();
});

app.use("/api/v1/dashboardAluno", dashboardAlunoRouter);
app.use(middlewareTratamentoErros);

describe("Testes de Integração - Dashboard Aluno", () => {
  const limparBanco = async () => {
    await prisma.resolucaoQuestaoLista.deleteMany();
    await prisma.resolucaoLista.deleteMany();
    await prisma.resolucaoQuestao.deleteMany();
    await prisma.listaQuestaoItem.deleteMany();
    await prisma.listaTurma.deleteMany();
    await prisma.listaQuestao.deleteMany();
    await prisma.turmaAluno.deleteMany();
    await prisma.turma.deleteMany();
    await prisma.questaoAlternativa.deleteMany();
    await prisma.questao.deleteMany();
    await prisma.tema.deleteMany();
  };

  beforeEach(async () => {
    await limparBanco();
  });

  afterAll(async () => {
    await limparBanco();
    await prisma.$disconnect();
  });

  describe("GET /api/v1/dashboardAluno", () => {
    it("deve retornar o dashboard consolidado com estatísticas corretas", async () => {
      const temaBom = await prisma.tema.create({ data: { nome: "Anatomia Fácil" } });
      const temaRuim = await prisma.tema.create({ data: { nome: "Neuroanatomia" } });

      const questao1 = await prisma.questao.create({
        data: {
          enunciado: "Q1",
          tipoQuestao: TipoQuestao.MULTIPLA_ESCOLHA,
          respostaCorreta: AlternativaQuestao.A,
          temaId: temaBom.id,
          criadoPorId: "prof-1",
        },
      });

      const questao2 = await prisma.questao.create({
        data: {
          enunciado: "Q2",
          tipoQuestao: TipoQuestao.MULTIPLA_ESCOLHA,
          respostaCorreta: AlternativaQuestao.B,
          temaId: temaRuim.id,
          criadoPorId: "prof-1",
        },
      });

      await prisma.resolucaoQuestao.createMany({
        data: [
          { questaoId: questao1.id, usuarioId: ALUNO_ID_MOCK, respostaMarcada: AlternativaQuestao.A },
          { questaoId: questao2.id, usuarioId: ALUNO_ID_MOCK, respostaMarcada: AlternativaQuestao.C },
          { questaoId: questao2.id, usuarioId: ALUNO_ID_MOCK, respostaMarcada: AlternativaQuestao.D },
        ],
      });

      const turma = await prisma.turma.create({
        data: {
          codigo: "TURMA-01",
          nome: "Turma Teste",
          semestre: "1",
          ano: 2026,
          descricao: "Desc",
          professorId: "prof-1",
        },
      });

      await prisma.turmaAluno.create({
        data: { turmaId: turma.id, alunoId: ALUNO_ID_MOCK },
      });

      const lista = await prisma.listaQuestao.create({
        data: { nome: "Lista da Semana", criadoPorId: "prof-1" },
      });

      await prisma.listaQuestaoItem.create({
        data: { listaQuestaoId: lista.id, questaoId: questao1.id, ordem: 1 },
      });

      const listaTurma = await prisma.listaTurma.create({
        data: { turmaId: turma.id, listaQuestaoId: lista.id },
      });

      const resolucaoLista = await prisma.resolucaoLista.create({
        data: {
          alunoId: ALUNO_ID_MOCK,
          listaTurmaId: listaTurma.id,
          status: StatusResolucaoLista.SUBMETIDA,
          submissaoEm: new Date(),
        },
      });

      await prisma.resolucaoQuestaoLista.create({
        data: {
          resolucaoListaId: resolucaoLista.id,
          questaoId: questao1.id,
          respostaMarcada: AlternativaQuestao.A, 
        },
      });

      const response = await request(app).get("/api/v1/dashboardAluno");
      const body = response.body as DashboardResponse;

      expect(response.status).toBe(200);
      expect(body.totalRespondidas).toBe(3); 
      expect(body.totalAcertos).toBe(1);
      expect(body.totalErros).toBe(2);
      expect(body.taxaAcerto).toBe(33);

      expect(body.porTema).toHaveLength(2);
      
      const temaFacilResult = body.porTema.find((t) => t.nome === "Anatomia Fácil");
      expect(temaFacilResult?.taxaAcerto).toBe(100);
      expect(temaFacilResult?.status).toBe("Tranquilo");

      const temaDificilResult = body.porTema.find((t) => t.nome === "Neuroanatomia");
      expect(temaDificilResult?.taxaAcerto).toBe(0);
      expect(temaDificilResult?.status).toBe("Crítico");

      expect(body.porLista).toHaveLength(1);
      expect(body.porLista[0].nomeLista).toBe("Lista da Semana");
      expect(body.porLista[0].status).toBe("SUBMETIDA");
      expect(body.porLista[0].acertos).toBe(1); 
      expect(body.porLista[0].taxaAcerto).toBe(100); 
    });

    it("deve retornar um dashboard zerado para aluno sem histórico", async () => {
      const response = await request(app).get("/api/v1/dashboardAluno");
      const body = response.body as DashboardResponse;

      expect(response.status).toBe(200);
      expect(body.totalRespondidas).toBe(0);
      expect(body.totalAcertos).toBe(0);
      expect(body.totalErros).toBe(0);
      expect(body.taxaAcerto).toBe(0);
      expect(body.porTema).toEqual([]);
      expect(body.porLista).toEqual([]);
    });

    it("deve retornar erro 401 caso não haja usuário logado", async () => {
      const response = await request(app)
        .get("/api/v1/dashboardAluno")
        .set("x-sem-usuario", "true"); 

      expect(response.status).toBe(401);
      const body = response.body as { erro: { codigo: string } };
      expect(body.erro.codigo).toBe("NAO_AUTORIZADO");
    });
  });
});