/*
  Warnings:

  - A unique constraint covering the columns `[usuarioId,desbloqueioId,fonte]` on the table `transacoes_moedas` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "transacoes_moedas_usuarioId_desbloqueioId_fonte_key" ON "transacoes_moedas"("usuarioId", "desbloqueioId", "fonte");
