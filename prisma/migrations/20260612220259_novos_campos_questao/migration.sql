/*
  Warnings:

  - You are about to drop the column `feitoPorIa` on the `questoes` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TaxonomiaBloom" AS ENUM ('LEMBRAR', 'COMPREENDER', 'APLICAR', 'ANALISAR', 'AVALIAR', 'CRIAR');

-- CreateEnum
CREATE TYPE "OrigemQuestao" AS ENUM ('LIVRO', 'PROVA_ANTERIOR', 'GERADA_POR_IA', 'ELABORADA_POR_PROFESSOR');

-- CreateEnum
CREATE TYPE "PlanoAnatomico" AS ENUM ('AXIAL', 'CORONAL', 'SAGITAL', 'PA', 'AP', 'OUTRO');

-- AlterTable
ALTER TABLE "questoes" DROP COLUMN "feitoPorIa",
ADD COLUMN     "estruturaAlvo" TEXT,
ADD COLUMN     "modalidade" TEXT,
ADD COLUMN     "origemQuestao" "OrigemQuestao" NOT NULL DEFAULT 'ELABORADA_POR_PROFESSOR',
ADD COLUMN     "planoAnatomico" "PlanoAnatomico",
ADD COLUMN     "regiaoAnatomica" TEXT,
ADD COLUMN     "sistemaAnatomico" TEXT,
ADD COLUMN     "taxonomiaBloom" "TaxonomiaBloom";
