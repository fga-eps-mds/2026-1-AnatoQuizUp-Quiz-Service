import request from "supertest";
import type { Request, Response, NextFunction } from "express";
import express from "express";
import { TierConquista, TipoConquista } from "@prisma/client";

// Interface para tipar a requisição com o usuário injetado
interface AuthenticatedRequest extends Request {
  usuario?: { id: string; papel: string };
}

// Definições de tipos para os dados de resposta (facilita o cast no teste)
interface ConquistaDto {
  id: string;
  nome: string;
  descricao: string;
}

interface ProgressoConquistaDto {
  id: string;
  valorProgresso: number;
  proximoTier: TierConquista;
  proximoObjetivo: number;
  percentual: number;
}

jest.mock("@/shared/middlewares/papeis.middleware", () => ({
  middlewarePapeis: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

import { prisma } from "@/config/db";
import { conquistaRouter } from "@/modules/conquistas/conquistas.routes";

const app = express();
app.use(express.json());

const USUARIO_ID_MOCK = "usuario-teste-123";

// Middleware tipado
app.use((req: Request, _res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (req.headers["x-sem-usuario"] === "true") {
    authReq.usuario = undefined;
  } else {
    authReq.usuario = {
      id: USUARIO_ID_MOCK,
      papel: "ALUNO",
    };
  }
  next();
});

app.use("/api/v1/conquistas", conquistaRouter);

describe("Testes de Integração - Módulo de Conquistas", () => {
  const limparBanco = async () => {
    await prisma.inventarioItem.deleteMany();
    await prisma.transacaoMoeda.deleteMany();
    await prisma.carteiraMoedas.deleteMany();
    await prisma.desbloqueioConquista.deleteMany();
    await prisma.conquistaUsuario.deleteMany();
    await prisma.recompensaItemConquista.deleteMany();
    await prisma.conquista.deleteMany();
  };

  beforeEach(async () => {
    await limparBanco();
  });

  afterAll(async () => {
    await limparBanco();
    await prisma.$disconnect();
  });

  describe("GET /api/v1/conquistas", () => {
    it("deve retornar uma lista paginada de conquistas ativas", async () => {
      await prisma.conquista.createMany({
        data: [
          {
            id: "conq-1",
            nome: "Mestre Supremo",
            descricao: "Acertou todas",
            tipoConquista: TipoConquista.TOTAL_ACERTOS,
            ativo: true,
          },
          {
            id: "conq-2",
            nome: "Inativo",
            descricao: "Não deve aparecer",
            tipoConquista: TipoConquista.STREAK_ACERTOS,
            ativo: false,
          },
        ],
      });

      const response = await request(app).get("/api/v1/conquistas?page=1&limit=10");

      expect(response.status).toBe(200);
      const body = response.body as { dados: ConquistaDto[]; metadados: object };
      expect(body.dados).toHaveLength(1);
      expect(body.dados[0].nome).toBe("Mestre Supremo");
      expect(body.metadados).toBeDefined();
    });
  });

  describe("GET /api/v1/conquistas/meu-progresso", () => {
    it("deve retornar o progresso consolidado do usuário nas conquistas", async () => {
      const conquista = await prisma.conquista.create({
        data: {
          nome: "Primeiros Passos",
          descricao: "Acertou 5",
          tipoConquista: TipoConquista.TOTAL_ACERTOS,
          ativo: true,
        },
      });

      await prisma.conquistaUsuario.create({
        data: {
          usuarioId: USUARIO_ID_MOCK,
          conquistaId: conquista.id,
          valorProgresso: 3,
        },
      });

      const response = await request(app).get("/api/v1/conquistas/meu-progresso");

      expect(response.status).toBe(200);
      const body = response.body as { dados: ProgressoConquistaDto[] };
      expect(body.dados).toHaveLength(1);
      
      const progresso = body.dados[0];
      expect(progresso.id).toBe(conquista.id);
      expect(progresso.valorProgresso).toBe(3);
      expect(progresso.proximoTier).toBe(TierConquista.BRONZE);
      expect(progresso.proximoObjetivo).toBe(5);
      expect(progresso.percentual).toBe(60); 
    });
  });

  describe("PATCH /api/v1/conquistas/desbloqueios/:id/destaque", () => {
    it("deve alterar o status de destaque de uma conquista desbloqueada com sucesso", async () => {
      const conquista = await prisma.conquista.create({
        data: {
          nome: "Mestre do Tórax",
          descricao: "Sabe tudo de tórax",
          tipoConquista: TipoConquista.TOTAL_ACERTOS_TEMA,
          ativo: true,
        },
      });

      const desbloqueio = await prisma.desbloqueioConquista.create({
        data: {
          usuarioId: USUARIO_ID_MOCK,
          conquistaId: conquista.id,
          tier: TierConquista.BRONZE,
          destaque: false,
        },
      });

      const response = await request(app)
        .patch(`/api/v1/conquistas/desbloqueios/${desbloqueio.id}/destaque`)
        .send({ destaque: true });

      expect(response.status).toBe(200);
      expect(response.body.mensagem).toBeDefined();

      const desbloqueioAtualizado = await prisma.desbloqueioConquista.findUnique({
        where: { id: desbloqueio.id },
      });
      expect(desbloqueioAtualizado?.destaque).toBe(true);
    });

    it("deve impedir o usuário de destacar mais de 3 conquistas", async () => {
      const conquista = await prisma.conquista.create({
        data: {
          nome: "Conquista Genérica",
          descricao: "Teste limite",
          tipoConquista: TipoConquista.STREAK_ACERTOS,
          ativo: true,
        },
      });

      await prisma.desbloqueioConquista.createMany({
        data: [
          { usuarioId: USUARIO_ID_MOCK, conquistaId: conquista.id, tier: TierConquista.BRONZE, destaque: true },
          { usuarioId: USUARIO_ID_MOCK, conquistaId: conquista.id, tier: TierConquista.PRATA, destaque: true },
          { usuarioId: USUARIO_ID_MOCK, conquistaId: conquista.id, tier: TierConquista.OURO, destaque: true },
        ],
      });

      const conquista2 = await prisma.conquista.create({
        data: {
          nome: "Conquista Extra",
          descricao: "Apenas para tentar destacar",
          tipoConquista: TipoConquista.TOTAL_ACERTOS,
          ativo: true,
        },
      });

      const novoDesbloqueio = await prisma.desbloqueioConquista.create({
        data: {
          usuarioId: USUARIO_ID_MOCK,
          conquistaId: conquista2.id,
          tier: TierConquista.BRONZE, 
          destaque: false,
        },
      });

      const response = await request(app)
        .patch(`/api/v1/conquistas/desbloqueios/${novoDesbloqueio.id}/destaque`)
        .send({ destaque: true });

      expect(response.status).toBe(500); 
      expect(response.body).toBeDefined(); 
    });

    it("deve retornar erro se o desbloqueio não pertencer ao usuário", async () => {
      const conquista = await prisma.conquista.create({
        data: {
          nome: "Invasão",
          descricao: "Tentando acessar",
          tipoConquista: TipoConquista.TOTAL_ACERTOS,
          ativo: true,
        },
      });

      const desbloqueio = await prisma.desbloqueioConquista.create({
        data: {
          usuarioId: "OUTRO_USUARIO_QUALQUER",
          conquistaId: conquista.id,
          tier: TierConquista.BRONZE,
        },
      });

      const response = await request(app)
        .patch(`/api/v1/conquistas/desbloqueios/${desbloqueio.id}/destaque`)
        .send({ destaque: true });

      expect(response.status).toBe(500);
      expect(response.body).toBeDefined();
    });
  });

  describe("GET /api/v1/conquistas/:id", () => {
    it("deve buscar o detalhe consolidado de uma conquista específica", async () => {
      const conquista = await prisma.conquista.create({
        data: {
          nome: "Estudante Dedicado",
          descricao: "Detalhe da conquista",
          tipoConquista: TipoConquista.TOTAL_ACERTOS,
          ativo: true,
        },
      });

      await prisma.conquistaUsuario.create({
        data: {
          usuarioId: USUARIO_ID_MOCK,
          conquistaId: conquista.id,
          valorProgresso: 51,
        },
      });

      await prisma.desbloqueioConquista.create({
        data: {
          usuarioId: USUARIO_ID_MOCK,
          conquistaId: conquista.id,
          tier: TierConquista.BRONZE, 
        },
      });

      const response = await request(app).get(`/api/v1/conquistas/${conquista.id}`);

      expect(response.status).toBe(200);
      const body = response.body as { id: string; valorProgresso: number; tiers: unknown[] };
      expect(body.id).toBe(conquista.id);
      expect(body.valorProgresso).toBe(51);
      expect(body.tiers).toHaveLength(3);
    });
  });
});

