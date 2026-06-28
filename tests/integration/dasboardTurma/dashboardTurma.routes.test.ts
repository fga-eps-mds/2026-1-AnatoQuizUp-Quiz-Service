import request from "supertest";
import type { Request, Response, NextFunction } from "express";
import express from "express";
import { 
  AlternativaQuestao, 
  StatusResolucaoLista, 
  TipoQuestao 
} from "@prisma/client";

interface AuthenticatedRequest extends Request {
  usuario?: {
    id: string;
    papel: string;
  };
}

jest.mock("@/shared/middlewares/papeis.middleware", () => ({
  middlewarePapeis: () => (req: Request, _res: Response, next: NextFunction) => {
    (req as AuthenticatedRequest).usuario = { id: "prof-teste-123", papel: "PROFESSOR" };
    next();
  },
}));

import { prisma } from "@/config/db";
import { dashboardRouter } from "@/modules/dashboardTurma/dashboardTurma.routes";

const app = express();
app.use(express.json());
app.use("/api/v1/turmas", dashboardRouter);

describe("Testes de Integração - Dashboard Turma", () => {
  const limparBanco = async () => {
    await prisma.resolucaoQuestaoLista.deleteMany();
    await prisma.resolucaoLista.deleteMany();
    await prisma.listaTurma.deleteMany();
    await prisma.listaQuestaoItem.deleteMany();
    await prisma.listaQuestao.deleteMany();
    await prisma.turmaAluno.deleteMany();
    await prisma.turma.deleteMany();
    await prisma.resolucaoQuestao.deleteMany();
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

  const setupBase = async () => {
    const turma = await prisma.turma.create({
      data: { codigo: "T1", nome: "Turma A", semestre: "1", ano: 2026, descricao: "Desc", professorId: "prof-teste-123" }
    });
    
    await prisma.turmaAluno.create({ 
      data: { turmaId: turma.id, alunoId: "aluno-1" } 
    });
    
    const tema = await prisma.tema.create({ data: { nome: "Anatomia" } });
    
    const questao = await prisma.questao.create({
      data: { enunciado: "Q1", tipoQuestao: TipoQuestao.MULTIPLA_ESCOLHA, respostaCorreta: AlternativaQuestao.A, temaId: tema.id, criadoPorId: "prof-teste-123" }
    });
    
    return { turma, tema, questao };
  };

  describe("GET /api/v1/turmas/:id/macro", () => {
    it("deve retornar o dashboard macro com sucesso", async () => {
      const { turma, questao } = await setupBase();
      
      await prisma.resolucaoQuestao.create({
        data: { usuarioId: "aluno-1", questaoId: questao.id, respostaMarcada: AlternativaQuestao.A }
      });

      const response = await request(app).get(`/api/v1/turmas/${turma.id}/macro`);

      expect(response.status).toBe(200);
      
      const body = response.body as { totalQuestoesRespondidas: number; taxaMediaAcertos: number };
      expect(body).toHaveProperty("totalQuestoesRespondidas", 1);
      expect(body.taxaMediaAcertos).toBe(100);
    });
  });

  describe("GET /api/v1/turmas/:id/individual", () => {
    it("deve listar desempenho individual dos alunos", async () => {
      const { turma, questao } = await setupBase();
      
      await prisma.resolucaoQuestao.create({
        data: { usuarioId: "aluno-1", questaoId: questao.id, respostaMarcada: AlternativaQuestao.A }
      });

      const response = await request(app).get(`/api/v1/turmas/${turma.id}/individual`);

      expect(response.status).toBe(200);
      const body = response.body as { alunos: Array<{ alunoId: string }> };
      expect(body.alunos).toHaveLength(1);
      expect(body.alunos[0].alunoId).toBe("aluno-1");
    });
  });

  describe("GET /api/v1/turmas/:id/listas", () => {
    it("deve calcular o desempenho por listas corretamente", async () => {
      const { turma, questao } = await setupBase();
      
      const listaQ = await prisma.listaQuestao.create({ data: { nome: "Lista 1", criadoPorId: "prof-teste-123" } });
      await prisma.listaQuestaoItem.create({ data: { listaQuestaoId: listaQ.id, questaoId: questao.id, ordem: 1 } });
      const listaTurma = await prisma.listaTurma.create({ data: { turmaId: turma.id, listaQuestaoId: listaQ.id } });
      
      const resolucao = await prisma.resolucaoLista.create({
        data: { alunoId: "aluno-1", listaTurmaId: listaTurma.id, status: StatusResolucaoLista.SUBMETIDA }
      });
      await prisma.resolucaoQuestaoLista.create({
        data: { resolucaoListaId: resolucao.id, questaoId: questao.id, respostaMarcada: AlternativaQuestao.A }
      });

      const response = await request(app).get(`/api/v1/turmas/${turma.id}/listas`);

      expect(response.status).toBe(200);
      const body = response.body as Array<{ nomeLista: string; totalSubmeteram: number }>;
      expect(body[0].nomeLista).toBe("Lista 1");
      expect(body[0].totalSubmeteram).toBe(1);
    });
  });

  describe("GET /api/v1/turmas/:id/listas/:listaId", () => {
    it("deve retornar erro 404 se a lista não pertencer à turma", async () => {
      const { turma } = await setupBase();
      
      const validCuid = "clm123456789012345678901"; 
      
      const response = await request(app).get(`/api/v1/turmas/${turma.id}/listas/${validCuid}`);
      
      expect(response.status).toBe(404);
    });
  });
});