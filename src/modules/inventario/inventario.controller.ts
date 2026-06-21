import type { Request, Response, NextFunction } from "express";
import type { InventarioService } from "./inventario.service";

export class InventarioController {
  constructor(private inventarioService: InventarioService) {}

  equipar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuarioId = req.usuario?.id || (req.headers["x-user-id"] as string); 
      const { itemLojaId } = req.body;

      const resultado = await this.inventarioService.equiparItem(usuarioId, itemLojaId);
      
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  };

  meuPerfil = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuarioId = req.usuario?.id || (req.headers["x-user-id"] as string);

      const resultado = await this.inventarioService.obterPerfilEquipado(usuarioId);
      
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  };

  meuInventario = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuarioId = req.usuario?.id || (req.headers["x-user-id"] as string);

      const resultado = await this.inventarioService.obterInventarioCompleto(usuarioId);
      
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  };
}