import type { NextFunction, Request, Response } from "express";

import type { LojaService } from "./loja.service";
import type {
  ComprarItemDto,
  ListarCatalogoQueryDto,
  ListarInventarioQueryDto,
} from "./loja.schemas";

export class LojaController {
  constructor(private readonly lojaService: LojaService) {}

  listarCatalogo = async (
    request: Request<unknown, unknown, unknown, ListarCatalogoQueryDto>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const catalogo = await this.lojaService.listarCatalogo(request.usuario?.id, request.query);

      return response.status(200).json(catalogo);
    } catch (error) {
      return next(error);
    }
  };

  listarInventario = async (
    request: Request<unknown, unknown, unknown, ListarInventarioQueryDto>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const inventario = await this.lojaService.listarInventario(
        request.usuario?.id,
        request.query,
      );

      return response.status(200).json(inventario);
    } catch (error) {
      return next(error);
    }
  };

  comprar = async (
    request: Request<unknown, unknown, ComprarItemDto>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const compra = await this.lojaService.comprar(request.usuario?.id, request.body.itemLojaId);

      return response.status(200).json(compra);
    } catch (error) {
      return next(error);
    }
  };
}
