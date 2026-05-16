import { z } from 'zod';

export const schemaListarTurmas = z.object({
  status: z.enum(['ATIVA', 'INATIVA'], {
    message: "Status deve ser ATIVA ou INATIVA", 
  }).optional(),
  
  busca: z.string().trim().min(1, "A busca não pode ser vazia").optional(),
});