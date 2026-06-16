import { Router } from "express";

import { PAPEIS } from "@/shared/constants/papeis";
import { middlewarePapeis } from "@/shared/middlewares/papeis.middleware";
import { validarRequisicao } from "@/shared/middlewares/validacao.middleware";

import { AvatarLojaController } from "./avatarLoja.controller";
import { AvatarLojaRepository } from "./avatarLoja.repository";
import { AvatarLojaService } from "./avatarLoja.service";
import {
  schemaComprarItemAvatar,
  schemaListarCatalogoAvatar,
  schemaListarInventarioAvatar,
} from "./avatarLoja.schemas";

const avatarLojaRepository = new AvatarLojaRepository();
const avatarLojaService = new AvatarLojaService(avatarLojaRepository);
const avatarLojaController = new AvatarLojaController(avatarLojaService);

const avatarLojaRouter = Router();

avatarLojaRouter.use(middlewarePapeis(PAPEIS.ALUNO));

avatarLojaRouter.get(
  "/catalogo",
  validarRequisicao(schemaListarCatalogoAvatar, "query"),
  avatarLojaController.listarCatalogo,
);

avatarLojaRouter.get(
  "/meu-inventario",
  validarRequisicao(schemaListarInventarioAvatar, "query"),
  avatarLojaController.listarInventario,
);

avatarLojaRouter.post(
  "/comprar",
  validarRequisicao(schemaComprarItemAvatar, "body"),
  avatarLojaController.comprar,
);

export { avatarLojaRouter };