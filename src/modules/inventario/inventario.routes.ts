import { Router } from "express";
import { InventarioController } from "./inventario.controller";
import { InventarioService } from "./inventario.service";
import { InventarioRepository } from "./inventario.repository";
import { PAPEIS } from "@/shared/constants/papeis";
import { middlewarePapeis } from "@/shared/middlewares/papeis.middleware";
import { validarRequisicao } from "@/shared/middlewares/validacao.middleware";
import { schemaEquiparItem, schemaUsuariosInventario } from "./inventario.schema";

const repository = new InventarioRepository();
const service = new InventarioService(repository);
const controller = new InventarioController(service);

const inventarioRoutes = Router();

inventarioRoutes.use(middlewarePapeis(PAPEIS.ALUNO));

inventarioRoutes.get("/meuPerfil", controller.meuPerfil);

inventarioRoutes.get(
  "/usuarios/equipados",
  validarRequisicao(schemaUsuariosInventario, "query"),
  controller.perfisEquipados,
);

inventarioRoutes.patch(
  "/equipar",
  validarRequisicao(schemaEquiparItem, "body"),
  controller.equipar,
);

inventarioRoutes.patch(
  "/desequipar",
  validarRequisicao(schemaEquiparItem, "body"),
  controller.desequipar,
);

inventarioRoutes.get("/meuInventario", controller.meuInventario);

export { inventarioRoutes };
