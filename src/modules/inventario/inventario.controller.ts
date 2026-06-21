import type { Request, Response, NextFunction } from "express";
import type { InventarioService } from "./inventario.service";

export class InventarioController {
  constructor(private inventarioService: InventarioService) {}

  equipar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuarioId = req.usuario!.id;
      const { itemLojaId } = req.body;

      const resultado = await this.inventarioService.equiparItem(usuarioId, itemLojaId);

      return res.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  };

  meuPerfil = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuarioId = req.usuario!.id;

      const resultado = await this.inventarioService.obterPerfilEquipado(usuarioId);

      return res.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  };

  meuInventario = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuarioId = req.usuario!.id;

      const resultado = await this.inventarioService.obterInventarioCompleto(usuarioId);

      return res.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  };
}
