import { PrismaClient, TipoQuestao, AlternativaQuestao, Dificuldade, StatusTurma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando o seed do Quiz-Service...");

  const temaNeuro = await prisma.tema.upsert({
    where: { id: "tema-seed-neuro" },
    update: { nome: "Neuroanatomia" },
    create: { id: "tema-seed-neuro", nome: "Neuroanatomia" },
  });

  const temaAbdome = await prisma.tema.upsert({
    where: { id: "tema-seed-abdome" },
    update: { nome: "Abdome Agudo" },
    create: { id: "tema-seed-abdome", nome: "Abdome Agudo" },
  });

  console.log(`Temas criados/verificados com sucesso.`);

  await prisma.questaoAlternativa.deleteMany({});
  await prisma.questao.deleteMany({});

  await prisma.questao.create({
    data: {
      enunciado:
        "Segundo a divisão do sistema nervoso baseada na funcionalidade, o sistema nervoso autônomo (SNA) é a parte eferente do sistema nervoso visceral. Baseado nos seus conceitos de neuroanatomia, selecione a alternativa INCORRETA.",
      tipoQuestao: TipoQuestao.MULTIPLA_ESCOLHA,
      respostaCorreta: AlternativaQuestao.C,
      saibaMais:
        "A distribuição da parte parassimpática do SNA difere da divisão simpática, pois suas fibras não passam pelos ramos dos nervos espinhais.",
      dificuldade: Dificuldade.MEDIA,
      temaId: temaNeuro.id,
      criadoPorId: "system-seed-user",
      alternativas: {
        create: {
          alternativaA:
            "As respostas autonômicas simpáticas são elaboradas e coordenadas pela porção posterior do hipotálamo.",
          alternativaB:
            "A divisão simpática do SNA é denominada toracolombar devido a localização dos corpos celulares.",
          alternativaC:
            "Tanto as fibras da parte simpática como da parte parassimpática do SNA passam pelos ramos dos nervos espinhais.",
          alternativaD:
            "Os corpos celulares dos neurônios pré-ganglionares da divisão parassimpática podem estar nos núcleos encefálicos.",
          alternativaE: "Nenhuma das alternativas anteriores.",
        },
      },
    },
  });

  console.log(`Temas base garantidos no banco: ${temaNeuro.nome} e ${temaAbdome.nome}`);

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
  await prisma.questao.create({
    data: {
      enunciado:
        "Paciente feminino, 29 anos, chega mancando ao PS do Hospital com quadro de dor intensa em fossa ilíaca direita, parada de eliminação de fezes e flatos. No exame físico, apresenta palpação abdominal dolorosa, com dor à descompressão brusca. Qual o exame de imagem mais indicado para auxiliar no diagnóstico?",
      tipoQuestao: TipoQuestao.MULTIPLA_ESCOLHA,
      respostaCorreta: AlternativaQuestao.B,
      saibaMais:
        "O exame de imagem mais indicado para auxiliar no diagnóstico nesse caso é a Ultrassonografia. É um exame rápido, não invasivo e não utiliza radiação ionizante, sendo excelente para avaliar a presença de inflamação na fossa ilíaca direita.",
      dificuldade: Dificuldade.FACIL,
      temaId: temaAbdome.id,
      criadoPorId: "system-seed-user",
      alternativas: {
        create: {
          alternativaA: "Radiografia",
          alternativaB: "Ultrassonografia",
          alternativaC: "TC com contraste",
          alternativaD: "TC sem contraste",
          alternativaE: "Videolaparoscopia",
        },
      },
    },
  });

  console.log("Banco de dados populado com as novas questões do .docx!");
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