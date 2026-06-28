import { Router } from "express";

import { PAPEIS } from "@/shared/constants/papeis";
import { middlewarePapeis } from "@/shared/middlewares/papeis.middleware";
import { validarRequisicao } from "@/shared/middlewares/validacao.middleware";

import { LojaController } from "./loja.controller";
import { LojaRepository } from "./loja.repository";
import { LojaService } from "./loja.service";
import {
  schemaComprarItem,
  schemaListarCatalogo,
  schemaListarInventario,
} from "./loja.schemas";

// Montagem das dependencias do modulo de loja.
const lojaRepository = new LojaRepository();
const lojaService = new LojaService(lojaRepository);
const lojaController = new LojaController(lojaService);

const lojaRouter = Router();

// Loja de cosmeticos: somente alunos compram/consultam.
lojaRouter.use(middlewarePapeis(PAPEIS.ALUNO));

// GET catalogo de itens a venda.
lojaRouter.get(
  "/catalogo",
  validarRequisicao(schemaListarCatalogo, "query"),
  lojaController.listarCatalogo,
);

// GET itens que o aluno ja possui.
lojaRouter.get(
  "/meu-inventario",
  validarRequisicao(schemaListarInventario, "query"),
  lojaController.listarInventario,
);

// POST compra um item gastando moedas do aluno.
lojaRouter.post(
  "/comprar",
  validarRequisicao(schemaComprarItem, "body"),
  lojaController.comprar,
);

export { lojaRouter };
