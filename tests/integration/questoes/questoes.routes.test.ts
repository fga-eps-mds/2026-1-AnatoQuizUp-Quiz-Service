import request from "supertest";
import type { Request, Response, NextFunction } from "express";
import express from "express";
import { 
  AlternativaQuestao, 
  Dificuldade, 
  StatusQuestao, 
  TipoQuestao 
} from "@prisma/client";
import { prisma } from "@/config/db";
import { questionRouter } from "@/modules/questoes/questoes.routes";
import { middlewareTratamentoErros } from "@/shared/middlewares/tratamento-erros.middleware";
import type { CriarQuestaoDto, RespostaQuestaoDto } from "@/modules/questoes/dto/question.types";
import { TIPO_QUESTAO_API } from "@/modules/questoes/dto/question.types";
import type { RespostaApiSucesso, RespostaPaginada } from "@/shared/types/api.types";

interface AuthenticatedRequest extends Request {
  usuario?: { id: string; papel: string };
}

jest.mock("@/shared/middlewares/papeis.middleware", () => ({
  middlewarePapeis: () => (req: Request, _res: Response, next: NextFunction) => {
    (req as AuthenticatedRequest).usuario = { id: "prof-123", papel: "PROFESSOR" };
    next();
  },
}));

jest.mock("multer", () => {
  const mMulter = jest.fn().mockReturnValue({
    single: () => (req: Request, _res: Response, next: NextFunction) => next(),
  });
  const memoryStorage = () => ({});
  Object.assign(mMulter, { memoryStorage });
  return mMulter;
});

jest.mock("@/modules/questoes/minio.service", () => ({
  MinioService: jest.fn().mockImplementation(() => ({
    uploadImagem: jest.fn().mockResolvedValue("http://mock-url.com/image.jpg"),
  })),
}));

const app = express();
app.use(express.json());
app.use("/api/v1/questoes", questionRouter);
app.use(middlewareTratamentoErros);

describe("Testes de Integração - Questões", () => {
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

  describe("POST /api/v1/questoes", () => {
    it("deve criar uma questão de múltipla escolha", async () => {
      // Corrigido: URL válida para passar no z.string().url()
      const payload: CriarQuestaoDto = {
        tema: "Anatomia",
        enunciado: "O que é o coração?",
        tipo: TIPO_QUESTAO_API.MULTIPLA_ESCOLHA,
        dificuldade: Dificuldade.MEDIA,
        imagem: "http://example.com/imagem.jpg", 
        alternativaCorreta: AlternativaQuestao.A,
        saibaMais: "Saiba mais sobre o coração",
        alternativas: {
          A: "Órgão",
          B: "Músculo",
          C: "Osso",
          D: "Veia",
          E: "Artéria",
        },
      };

      const response = await request(app)
        .post("/api/v1/questoes")
        .send(payload);

      expect(response.status).toBe(201);
      const body = response.body as RespostaApiSucesso<RespostaQuestaoDto>;
      expect(body.dados.enunciado).toBe("O que é o coração?");
    });
  });

  describe("GET /api/v1/questoes", () => {
    it("deve listar questões cadastradas", async () => {
      const tema = await prisma.tema.create({ data: { nome: "Histologia" } });
      await prisma.questao.create({
        data: {
          enunciado: "Q1",
          tipoQuestao: TipoQuestao.MULTIPLA_ESCOLHA,
          respostaCorreta: AlternativaQuestao.A,
          dificuldade: Dificuldade.FACIL,
          temaId: tema.id,
          criadoPorId: "prof-123",
          alternativas: {
            create: {
              alternativaA: "A", alternativaB: "B", alternativaC: "C", alternativaD: "D", alternativaE: "E"
            }
          }
        },
      });

      const response = await request(app).get("/api/v1/questoes");

      expect(response.status).toBe(200);
      const body = response.body as RespostaPaginada<RespostaQuestaoDto>;
      expect(body.dados).toHaveLength(1);
    });
  });

  describe("PUT /api/v1/questoes/:id", () => {
    it("deve atualizar uma questão existente", async () => {
      const tema = await prisma.tema.create({ data: { nome: "Anatomia" } });
      const questao = await prisma.questao.create({
        data: {
          enunciado: "Enunciado Antigo",
          tipoQuestao: TipoQuestao.MULTIPLA_ESCOLHA,
          respostaCorreta: AlternativaQuestao.A,
          temaId: tema.id,
          criadoPorId: "prof-123",
          alternativas: {
            create: {
              alternativaA: "A", alternativaB: "B", alternativaC: "C", alternativaD: "D", alternativaE: "E"
            }
          }
        },
      });

      // Corrigido: URL válida
      const updatePayload: CriarQuestaoDto = {
        tema: "Anatomia",
        enunciado: "Enunciado Novo",
        tipo: TIPO_QUESTAO_API.MULTIPLA_ESCOLHA,
        dificuldade: Dificuldade.FACIL,
        imagem: "http://example.com/imagem-nova.jpg",
        alternativaCorreta: AlternativaQuestao.B,
        saibaMais: "Saiba mais",
        alternativas: { A: "A", B: "B", C: "C", D: "D", E: "E" },
      };

      const response = await request(app)
        .put(`/api/v1/questoes/${questao.id}`)
        .send(updatePayload);

      expect(response.status).toBe(200);
      const body = response.body as RespostaApiSucesso<RespostaQuestaoDto>;
      expect(body.dados.enunciado).toBe("Enunciado Novo");
    });
  });

  describe("DELETE /api/v1/questoes/:id", () => {
    it("deve desativar uma questão", async () => {
      const tema = await prisma.tema.create({ data: { nome: "Anatomia" } });
      const questao = await prisma.questao.create({
        data: {
          enunciado: "Para deletar",
          tipoQuestao: TipoQuestao.MULTIPLA_ESCOLHA,
          respostaCorreta: AlternativaQuestao.A,
          temaId: tema.id,
          criadoPorId: "prof-123",
        },
      });

      const response = await request(app).delete(`/api/v1/questoes/${questao.id}`);

      expect(response.status).toBe(200);
      const body = response.body as RespostaApiSucesso<RespostaQuestaoDto>;
      expect(body.dados.status).toBe(StatusQuestao.INATIVO);
    });
  });
});