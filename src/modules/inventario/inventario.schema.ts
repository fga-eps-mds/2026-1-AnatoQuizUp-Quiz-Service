import { z } from "zod";

export const schemaEquiparItem = z.object({
  itemLojaId: z
    .string({
      message: "O ID do item deve ser uma string.",
    })
    .min(1, "O ID do item da loja é obrigatório."),
});

export const schemaUsuariosInventario = z.object({
  usuarioIds: z
    .string()
    .transform((valor) => [
      ...new Set(
        valor
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean),
      ),
    ])
    .pipe(z.array(z.string().min(1)).min(1).max(100)),
});
