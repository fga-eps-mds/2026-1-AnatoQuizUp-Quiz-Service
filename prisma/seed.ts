import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tema = await prisma.tema.upsert({
    where: { id: "tema-seed-anatomia" },
    update: { nome: "Anatomia geral" },
    create: { id: "tema-seed-anatomia", nome: "Anatomia geral" },
  });

  console.log(`Seed do Quiz-Service executado. Tema base: ${tema.nome}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Falha ao executar o seed do Quiz-Service.", error);
    await prisma.$disconnect();
    process.exit(1);
  });
