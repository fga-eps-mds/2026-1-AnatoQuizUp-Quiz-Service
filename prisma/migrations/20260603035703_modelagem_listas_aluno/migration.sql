-- CreateEnum
CREATE TYPE "StatusResolucaoLista" AS ENUM ('EM_ANDAMENTO', 'SUBMETIDA');

-- AlterTable
ALTER TABLE "listas_turmas" ADD COLUMN     "gabaritoLiberado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prazo" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "resolucoes_listas" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "listaTurmaId" TEXT NOT NULL,
    "status" "StatusResolucaoLista" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "submissaoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resolucoes_listas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resolucoes_questoes_listas" (
    "id" TEXT NOT NULL,
    "resolucaoListaId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "respostaMarcada" "AlternativaQuestao" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resolucoes_questoes_listas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resolucoes_listas_listaTurmaId_idx" ON "resolucoes_listas"("listaTurmaId");

-- CreateIndex
CREATE INDEX "resolucoes_listas_alunoId_idx" ON "resolucoes_listas"("alunoId");

-- CreateIndex
CREATE UNIQUE INDEX "resolucoes_listas_alunoId_listaTurmaId_key" ON "resolucoes_listas"("alunoId", "listaTurmaId");

-- CreateIndex
CREATE INDEX "resolucoes_questoes_listas_questaoId_idx" ON "resolucoes_questoes_listas"("questaoId");

-- CreateIndex
CREATE UNIQUE INDEX "resolucoes_questoes_listas_resolucaoListaId_questaoId_key" ON "resolucoes_questoes_listas"("resolucaoListaId", "questaoId");

-- AddForeignKey
ALTER TABLE "resolucoes_listas" ADD CONSTRAINT "resolucoes_listas_listaTurmaId_fkey" FOREIGN KEY ("listaTurmaId") REFERENCES "listas_turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolucoes_questoes_listas" ADD CONSTRAINT "resolucoes_questoes_listas_resolucaoListaId_fkey" FOREIGN KEY ("resolucaoListaId") REFERENCES "resolucoes_listas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolucoes_questoes_listas" ADD CONSTRAINT "resolucoes_questoes_listas_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "questoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
