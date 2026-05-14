-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TipoQuestao" AS ENUM ('MULTIPLA_ESCOLHA', 'CERTO_ERRADO');

-- CreateEnum
CREATE TYPE "AlternativaQuestao" AS ENUM ('A', 'B', 'C', 'D', 'E');

-- CreateEnum
CREATE TYPE "StatusQuestao" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "Dificuldade" AS ENUM ('FACIL', 'MEDIA', 'DIFICIL');

-- CreateTable
CREATE TABLE "temas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "excluidoEm" TIMESTAMP(3),

    CONSTRAINT "temas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questoes" (
    "id" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "tipoQuestao" "TipoQuestao" NOT NULL,
    "respostaCorreta" "AlternativaQuestao" NOT NULL,
    "saibaMais" TEXT,
    "status" "StatusQuestao" NOT NULL DEFAULT 'ATIVO',
    "feitoPorIa" BOOLEAN NOT NULL DEFAULT false,
    "urlImagem" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "questaoOriginalId" TEXT,
    "dificuldade" "Dificuldade" NOT NULL DEFAULT 'MEDIA',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "excluidoEm" TIMESTAMP(3),

    CONSTRAINT "questoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questoes_alternativas" (
    "id" TEXT NOT NULL,
    "alternativaA" TEXT NOT NULL,
    "alternativaB" TEXT NOT NULL,
    "alternativaC" TEXT NOT NULL,
    "alternativaD" TEXT NOT NULL,
    "alternativaE" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "excluidoEm" TIMESTAMP(3),

    CONSTRAINT "questoes_alternativas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resolucoes_questoes" (
    "id" TEXT NOT NULL,
    "respostaMarcada" "AlternativaQuestao" NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "excluidoEm" TIMESTAMP(3),

    CONSTRAINT "resolucoes_questoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "questoes_alternativas_questaoId_key" ON "questoes_alternativas"("questaoId");

-- AddForeignKey
ALTER TABLE "questoes" ADD CONSTRAINT "questoes_questaoOriginalId_fkey" FOREIGN KEY ("questaoOriginalId") REFERENCES "questoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questoes" ADD CONSTRAINT "questoes_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "temas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questoes_alternativas" ADD CONSTRAINT "questoes_alternativas_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "questoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolucoes_questoes" ADD CONSTRAINT "resolucoes_questoes_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "questoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

