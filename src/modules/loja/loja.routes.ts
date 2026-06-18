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

const lojaRepository = new LojaRepository();
const lojaService = new LojaService(lojaRepository);
const lojaController = new LojaController(lojaService);

const lojaRouter = Router();

lojaRouter.use(middlewarePapeis(PAPEIS.ALUNO));

lojaRouter.get(
  "/catalogo",
  validarRequisicao(schemaListarCatalogo, "query"),
  lojaController.listarCatalogo,
);

lojaRouter.get(
  "/meu-inventario",
  validarRequisicao(schemaListarInventario, "query"),
  lojaController.listarInventario,
);

lojaRouter.post(
  "/comprar",
  validarRequisicao(schemaComprarItem, "body"),
  lojaController.comprar,
);

export { lojaRouter };
