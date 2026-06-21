import { z } from "zod";

export const schemaEquiparItem = z.object({
  itemLojaId: z.string({
    message: "O ID do item deve ser uma string.",
  }).min(1, "O ID do item da loja é obrigatório."),
});