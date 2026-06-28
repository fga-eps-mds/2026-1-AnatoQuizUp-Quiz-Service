import request from "supertest";
import type { Request, Response, NextFunction } from "express";
import express from "express";
import { 
  AlternativaQuestao, 
  Dificuldade, 
  TipoQuestao 
} from "@prisma/client";
import { prisma } from "@/config/db";
import { rankingRouter } from "@/modules/ranking/ranking.routes";
import type { PontuacaoUsuario } from "@/modules/ranking/ranking.types";

interface AuthenticatedRequest extends Request {
  usuario?: { id: string; papel: string };
}

jest.mock("@/shared/middlewares/papeis.middleware", () => ({
  middlewarePapeis: () => (req: Request, _res: Response, next: NextFunction) => {
    (req as AuthenticatedRequest).usuario = { id: "aluno-1", papel: "ALUNO" };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use("/api/v1/ranking", rankingRouter);

describe("Testes de Integração - Ranking", () => {
  const limparBanco = async () => {
    await prisma.resolucaoQuestao.deleteMany();
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

  const setupBase = async () => {
    const tema = await prisma.tema.create({ data: { nome: "Anatomia" } });
    const questao = await prisma.questao.create({
      data: {
        enunciado: "Q1",
        tipoQuestao: TipoQuestao.MULTIPLA_ESCOLHA,
        respostaCorreta: AlternativaQuestao.A,
        dificuldade: Dificuldade.MEDIA,
        temaId: tema.id,
        criadoPorId: "prof-1",
        status: "ATIVO",
      },
    });
    return { questao };
  };

  describe("GET /api/v1/ranking/pontuacoes", () => {
    it("deve calcular o ranking geral corretamente (ordenado por acertos)", async () => {
      const { questao } = await setupBase();

      // Usuário 1: 2 acertos
      await prisma.resolucaoQuestao.createMany({
        data: [
          { usuarioId: "user-1", questaoId: questao.id, respostaMarcada: AlternativaQuestao.A },
          { usuarioId: "user-1", questaoId: questao.id, respostaMarcada: AlternativaQuestao.A },
        ]
      });

      // Usuário 2: 1 acerto
      await prisma.resolucaoQuestao.create({
        data: { usuarioId: "user-2", questaoId: questao.id, respostaMarcada: AlternativaQuestao.A }
      });

      const response = await request(app).get("/api/v1/ranking/pontuacoes");

      expect(response.status).toBe(200);
      const body = response.body as { dados: PontuacaoUsuario[] };
      
      expect(body.dados).toHaveLength(2);
      expect(body.dados[0].usuarioId).toBe("user-1"); // 2 acertos
      expect(body.dados[1].usuarioId).toBe("user-2"); // 1 acerto
    });

    it("deve filtrar o ranking quando usuarioIds são fornecidos", async () => {
      const { questao } = await setupBase();

      await prisma.resolucaoQuestao.create({
        data: { usuarioId: "user-target", questaoId: questao.id, respostaMarcada: AlternativaQuestao.A }
      });
      await prisma.resolucaoQuestao.create({
        data: { usuarioId: "user-out", questaoId: questao.id, respostaMarcada: AlternativaQuestao.A }
      });

      const response = await request(app)
        .get("/api/v1/ranking/pontuacoes")
        .query({ usuarioIds: "user-target" });

      expect(response.status).toBe(200);
      const body = response.body as { dados: PontuacaoUsuario[] };
      
      expect(body.dados).toHaveLength(1);
      expect(body.dados[0].usuarioId).toBe("user-target");
    });

    it("deve retornar lista vazia quando não há resoluções", async () => {
      const response = await request(app).get("/api/v1/ranking/pontuacoes");

      expect(response.status).toBe(200);
      const body = response.body as { dados: PontuacaoUsuario[] };
      expect(body.dados).toEqual([]);
    });
  });
});