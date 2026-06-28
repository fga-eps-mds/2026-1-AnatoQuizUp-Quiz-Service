import { z } from "zod";

// Schemas Zod do inventario.

// Body para equipar/desequipar: exige o id do item da loja.
export const schemaEquiparItem = z.object({
  itemLojaId: z
    .string({
      message: "O ID do item deve ser uma string.",
    })
    .min(1, "O ID do item da loja é obrigatório."),
});

// Query de varios usuarios: recebe ids separados por virgula e normaliza
// (split, trim, remove vazios e duplicados) em um array de 1 a 100 ids.
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
