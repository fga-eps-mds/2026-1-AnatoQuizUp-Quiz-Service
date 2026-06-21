-- CreateEnum
CREATE TYPE "OrigemItemInventario" AS ENUM ('COMPRA', 'CONQUISTA');

-- AlterTable
ALTER TABLE "itens_loja"
ADD COLUMN "disponivelNaLoja" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "inventario_itens"
ADD COLUMN "origem" "OrigemItemInventario" NOT NULL DEFAULT 'COMPRA',
ADD COLUMN "desbloqueioConquistaId" TEXT;

-- CreateTable
CREATE TABLE "recompensas_itens_conquistas" (
    "id" TEXT NOT NULL,
    "conquistaId" TEXT NOT NULL,
    "tier" "TierConquista" NOT NULL,
    "itemLojaId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recompensas_itens_conquistas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "itens_loja_disponivelNaLoja_idx" ON "itens_loja"("disponivelNaLoja");

-- CreateIndex
CREATE INDEX "inventario_itens_desbloqueioConquistaId_idx" ON "inventario_itens"("desbloqueioConquistaId");

-- CreateIndex
CREATE UNIQUE INDEX "recompensas_itens_conquistas_conquistaId_tier_key"
ON "recompensas_itens_conquistas"("conquistaId", "tier");

-- CreateIndex
CREATE INDEX "recompensas_itens_conquistas_itemLojaId_idx"
ON "recompensas_itens_conquistas"("itemLojaId");

-- AddForeignKey
ALTER TABLE "inventario_itens"
ADD CONSTRAINT "inventario_itens_desbloqueioConquistaId_fkey"
FOREIGN KEY ("desbloqueioConquistaId")
REFERENCES "desbloqueios_conquistas"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recompensas_itens_conquistas"
ADD CONSTRAINT "recompensas_itens_conquistas_conquistaId_fkey"
FOREIGN KEY ("conquistaId")
REFERENCES "conquistas"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recompensas_itens_conquistas"
ADD CONSTRAINT "recompensas_itens_conquistas_itemLojaId_fkey"
FOREIGN KEY ("itemLojaId")
REFERENCES "itens_loja"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
