import { z } from 'zod';

const VALORES_STATUS_TURMA = ['ATIVA', 'INATIVA'] as const;

const textoObrigatorio = (mensagem: string) => z.string().trim().min(1, mensagem);

export const schemaListarTurmas = z.object({
  status: z.enum(VALORES_STATUS_TURMA, {
    message: "Status deve ser ATIVA ou INATIVA", 
  }).optional(),
  
  busca: z.string().trim().min(1, "A busca não pode ser vazia").optional(),

  semestre: z.string().trim().min(1, "O semestre não pode ser vazio").optional(),

  ano: z.coerce.number().int("Ano deve ser um número inteiro").min(1, "Ano deve ser maior que zero").optional(),
});

export const schemaParamsTurma = z.object({
  id: textoObrigatorio("Id da turma é obrigatório"),
});

export const schemaParamsTurmaAluno = z.object({
  id: textoObrigatorio("Id da turma é obrigatório"),
  alunoId: textoObrigatorio("Id do aluno é obrigatório"),
});

const schemaDadosTurma = z.object({
  codigo: textoObrigatorio("Código da turma é obrigatório"),
  nome: textoObrigatorio("Nome da turma é obrigatório"),
  semestre: textoObrigatorio("Semestre é obrigatório"),
  ano: z.coerce.number().int("Ano deve ser um número inteiro").min(1, "Ano deve ser maior que zero"),
  descricao: textoObrigatorio("Descrição é obrigatória"),
  status: z.enum(VALORES_STATUS_TURMA, {
    message: "Status deve ser ATIVA ou INATIVA",
  }).optional(),
});

export const schemaCriarTurma = schemaDadosTurma;

export const schemaAtualizarTurma = schemaDadosTurma.partial().refine(
  (dados) => Object.keys(dados).length > 0,
  { message: "Informe ao menos um campo para atualizar" },
);

export const schemaVincularAlunoTurma = z.object({
  alunoId: textoObrigatorio("Id do aluno é obrigatório"),
});
