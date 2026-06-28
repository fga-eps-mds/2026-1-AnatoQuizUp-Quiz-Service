import request from "supertest";
import type { Request, Response, NextFunction } from "express";
import express from "express";
import { listaQuestaoRouter } from "@/modules/lista/lista.routes";
import { prisma } from "@/config/db";
import type { CriarListaQuestaoDTO } from "@/modules/lista/dto/lista.types";

jest.mock("@/shared/utils/pdf.util", () => ({
  gerarPdfBase64: jest.fn().mockResolvedValue("base64-mock-data"),
}));

interface AuthenticatedRequest extends Request {
  usuario?: {
    id: string;
    email: string;
  };
}

jest.mock("@/shared/middlewares/autenticacao.middleware", () => ({
  middlewareAutenticacao: (req: Request, _res: Response, next: NextFunction) => {
    (req as AuthenticatedRequest).usuario = { id: "prof-teste-123", email: "prof@teste.com" };
    next();
  },
}));

jest.mock("@/shared/middlewares/papeis.middleware", () => ({
  middlewarePapeis: () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  },
}));

const app = express();
app.use(express.json());
app.use("/api/v1/lista", listaQuestaoRouter);

describe("Testes de Integração - Módulo de Lista de Questões", () => {
  const limparBanco = async () => {
    await prisma.resolucaoQuestaoLista.deleteMany();
    await prisma.resolucaoLista.deleteMany();
    await prisma.listaQuestaoItem.deleteMany();
    await prisma.listaTurma.deleteMany();
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

  const criarTurma = async () => prisma.turma.create({
    data: { 
      codigo: "T1", nome: "Turma A", semestre: "1", ano: 2026, 
      descricao: "Desc", professorId: "prof-teste-123" 
    }
  });

  const criarQuestao = async (temaId: string) => prisma.questao.create({
    data: {
      enunciado: "Questão 1",
      tipoQuestao: "MULTIPLA_ESCOLHA",
      respostaCorreta: "A",
      temaId: temaId,
      criadoPorId: "prof-teste-123"
    }
  });

  describe("POST /api/v1/lista", () => {
    it("deve criar uma lista com sucesso", async () => {
      const turma = await criarTurma();

      const payload: CriarListaQuestaoDTO = {
        nome: "Lista de Teste",
        turmasIds: [turma.id]
      };

      const response = await request(app)
        .post("/api/v1/lista")
        .send(payload);

      expect(response.status).toBe(201);
      const body = response.body as { dados: { nome: string } };
      expect(body.dados.nome).toBe("Lista de Teste");
    });
  });

  describe("GET /api/v1/lista", () => {
    it("deve listar as listas do usuário autenticado", async () => {
      await prisma.listaQuestao.create({
        data: { nome: "Lista A", criadoPorId: "prof-teste-123" }
      });

      const response = await request(app).get("/api/v1/lista");

      expect(response.status).toBe(200);
      const body = response.body as { dados: Array<{ nome: string }> };
      expect(body.dados).toHaveLength(1);
      expect(body.dados[0].nome).toBe("Lista A");
    });
  });

  describe("POST /api/v1/lista/:id/questoes", () => {
    it("deve vincular questões a uma lista existente", async () => {
      const lista = await prisma.listaQuestao.create({
        data: { nome: "Lista Vazia", criadoPorId: "prof-teste-123" }
      });
      const tema = await prisma.tema.create({ data: { nome: "T1" } });
      const questao = await criarQuestao(tema.id);

      const response = await request(app)
        .post(`/api/v1/lista/${lista.id}/questoes`)
        .send({ questoesIds: [questao.id] });

      expect(response.status).toBe(200);
      const body = response.body as { dados: { itens: Array<unknown> } };
      expect(body.dados.itens).toHaveLength(1);
    });
  });

  describe("GET /api/v1/lista/:id/estatisticas/turma/:turmaId", () => {
    it("deve gerar estatísticas para uma turma", async () => {
      const turma = await criarTurma();
      const lista = await prisma.listaQuestao.create({
        data: { nome: "Lista Estatística", criadoPorId: "prof-teste-123" }
      });

      await prisma.listaTurma.create({
        data: { listaQuestaoId: lista.id, turmaId: turma.id }
      });

      const response = await request(app).get(`/api/v1/lista/${lista.id}/estatisticas/turma/${turma.id}`);

      expect(response.status).toBe(200);
      const body = response.body as { dados: { turmaId: string } };
      expect(body.dados.turmaId).toBe(turma.id);
    });
  });
});