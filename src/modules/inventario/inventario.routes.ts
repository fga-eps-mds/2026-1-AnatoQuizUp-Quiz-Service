import { Router } from "express";
import { InventarioController } from "./inventario.controller";
import { InventarioService } from "./inventario.service";
import { InventarioRepository } from "./inventario.repository";
import { PAPEIS } from "@/shared/constants/papeis";
import { middlewarePapeis } from "@/shared/middlewares/papeis.middleware";
import { validarRequisicao } from "@/shared/middlewares/validacao.middleware";
import { schemaEquiparItem, schemaUsuariosInventario } from "./inventario.schema";

// Montagem das dependencias do modulo de inventario.
const repository = new InventarioRepository();
const service = new InventarioService(repository);
const controller = new InventarioController(service);

const inventarioRoutes = Router();

// Atalho de autorizacao reutilizado pelas rotas exclusivas do aluno.
const apenasAluno = middlewarePapeis(PAPEIS.ALUNO);

// GET perfil resumido do aluno (cosmeticos equipados do proprio usuario).
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

// PATCH equipa um item cosmetico no inventario do aluno.
inventarioRoutes.patch(
  "/equipar",
  apenasAluno,
  validarRequisicao(schemaEquiparItem, "body"),
  controller.equipar,
);

// PATCH desequipa um item cosmetico do inventario do aluno.
inventarioRoutes.patch(
  "/desequipar",
  apenasAluno,
  validarRequisicao(schemaEquiparItem, "body"),
  controller.desequipar,
);

// GET inventario completo do aluno autenticado.
inventarioRoutes.get("/meuInventario", apenasAluno, controller.meuInventario);

export { inventarioRoutes };
