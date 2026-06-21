import { Router } from "express";
import { InventarioController } from "./inventario.controller";
import { InventarioService } from "./inventario.service";
import { InventarioRepository } from "./inventario.repository";
import { validarRequisicao } from "../../shared/middlewares/validacao.middleware";
import { schemaEquiparItem } from "./inventario.schema";

const repository = new InventarioRepository();
const service = new InventarioService(repository);
const controller = new InventarioController(service);

const inventarioRoutes = Router();

inventarioRoutes.get("/meuPerfil", controller.meuPerfil);

inventarioRoutes.patch(
  "/equipar",
  validarRequisicao(schemaEquiparItem, "body"),
  controller.equipar
);

inventarioRoutes.get("/meuInventario", controller.meuInventario);

export { inventarioRoutes };