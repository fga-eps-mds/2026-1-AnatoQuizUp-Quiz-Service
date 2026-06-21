/*
  Warnings:

  - You are about to drop the column `estruturaAlvo` on the `questoes` table. All the data in the column will be lost.
  - You are about to drop the column `modalidade` on the `questoes` table. All the data in the column will be lost.
  - You are about to drop the column `planoAnatomico` on the `questoes` table. All the data in the column will be lost.
  - You are about to drop the column `sistemaAnatomico` on the `questoes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "questoes" DROP COLUMN "estruturaAlvo",
DROP COLUMN "modalidade",
DROP COLUMN "planoAnatomico",
DROP COLUMN "sistemaAnatomico";

-- DropEnum
DROP TYPE "PlanoAnatomico";
