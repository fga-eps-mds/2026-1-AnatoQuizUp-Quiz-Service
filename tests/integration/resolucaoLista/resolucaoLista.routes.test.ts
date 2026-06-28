import request from "supertest";
import type { Request, Response, NextFunction } from "express";
import express from "express";
import { AlternativaQuestao, StatusResolucaoLista, TipoQuestao } from "@prisma/client";
import { prisma } from "@/config/db";
import { resolucaoListaRouter } from "@/modules/resolucaoLista/resolucaoLista.routes";
import { middlewareTratamentoErros } from "@/shared/middlewares/tratamento-erros.middleware";
import type { QuestaoFormatadaDTO } from "@/modules/resolucaoLista/dto/types";

// Tipagem segura para a requisição autenticada
interface AuthenticatedRequest extends Request {
  usuario?: { id: string; papel: string };
}

// Mock de autenticação
jest.mock("@/shared/middlewares/papeis.middleware", () => ({
  middlewarePapeis: () => (req: Request, _res: Response, next: NextFunction) => {
    (req as AuthenticatedRequest).usuario = { id: "aluno-123", papel: "ALUNO" };
    next();
  },
}));

// Mock do gerador de PDF
jest.mock("@/shared/utils/pdf.util", () => ({
  gerarPdfBase64: jest.fn().mockResolvedValue("base64-mock-data"),
}));

const app = express();
app.use(express.json());
app.use("/api/v1/resolucao", resolucaoListaRouter);
app.use(middlewareTratamentoErros);

describe("Testes de Integração - ResolucaoLista", () => {
  const limparBanco = async () => {
    await prisma.resolucaoQuestaoLista.deleteMany();
    await prisma.resolucaoLista.deleteMany();
    await prisma.listaQuestaoItem.deleteMany();
    await prisma.listaTurma.deleteMany();
    await prisma.listaQuestao.deleteMany();
    await prisma.turmaAluno.deleteMany();
    await prisma.turma.deleteMany();
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

  const setupData = async () => {
    const tema = await prisma.tema.create({ data: { nome: "Anatomia" } });
    const questao = await prisma.questao.create({
      data: {
        enunciado: "Q1",
        tipoQuestao: TipoQuestao.MULTIPLA_ESCOLHA,
        respostaCorreta: AlternativaQuestao.A,
        temaId: tema.id,
        criadoPorId: "prof-1",
        alternativas: {
          create: { alternativaA: "A", alternativaB: "B", alternativaC: "C", alternativaD: "D", alternativaE: "E" }
        }
      }
    });

    const turma = await prisma.turma.create({
      data: { codigo: "T1", nome: "Turma A", semestre: "1", ano: 2026, descricao: "Desc", professorId: "prof-1" }
    });

    await prisma.turmaAluno.create({ data: { turmaId: turma.id, alunoId: "aluno-123" } });

    const lista = await prisma.listaQuestao.create({ data: { nome: "Lista Teste", criadoPorId: "prof-1" } });
    await prisma.listaQuestaoItem.create({ data: { listaQuestaoId: lista.id, questaoId: questao.id, ordem: 1 } });
    
    const listaTurma = await prisma.listaTurma.create({ data: { listaQuestaoId: lista.id, turmaId: turma.id } });

    return { listaTurma, questao };
  };

  describe("POST /api/v1/resolucao/:id/autosave", () => {
    it("deve salvar a resposta automaticamente", async () => {
      const { listaTurma, questao } = await setupData();

      const response = await request(app)
        .post(`/api/v1/resolucao/${listaTurma.id}/autosave`)
        .send({
          questaoId: questao.id,
          alternativaMarcada: AlternativaQuestao.A
        });

      expect(response.status).toBe(200);
      
      const resolucao = await prisma.resolucaoLista.findUnique({
        where: { alunoId_listaTurmaId: { alunoId: "aluno-123", listaTurmaId: listaTurma.id } }
      });
      expect(resolucao).not.toBeNull();
    });
  });

  describe("GET /api/v1/resolucao/:id", () => {
    it("deve buscar os detalhes da lista", async () => {
      const { listaTurma } = await setupData();

      const response = await request(app).get(`/api/v1/resolucao/${listaTurma.id}`);

      expect(response.status).toBe(200);
      
      type ResponseBody = { dados: { id: string; questoes: QuestaoFormatadaDTO[] } };
      const body = response.body as ResponseBody;
      
      expect(body.dados.id).toBe(listaTurma.id);
      expect(body.dados.questoes).toHaveLength(1);
    });
  });

  describe("POST /api/v1/resolucao/:id/submeter", () => {
    it("deve submeter a lista com sucesso", async () => {
      const { listaTurma, questao } = await setupData();

      // Primeiro salva uma resposta
      await request(app)
        .post(`/api/v1/resolucao/${listaTurma.id}/autosave`)
        .send({ questaoId: questao.id, alternativaMarcada: AlternativaQuestao.A });

      const response = await request(app).post(`/api/v1/resolucao/${listaTurma.id}/submeter`);

      expect(response.status).toBe(200);

      const resolucao = await prisma.resolucaoLista.findUnique({
        where: { alunoId_listaTurmaId: { alunoId: "aluno-123", listaTurmaId: listaTurma.id } }
      });
      expect(resolucao?.status).toBe(StatusResolucaoLista.SUBMETIDA);
    });
  });

  describe("GET /api/v1/resolucao/:listaTurmaId/pdf", () => {
    it("deve gerar o PDF base64", async () => {
      const { listaTurma } = await setupData();
      
      const response = await request(app).get(`/api/v1/resolucao/${listaTurma.id}/pdf`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("base64");
    });
  });
});