import type { NextFunction, Request, Response } from "express";

import type { AvatarLojaService } from "./avatarLoja.service";
import type {
  ComprarItemAvatarDto,
  ListarCatalogoAvatarQueryDto,
  ListarInventarioAvatarQueryDto,
} from "./avatarLoja.schemas";

export class AvatarLojaController {
  constructor(private readonly avatarLojaService: AvatarLojaService) {}

  listarCatalogo = async (
    request: Request<unknown, unknown, unknown, ListarCatalogoAvatarQueryDto>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const catalogo = await this.avatarLojaService.listarCatalogo(
        request.usuario?.id,
        request.query,
      );

      return response.status(200).json(catalogo);
    } catch (error) {
      return next(error);
    }
  };

  listarInventario = async (
    request: Request<unknown, unknown, unknown, ListarInventarioAvatarQueryDto>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const inventario = await this.avatarLojaService.listarInventario(
        request.usuario?.id,
        request.query,
      );

      return response.status(200).json(inventario);
    } catch (error) {
      return next(error);
    }
  };

  comprar = async (
    request: Request<unknown, unknown, ComprarItemAvatarDto>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const compra = await this.avatarLojaService.comprar(
        request.usuario?.id,
        request.body.itemAvatarLojaId,
      );

      return response.status(200).json(compra);
    } catch (error) {
      return next(error);
    }
  };
}