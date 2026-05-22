import { PrismaClient, TipoQuestao, AlternativaQuestao, StatusQuestao, Dificuldade } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando o seed massivo do Quiz-Service (27 Questões, 3 Listas e Turmas)...");

  // 1. Limpando as tabelas na ordem correta para evitar erros de FK
  await prisma.listaTurma.deleteMany({});
  await prisma.turmaAluno.deleteMany({});
  await prisma.listaQuestaoItem.deleteMany({});
  await prisma.listaQuestao.deleteMany({});
  await prisma.resolucaoQuestao.deleteMany({});
  await prisma.questaoAlternativa.deleteMany({});
  await prisma.questao.deleteMany({});
  await prisma.tema.deleteMany({});
  await prisma.turma.deleteMany({});

  const professorId = "cmp7fx97j00034hyqazqwrk3e";

  // 2. Criando Temas
  const temas = {
    neuro: await prisma.tema.create({ data: { nome: "Neuroanatomia" } }),
    abdome: await prisma.tema.create({ data: { nome: "Abdome Agudo" } }),
    esqueleto: await prisma.tema.create({ data: { nome: "Sistema Esquelético" } }),
  };

  // 3. Criando Turmas e Alunos para teste
  const turma1 = await prisma.turma.create({
    data: {
      codigo: "ANATO-101",
      nome: "Anatomia Humana I",
      semestre: "1",
      ano: 2026,
      descricao: "Turma de calouros",
      professorId: professorId,
      alunos: {
        create: [
          { alunoId: "aluno-teste-1" },
          { alunoId: "aluno-teste-2" },
          { alunoId: "aluno-teste-3" },
        ]
      }
    }
  });

  const turma2 = await prisma.turma.create({
    data: {
      codigo: "NEURO-201",
      nome: "Neuroanatomia Avançada",
      semestre: "3",
      ano: 2026,
      descricao: "Turma do terceiro semestre",
      professorId: professorId,
      alunos: {
        create: [
          { alunoId: "aluno-teste-4" },
          { alunoId: "aluno-teste-5" },
        ]
      }
    }
  });

  // 4. Array base das questões
  const questoes = [
    // NEURO
    { temaId: temas.neuro.id, dif: Dificuldade.FACIL, resp: AlternativaQuestao.B, 
      enunciado: "Qual estrutura central é responsável pelo controle motor e equilíbrio?", 
      saibaMais: "O cerebelo coordena os movimentos.", 
      alts: ["Hipotálamo", "Cerebelo", "Bulbo", "Ponte", "Amígdala"] },
    { temaId: temas.neuro.id, dif: Dificuldade.FACIL, resp: AlternativaQuestao.A, 
      enunciado: "Qual lobo cerebral é primariamente associado à visão?", 
      saibaMais: "O lobo occipital abriga o córtex visual primário.", 
      alts: ["Occipital", "Frontal", "Temporal", "Parietal", "Insular"] },
    { temaId: temas.neuro.id, dif: Dificuldade.FACIL, resp: AlternativaQuestao.C, 
      enunciado: "O sistema nervoso central é composto por quais estruturas principais?", 
      saibaMais: "O SNC inclui apenas o encéfalo e a medula espinhal.", 
      alts: ["Nervos e gânglios", "Cérebro e nervos", "Encéfalo e medula espinhal", "Apenas cérebro", "Tronco encefálico e nervos espinhais"] },
    { temaId: temas.neuro.id, dif: Dificuldade.MEDIA, resp: AlternativaQuestao.C, 
      enunciado: "Sobre o sistema nervoso autônomo, qual afirmativa é INCORRETA?", 
      saibaMais: "Fibras parassimpáticas não passam pelos ramos dos nervos espinhais.", 
      alts: ["Respostas simpáticas vêm do hipotálamo.", "Divisão simpática é toracolombar.", "Fibras parassimpáticas passam pelos nervos espinhais.", "Corpos pré-ganglionares parassimpáticos estão no encéfalo.", "Nenhuma das anteriores."] },
    { temaId: temas.neuro.id, dif: Dificuldade.MEDIA, resp: AlternativaQuestao.B, 
      enunciado: "Qual nervo craniano é responsável pela inervação motora dos músculos da mímica facial?", 
      saibaMais: "O nervo facial (VII) controla as expressões faciais.", 
      alts: ["Trigêmeo (V)", "Facial (VII)", "Oculomotor (III)", "Vago (X)", "Acessório (XI)"] },
    { temaId: temas.neuro.id, dif: Dificuldade.MEDIA, resp: AlternativaQuestao.D, 
      enunciado: "Qual o principal neurotransmissor liberado pelos neurônios pós-ganglionares simpáticos?", 
      saibaMais: "A noradrenalina atua nos receptores adrenérgicos dos órgãos alvo.", 
      alts: ["Acetilcolina", "Dopamina", "Serotonina", "Noradrenalina", "GABA"] },
    { temaId: temas.neuro.id, dif: Dificuldade.DIFICIL, resp: AlternativaQuestao.A, 
      enunciado: "Uma lesão no fascículo grácil da medula espinhal resulta na perda de qual função?", 
      saibaMais: "O fascículo grácil conduz propriocepção e tato fino dos membros inferiores.", 
      alts: ["Propriocepção dos membros inferiores", "Dor e temperatura contralaterais", "Motricidade dos membros superiores", "Visão periférica", "Audição ipsilateral"] },
    { temaId: temas.neuro.id, dif: Dificuldade.DIFICIL, resp: AlternativaQuestao.E, 
      enunciado: "A artéria cerebral média é ramo direto de qual grande vaso?", 
      saibaMais: "Ela é continuação direta da artéria carótida interna.", 
      alts: ["Artéria basilar", "Artéria vertebral", "Artéria carótida externa", "Artéria cerebral posterior", "Artéria carótida interna"] },
    { temaId: temas.neuro.id, dif: Dificuldade.DIFICIL, resp: AlternativaQuestao.B, 
      enunciado: "Qual núcleo dos gânglios da base degenera na Doença de Huntington?", 
      saibaMais: "A perda de neurônios no núcleo caudado e putâmen gera a coreia.", 
      alts: ["Substância negra", "Núcleo caudado e putâmen", "Globo pálido interno", "Núcleo subtalâmico", "Tálamo"] },

    // ABDOME
    { temaId: temas.abdome.id, dif: Dificuldade.FACIL, resp: AlternativaQuestao.B, 
      enunciado: "Qual o exame de imagem inicial mais indicado para suspeita de apendicite aguda?", 
      saibaMais: "A ultrassonografia é rápida e sem radiação.", 
      alts: ["Radiografia", "Ultrassonografia", "TC com contraste", "TC sem contraste", "Ressonância"] },
    { temaId: temas.abdome.id, dif: Dificuldade.FACIL, resp: AlternativaQuestao.A, 
      enunciado: "Dor intensa e súbita no hipocôndrio direito, irradiando para escápula, sugere inflamação em qual órgão?", 
      saibaMais: "É o quadro clássico de colecistite aguda.", 
      alts: ["Vesícula biliar", "Apêndice", "Baço", "Pâncreas", "Rim esquerdo"] },
    { temaId: temas.abdome.id, dif: Dificuldade.FACIL, resp: AlternativaQuestao.C, 
      enunciado: "Sinal de descompressão brusca dolorosa em todo o abdome é indicativo de:", 
      saibaMais: "A dor de rebote generalizada sugere peritonite difusa.", 
      alts: ["Gastroenterite", "Cálculo renal", "Peritonite", "Constipação", "Hérnia umbilical"] },
    { temaId: temas.abdome.id, dif: Dificuldade.MEDIA, resp: AlternativaQuestao.D, 
      enunciado: "Palpação profunda na fossa ilíaca esquerda provocando dor na direita é qual sinal?", 
      saibaMais: "Sinal de Rovsing, típico de apendicite.", 
      alts: ["Blumberg", "Murphy", "McBurney", "Rovsing", "Psoas"] },
    { temaId: temas.abdome.id, dif: Dificuldade.MEDIA, resp: AlternativaQuestao.B, 
      enunciado: "Qual é a causa mais comum de obstrução intestinal em intestino delgado em adultos?", 
      saibaMais: "Aderências (bridas) pós-cirúrgicas são a principal causa.", 
      alts: ["Hérnias encarceradas", "Aderências pós-operatórias", "Tumores malignos", "Vólvulo", "Doença de Crohn"] },
    { temaId: temas.abdome.id, dif: Dificuldade.MEDIA, resp: AlternativaQuestao.A, 
      enunciado: "O Sinal de Cullen (equimose periumbilical) pode ser encontrado em casos graves de:", 
      saibaMais: "Sinal clássico de hemorragia retroperitoneal na pancreatite.", 
      alts: ["Pancreatite aguda necro-hemorrágica", "Apendicite supurada", "Colecistite gangrenosa", "Úlcera péptica perfurada", "Diverticulite aguda"] },
    { temaId: temas.abdome.id, dif: Dificuldade.DIFICIL, resp: AlternativaQuestao.C, 
      enunciado: "Em uma radiografia de abdome agudo obstrutivo, o sinal do 'grão de café' indica:", 
      saibaMais: "É o achado radiológico patognomônico de vólvulo de sigmoide.", 
      alts: ["Íleo biliar", "Intussuscepção", "Vólvulo de sigmoide", "Megacólon tóxico", "Perfuração gástrica"] },
    { temaId: temas.abdome.id, dif: Dificuldade.DIFICIL, resp: AlternativaQuestao.E, 
      enunciado: "Qual critério tomográfico é utilizado para classificar a gravidade da pancreatite aguda?", 
      saibaMais: "O Critério de Balthazar avalia necrose e coleções peripancreáticas.", 
      alts: ["Ranson", "Apache II", "Alvarado", "Hinchey", "Balthazar"] },
    { temaId: temas.abdome.id, dif: Dificuldade.DIFICIL, resp: AlternativaQuestao.D, 
      enunciado: "A tríade de Rigler (pneumobilia, obstrução de delgado e cálculo ectópico) sela o diagnóstico de:", 
      saibaMais: "Íleo biliar ocorre por fístula colecistoentérica.", 
      alts: ["Colangite aguda", "Isquemia mesentérica", "Síndrome de Mirizzi", "Íleo biliar", "Coledocolitíase"] },

    // ESQUELETO
    { temaId: temas.esqueleto.id, dif: Dificuldade.FACIL, resp: AlternativaQuestao.A, 
      enunciado: "Qual dos ossos abaixo faz parte exclusivamente do esqueleto axial?", 
      saibaMais: "O esterno compõe a caixa torácica anterior.", 
      alts: ["Esterno", "Clavícula", "Escápula", "Ílio", "Fêmur"] },
    { temaId: temas.esqueleto.id, dif: Dificuldade.FACIL, resp: AlternativaQuestao.E, 
      enunciado: "Qual é o maior e mais pesado osso do corpo humano?", 
      saibaMais: "O fêmur é o osso da coxa.", 
      alts: ["Tíbia", "Úmero", "Rádio", "Fíbula", "Fêmur"] },
    { temaId: temas.esqueleto.id, dif: Dificuldade.FACIL, resp: AlternativaQuestao.C, 
      enunciado: "Qual estrutura conecta os músculos aos ossos?", 
      saibaMais: "Os tendões transferem a força da contração muscular para o esqueleto.", 
      alts: ["Ligamentos", "Cartilagens", "Tendões", "Fáscias", "Bursas"] },
    { temaId: temas.esqueleto.id, dif: Dificuldade.MEDIA, resp: AlternativaQuestao.C, 
      enunciado: "Qual a estrutura cartilaginosa por onde os ossos longos crescem em comprimento?", 
      saibaMais: "A placa epifisária permite a ossificação endocondral.", 
      alts: ["Periósteo", "Linha epifisária", "Placa epifisária", "Canal medular", "Endósteo"] },
    { temaId: temas.esqueleto.id, dif: Dificuldade.MEDIA, resp: AlternativaQuestao.B, 
      enunciado: "A articulação do ombro (glenoumeral) é classicamente classificada como:", 
      saibaMais: "Articulações sinoviais esferoides permitem ampla mobilidade em vários eixos.", 
      alts: ["Fibrosa (sindesmose)", "Sinovial esferoide", "Cartilagínea (sínfise)", "Sinovial gínglimo", "Plana"] },
    { temaId: temas.esqueleto.id, dif: Dificuldade.MEDIA, resp: AlternativaQuestao.D, 
      enunciado: "Qual célula óssea é primariamente responsável pela reabsorção da matriz óssea?", 
      saibaMais: "Os osteoclastos são as células que degradam o osso para remodelamento.", 
      alts: ["Osteoblasto", "Osteócito", "Condrócito", "Osteoclasto", "Macrófago"] },
    { temaId: temas.esqueleto.id, dif: Dificuldade.DIFICIL, resp: AlternativaQuestao.A, 
      enunciado: "A ossificação intramembranosa é o principal processo de formação de quais ossos?", 
      saibaMais: "Forma ossos chatos do crânio, maxila, mandíbula e parte da clavícula.", 
      alts: ["Ossos planos do crânio", "Ossos longos dos membros", "Vértebras", "Ossos do carpo", "Costelas"] },
    { temaId: temas.esqueleto.id, dif: Dificuldade.DIFICIL, resp: AlternativaQuestao.E, 
      enunciado: "O ligamento cruzado anterior (LCA) do joelho impede principalmente qual movimento?", 
      saibaMais: "Ele impede a translação anterior da tíbia em relação ao fêmur.", 
      alts: ["Rotação externa da tíbia", "Valgo do joelho", "Translação posterior da tíbia", "Hiperflexão do joelho", "Translação anterior da tíbia"] },
    { temaId: temas.esqueleto.id, dif: Dificuldade.DIFICIL, resp: AlternativaQuestao.B, 
      enunciado: "Em uma fratura do colo cirúrgico do úmero, qual nervo corre maior risco de lesão?", 
      saibaMais: "O nervo axilar contorna o colo cirúrgico do úmero.", 
      alts: ["Nervo radial", "Nervo axilar", "Nervo mediano", "Nervo ulnar", "Nervo musculocutâneo"] },
  ];

  const questoesNeuro: string[] = [];
  const questoesAbdome: string[] = [];
  const questoesFaceis: string[] = [];

  // 5. Inserindo as questões no banco e guardando os IDs
  for (const q of questoes) {
    const questaoCriada = await prisma.questao.create({
      data: {
        temaId: q.temaId,
        enunciado: q.enunciado,
        tipoQuestao: TipoQuestao.MULTIPLA_ESCOLHA,
        respostaCorreta: q.resp,
        saibaMais: q.saibaMais,
        status: StatusQuestao.ATIVO,
        dificuldade: q.dif,
        criadoPorId: professorId,
        alternativas: {
          create: {
            alternativaA: q.alts[0], alternativaB: q.alts[1], alternativaC: q.alts[2], alternativaD: q.alts[3], alternativaE: q.alts[4]
          }
        }
      }
    });

    if (q.temaId === temas.neuro.id) questoesNeuro.push(questaoCriada.id);
    if (q.temaId === temas.abdome.id) questoesAbdome.push(questaoCriada.id);
    if (q.dif === Dificuldade.FACIL) questoesFaceis.push(questaoCriada.id);
  }

  // 6. Criando as Listas e Vinculando às Turmas
  await prisma.listaQuestao.create({
    data: {
      nome: "Simulado de Neuroanatomia - 2026.1",
      criadoPorId: professorId,
      itens: {
        create: questoesNeuro.map((id, index) => ({
          questaoId: id,
          ordem: index + 1
        }))
      },
      turmas: {
        create: [
          { turmaId: turma2.id } // Vinculada à turma de Neuro
        ]
      }
    }
  });

  await prisma.listaQuestao.create({
    data: {
      nome: "Revisão de Abdome Agudo",
      criadoPorId: professorId,
      itens: {
        create: questoesAbdome.map((id, index) => ({
          questaoId: id,
          ordem: index + 1
        }))
      },
      turmas: {
        create: [
          { turmaId: turma1.id } // Vinculada à turma de Anatomia I
        ]
      }
    }
  });

  await prisma.listaQuestao.create({
    data: {
      nome: "Aquecimento Geral (Nível Fácil)",
      criadoPorId: professorId,
      itens: {
        create: questoesFaceis.map((id, index) => ({
          questaoId: id,
          ordem: index + 1
        }))
      },
      turmas: {
        create: [
          { turmaId: turma1.id }, // Vinculada a ambas as turmas
          { turmaId: turma2.id }
        ]
      }
    }
  });

  console.log("Banco populado com sucesso! Turmas criadas, 27 questões distribuídas e 3 Listas alocadas.");
}

main()
  .then(async () => { 
    await prisma.$disconnect(); 
  })
  .catch(async (e) => { 
    console.error(e); 
    await prisma.$disconnect(); 
    process.exit(1); 
  });