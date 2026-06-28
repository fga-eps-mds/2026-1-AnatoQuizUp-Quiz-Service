import request from "supertest";
import type { Request, Response, NextFunction } from "express";
import express from "express";
import { TipoItemLoja, OrigemItemInventario } from "@prisma/client";
import { prisma } from "@/config/db";
import { lojaRouter } from "@/modules/loja/loja.routes";
import { middlewareTratamentoErros } from "@/shared/middlewares/tratamento-erros.middleware";

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
app.use("/api/v1/loja", lojaRouter);
app.use(middlewareTratamentoErros);

describe("Testes de Integração - Loja", () => {
  const limparBanco = async () => {
    await prisma.transacaoMoeda.deleteMany();
    await prisma.inventarioItem.deleteMany();
    await prisma.carteiraMoedas.deleteMany();
    await prisma.itemLoja.deleteMany();
  };

  beforeEach(async () => {
    await limparBanco();
  });

  afterAll(async () => {
    await limparBanco();
    await prisma.$disconnect();
  });

  describe("GET /api/v1/loja/catalogo", () => {
    it("deve listar os itens ativos do catálogo", async () => {
      await prisma.itemLoja.create({
        data: {
          codigo: "ITEM-1",
          nome: "Avatar Dourado",
          tipo: TipoItemLoja.AVATAR,
          precoMoedas: 100,
          ativo: true,
          disponivelNaLoja: true,
        },
      });

      const response = await request(app).get("/api/v1/loja/catalogo");

      expect(response.status).toBe(200);
      const body = response.body as { dados: Array<{ nome: string }> };
      expect(body.dados).toHaveLength(1);
      expect(body.dados[0].nome).toBe("Avatar Dourado");
    });
  });

  describe("POST /api/v1/loja/comprar", () => {
    it("deve comprar um item com sucesso", async () => {
      const item = await prisma.itemLoja.create({
        data: {
          codigo: "ITEM-2",
          nome: "Skin Premium",
          tipo: TipoItemLoja.PLANO_FUNDO,
          precoMoedas: 50,
          ativo: true,
          disponivelNaLoja: true,
        },
      });

      await prisma.carteiraMoedas.create({
        data: { usuarioId: "aluno-123", saldo: 100 },
      });

      const response = await request(app)
        .post("/api/v1/loja/comprar")
        .send({ itemLojaId: item.id });

      expect(response.status).toBe(200);
      const body = response.body as { saldoMoedas: number };
      expect(body.saldoMoedas).toBe(50);
    });

    it("deve retornar erro 422 ao comprar item com saldo insuficiente", async () => {
      const item = await prisma.itemLoja.create({
        data: {
          codigo: "ITEM-3",
          nome: "Item Caro",
          tipo: TipoItemLoja.TITULO,
          precoMoedas: 500,
          ativo: true,
          disponivelNaLoja: true,
        },
      });

      await prisma.carteiraMoedas.create({
        data: { usuarioId: "aluno-123", saldo: 10 },
      });

      const response = await request(app)
        .post("/api/v1/loja/comprar")
        .send({ itemLojaId: item.id });

      expect(response.status).toBe(422);
      const body = response.body as { erro: { mensagem: string } };
      expect(body.erro.mensagem).toBe("Saldo de moedas insuficiente para comprar este item.");
    });
  });

  describe("GET /api/v1/loja/meu-inventario", () => {
    it("deve listar os itens adquiridos pelo aluno", async () => {
      const item = await prisma.itemLoja.create({
        data: {
          codigo: "ITEM-4",
          nome: "Moldura Básica",
          tipo: TipoItemLoja.MOLDURA,
          precoMoedas: 10,
          ativo: true,
          disponivelNaLoja: true,
        },
      });

      await prisma.inventarioItem.create({
        data: {
          usuarioId: "aluno-123",
          itemLojaId: item.id,
          origem: OrigemItemInventario.COMPRA,
        },
      });

      const response = await request(app).get("/api/v1/loja/meu-inventario");

      expect(response.status).toBe(200);
      const body = response.body as { dados: Array<{ item: { nome: string } }> };
      expect(body.dados).toHaveLength(1);
      expect(body.dados[0].item.nome).toBe("Moldura Básica");
    });
  });
});