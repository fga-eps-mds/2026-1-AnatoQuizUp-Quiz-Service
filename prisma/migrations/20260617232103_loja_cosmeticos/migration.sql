-- CreateEnum
CREATE TYPE "TipoItemLoja" AS ENUM ('ICONE_PERFIL', 'AVATAR', 'TITULO', 'PLANO_FUNDO');

-- AlterEnum
ALTER TYPE "FonteMoeda" ADD VALUE 'COMPRA_ITEM';

-- AlterTable
ALTER TABLE "transacoes_moedas" ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "itemLojaId" TEXT,
ALTER COLUMN "questaoId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "itens_loja" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoItemLoja" NOT NULL,
    "precoMoedas" INTEGER NOT NULL,
    "valor" TEXT,
    "imagemUrl" TEXT,
    "previewImagemUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "excluidoEm" TIMESTAMP(3),

    CONSTRAINT "itens_loja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario_itens" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "itemLojaId" TEXT NOT NULL,
    "equipado" BOOLEAN NOT NULL DEFAULT false,
    "adquiridoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "excluidoEm" TIMESTAMP(3),

    CONSTRAINT "inventario_itens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "itens_loja_codigo_key" ON "itens_loja"("codigo");

-- CreateIndex
CREATE INDEX "itens_loja_tipo_idx" ON "itens_loja"("tipo");

-- CreateIndex
CREATE INDEX "itens_loja_ativo_idx" ON "itens_loja"("ativo");

-- CreateIndex
CREATE INDEX "inventario_itens_usuarioId_idx" ON "inventario_itens"("usuarioId");

-- CreateIndex
CREATE INDEX "inventario_itens_itemLojaId_idx" ON "inventario_itens"("itemLojaId");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_itens_usuarioId_itemLojaId_key" ON "inventario_itens"("usuarioId", "itemLojaId");

-- CreateIndex
CREATE INDEX "transacoes_moedas_itemLojaId_idx" ON "transacoes_moedas"("itemLojaId");

-- CreateIndex
CREATE UNIQUE INDEX "transacoes_moedas_usuarioId_itemLojaId_fonte_key" ON "transacoes_moedas"("usuarioId", "itemLojaId", "fonte");

-- AddForeignKey
ALTER TABLE "inventario_itens" ADD CONSTRAINT "inventario_itens_itemLojaId_fkey" FOREIGN KEY ("itemLojaId") REFERENCES "itens_loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes_moedas" ADD CONSTRAINT "transacoes_moedas_itemLojaId_fkey" FOREIGN KEY ("itemLojaId") REFERENCES "itens_loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

