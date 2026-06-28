import type { StatusTurma } from '@prisma/client';

import type { Papel } from '@/shared/constants/papeis';

// DTOs (contratos de dados) do modulo de turmas.

// Contexto do usuario autenticado usado pelo service para decidir autorizacao.
export interface UsuarioContexto {
  id: string;
  papel: Papel;
}

// Filtros da listagem de turmas (visao geral/professor).
export interface FiltrosListagemTurma {
  professorId?: string;
  status?: StatusTurma;
  busca?: string;
  semestre?: string;
  ano?: number;
}

// Filtros da listagem para o aluno (sem recorte por professor).
export interface FiltrosListagemTurmaAluno {
  busca?: string;
  semestre?: string;
  ano?: number;
}

// Turma como retornada pela API.
export interface RespostaTurma {
  id: string;
  codigo: string;
  nome: string;
  semestre: string;
  ano: number;
  descricao: string;
  status: StatusTurma;
  professorId: string;
  criadoEm: Date;
}

// Dados para criar uma turma.
export interface CriarTurmaDto {
  codigo: string;
  nome: string;
  semestre: string;
  ano: number;
  descricao: string;
  status?: StatusTurma;
}

// Atualizacao: todos os campos de criacao tornam-se opcionais.
export type AtualizarTurmaDto = Partial<CriarTurmaDto>;

// Payload para vincular um aluno a turma.
export interface VincularAlunoTurmaDto {
  alunoId: string;
}

// Vinculo turma<->aluno como retornado pela API.
export interface RespostaVinculoTurmaAluno {
  id: string;
  turmaId: string;
  alunoId: string;
  criadoEm: Date;
  atualizadoEm: Date;
}
