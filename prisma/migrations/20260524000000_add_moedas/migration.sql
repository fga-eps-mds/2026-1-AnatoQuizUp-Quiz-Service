-- CreateEnum
CREATE TYPE "FonteMoeda" AS ENUM ('ACERTO_QUESTAO');

-- CreateTable
CREATE TABLE "carteiras_moedas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "saldo" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carteiras_moedas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacoes_moedas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "fonte" "FonteMoeda" NOT NULL DEFAULT 'ACERTO_QUESTAO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transacoes_moedas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "carteiras_moedas_usuarioId_key" ON "carteiras_moedas"("usuarioId");

-- CreateIndex
CREATE INDEX "transacoes_moedas_usuarioId_idx" ON "transacoes_moedas"("usuarioId");

-- CreateIndex
CREATE INDEX "transacoes_moedas_questaoId_idx" ON "transacoes_moedas"("questaoId");

-- CreateIndex
CREATE UNIQUE INDEX "transacoes_moedas_usuarioId_questaoId_fonte_key" ON "transacoes_moedas"("usuarioId", "questaoId", "fonte");

-- AddForeignKey
ALTER TABLE "transacoes_moedas" ADD CONSTRAINT "transacoes_moedas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "carteiras_moedas"("usuarioId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes_moedas" ADD CONSTRAINT "transacoes_moedas_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "questoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
