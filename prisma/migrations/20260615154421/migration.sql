/*
  Warnings:

  - A unique constraint covering the columns `[usuarioId,itemAvatarLojaId,fonte]` on the table `transacoes_moedas` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TipoItemAvatar" AS ENUM ('CABELO', 'ROUPA', 'JALECO', 'OCULOS', 'ACESSORIO', 'CALCADO', 'OUTRO');

-- CreateEnum
CREATE TYPE "RaridadeItemAvatar" AS ENUM ('COMUM', 'RARO', 'EPICO', 'LENDARIO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FonteMoeda" ADD VALUE 'COMPRA_ITEM_AVATAR';
ALTER TYPE "FonteMoeda" ADD VALUE 'AJUSTE_MANUAL';

-- AlterTable
ALTER TABLE "transacoes_moedas" ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "itemAvatarLojaId" TEXT,
ALTER COLUMN "questaoId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "itens_avatar_loja" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoItemAvatar" NOT NULL,
    "raridade" "RaridadeItemAvatar" NOT NULL DEFAULT 'COMUM',
    "precoMoedas" INTEGER NOT NULL,
    "imagemUrl" TEXT,
    "previewImagemUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "excluidoEm" TIMESTAMP(3),

    CONSTRAINT "itens_avatar_loja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario_avatar_itens" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "itemAvatarLojaId" TEXT NOT NULL,
    "equipado" BOOLEAN NOT NULL DEFAULT false,
    "adquiridoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "excluidoEm" TIMESTAMP(3),

    CONSTRAINT "inventario_avatar_itens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "itens_avatar_loja_codigo_key" ON "itens_avatar_loja"("codigo");

-- CreateIndex
CREATE INDEX "itens_avatar_loja_tipo_idx" ON "itens_avatar_loja"("tipo");

-- CreateIndex
CREATE INDEX "itens_avatar_loja_ativo_idx" ON "itens_avatar_loja"("ativo");

-- CreateIndex
CREATE INDEX "inventario_avatar_itens_usuarioId_idx" ON "inventario_avatar_itens"("usuarioId");

-- CreateIndex
CREATE INDEX "inventario_avatar_itens_itemAvatarLojaId_idx" ON "inventario_avatar_itens"("itemAvatarLojaId");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_avatar_itens_usuarioId_itemAvatarLojaId_key" ON "inventario_avatar_itens"("usuarioId", "itemAvatarLojaId");

-- CreateIndex
CREATE INDEX "transacoes_moedas_itemAvatarLojaId_idx" ON "transacoes_moedas"("itemAvatarLojaId");

-- CreateIndex
CREATE UNIQUE INDEX "transacoes_moedas_usuarioId_itemAvatarLojaId_fonte_key" ON "transacoes_moedas"("usuarioId", "itemAvatarLojaId", "fonte");

-- AddForeignKey
ALTER TABLE "inventario_avatar_itens" ADD CONSTRAINT "inventario_avatar_itens_itemAvatarLojaId_fkey" FOREIGN KEY ("itemAvatarLojaId") REFERENCES "itens_avatar_loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes_moedas" ADD CONSTRAINT "transacoes_moedas_itemAvatarLojaId_fkey" FOREIGN KEY ("itemAvatarLojaId") REFERENCES "itens_avatar_loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
