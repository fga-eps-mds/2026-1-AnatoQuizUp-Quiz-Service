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

const apenasAluno = middlewarePapeis(PAPEIS.ALUNO);

inventarioRoutes.get("/meuPerfil", apenasAluno, controller.meuPerfil);

// Consulta batch de cosmeticos equipados usada pela orquestracao (perfil social
// e ranking). E read-only, interna (nao exposta publicamente pelo BFF) e tambem
// precisa atender o professor/admin que visualiza rankings.
inventarioRoutes.get(
  "/usuarios/equipados",
  middlewarePapeis(PAPEIS.ALUNO, PAPEIS.PROFESSOR, PAPEIS.ADMINISTRADOR),
  validarRequisicao(schemaUsuariosInventario, "query"),
  controller.perfisEquipados,
);

inventarioRoutes.patch(
  "/equipar",
  apenasAluno,
  validarRequisicao(schemaEquiparItem, "body"),
  controller.equipar,
);

inventarioRoutes.patch(
  "/desequipar",
  apenasAluno,
  validarRequisicao(schemaEquiparItem, "body"),
  controller.desequipar,
);

inventarioRoutes.get("/meuInventario", apenasAluno, controller.meuInventario);

export { inventarioRoutes };
