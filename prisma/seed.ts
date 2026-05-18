import { PrismaClient, StatusTurma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tema = await prisma.tema.upsert({
    where: { id: "tema-seed-anatomia" },
    update: { nome: "Anatomia geral" },
    create: { id: "tema-seed-anatomia", nome: "Anatomia geral" },
  });

  console.log(`Tema base garantido no banco: ${tema.nome}`);

  const PROFESSOR_ID = "cmp7fx97j00034hyqazqwrk3e"; 
  const ALUNO_1_ID   = "cmp7fx99d00044hyqq4msqsyt";
  const ALUNO_2_ID   = "cmp7fx99d00044hyqq4mswgsr";

  const turma1 = await prisma.turma.upsert({
    where: { codigo: "ANAT-01-2026" },
    update: {}, 
    create: {
      codigo: "ANAT-01-2026",
      nome: "Turma A - Anatomia Sistêmica",
      semestre: "1",
      ano: 2026,
      descricao: "Turma matutina de Anatomia Sistêmica",
      status: StatusTurma.ATIVA,
      professorId: PROFESSOR_ID,
      alunos: {
        create: [
          { alunoId: ALUNO_1_ID },
          { alunoId: ALUNO_2_ID }
        ]
      }
    }
  });

  const turma2 = await prisma.turma.upsert({
    where: { codigo: "NEURO-02-2026" },
    update: {},
    create: {
      codigo: "NEURO-02-2026",
      nome: "Turma B - Neuroanatomia",
      semestre: "1",
      ano: 2026,
      descricao: "Turma vespertina de Neuroanatomia",
      status: StatusTurma.ATIVA,
      professorId: PROFESSOR_ID,
      alunos: {
        create: [
          { alunoId: ALUNO_1_ID } 
        ]
      }
    }
  });

  console.log(`Seed do Quiz-Service executado com sucesso!`);
  console.log(`Turmas criadas: ${turma1.codigo} e ${turma2.codigo}`);
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