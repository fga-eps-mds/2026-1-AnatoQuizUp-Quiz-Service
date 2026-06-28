import request from "supertest";
import type { Request, Response, NextFunction } from "express";
import express from "express";
import { prisma } from "@/config/db";
import { turmaRouter } from "@/modules/turma/turma.routes";
import { middlewareTratamentoErros } from "@/shared/middlewares/tratamento-erros.middleware";
import type { CriarTurmaDto, RespostaTurma } from "@/modules/turma/dto/turma.types";
import { PAPEIS } from "@/shared/constants/papeis";

interface AuthenticatedRequest extends Request {
  usuario?: { id: string; papel: string };
}

const app = express();
app.use(express.json());

// Middleware global para garantir contexto de usuário em todas as rotas de teste
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as AuthenticatedRequest).usuario = { id: "prof-123", papel: PAPEIS.PROFESSOR };
  next();
});

app.use("/api/v1/turmas", turmaRouter);
app.use(middlewareTratamentoErros);

describe("Testes de Integração - Módulo de Turma", () => {
  const limparBanco = async () => {
    // Ordem estrita para evitar violação de chaves estrangeiras
    await prisma.turmaAluno.deleteMany();
    await prisma.turma.deleteMany();
  };

  beforeEach(async () => {
    await limparBanco();
  });

  afterAll(async () => {
    await limparBanco();
    await prisma.$disconnect();
  });

  describe("POST /api/v1/turmas", () => {
    it("deve criar uma turma com sucesso", async () => {
      const payload: CriarTurmaDto = {
        codigo: "TURMA-001",
        nome: "Engenharia de Software",
        semestre: "2026/1",
        ano: 2026,
        descricao: "Turma de EPS",
        status: "ATIVA"
      };

      const response = await request(app)
        .post("/api/v1/turmas")
        .send(payload);

      expect(response.status).toBe(201);
      
      const body = response.body as { dados: RespostaTurma };
      expect(body.dados.nome).toBe("Engenharia de Software");
      expect(body.dados.codigo).toBe("TURMA-001");
    });
  });

  describe("GET /api/v1/turmas", () => {
    it("deve listar turmas cadastradas", async () => {
      await prisma.turma.create({
        data: {
          codigo: "T1",
          nome: "Turma de Teste",
          semestre: "1",
          ano: 2026,
          descricao: "Desc",
          professorId: "prof-123",
          status: "ATIVA"
        }
      });

      const response = await request(app).get("/api/v1/turmas");

      expect(response.status).toBe(200);
      const body = response.body as { dados: RespostaTurma[] };
      expect(body.dados).toHaveLength(1);
    });
  });

  describe("POST /api/v1/turmas/:id/alunos", () => {
    it("deve vincular um aluno a uma turma existente", async () => {
      const turma = await prisma.turma.create({
        data: {
          codigo: "T2",
          nome: "Turma A",
          semestre: "1",
          ano: 2026,
          descricao: "Desc",
          professorId: "prof-123",
          status: "ATIVA"
        }
      });

      const response = await request(app)
        .post(`/api/v1/turmas/${turma.id}/alunos`)
        .send({ alunoId: "aluno-456" });

      expect(response.status).toBe(201);
      
      const vinculo = await prisma.turmaAluno.findFirst({
        where: { turmaId: turma.id, alunoId: "aluno-456" }
      });
      expect(vinculo).toBeDefined();
    });
  });

  describe("DELETE /api/v1/turmas/:id", () => {
    it("deve realizar o delete lógico de uma turma", async () => {
      const turma = await prisma.turma.create({
        data: {
          codigo: "T-DEL",
          nome: "Turma para deletar",
          semestre: "1",
          ano: 2026,
          descricao: "Desc",
          professorId: "prof-123",
          status: "ATIVA"
        }
      });

      const response = await request(app).delete(`/api/v1/turmas/${turma.id}`);

      // O controller retorna 204 no delete
      expect(response.status).toBe(204);

      const turmaBanco = await prisma.turma.findUnique({
        where: { id: turma.id }
      });
      
      expect(turmaBanco?.status).toBe("INATIVA");
      expect(turmaBanco?.excluidoEm).not.toBeNull();
    });
  });
});