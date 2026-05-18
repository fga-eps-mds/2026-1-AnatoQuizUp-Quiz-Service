-- CreateEnum
CREATE TYPE "StatusTurma" AS ENUM ('ATIVA', 'INATIVA');

-- CreateTable
CREATE TABLE "turmas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "semestre" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" "StatusTurma" NOT NULL DEFAULT 'ATIVA',
    "professorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "excluidoEm" TIMESTAMP(3),

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas_alunos" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "excluidoEm" TIMESTAMP(3),

    CONSTRAINT "turmas_alunos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "turmas_codigo_key" ON "turmas"("codigo");

-- CreateIndex
CREATE INDEX "turmas_professorId_idx" ON "turmas"("professorId");

-- CreateIndex
CREATE INDEX "turmas_alunos_alunoId_idx" ON "turmas_alunos"("alunoId");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_alunos_turmaId_alunoId_key" ON "turmas_alunos"("turmaId", "alunoId");

-- AddForeignKey
ALTER TABLE "turmas_alunos" ADD CONSTRAINT "turmas_alunos_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
