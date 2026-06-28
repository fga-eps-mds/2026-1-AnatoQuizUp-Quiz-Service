import request from "supertest";
import type { Request, Response, NextFunction } from "express";
import express from "express";
import { 
  AlternativaQuestao, 
  Dificuldade, 
  TipoQuestao, 
  StatusQuestao 
} from "@prisma/client";
import { prisma } from "@/config/db";
import { quizRouter } from "@/modules/quiz/quiz.routes";
import { middlewareTratamentoErros } from "@/shared/middlewares/tratamento-erros.middleware";
import { TIPO_QUESTAO_API } from "@/modules/questoes/dto/question.types";
import type { FeedbackQuizDto } from "@/modules/quiz/dto/responses/feedback_quiz_dto";
import type { RespostaPaginada } from "@/shared/types/api.types";
import type { RespostaQuestaoQuizDto } from "@/modules/quiz/dto/responses/resposta_questao_quiz_dto";

interface AuthenticatedRequest extends Request {
  usuario?: { id: string; papel: string };
}

jest.mock("@/shared/middlewares/papeis.middleware", () => ({
  middlewarePapeis: () => (req: Request, _res: Response, next: NextFunction) => {
    (req as AuthenticatedRequest).usuario = { id: "aluno-123", papel: "ALUNO" };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use("/api/v1/quiz", quizRouter);
app.use(middlewareTratamentoErros);

describe("Testes de Integração - Quiz", () => {
  const limparBanco = async () => {
    // Ordem estrita para evitar violação de chaves estrangeiras
    await prisma.transacaoMoeda.deleteMany();
    await prisma.resolucaoQuestao.deleteMany();
    await prisma.resolucaoQuestaoLista.deleteMany();
    await prisma.resolucaoLista.deleteMany();
    await prisma.listaTurma.deleteMany();
    await prisma.listaQuestaoItem.deleteMany();
    await prisma.listaQuestao.deleteMany();
    await prisma.turmaAluno.deleteMany();
    await prisma.turma.deleteMany();
    await prisma.carteiraMoedas.deleteMany();
    await prisma.conquistaUsuario.deleteMany();
    await prisma.desbloqueioConquista.deleteMany();
    await prisma.recompensaItemConquista.deleteMany();
    await prisma.conquista.deleteMany();
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

  describe("GET /api/v1/quiz", () => {
    it("deve retornar uma lista de questões", async () => {
      const tema = await prisma.tema.create({ data: { nome: "Anatomia" } });
      await prisma.questao.create({
        data: {
          enunciado: "O que é o coração?",
          tipoQuestao: TipoQuestao.MULTIPLA_ESCOLHA,
          respostaCorreta: AlternativaQuestao.A,
          dificuldade: Dificuldade.MEDIA,
          temaId: tema.id,
          criadoPorId: "prof-123",
          status: StatusQuestao.ATIVO,
          alternativas: { create: { alternativaA: "A", alternativaB: "B", alternativaC: "C", alternativaD: "D", alternativaE: "E" } }
        },
      });

      const response = await request(app).get("/api/v1/quiz");

      expect(response.status).toBe(200);
      const body = response.body as RespostaPaginada<RespostaQuestaoQuizDto>;
      expect(body.dados).toHaveLength(1);
      expect(body.dados[0].enunciado).toBe("O que é o coração?");
    });
  });

  describe("POST /api/v1/quiz/responder", () => {
    it("deve registrar a resposta e conceder moedas", async () => {
      const tema = await prisma.tema.create({ data: { nome: "Anatomia" } });
      const questao = await prisma.questao.create({
        data: {
          enunciado: "O que é o coração?",
          tipoQuestao: TipoQuestao.MULTIPLA_ESCOLHA,
          respostaCorreta: AlternativaQuestao.A,
          dificuldade: Dificuldade.FACIL,
          temaId: tema.id,
          criadoPorId: "prof-123",
          status: StatusQuestao.ATIVO,
        },
      });

      await prisma.carteiraMoedas.create({
        data: { usuarioId: "aluno-123", saldo: 0 },
      });

      const response = await request(app)
        .post("/api/v1/quiz/responder")
        .send({
          questaoId: questao.id,
          tipo: TIPO_QUESTAO_API.MULTIPLA_ESCOLHA,
          respostaMarcada: AlternativaQuestao.A,
        });

      expect(response.status).toBe(200);
      const body = response.body as FeedbackQuizDto;
      expect(body.correcao).toBe(true);
      expect(body.saldoMoedas).toBe(10);
    });
  });

  describe("GET /api/v1/quiz/moedas", () => {
    it("deve buscar o saldo atual do usuário", async () => {
      await prisma.carteiraMoedas.create({
        data: { usuarioId: "aluno-123", saldo: 50 },
      });

      const response = await request(app).get("/api/v1/quiz/moedas");

      expect(response.status).toBe(200);
      const body = response.body as { saldoMoedas: number };
      expect(body.saldoMoedas).toBe(50);
    });
  });

  describe("GET /api/v1/quiz/quantidade_por_tema", () => {
    it("deve retornar a contagem de questões por tema", async () => {
      const tema = await prisma.tema.create({ data: { nome: "Anatomia" } });
      await prisma.questao.create({
        data: {
          enunciado: "Q1",
          tipoQuestao: TipoQuestao.MULTIPLA_ESCOLHA,
          respostaCorreta: AlternativaQuestao.A,
          dificuldade: Dificuldade.MEDIA,
          temaId: tema.id,
          criadoPorId: "prof-123",
          status: StatusQuestao.ATIVO,
        },
      });

      const response = await request(app).get("/api/v1/quiz/quantidade_por_tema");

      expect(response.status).toBe(200);
      const body = response.body as { quantidadeDeQuestoesPorTema: Array<{ nome: string; totalQuestoes: number }> };
      expect(body.quantidadeDeQuestoesPorTema[0].nome).toBe("Anatomia");
      expect(body.quantidadeDeQuestoesPorTema[0].totalQuestoes).toBe(1);
    });
  });
});