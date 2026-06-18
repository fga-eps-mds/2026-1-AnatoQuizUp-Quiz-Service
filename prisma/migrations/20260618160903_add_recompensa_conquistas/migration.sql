-- AlterEnum
ALTER TYPE "FonteMoeda" ADD VALUE 'DESBLOQUEIO_CONQUISTA';

-- AlterTable
ALTER TABLE "transacoes_moedas" ADD COLUMN     "desbloqueioId" TEXT,
ALTER COLUMN "questaoId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "transacoes_moedas" ADD CONSTRAINT "transacoes_moedas_desbloqueioId_fkey" FOREIGN KEY ("desbloqueioId") REFERENCES "desbloqueios_conquistas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
